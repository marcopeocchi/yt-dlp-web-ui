import { AlertColor } from '@mui/material'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ToastState {
  message: string
  open: boolean
  autoClose: boolean
  severity?: AlertColor
}

type MessageAction = {
  message: string,
  severity?: AlertColor
}

const initialState: ToastState = {
  message: '',
  open: false,
  autoClose: true,
}

export const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    setMessage: (state, action: PayloadAction<MessageAction>) => {
      state.message = action.payload.message
      state.severity = action.payload.severity
      state.open = true
    },
    setOpen: (state) => {
      state.open = true
    },
    setClose: (state) => {
      state.open = false
    },
  }
})

export const {
  setMessage,
  setClose,
  setOpen,
} = toastSlice.actions

export default toastSlice.reducer