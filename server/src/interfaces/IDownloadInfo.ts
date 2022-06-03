interface IDownloadInfo {
    formats: Array<IDownloadInfoSection>,
    best: IDownloadInfoSection,
    thumbnail: string,
    title: string,
}

interface IDownloadInfoSection {
    format_id: string,
    format_note: string,
    fps: number,
    resolution: string,
    vcodec: string,
    acodec: string,
}