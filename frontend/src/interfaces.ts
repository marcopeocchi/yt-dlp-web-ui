export interface IMessage {
    status: string,
    progress?: string,
    size?: number,
    dlSpeed?: string
    pid: number
}

export interface IDLMetadata {
    formats: Array<IDLFormat>,
    best: IDLFormat,
    thumbnail: string,
    title: string,
}

export interface IDLFormat {
    format_id: string,
    format_note: string,
    fps: number,
    resolution: string,
    vcodec: string,
    acodec: string,
}

export interface IDLMetadataAndPID {
    pid: number,
    metadata: IDLMetadata
}

export interface IDLSpeed {
    effective: number,
    unit: string,
}
