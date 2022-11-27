import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { CliArguments } from "../../classes"
import { I18nBuilder } from "../../i18n"

export type LanguageUnion = "english" | "chinese" | "russian" | "italian" | "spanish" | "korean" | "japanese"
export type ThemeUnion = "light" | "dark"

export interface SettingsState {
    serverAddr: string,
    serverPort: string,
    language: LanguageUnion,
    theme: ThemeUnion,
    cliArgs: string,
    formatSelection: boolean,
    ratelimit: string,
}

const initialState: SettingsState = {
    serverAddr: localStorage.getItem("server-addr") || window.location.hostname,
    serverPort: localStorage.getItem("server-port") || window.location.port,
    language: (localStorage.getItem("language") || "english") as LanguageUnion,
    theme: (localStorage.getItem("theme") || "light") as ThemeUnion,
    cliArgs: localStorage.getItem("cli-args") ?? "",
    formatSelection: localStorage.getItem("format-selection") === "true",
    ratelimit: localStorage.getItem("rate-limit") ?? "",
}

export const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        setServerAddr: (state, action: PayloadAction<string>) => {
            state.serverAddr = action.payload
            localStorage.setItem("server-addr", action.payload)
        },
        setServerPort: (state, action: PayloadAction<string>) => {
            state.serverPort = action.payload
            localStorage.setItem("server-port", action.payload)
        },
        setLanguage: (state, action: PayloadAction<LanguageUnion>) => {
            state.language = action.payload
            localStorage.setItem("language", action.payload)
        },
        setCliArgs: (state, action: PayloadAction<string>) => {
            state.cliArgs = action.payload
            localStorage.setItem("cli-args", action.payload)
        },
        setTheme: (state, action: PayloadAction<ThemeUnion>) => {
            state.theme = action.payload
            localStorage.setItem("theme", action.payload)
        },
        setFormatSelection: (state, action: PayloadAction<boolean>) => {
            state.formatSelection = action.payload
            localStorage.setItem("format-selection", action.payload.toString())
        },
        setRateLimit: (state, action: PayloadAction<string>) => {
            state.ratelimit = action.payload
            localStorage.setItem("rate-limit", action.payload)
        },
    }
})

export const { setLanguage, setCliArgs, setTheme, setServerAddr, setServerPort, setFormatSelection, setRateLimit } = settingsSlice.actions

export default settingsSlice.reducer