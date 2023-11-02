import StorageIcon from '@mui/icons-material/Storage'
import { useRecoilValue } from 'recoil'
import { freeSpaceBytesState } from '../atoms/status'
import { formatGiB } from '../utils'

const FreeSpaceIndicator = () => {
  const freeSpace = useRecoilValue(freeSpaceBytesState)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 3
    }}>
      <StorageIcon />
      <span>
        {formatGiB(freeSpace)}
      </span>
    </div>
  )
}

export default FreeSpaceIndicator