/**
 * Represent a download payload sent by the frontend
 */

export interface IPayload {
    url: string
    params: Array<string> | string
    path: string
    title?: string
    thumbnail?: string
    size?: string
    renameTo?: string
}