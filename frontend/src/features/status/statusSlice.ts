import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface StatusState {
    connected: boolean,
    updated: boolean,
    downloading: boolean,
    freeSpace: number,
}

const initialState: StatusState = {
    connected: false,
    updated: false,
    downloading: false,
    freeSpace: 0,
}

export const statusSlice = createSlice({
    name: 'status',
    initialState,
    reducers: {
        connected: (state) => {
            state.connected = true
        },
        disconnected: (state) => {
            state.connected = false
        },
        updated: (state) => {
            state.updated = true
        },
        alreadyUpdated: (state) => {
            state.updated = false
        },
        downloading: (state) => {
            state.downloading = true
        },
        finished: (state) => {
            state.downloading = false
        },
        setFreeSpace: (state, action: PayloadAction<number>) => {
            state.freeSpace = action.payload
        }
    }
})

export const { connected, disconnected, updated, alreadyUpdated, downloading, finished, setFreeSpace } = statusSlice.actions

export default statusSlice.reducer 