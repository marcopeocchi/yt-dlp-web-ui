export interface IDownloadMetadata {
    formats: Array<IDownloadFormat>,
    best: IDownloadFormat,
    thumbnail: string,
    title: string,
}

export interface IDownloadFormat {
    format_id: string,
    format_note: string,
    fps: number,
    resolution: string,
    vcodec: string,
    acodec: string,
}