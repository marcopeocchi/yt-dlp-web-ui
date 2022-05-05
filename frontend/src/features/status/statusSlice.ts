import { createSlice } from "@reduxjs/toolkit"

export interface StatusState {
    connected: boolean,
    updated: boolean,
    downloading: boolean,
}

const initialState: StatusState = {
    connected: false,
    updated: false,
    downloading: false,
}

export const statusSlice = createSlice({
    name: 'status',
    initialState,
    reducers: {
        connected: (state) => { state.connected = true },
        disconnected: (state) => { state.connected = false },
        updated: (state) => { state.updated = true },
        alreadyUpdated: (state) => { state.updated = false },
        downloading: (state) => { state.downloading = true },
        finished: (state) => { state.downloading = false },
    }
})

export const { connected, disconnected, updated, alreadyUpdated, downloading, finished } = statusSlice.actions

export default statusSlice.reducer 