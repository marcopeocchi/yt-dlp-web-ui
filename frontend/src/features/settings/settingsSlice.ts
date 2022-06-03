import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { CliArguments } from "../../classes"
import { I18nBuilder } from "../../i18n"

export type LanguageUnion = "english" | "chinese" | "russian" | "italian" | "spanish" | "korean"
export type ThemeUnion = "light" | "dark"

export interface SettingsState {
    serverAddr: string,
    language: LanguageUnion,
    theme: ThemeUnion,
    cliArgs: CliArguments,
    i18n: I18nBuilder,
    formatSelection: boolean
}

const initialState: SettingsState = {
    serverAddr: localStorage.getItem("server-addr") || "localhost",
    language: (localStorage.getItem("language") || "english") as LanguageUnion,
    theme: (localStorage.getItem("theme") || "light") as ThemeUnion,
    cliArgs: localStorage.getItem("cli-args") ? new CliArguments().fromString(localStorage.getItem("cli-args")) : new CliArguments(false, true),
    i18n: new I18nBuilder((localStorage.getItem("language") || "english")),
    formatSelection: localStorage.getItem("format-selection") === "true",
}

export const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        setServerAddr: (state, action: PayloadAction<string>) => {
            state.serverAddr = action.payload
            localStorage.setItem("server-addr", action.payload)
        },
        setLanguage: (state, action: PayloadAction<LanguageUnion>) => {
            state.language = action.payload
            state.i18n.setLanguage(action.payload)
            localStorage.setItem("language", action.payload)
        },
        setCliArgs: (state, action: PayloadAction<CliArguments>) => {
            state.cliArgs = action.payload
            localStorage.setItem("cli-args", action.payload.toString())
        },
        setTheme: (state, action: PayloadAction<ThemeUnion>) => {
            state.theme = action.payload
            localStorage.setItem("theme", action.payload)
        },
        setFormatSelection: (state, action: PayloadAction<boolean>) => {
            state.formatSelection = action.payload
            localStorage.setItem("format-selection", action.payload.toString())
        },
    }
})

export const { setLanguage, setCliArgs, setTheme, setServerAddr, setFormatSelection } = settingsSlice.actions

export default settingsSlice.reducer