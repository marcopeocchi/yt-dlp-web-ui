import { Chip, CircularProgress } from '@mui/material'
import { useRecoilValue } from 'recoil'
import { ytdlpVersionState } from '../atoms/status'

const VersionIndicator: React.FC = () => {
  const version = useRecoilValue(ytdlpVersionState)

  return (
    version
      ? <Chip label={`yt-dlp v${version}`} variant="outlined" size="small" />
      : <CircularProgress size={15} />
  )
}

export default VersionIndicator