import { ThemeProvider } from '@emotion/react'

import ChevronLeft from '@mui/icons-material/ChevronLeft'
import Dashboard from '@mui/icons-material/Dashboard'
import Menu from '@mui/icons-material/Menu'
import SettingsIcon from '@mui/icons-material/Settings'
import SettingsEthernet from '@mui/icons-material/SettingsEthernet'
import Storage from '@mui/icons-material/Storage'

import { Box, createTheme } from '@mui/material'

import DownloadIcon from '@mui/icons-material/Download'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

import { grey } from '@mui/material/colors'

import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { Link, Outlet } from 'react-router-dom'
import { RootState } from './stores/store'

import AppBar from './components/AppBar'
import Drawer from './components/Drawer'

import Logout from './components/Logout'
import ThemeToggler from './components/ThemeToggler'
import I18nProvider from './providers/i18nProvider'
import RPCCLientProvider from './providers/rpcClientProvider'
import { formatGiB } from './utils'

export default function Layout() {
  const [open, setOpen] = useState(false)

  const settings = useSelector((state: RootState) => state.settings)
  const status = useSelector((state: RootState) => state.status)

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
    setOpen(state => !state)
  }

  return (
    <ThemeProvider theme={theme}>
      <I18nProvider>
        <RPCCLientProvider>
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
                      <span>
                        &nbsp;{formatGiB(status.freeSpace)}&nbsp;
                      </span>
                    </div>
                    : null
                }
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}>
                  <SettingsEthernet />
                  <span>
                    &nbsp;{status.connected ? settings.serverAddr : 'not connected'}
                  </span>
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
                <Link to={'/archive'} style={
                  {
                    textDecoration: 'none',
                    color: mode === 'dark' ? '#ffffff' : '#000000DE'
                  }
                }>
                  <ListItemButton disabled={status.downloading}>
                    <ListItemIcon>
                      <DownloadIcon />
                    </ListItemIcon>
                    <ListItemText primary="Archive" />
                  </ListItemButton>
                </Link>
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
                <ThemeToggler />
                <Logout />
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
              <Outlet />
            </Box>
          </Box>
        </RPCCLientProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}