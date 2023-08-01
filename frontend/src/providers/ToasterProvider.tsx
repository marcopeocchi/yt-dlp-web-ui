import { Alert, Snackbar } from "@mui/material"
import { useRecoilState } from 'recoil'
import { toastListState } from '../atoms/toast'
import { useEffect } from 'react'

const Toaster: React.FC = () => {
  const [toasts, setToasts] = useRecoilState(toastListState)

  useEffect(() => {
    if (toasts.length > 0) {
      const closer = setInterval(() => {
        setToasts(t => t.map(t => ({ ...t, open: false })))
      }, 1500)

      const cleaner = setInterval(() => {
        setToasts(t => t.filter((x) => (Date.now() - x.createdAt) < 1500))
      }, 1750)

      return () => {
        clearInterval(closer)
        clearInterval(cleaner)
      }
    }
  }, [setToasts, toasts.length])

  return (
    <>
      {toasts.map((toast, index) => (
        <Snackbar
          key={index}
          open={toast.open}
          sx={index > 0 ? { marginBottom: index * 6.5 } : {}}
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