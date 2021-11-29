export interface IMessage {
    status: string,
    progress?: string,
    size?: string,
    dlSpeed?: string
}

export interface IDLSpeed {
    effective: number,
    unit: string,
}