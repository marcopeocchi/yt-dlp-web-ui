import React, { useEffect, useState } from "react";
import { Backdrop, CircularProgress, Container, Grid } from "@mui/material";
import { ArchiveResult } from "./components/ArchiveResult";
import { useSelector } from "react-redux";
import { RootState } from "./stores/store";

export default function archivedDownloads() {
    const [loading, setLoading] = useState(true);
    const [archived, setArchived] = useState([]);

    const settings = useSelector((state: RootState) => state.settings)

    useEffect(() => {
        fetch(`http://${settings.serverAddr}:3022/getAllDownloaded`)
            .then(res => res.json())
            .then(data => setArchived(data))
            .then(() => setLoading(false))
    }, []);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}
            >
                <CircularProgress color="primary" />
            </Backdrop>
            {
                archived.length > 0 ?
                    <Grid container spacing={{ xs: 2, md: 2 }} columns={{ xs: 4, sm: 8, md: 12 }} pt={2}>
                        {
                            archived.map((el, idx) =>
                                <Grid key={`${idx}-${el.id}`} item xs={4} sm={4} md={4}>
                                    <ArchiveResult
                                        url={`http://${settings.serverAddr}:3022/stream/${el.id}`}
                                        thumbnail={el.img} title={el.title}
                                    />
                                </Grid>
                            )
                        }
                    </Grid>
                    : null
            }
        </Container>
    );
}