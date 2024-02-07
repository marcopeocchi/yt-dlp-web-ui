import type { DLMetadata, RPCRequest, RPCResponse, RPCResult } from './types'

type DownloadRequestArgs = {
  url: string,
  args: string,
  pathOverride?: string,
  renameTo?: string,
  playlist?: boolean
}

export class RPCClient {
  private seq: number
  private httpEndpoint: string
  private readonly _socket$: WebSocket
  private readonly token?: string

  constructor(httpEndpoint: string, webSocketEndpoint: string, token?: string) {
    this.seq = 0
    this.httpEndpoint = httpEndpoint
    this.token = token
    this._socket$ = new WebSocket(
      token ? `${webSocketEndpoint}?token=${token}` : webSocketEndpoint
    )
  }

  /**
   * Websocket connection
   */
  public get socket() {
    return this._socket$
  }

  private incrementSeq() {
    return String(this.seq++)
  }

  private send(req: RPCRequest) {
    this._socket$.send(JSON.stringify({
      ...req,
      id: this.incrementSeq(),
    }))
  }

  private argsSanitizer(args: string) {
    return args
      .split(' ')
      .map(a => a.trim().replaceAll("'", '').replaceAll('"', ''))
      .filter(Boolean)
  }

  private async sendHTTP<T>(req: RPCRequest) {
    const res = await fetch(this.httpEndpoint, {
      method: 'POST',
      headers: {
        'X-Authentication': this.token ?? ''
      },
      body: JSON.stringify({
        ...req,
        id: this.incrementSeq(),
      })
    })
    const data: RPCResponse<T> = await res.json()

    return data
  }

  /**
   * Request a new download. Handles arguments sanitization.
   * @param req payload
   * @returns 
   */
  public download(req: DownloadRequestArgs) {
    if (!req.url) {
      return
    }

    const rename = req.args.includes('-o')
      ? req.args
        .substring(req.args.indexOf('-o'))
        .replaceAll("'", '')
        .replaceAll('"', '')
        .split('-o')
        .map(s => s.trim())
        .join('')
        .split(' ')
        .at(0) ?? ''
      : ''

    const sanitizedArgs = this.argsSanitizer(
      req.args.replace('-o', '').replace(rename, '')
    )

    if (req.playlist) {
      return this.sendHTTP({
        method: 'Service.ExecPlaylist',
        params: [{
          URL: req.url,
          Params: sanitizedArgs,
          Path: req.pathOverride,
          Rename: req.renameTo || rename,
        }]
      })
    }

    this.sendHTTP({
      method: 'Service.Exec',
      params: [{
        URL: req.url.split('?list').at(0)!,
        Params: sanitizedArgs,
        Path: req.pathOverride,
        Rename: req.renameTo || rename,
      }]
    })
  }

  /**
   * Requests the available formats for a given url (-f arg)
   * @param url requested url
   * @returns 
   */
  public formats(url: string) {
    if (url) {
      return this.sendHTTP<DLMetadata>({
        method: 'Service.Formats',
        params: [{
          URL: url.split('?list').at(0)!,
        }]
      })
    }
  }

  /**
   * Requests all downloads
   */
  public running() {
    this.send({
      method: 'Service.Running',
      params: [],
    })
  }

  /**
   * Stops and removes a download asynchronously
   * @param id download id
   */
  public kill(id: string) {
    this.sendHTTP({
      method: 'Service.Kill',
      params: [id],
    })
  }

  /**
   * Stops and removes all downloads
   */
  public killAll() {
    this.sendHTTP({
      method: 'Service.KillAll',
      params: [],
    })
  }

  /**
   * Get asynchronously the avaliable space on downloads directory
   * @returns free space in bytes
   */
  public freeSpace() {
    return this.sendHTTP<number>({
      method: 'Service.FreeSpace',
      params: [],
    })
  }

  /**
   * Get asynchronously the tree view of the download directory
   * @returns free space in bytes
   */
  public directoryTree() {
    return this.sendHTTP<string[]>({
      method: 'Service.DirectoryTree',
      params: [],
    })
  }

  /**
   * Updates synchronously yt-dlp executable
   * @returns free space in bytes
   */
  public updateExecutable() {
    return this.sendHTTP({
      method: 'Service.UpdateExecutable',
      params: []
    })
  }
}