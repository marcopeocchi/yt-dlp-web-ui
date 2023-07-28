import { useDispatch } from "react-redux"
import { setMessage } from "../features/ui/toastSlice"
import { AlertColor } from "@mui/material"

export const useToast = () => {
  const dispatch = useDispatch()

  return {
    pushMessage: (message: string, severity?: AlertColor) => {
      dispatch(setMessage({
        message: message,
        severity: severity
      }))
    }
  }
}