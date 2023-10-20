import { Backdrop, CircularProgress } from '@mui/material'
import { useRecoilValue } from 'recoil'
import { loadingAtom } from '../atoms/ui'

const LoadingBackdrop: React.FC = () => {
  const isLoading = useRecoilValue(loadingAtom)

  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={isLoading}
    >
      <CircularProgress color="primary" />
    </Backdrop>
  )
}

export default LoadingBackdrop