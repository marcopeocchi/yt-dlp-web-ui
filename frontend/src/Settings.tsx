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
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Socket } from "socket.io-client";
import { LanguageUnion, setCliArgs, setFormatSelection, setLanguage, setServerAddr, setTheme, ThemeUnion } from "./features/settings/settingsSlice";
import { alreadyUpdated, updated } from "./features/status/statusSlice";
import { RootState } from "./stores/store";
import { validateDomain, validateIP } from "./utils";

type Props = {
    socket: Socket
}

export default function Settings({ socket }: Props) {
    const settings = useSelector((state: RootState) => state.settings)
    const status = useSelector((state: RootState) => state.status)
    const dispatch = useDispatch()

    const [invalidIP, setInvalidIP] = useState(false);

    /**
     * Update the server ip address state and localstorage whenever the input value changes.  
     * Validate the ip-addr then set.
     * @param e Input change event
     */
    const handleAddrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        if (validateIP(input)) {
            setInvalidIP(false)
            dispatch(setServerAddr(input))
        } else if (validateDomain(input)) {
            setInvalidIP(false)
            dispatch(setServerAddr(input))
        } else {
            setInvalidIP(true)
        }
    }

    /**
     * Language toggler handler 
     */
    const handleLanguageChange = (event: SelectChangeEvent<LanguageUnion>) => {
        dispatch(setLanguage(event.target.value as LanguageUnion));
    }

    /**
     * Language toggler handler 
     */
    const handleThemeChange = (event: SelectChangeEvent<ThemeUnion>) => {
        dispatch(setTheme(event.target.value as ThemeUnion));
    }

    /**
     * Send via WebSocket a message in order to update the yt-dlp binary from server
     */
    const updateBinary = () => {
        socket.emit('update-bin')
        dispatch(alreadyUpdated())
    }


    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Chart */}
                <Grid item xs={12} md={12} lg={12}>
                    <Paper
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 240,
                        }}
                    >
                        <Typography pb={2} variant="h6" color="primary">
                            {settings.i18n.t('settingsAnchor')}
                        </Typography>
                        <FormGroup>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={10}>
                                    <TextField
                                        fullWidth
                                        label={settings.i18n.t('serverAddressTitle')}
                                        defaultValue={settings.serverAddr}
                                        onChange={handleAddrChange}
                                        error={invalidIP}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">ws://</InputAdornment>,
                                        }}
                                        sx={{ mb: 2 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        fullWidth
                                        label={settings.i18n.t('serverAddressTitle')}
                                        defaultValue={settings.serverAddr}
                                        onChange={handleAddrChange}
                                        error={invalidIP}
                                        sx={{ mb: 2 }}
                                    />
                                </Grid>
                            </Grid>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="demo-simple-select-label">Language</InputLabel>
                                        <Select
                                            defaultValue={settings.language}
                                            label="Language"
                                            onChange={handleLanguageChange}
                                        >
                                            <MenuItem value="english">English</MenuItem>
                                            <MenuItem value="spanish">Spanish</MenuItem>
                                            <MenuItem value="italian">Italian</MenuItem>
                                            <MenuItem value="chinese">Chinese</MenuItem>
                                            <MenuItem value="russian">Russian</MenuItem>
                                            <MenuItem value="korean">Korean</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Theme</InputLabel>
                                        <Select
                                            defaultValue={settings.theme}
                                            label="Theme"
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
                                        defaultChecked={settings.cliArgs.noMTime}
                                        onChange={() => dispatch(setCliArgs(settings.cliArgs.toggleNoMTime()))}
                                    />
                                }
                                label={settings.i18n.t('noMTimeCheckbox')}
                                sx={{ mt: 3 }}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        defaultChecked={settings.cliArgs.extractAudio}
                                        onChange={() => dispatch(setCliArgs(settings.cliArgs.toggleExtractAudio()))}
                                    />
                                }
                                label={settings.i18n.t('extractAudioCheckbox')}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        defaultChecked={settings.formatSelection}
                                        onChange={() => dispatch(setFormatSelection(!settings.formatSelection))}
                                    />
                                }
                                label={settings.i18n.t('formatSelectionEnabler')}
                            />
                            <Grid>
                                <Stack direction="row">
                                    <Button
                                        sx={{ mr: 1, mt: 3 }}
                                        variant="contained"
                                        onClick={() => dispatch(updated())}
                                    >
                                        {settings.i18n.t('updateBinButton')}
                                    </Button>
                                    {/* <Button sx={{ mr: 1, mt: 1 }} variant="outlined">Primary</Button> */}
                                </Stack>
                            </Grid>
                        </FormGroup>
                    </Paper>
                </Grid>
            </Grid>
            <Snackbar
                open={status.updated}
                autoHideDuration={1500}
                message={settings.i18n.t('toastUpdated')}
                onClose={updateBinary}
            />
        </Container>
    );
}