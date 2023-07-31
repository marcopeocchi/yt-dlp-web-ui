import { AlertColor } from '@mui/material'
import { atom } from 'recoil'

type Toast = {
  open: boolean,
  message: string
  autoClose: boolean
  createdAt: number,
  severity?: AlertColor
}

export const toastListState = atom<Toast[]>({
  key: 'toastListState',
  default: [],
})