import {
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
  capitalize
} from '@mui/material'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRecoilState } from 'recoil'
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  map,
  takeWhile
} from 'rxjs'
import { rpcPollingTimeState } from '../atoms/rpc'
import {
  Language,
  Theme,
  appTitleState,
  enableCustomArgsState,
  fileRenamingState,
  formatSelectionState,
  languageState,
  languages,
  pathOverridingState,
  servedFromReverseProxyState,
  servedFromReverseProxySubDirState,
  serverAddressState,
  serverPortState,
  themeState
} from '../atoms/settings'
import CookiesTextField from '../components/CookiesTextField'
import { useToast } from '../hooks/toast'
import { useI18n } from '../hooks/useI18n'
import { useRPC } from '../hooks/useRPC'
import { validateDomain, validateIP } from '../utils'

// NEED ABSOLUTELY TO BE SPLIT IN MULTIPLE COMPONENTS
export default function Settings() {
  const [reverseProxy, setReverseProxy] = useRecoilState(servedFromReverseProxyState)
  const [baseURL, setBaseURL] = useRecoilState(servedFromReverseProxySubDirState)

  const [formatSelection, setFormatSelection] = useRecoilState(formatSelectionState)
  const [pathOverriding, setPathOverriding] = useRecoilState(pathOverridingState)
  const [fileRenaming, setFileRenaming] = useRecoilState(fileRenamingState)
  const [enableArgs, setEnableArgs] = useRecoilState(enableCustomArgsState)

  const [serverAddr, setServerAddr] = useRecoilState(serverAddressState)
  const [serverPort, setServerPort] = useRecoilState(serverPortState)

  const [pollingTime, setPollingTime] = useRecoilState(rpcPollingTimeState)
  const [language, setLanguage] = useRecoilState(languageState)
  const [appTitle, setApptitle] = useRecoilState(appTitleState)

  const [theme, setTheme] = useRecoilState(themeState)

  const [invalidIP, setInvalidIP] = useState(false)

  const { i18n } = useI18n()
  const { client } = useRPC()

  const { pushMessage } = useToast()

  const baseURL$ = useMemo(() => new Subject<string>(), [])
  const serverAddr$ = useMemo(() => new Subject<string>(), [])
  const serverPort$ = useMemo(() => new Subject<string>(), [])

  useEffect(() => {
    const sub = baseURL$
      .pipe(debounceTime(500))
      .subscribe(baseURL => {
        setBaseURL(baseURL)
        pushMessage(i18n.t('restartAppMessage'), 'info')
      })
    return () => sub.unsubscribe()
  }, [])

  useEffect(() => {
    const sub = serverAddr$
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(addr => {
        if (validateIP(addr)) {
          setInvalidIP(false)
          setServerAddr(addr)
          pushMessage(i18n.t('restartAppMessage'), 'info')
        } else if (validateDomain(addr)) {
          setInvalidIP(false)
          setServerAddr(addr)
          pushMessage(i18n.t('restartAppMessage'), 'info')
        } else {
          setInvalidIP(true)
        }
      })
    return () => sub.unsubscribe()
  }, [serverAddr$])

  useEffect(() => {
    const sub = serverPort$
      .pipe(
        debounceTime(500),
        map(val => Number(val)),
        takeWhile(val => isFinite(val) && val <= 65535),
      )
      .subscribe(port => {
        setServerPort(port)
        pushMessage(i18n.t('restartAppMessage'), 'info')
      })
    return () => sub.unsubscribe()
  }, [])

  /**
   * Language toggler handler 
   */
  const handleLanguageChange = (event: SelectChangeEvent<Language>) => {
    setLanguage(event.target.value as Language)
  }

  /**
   * Theme toggler handler 
   */
  const handleThemeChange = (event: SelectChangeEvent<Theme>) => {
    setTheme(event.target.value as Theme)
  }

  /**
   * Updates yt-dlp binary via RPC
   */
  const updateBinary = () => {
    client.updateExecutable().then(() => pushMessage(i18n.t('toastUpdated'), 'success'))
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Paper
        sx={{
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 240,
        }}
      >
        <Typography pb={2} variant="h6" color="primary">
          {i18n.t('settingsAnchor')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={11}>
            <TextField
              fullWidth
              label={i18n.t('serverAddressTitle')}
              defaultValue={serverAddr}
              error={invalidIP}
              onChange={(e) => serverAddr$.next(e.currentTarget.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">ws://</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <TextField
              disabled={reverseProxy}
              fullWidth
              label={i18n.t('serverPortTitle')}
              defaultValue={serverPort}
              onChange={(e) => serverPort$.next(e.currentTarget.value)}
              error={isNaN(Number(serverPort)) || Number(serverPort) > 65535}
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <TextField
              disabled={reverseProxy}
              fullWidth
              label={i18n.t('appTitle')}
              defaultValue={appTitle}
              onChange={(e) => setApptitle(e.currentTarget.value)}
              error={appTitle === ''}
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <Typography>
              {i18n.t('rpcPollingTimeTitle')}
            </Typography>
            <Typography variant='caption' sx={{ mb: 0.5 }}>
              {i18n.t('rpcPollingTimeDescription')}
            </Typography>
            <Slider
              aria-label="rpc polling time"
              defaultValue={pollingTime}
              max={2000}
              getAriaValueText={(v: number) => `${v} ms`}
              step={null}
              valueLabelDisplay="off"
              marks={[
                { value: 100, label: '100 ms' },
                { value: 250, label: '250 ms' },
                { value: 500, label: '500 ms' },
                { value: 750, label: '750 ms' },
                { value: 1000, label: '1000 ms' },
                { value: 2000, label: '2000 ms' },
              ]}
              onChange={(_, value) => typeof value === 'number'
                ? setPollingTime(value)
                : setPollingTime(1000)
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" sx={{ mb: 0.5 }}>
              Reverse Proxy
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  defaultChecked={reverseProxy}
                  onChange={() => setReverseProxy(state => !state)}
                />
              }
              label={i18n.t('servedFromReverseProxyCheckbox')}
              sx={{ mb: 1 }}
            />
            <TextField
              fullWidth
              label={i18n.t('urlBase')}
              defaultValue={baseURL}
              onChange={(e) => {
                let value = e.currentTarget.value
                if (value.startsWith('/')) {
                  value = value.substring(1)
                }
                if (value.endsWith('/')) {
                  value = value.substring(0, value.length - 1)
                }
                baseURL$.next(value)
              }}
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
        <Typography variant="h6" color="primary" sx={{ mt: 0.5, mb: 2 }}>
          Appearance
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{i18n.t('languageSelect')}</InputLabel>
              <Select
                defaultValue={language}
                label={i18n.t('languageSelect')}
                onChange={handleLanguageChange}
              >
                {languages.toSorted((a, b) => a.localeCompare(b)).map(l => (
                  <MenuItem value={l} key={l}>
                    {capitalize(l)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{i18n.t('themeSelect')}</InputLabel>
              <Select
                defaultValue={theme}
                label={i18n.t('themeSelect')}
                onChange={handleThemeChange}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 0.5 }}>
          General download settings
        </Typography>

        <FormControlLabel
          control={
            <Switch
              defaultChecked={formatSelection}
              onChange={() => {
                setFormatSelection(!formatSelection)
              }}
            />
          }
          label={i18n.t('formatSelectionEnabler')}
        />
        <Grid>
          <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 0.5 }}>
            {i18n.t('overridesAnchor')}
          </Typography>
          <Stack direction="column">
            <FormControlLabel
              control={
                <Switch
                  defaultChecked={!!pathOverriding}
                  onChange={() => {
                    setPathOverriding(state => !state)
                  }}
                />
              }
              label={i18n.t('pathOverrideOption')}
            />
            <FormControlLabel
              control={
                <Switch
                  defaultChecked={fileRenaming}
                  onChange={() => {
                    setFileRenaming(state => !state)
                  }}
                />
              }
              label={i18n.t('filenameOverrideOption')}
            />
            <FormControlLabel
              control={
                <Switch
                  defaultChecked={enableArgs}
                  onChange={() => {
                    setEnableArgs(state => !state)
                  }}
                />
              }
              label={i18n.t('customArgs')}
            />
          </Stack>
        </Grid>
        <Grid sx={{ mr: 1, mt: 2 }}>
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            Cookies
          </Typography>
          <Suspense>
            <CookiesTextField />
          </Suspense>
        </Grid>
        <Grid>
          <Stack direction="row">
            <Button
              sx={{ mr: 1, mt: 3 }}
              variant="contained"
              onClick={() => updateBinary()}
            >
              {i18n.t('updateBinButton')}
            </Button>
          </Stack>
        </Grid>
      </Paper>
    </Container>
  )
}
