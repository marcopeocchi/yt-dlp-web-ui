import { ThemeProvider } from '@emotion/react'
import {
  ChevronLeft,
  Dashboard,
  FormatListBulleted,
  Menu,
  SettingsEthernet,
  Settings as SettingsIcon,
  Storage
} from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  CssBaseline,
  Divider,
  IconButton, List,
  ListItemIcon, ListItemText, Toolbar,
  Typography,
  createTheme
} from '@mui/material'
import ListItemButton from '@mui/material/ListItemButton'
import { grey } from '@mui/material/colors'
import { Suspense, lazy, useMemo, useState } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import {
  Link, Route,
  BrowserRouter as Router,
  Routes
} from 'react-router-dom'
import Home from './Home'
import { AppBar } from './components/AppBar'
import { Drawer } from './components/Drawer'
import { toggleListView } from './features/settings/settingsSlice'
import { RootState, store } from './stores/store'
import { formatGiB, getWebSocketEndpoint } from './utils'

function AppContent() {
  const [open, setOpen] = useState(false)

  const settings = useSelector((state: RootState) => state.settings)
  const status = useSelector((state: RootState) => state.status)
  const dispatch = useDispatch()

  const socket = useMemo(() => new WebSocket(getWebSocketEndpoint()), [])

  const mode = settings.theme
  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: settings.theme,
        background: {
          default: settings.theme === 'light' ? grey[50] : '#121212'
        },
      },
    }), [settings.theme]
  )

  const toggleDrawer = () => {
    setOpen(!open)
  }

  const Settings = lazy(() => import('./Settings'))

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="absolute" open={open}>
            <Toolbar sx={{ pr: '24px' }}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="open drawer"
                onClick={toggleDrawer}
                sx={{
                  marginRight: '36px',
                  ...(open && { display: 'none' }),
                }}
              >
                <Menu />
              </IconButton>
              <Typography
                component="h1"
                variant="h6"
                color="inherit"
                noWrap
                sx={{ flexGrow: 1 }}
              >
                yt-dlp WebUI
              </Typography>
              {
                status.freeSpace ?
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}>
                    <Storage />
                    <span>&nbsp;{formatGiB(status.freeSpace)}&nbsp;</span>
                  </div>
                  : null
              }
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}>
                <SettingsEthernet />
                <span>&nbsp;{status.connected ? settings.serverAddr : 'not connected'}</span>
              </div>
            </Toolbar>
          </AppBar>
          <Drawer variant="permanent" open={open}>
            <Toolbar
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                px: [1],
              }}
            >
              <IconButton onClick={toggleDrawer}>
                <ChevronLeft />
              </IconButton>
            </Toolbar>
            <Divider />
            <List component="nav">
              <Link to={'/'} style={
                {
                  textDecoration: 'none',
                  color: mode === 'dark' ? '#ffffff' : '#000000DE'
                }
              }>
                <ListItemButton disabled={status.downloading}>
                  <ListItemIcon>
                    <Dashboard />
                  </ListItemIcon>
                  <ListItemText primary="Home" />
                </ListItemButton>
              </Link>
              <ListItemButton onClick={() => dispatch(toggleListView())}>
                <ListItemIcon>
                  <FormatListBulleted />
                </ListItemIcon>
                <ListItemText primary="List view" />
              </ListItemButton>
              <Link to={'/settings'} style={
                {
                  textDecoration: 'none',
                  color: mode === 'dark' ? '#ffffff' : '#000000DE'
                }
              }>
                <ListItemButton disabled={status.downloading}>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </Link>
            </List>
          </Drawer>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              height: '100vh',
              overflow: 'auto',
            }}
          >
            <Toolbar />
            <Routes>
              <Route path="/" element={<Home socket={socket} />} />
              <Route path="/settings" element={
                <Suspense fallback={<CircularProgress />}>
                  <Settings socket={socket} />
                </Suspense>
              } />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  )
}

export function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}