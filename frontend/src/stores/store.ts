import { configureStore } from '@reduxjs/toolkit'
import settingsReducer from '../features/settings/settingsSlice'
import statussReducer from '../features/status/statusSlice'

export const store = configureStore({
    reducer: {
        settings: settingsReducer,
        status: statussReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

