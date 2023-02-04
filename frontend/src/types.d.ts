export type RPCMethods =
  | "Service.Exec"
  | "Service.Kill"
  | "Service.Clear"
  | "Service.Running"
  | "Service.KillAll"
  | "Service.FreeSpace"
  | "Service.Formats"
  | "Service.DirectoryTree"
  | "Service.UpdateExecutable"

export type RPCRequest = {
  method: RPCMethods,
  params?: any[],
  id?: string
}

export type RPCResponse<T> = {
  result: T,
  error: number | null
  id?: string
}

export type RPCResult = {
  id: string
  progress: {
    speed: number
    eta: number
    percentage: string
  }
  info: {
    url: string
    filesize_approx?: number
    resolution?: string
    thumbnail: string
    title: string
    vcodec?: string
    acodec?: string
    ext?: string
  }
}

export type RPCParams = {
  URL: string
  Params?: string
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
  filesize_approx: number,
}