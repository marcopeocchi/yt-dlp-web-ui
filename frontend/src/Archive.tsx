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
  SpeedDialIcon,
  Typography
} from '@mui/material'

import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import VideoFileIcon from '@mui/icons-material/VideoFile'
import FolderIcon from '@mui/icons-material/Folder'
import { Buffer } from 'buffer'
import { useEffect, useMemo, useState, useTransition } from 'react'
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

  const [isPending, startTransition] = useTransition()

  const fetcher = () => fetch(`${serverAddr}/downloaded`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subdir: '' })
  })
    .then(res => res.json())
    .then(data => files$.next(data))

  const fetcherSubfolder = (sub: string) => {
    const folders = sub.split('/')
    let subdir = folders.length > 2
      ? folders.slice(-2).join('/')
      : folders.pop()

    fetch(`${serverAddr}/downloaded`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subdir: subdir })
    })
      .then(res => res.json())
      .then(data => {
        files$.next([{
          isDirectory: true,
          name: '..',
          path: '',
        }, ...data])
      })
  }

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


  const onFileClick = (path: string) => startTransition(() => {
    window.open(`${serverAddr}/play?path=${Buffer.from(path).toString('hex')}`)
  })

  const onFolderClick = (path: string) => startTransition(() => {
    fetcherSubfolder(path)
  })

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={!(files$.observed) || isPending}
      >
        <CircularProgress color="primary" />
      </Backdrop>
      <Paper sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Typography pb={0} variant="h5" color="primary">
          {'Archive'}
        </Typography>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {selectable.length === 0 && 'No files found'}
          {selectable.map((file) => (
            <ListItem
              key={file.shaSum}
              secondaryAction={
                !file.isDirectory && <Checkbox
                  edge="end"
                  checked={file.selected}
                  onChange={() => addSelected(file.name)}
                />
              }
              disablePadding
            >
              <ListItemButton onClick={
                () => file.isDirectory
                  ? onFolderClick(file.path)
                  : onFileClick(file.path)
              }>
                <ListItemIcon>
                  {file.isDirectory
                    ? <FolderIcon />
                    : <VideoFileIcon />
                  }
                </ListItemIcon>
                <ListItemText primary={file.name} />
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
          onClick={() => {
            if (selected$.value.length > 0) {
              setOpenDialog(true)
            }
          }}
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
          }} autoFocus
          >
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}