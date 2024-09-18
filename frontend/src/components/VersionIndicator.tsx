import { Chip } from '@mui/material'
import { useRecoilValue } from 'recoil'
import { ytdlpRpcVersionState } from '../atoms/status'

const VersionIndicator: React.FC = () => {
  const version = useRecoilValue(ytdlpRpcVersionState)

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <Chip label={`RPC v${version.rpcVersion}`} variant="outlined" size="small" />
      <Chip label={`yt-dlp v${version.ytdlpVersion}`} variant="outlined" size="small" />
    </div>
  )
}

export default VersionIndicator