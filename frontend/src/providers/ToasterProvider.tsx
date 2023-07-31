import { Alert, Snackbar } from "@mui/material"
import { useDispatch, useSelector } from "react-redux"
import { setClose } from "../features/ui/toastSlice"
import { RootState } from "../stores/store"

const Toaster: React.FC = () => {
  const toast = useSelector((state: RootState) => state.toast)
  const dispatch = useDispatch()

  return (
    <Snackbar
      open={toast.open}
      autoHideDuration={toast.severity === 'error' ? 10000 : 1500}
      onClose={() => dispatch(setClose())}
    >
      <Alert variant="filled" severity={toast.severity}>
        {toast.message}
      </Alert>
    </Snackbar>
  )
}

export default Toaster