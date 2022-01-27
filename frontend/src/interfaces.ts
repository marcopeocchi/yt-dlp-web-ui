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

export interface IDLInfo {
    pid: number,
    info: IDLInfoBase
}

export interface IDLSpeed {
    effective: number,
    unit: string,
}
