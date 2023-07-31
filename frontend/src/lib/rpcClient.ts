import { Observable, share } from 'rxjs'
import type { DLMetadata, RPCRequest, RPCResponse, RPCResult } from '../types'

import { WebSocketSubject, webSocket } from 'rxjs/webSocket'

export class RPCClient {
  private seq: number
  private httpEndpoint: string
  private readonly _socket$: WebSocketSubject<any>

  constructor(httpEndpoint: string, webSocketEndpoint: string) {
    this.seq = 0
    this.httpEndpoint = httpEndpoint
    this._socket$ = webSocket<any>(webSocketEndpoint)
  }

  public get socket$(): Observable<RPCResponse<RPCResult[]>> {
    return this._socket$.asObservable()
  }

  private incrementSeq() {
    return String(this.seq++)
  }

  private send(req: RPCRequest) {
    this._socket$.next({
      ...req,
      id: this.incrementSeq(),
    })
  }

  private async sendHTTP<T>(req: RPCRequest) {
    const res = await fetch(this.httpEndpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...req,
        id: this.incrementSeq(),
      })
    })
    const data: RPCResponse<T> = await res.json()

    return data
  }

  public download(
    url: string,
    args: string,
    pathOverride = '',
    renameTo = '',
    playlist?: boolean
  ) {
    if (!url) {
      return
    }
    if (playlist) {
      return this.sendHTTP({
        method: 'Service.ExecPlaylist',
        params: [{
          URL: url,
          Params: args.split(" ").map(a => a.trim()),
          Path: pathOverride,
        }]
      })
    }
    this.sendHTTP({
      method: 'Service.Exec',
      params: [{
        URL: url.split("?list").at(0)!,
        Params: args.split(" ").map(a => a.trim()),
        Path: pathOverride,
        Rename: renameTo,
      }]
    })
  }

  public formats(url: string) {
    if (url) {
      return this.sendHTTP<DLMetadata>({
        method: 'Service.Formats',
        params: [{
          URL: url.split("?list").at(0)!,
        }]
      })
    }
  }

  public running() {
    this.send({
      method: 'Service.Running',
      params: [],
    })
  }

  public kill(id: string) {
    this.sendHTTP({
      method: 'Service.Kill',
      params: [id],
    })
  }

  public killAll() {
    this.sendHTTP({
      method: 'Service.KillAll',
      params: [],
    })
  }

  public freeSpace() {
    return this.sendHTTP<number>({
      method: 'Service.FreeSpace',
      params: [],
    })
  }

  public directoryTree() {
    return this.sendHTTP<string[]>({
      method: 'Service.DirectoryTree',
      params: [],
    })
  }

  public updateExecutable() {
    return this.sendHTTP({
      method: 'Service.UpdateExecutable',
      params: []
    })
  }
}