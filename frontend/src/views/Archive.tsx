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
import FolderIcon from '@mui/icons-material/Folder'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import VideoFileIcon from '@mui/icons-material/VideoFile'

import { matchW } from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { BehaviorSubject, Subject, combineLatestWith, map, share } from 'rxjs'
import { serverURL } from '../atoms/settings'
import { useObservable } from '../hooks/observable'
import { useToast } from '../hooks/toast'
import { useI18n } from '../hooks/useI18n'
import { ffetch } from '../lib/httpClient'
import { DeleteRequest, DirectoryEntry } from '../types'
import { base64URLEncode, roundMiB } from '../utils'

export default function Downloaded() {
  const serverAddr = useRecoilValue(serverURL)
  const navigate = useNavigate()

  const { i18n } = useI18n()
  const { pushMessage } = useToast()

  const [openDialog, setOpenDialog] = useState(false)

  const files$ = useMemo(() => new Subject<DirectoryEntry[]>(), [])
  const selected$ = useMemo(() => new BehaviorSubject<string[]>([]), [])

  const [isPending, startTransition] = useTransition()

  const fetcher = () => pipe(
    ffetch<DirectoryEntry[]>(
      `${serverAddr}/archive/downloaded`,
      {
        method: 'POST',
        body: JSON.stringify({
          subdir: '',
        })
      }
    ),
    matchW(
      (e) => {
        pushMessage(e, 'error')
        navigate('/login')
      },
      (d) => files$.next(d ?? []),
    )
  )()

  const fetcherSubfolder = (sub: string) => {
    const folders = sub.startsWith('/')
      ? sub.substring(1).split('/')
      : sub.split('/')

    const relpath = folders.length >= 2
      ? folders.slice(-(folders.length - 1)).join('/')
      : folders.pop()

    const _upperLevel = folders.slice(1, -1)
    const upperLevel = _upperLevel.length === 2
      ? ['.', ..._upperLevel].join('/')
      : _upperLevel.join('/')

    const task = ffetch<DirectoryEntry[]>(`${serverAddr}/archive/downloaded`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subdir: relpath })
    })

    pipe(
      task,
      matchW(
        (l) => pushMessage(l, 'error'),
        (r) => files$.next(sub
          ? [{
            isDirectory: true,
            isVideo: false,
            modTime: '',
            name: '..',
            path: upperLevel,
            shaSum: '',
            size: 0,
          }, ...r.filter(f => f.name !== '')]
          : r.filter(f => f.name !== '')
        )
      )
    )()
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
      .map(entry => fetch(`${serverAddr}/archive/delete`, {
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
  }, [serverAddr])

  const onFileClick = (path: string) => startTransition(() => {
    const encoded = base64URLEncode(path)

    window.open(`${serverAddr}/archive/d/${encoded}`)
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
        <Typography py={1} variant="h5" color="primary">
          {i18n.t('archiveTitle')}
        </Typography>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {selectable.length === 0 && 'No files found'}
          {selectable.map((file, idx) => (
            <ListItem
              key={idx}
              secondaryAction={
                <div>
                  {!file.isDirectory && <Typography
                    variant="caption"
                    component="span"
                  >
                    {roundMiB(file.size)}
                  </Typography>
                  }
                  {!file.isDirectory && <Checkbox
                    edge="end"
                    checked={file.selected}
                    onChange={() => addSelected(file.name)}
                  />}
                </div>
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
                    : file.isVideo
                      ? <VideoFileIcon />
                      : <InsertDriveFileIcon />
                  }
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={file.name != '..' && new Date(file.modTime).toLocaleString()}
                />
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