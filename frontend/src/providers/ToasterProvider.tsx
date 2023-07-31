import { Alert, Snackbar } from "@mui/material"
import { useRecoilState } from 'recoil'
import { toastListState } from '../atoms/toast'
import { useEffect } from 'react'

const Toaster: React.FC = () => {
  const [toasts, setToasts] = useRecoilState(toastListState)

  useEffect(() => {
    if (toasts.length > 0) {
      const interval = setInterval(() => {
        setToasts(t => t.filter((x) => (Date.now() - x.createdAt) < 1500))
      }, 1500)

      return () => clearInterval(interval)
    }
  }, [setToasts, toasts])

  return (
    <>
      {toasts.map((toast, index) => (
        <Snackbar
          key={index}
          open={toast.open}
        >
          <Alert variant="filled" severity={toast.severity}>
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  )
}

export default Toaster