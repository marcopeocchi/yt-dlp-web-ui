import EightK from '@mui/icons-material/EightK'
import FourK from '@mui/icons-material/FourK'
import Hd from '@mui/icons-material/Hd'
import Sd from '@mui/icons-material/Sd'
import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  LinearProgress,
  Skeleton,
  Stack,
  Typography
} from '@mui/material'
import { useCallback } from 'react'
import { RPCResult } from '../types'
import { ellipsis, formatSpeedMiB, mapProcessStatus, roundMiB } from '../utils'

type Props = {
  download: RPCResult
  onStop: () => void
  onCopy: () => void
}

const Resolution: React.FC<{ resolution?: string }> = ({ resolution }) => {
  if (!resolution) return null
  if (resolution.includes('4320')) return <EightK color="primary" />
  if (resolution.includes('2160')) return <FourK color="primary" />
  if (resolution.includes('1080')) return <Hd color="primary" />
  if (resolution.includes('720')) return <Sd color="primary" />
  return null
}

const DownloadCard: React.FC<Props> = ({ download, onStop, onCopy }) => {
  const isCompleted = useCallback(
    () => download.progress.percentage === '-1',
    [download.progress.percentage]
  )

  const percentageToNumber = useCallback(
    () => isCompleted()
      ? 100
      : Number(download.progress.percentage.replace('%', '')),
    [download.progress.percentage, isCompleted]
  )

  return (
    <Card>
      <CardActionArea onClick={() => {
        navigator.clipboard.writeText(download.info.url)
        onCopy()
      }}>
        {download.info.thumbnail !== '' ?
          <CardMedia
            component="img"
            height={180}
            image={download.info.thumbnail}
          /> :
          <Skeleton variant="rectangular" height={180} />
        }
        <CardContent>
          {download.info.title !== '' ?
            <Typography gutterBottom variant="h6" component="div">
              {ellipsis(download.info.title, 54)}
            </Typography> :
            <Skeleton />
          }
          <Stack direction="row" spacing={1} py={2}>
            <Chip
              label={
                isCompleted()
                  ? 'Completed'
                  : mapProcessStatus(download.progress.process_status)
              }
              color="primary"
              size="small"
            />
            <Typography>
              {!isCompleted() ? download.progress.percentage : ''}
            </Typography>
            <Typography>
              &nbsp;
              {!isCompleted() ? formatSpeedMiB(download.progress.speed) : ''}
            </Typography>
            <Typography>
              {roundMiB(download.info.filesize_approx ?? 0)}
            </Typography>
            <Resolution resolution={download.info.resolution} />
          </Stack>
          {download.progress.percentage ?
            <LinearProgress
              variant="determinate"
              value={percentageToNumber()}
              color={isCompleted() ? "secondary" : "primary"}
            /> :
            null
          }
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={onStop}
        >
          {isCompleted() ? "Clear" : "Stop"}
        </Button>
      </CardActions>
    </Card>
  )
}

export default DownloadCard