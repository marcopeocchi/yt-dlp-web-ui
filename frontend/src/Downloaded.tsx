import {
  Backdrop,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material'

import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import VideoFileIcon from '@mui/icons-material/VideoFile'
import { Buffer } from 'buffer'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { BehaviorSubject, Subject, combineLatestWith, map, share } from 'rxjs'
import { useObservable } from './hooks/observable'
import { RootState } from './stores/store'
import { DeleteRequest, DirectoryEntry } from './types'

export default function Downloaded() {
  const settings = useSelector((state: RootState) => state.settings)

  const [openDialog, setOpenDialog] = useState(false)

  const serverAddr =
    `${window.location.protocol}//${settings.serverAddr}:${settings.serverPort}`

  const files$ = useMemo(() => new Subject<DirectoryEntry[]>(), [])
  const selected$ = useMemo(() => new BehaviorSubject<string[]>([]), [])

  const fetcher = () => fetch(`${serverAddr}/downloaded`)
    .then(res => res.json())
    .then(data => files$.next(data))

  const selectable$ = useMemo(() => files$.pipe(
    combineLatestWith(selected$),
    map(([data, selected]) => data.map(x => ({
      ...x,
      selected: selected.includes(x.name)
    }))),
    share()
  ), [])

  const selectable = useObservable(selectable$, [])

  const addSelected = (name: string) => {
    selected$.value.includes(name)
      ? selected$.next(selected$.value.filter(val => val !== name))
      : selected$.next([...selected$.value, name])
  }

  const deleteSelected = () => {
    Promise.all(selectable
      .filter(entry => entry.selected)
      .map(entry => fetch(`${serverAddr}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: entry.path,
          shaSum: entry.shaSum,
        } as DeleteRequest)
      }))
    ).then(fetcher)
  }

  useEffect(() => {
    fetcher()
  }, [settings.serverAddr, settings.serverPort])

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={!(files$.observed)}
      >
        <CircularProgress color="primary" />
      </Backdrop>
      <Paper sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {selectable.length === 0 && 'No files found'}
          {selectable.map((file) => (
            <ListItem
              key={file.shaSum}
              secondaryAction={
                <Checkbox
                  edge="end"
                  checked={file.selected}
                  onChange={() => addSelected(file.name)}
                />
              }
              disablePadding
            >
              <ListItemButton>
                <ListItemIcon>
                  <VideoFileIcon />
                </ListItemIcon>
                <ListItemText primary={file.name} onClick={() => window.open(
                  `${serverAddr}/play?path=${Buffer.from(file.path).toString('hex')}`
                )} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={{ position: 'absolute', bottom: 32, right: 32 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<DeleteForeverIcon />}
          tooltipTitle={`Delete selected`}
          tooltipOpen
          onClick={() => setOpenDialog(true)}
        />
      </SpeedDial>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>
          Are you sure?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You're deleting:
          </DialogContentText>
          <ul>
            {selected$.value.map((entry, idx) => (
              <li key={idx}>{entry}</li>
            ))}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={() => {
            deleteSelected()
            setOpenDialog(false)
          }} autoFocus>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}