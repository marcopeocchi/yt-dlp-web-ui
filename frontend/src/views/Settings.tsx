import {
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  TextField,
  Typography,
  capitalize
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useRecoilState } from 'recoil'
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  map,
  takeWhile
} from 'rxjs'
import {
  Language,
  Theme,
  enableCustomArgsState,
  fileRenamingState,
  formatSelectionState,
  languageState,
  languages,
  latestCliArgumentsState,
  pathOverridingState,
  serverAddressState,
  serverPortState,
  themeState
} from '../atoms/settings'
import { useToast } from '../hooks/toast'
import { useI18n } from '../hooks/useI18n'
import { useRPC } from '../hooks/useRPC'
import { CliArguments } from '../lib/argsParser'
import { validateDomain, validateIP } from '../utils'

// NEED ABSOLUTELY TO BE SPLIT IN MULTIPLE COMPONENTS
export default function Settings() {
  const [formatSelection, setFormatSelection] = useRecoilState(formatSelectionState)
  const [pathOverriding, setPathOverriding] = useRecoilState(pathOverridingState)
  const [fileRenaming, setFileRenaming] = useRecoilState(fileRenamingState)
  const [enableArgs, setEnableArgs] = useRecoilState(enableCustomArgsState)
  const [serverAddr, setServerAddr] = useRecoilState(serverAddressState)
  const [serverPort, setServerPort] = useRecoilState(serverPortState)
  const [language, setLanguage] = useRecoilState(languageState)
  const [cliArgs, setCliArgs] = useRecoilState(latestCliArgumentsState)
  const [theme, setTheme] = useRecoilState(themeState)

  const [invalidIP, setInvalidIP] = useState(false)

  const { i18n } = useI18n()
  const { client } = useRPC()

  const { pushMessage } = useToast()

  const argsBuilder = useMemo(() => new CliArguments().fromString(cliArgs), [])

  const serverAddr$ = useMemo(() => new Subject<string>(), [])
  const serverPort$ = useMemo(() => new Subject<string>(), [])

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
        } else if (validateDomain(addr)) {
          setInvalidIP(false)
          setServerAddr(addr)
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
    client.updateExecutable().then(() => pushMessage(i18n.t('toastUpdated')))
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 240,
            }}
          >
            <Typography pb={3} variant="h5" color="primary">
              {i18n.t('settingsAnchor')}
            </Typography>
            <FormGroup>
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
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <TextField
                    fullWidth
                    label={i18n.t('serverPortTitle')}
                    defaultValue={serverPort}
                    onChange={(e) => serverPort$.next(e.currentTarget.value)}
                    error={isNaN(Number(serverPort)) || Number(serverPort) > 65535}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{i18n.t('languageSelect')}</InputLabel>
                    <Select
                      defaultValue={language}
                      label={i18n.t('languageSelect')}
                      onChange={handleLanguageChange}
                    >
                      {languages.map(l => (
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
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={argsBuilder.noMTime}
                    onChange={() => setCliArgs(argsBuilder.toggleNoMTime().toString())}
                  />
                }
                label={i18n.t('noMTimeCheckbox')}
                sx={{ mt: 3 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={argsBuilder.extractAudio}
                    onChange={() => setCliArgs(argsBuilder.toggleExtractAudio().toString())}
                    disabled={formatSelection}
                  />
                }
                label={i18n.t('extractAudioCheckbox')}
              />
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={formatSelection}
                    onChange={() => {
                      setCliArgs(argsBuilder.disableExtractAudio().toString())
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
            </FormGroup>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
