import { EightK, FourK, Hd, Sd } from "@mui/icons-material";
import { Button, Card, CardActionArea, CardActions, CardContent, CardMedia, Chip, LinearProgress, Skeleton, Stack, Typography } from "@mui/material";
import { IMessage } from "../interfaces";
import { ellipsis } from "../utils";

type Props = {
    formattedLog: IMessage,
    title: string,
    thumbnail: string,
    resolution: string
    progress: number,
    stopCallback: VoidFunction,
}

export function StackableResult({ formattedLog, title, thumbnail, resolution, progress, stopCallback }: Props) {
    const guessResolution = (xByY: string): JSX.Element => {
        if (!xByY) return null;
        if (xByY.includes('4320')) return (<EightK color="primary" />);
        if (xByY.includes('2160')) return (<FourK color="primary" />);
        if (xByY.includes('1080')) return (<Hd color="primary" />);
        if (xByY.includes('720')) return (<Sd color="primary" />);
        return null;
    }

    return (
        <Card>
            <CardActionArea>
                {thumbnail ?
                    <CardMedia
                        component="img"
                        height={180}
                        image={thumbnail}
                    /> :
                    <Skeleton variant="rectangular" height={180} />
                }
                <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                        {ellipsis(title, 54)}
                    </Typography>
                    <Stack direction="row" spacing={1} py={2}>
                        <Chip label={formattedLog.status} color="primary" />
                        <Typography>{formattedLog.progress}</Typography>
                        <Typography>{formattedLog.dlSpeed}</Typography>
                        <Typography>{formattedLog.size}</Typography>
                        {guessResolution(resolution)}
                    </Stack>
                    {progress ?
                        <LinearProgress variant="determinate" value={progress} /> :
                        null
                    }
                </CardContent>
            </CardActionArea>
            <CardActions>
                <Button variant="contained" size="small" color="primary" onClick={stopCallback}>
                    Stop
                </Button>
            </CardActions>
        </Card>
    )
}