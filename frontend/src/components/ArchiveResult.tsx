import { Card, CardActionArea, CardContent, CardMedia, Skeleton, Typography } from "@mui/material";
import { ellipsis } from "../utils";

type Props = {
    title: string,
    thumbnail: string,
    url: string,
}

export function ArchiveResult({ title, thumbnail, url }: Props) {
    return (
        <Card>
            <CardActionArea onClick={() => window.open(url)}>
                {thumbnail ?
                    <CardMedia
                        component="img"
                        height={180}
                        image={thumbnail}
                    /> :
                    <Skeleton variant="rectangular" height={180} />
                }
                <CardContent>
                    <Typography gutterBottom variant="body2" component="div">
                        {ellipsis(title, 72)}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    )
}