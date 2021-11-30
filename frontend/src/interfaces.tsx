export interface IMessage {
    status: string,
    progress?: string,
    size?: string,
    dlSpeed?: string | IDLSpeed
}

export interface IDLInfo {
    title: string,
    thumbnail: string,
    upload_date?: string | Date,
    duration?: number
}

export interface IDLSpeed {
    effective: number,
    unit: string,
}