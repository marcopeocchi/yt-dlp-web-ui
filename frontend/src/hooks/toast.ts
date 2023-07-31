import { AlertColor } from '@mui/material'
import { useRecoilState } from 'recoil'
import { toastListState } from '../atoms/toast'

export const useToast = () => {
  const [toasts, setToasts] = useRecoilState(toastListState)

  return {
    pushMessage: (message: string, severity?: AlertColor) => {
      setToasts([{
        open: true,
        message: message,
        severity: severity,
        autoClose: true,
        createdAt: Date.now()
      }, ...toasts])
    }
  }
}