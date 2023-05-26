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
  method: RPCMethods
  params?: any[]
  id?: string
}

export type RPCResponse<T> = {
  result: T
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

export interface DLMetadata {
  formats: Array<DLFormat>
  best: DLFormat
  thumbnail: string
  title: string
}

export type DLFormat = {
  format_id: string
  format_note: string
  fps: number
  resolution: string
  vcodec: string
  acodec: string
  filesize_approx: number
}

export type DirectoryEntry = {
  name: string
  path: string
  shaSum: string
  isVideo: boolean,
  isDirectory: boolean
}

export type DeleteRequest = Omit<
  DirectoryEntry, 'name' | 'isDirectory' | 'isVideo'
>

export type PlayRequest = Omit<
  DirectoryEntry, 'shaSum' | 'name' | 'isDirectory' | 'isVideo'
>

