export interface IMessage {
    status: string,
    progress?: string,
    size?: string,
    dlSpeed?: string
    pid: number
}

export interface IDLInfoBase {
    title: string,
    thumbnail: string,
    upload_date?: string | Date,
    duration?: number
    resolution?: string
}

export interface IDownloadInfo {
    formats: Array<IDownloadInfoSection>,
    best: IDownloadInfoSection,
    thumbnail: string,
    title: string,
}

export interface IDownloadInfoSection {
    format_id: string,
    format_note: string,
    fps: number,
    resolution: string,
    vcodec: string,
}

export interface IDLInfo {
    pid: number,
    info: IDLInfoBase
}

export interface IDLSpeed {
    effective: number,
    unit: string,
}
