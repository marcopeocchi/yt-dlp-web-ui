import { AlertColor } from '@mui/material'
import { useRecoilState } from 'recoil'
import { toastListState } from '../atoms/toast'

export const useToast = () => {
  const [, setToasts] = useRecoilState(toastListState)

  return {
    pushMessage: (message: string, severity?: AlertColor) => {
      setToasts(state => [...state, {
        open: true,
        message: message,
        severity: severity,
        autoClose: true,
        createdAt: Date.now()
      }])
    }
  }
}