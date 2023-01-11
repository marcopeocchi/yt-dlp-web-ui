export type RPCMethods =
  | "Service.Exec"
  | "Service.Kill"
  | "Service.Running"
  | "Service.KillAll"
  | "Service.FreeSpace"
  | "Service.Formats"
  | "Service.DirectoryTree"

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