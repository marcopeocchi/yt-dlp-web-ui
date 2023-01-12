import { EightK, FourK, Hd, Sd } from "@mui/icons-material";
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
} from "@mui/material";
import { useEffect, useState } from "react";
import { ellipsis } from "../utils";

type Props = {
  title: string,
  thumbnail: string,
  resolution: string
  percentage: string,
  size: number,
  speed: number,
  stopCallback: VoidFunction,
}

export function StackableResult({
  title,
  thumbnail,
  resolution,
  percentage,
  speed,
  size,
  stopCallback
}: Props) {
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (percentage === '-1') {
      setIsCompleted(true)
    }
  }, [percentage])

  const guessResolution = (xByY: string): any => {
    if (!xByY) return null;
    if (xByY.includes('4320')) return (<EightK color="primary" />);
    if (xByY.includes('2160')) return (<FourK color="primary" />);
    if (xByY.includes('1080')) return (<Hd color="primary" />);
    if (xByY.includes('720')) return (<Sd color="primary" />);
    return null;
  }

  const percentageToNumber = () => isCompleted ? 100 : Number(percentage.replace('%', ''))

  const roundMiB = (bytes: number) => `${(bytes / 1_000_000).toFixed(2)} MiB`
  const formatSpeedMiB = (val: number) => `${roundMiB(val)}/s`

  return (
    <Card>
      <CardActionArea>
        {thumbnail !== '' ?
          <CardMedia
            component="img"
            height={180}
            image={thumbnail}
          /> :
          <Skeleton variant="rectangular" height={180} />
        }
        <CardContent>
          {title !== '' ?
            <Typography gutterBottom variant="h6" component="div">
              {ellipsis(title, 54)}
            </Typography> :
            <Skeleton />
          }
          <Stack direction="row" spacing={1} py={2}>
            <Chip
              label={isCompleted ? 'Completed' : 'Downloading'}
              color="primary"
              size="small"
            />
            <Typography>{!isCompleted ? percentage : ''}</Typography>
            <Typography> {!isCompleted ? formatSpeedMiB(speed) : ''}</Typography>
            <Typography>{roundMiB(size ?? 0)}</Typography>
            {guessResolution(resolution)}
          </Stack>
          {percentage ?
            <LinearProgress
              variant="determinate"
              value={percentageToNumber()}
              color={isCompleted ? "secondary" : "primary"}
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
          onClick={stopCallback}>
          {isCompleted ? "Clear" : "Stop"}
        </Button>
      </CardActions>
    </Card>
  )
}