import { ThemeProvider } from "@emotion/react";
import {
  ChevronLeft,
  Dashboard,
  // Download,
  Menu, Settings as SettingsIcon,
  SettingsEthernet,
  Storage
} from "@mui/icons-material";
import {
  Box,
  createTheme, CssBaseline,
  Divider,
  IconButton, List,
  ListItemIcon, ListItemText, Toolbar,
  Typography
} from "@mui/material";
import { grey } from "@mui/material/colors";
import ListItemButton from '@mui/material/ListItemButton';
import { useMemo, useState } from "react";
import { Provider, useSelector } from "react-redux";
import {
  BrowserRouter as Router, Link, Route,
  Routes
} from 'react-router-dom';
import { AppBar } from "./components/AppBar";
import { Drawer } from "./components/Drawer";
import Home from "./Home";
import Settings from "./Settings";
import { RootState, store } from './stores/store';
import { formatGiB, getWebSocketEndpoint } from "./utils";

function AppContent() {
  const [open, setOpen] = useState(false)

  const settings = useSelector((state: RootState) => state.settings)
  const status = useSelector((state: RootState) => state.status)

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
              <Route path="/settings" element={<Settings socket={socket} />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}