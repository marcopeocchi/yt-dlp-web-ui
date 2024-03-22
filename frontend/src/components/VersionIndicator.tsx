import { Chip, CircularProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { serverURL } from '../atoms/settings'
import { useToast } from '../hooks/toast'

const VersionIndicator: React.FC = () => {
  const serverAddr = useRecoilValue(serverURL)

  const [version, setVersion] = useState('')
  const { pushMessage } = useToast()

  const fetchVersion = async () => {
    const res = await fetch(`${serverAddr}/api/v1/version`, {
      headers: {
        'X-Authentication': localStorage.getItem('token') ?? ''
      }
    })

    if (!res.ok) {
      return pushMessage(await res.text(), 'error')
    }

    setVersion(await res.json())
  }

  useEffect(() => {
    fetchVersion()
  }, [])

  return (
    version
      ? <Chip label={`yt-dlp v${version}`} variant="outlined" size="small" />
      : <CircularProgress size={15} />
  )
}

export default VersionIndicator