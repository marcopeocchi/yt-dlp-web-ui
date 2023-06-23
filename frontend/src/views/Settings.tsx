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
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  map,
  takeWhile
} from 'rxjs'
import { CliArguments } from '../lib/argsParser'
import I18nBuilder from '../lib/intl'
import { RPCClient } from '../lib/rpcClient'
import {
  LanguageUnion,
  ThemeUnion,
  setCliArgs,
  setEnableCustomArgs,
  setFileRenaming,
  setFormatSelection,
  setLanguage,
  setPathOverriding,
  setServerAddr,
  setServerPort,
  setTheme
} from '../features/settings/settingsSlice'
import { updated } from '../features/status/statusSlice'
import { RootState } from '../stores/store'
import { validateDomain, validateIP } from '../utils'

export default function Settings() {
  const dispatch = useDispatch()

  const status = useSelector((state: RootState) => state.status)
  const settings = useSelector((state: RootState) => state.settings)

  const [invalidIP, setInvalidIP] = useState(false);

  const i18n = useMemo(() => new I18nBuilder(settings.language), [settings.language])

  const client = useMemo(() => new RPCClient(), [])
  const cliArgs = useMemo(() => new CliArguments().fromString(settings.cliArgs), [])

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
          dispatch(setServerAddr(addr))
        } else if (validateDomain(addr)) {
          setInvalidIP(false)
          dispatch(setServerAddr(addr))
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
        dispatch(setServerPort(port.toString()))
      })
    return () => sub.unsubscribe()
  }, [])

  /**
   * Language toggler handler 
   */
  const handleLanguageChange = (event: SelectChangeEvent<LanguageUnion>) => {
    dispatch(setLanguage(event.target.value as LanguageUnion));
  }

  /**
   * Theme toggler handler 
   */
  const handleThemeChange = (event: SelectChangeEvent<ThemeUnion>) => {
    dispatch(setTheme(event.target.value as ThemeUnion));
  }

  /**
   * Send via WebSocket a message to update yt-dlp binary
   */
  const updateBinary = () => {
    client.updateExecutable().then(() => dispatch(updated()))
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
                    defaultValue={settings.serverAddr}
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
                    defaultValue={settings.serverPort}
                    onChange={(e) => serverPort$.next(e.currentTarget.value)}
                    error={isNaN(Number(settings.serverPort)) || Number(settings.serverPort) > 65535}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{i18n.t('languageSelect')}</InputLabel>
                    <Select
                      defaultValue={settings.language}
                      label={i18n.t('languageSelect')}
                      onChange={handleLanguageChange}
                    >
                      <MenuItem value="english">English</MenuItem>
                      <MenuItem value="spanish">Spanish</MenuItem>
                      <MenuItem value="italian">Italian</MenuItem>
                      <MenuItem value="chinese">Chinese</MenuItem>
                      <MenuItem value="russian">Russian</MenuItem>
                      <MenuItem value="korean">Korean</MenuItem>
                      <MenuItem value="japanese">Japanese</MenuItem>
                      <MenuItem value="catalan">Catalan</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{i18n.t('themeSelect')}</InputLabel>
                    <Select
                      defaultValue={settings.theme}
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
                    defaultChecked={cliArgs.noMTime}
                    onChange={() => dispatch(setCliArgs(cliArgs.toggleNoMTime().toString()))}
                  />
                }
                label={i18n.t('noMTimeCheckbox')}
                sx={{ mt: 3 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={cliArgs.extractAudio}
                    onChange={() => dispatch(setCliArgs(cliArgs.toggleExtractAudio().toString()))}
                    disabled={settings.formatSelection}
                  />
                }
                label={i18n.t('extractAudioCheckbox')}
              />
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={settings.formatSelection}
                    onChange={() => {
                      dispatch(setCliArgs(cliArgs.disableExtractAudio().toString()))
                      dispatch(setFormatSelection(!settings.formatSelection))
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
                        defaultChecked={settings.pathOverriding}
                        onChange={() => {
                          dispatch(setPathOverriding(!settings.pathOverriding))
                        }}
                      />
                    }
                    label={i18n.t('pathOverrideOption')}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked={settings.fileRenaming}
                        onChange={() => {
                          dispatch(setFileRenaming(!settings.fileRenaming))
                        }}
                      />
                    }
                    label={i18n.t('filenameOverrideOption')}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked={settings.enableCustomArgs}
                        onChange={() => {
                          dispatch(setEnableCustomArgs(!settings.enableCustomArgs))
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
                    onClick={() => dispatch(updated())}
                  >
                    {i18n.t('updateBinButton')}
                  </Button>
                </Stack>
              </Grid>
            </FormGroup>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar
        open={status.updated}
        autoHideDuration={1500}
        message={i18n.t('toastUpdated')}
        onClose={updateBinary}
      />
    </Container>
  );
}