import StorageIcon from '@mui/icons-material/Storage'
import { useEffect, useState } from 'react'
import { formatGiB } from '../utils'
import { useRPC } from '../hooks/useRPC'

const FreeSpaceIndicator = () => {
  const [freeSpace, setFreeSpace] = useState(0)

  const { client } = useRPC()

  useEffect(() => {
    client.freeSpace().then(r => setFreeSpace(r.result))
  }, [client])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <StorageIcon />
      <span>
        &nbsp;{formatGiB(freeSpace)}&nbsp;
      </span>
    </div>
  )
}

export default FreeSpaceIndicator