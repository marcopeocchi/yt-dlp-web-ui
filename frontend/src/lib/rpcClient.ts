import type { DLMetadata, RPCRequest, RPCResponse } from '../types'

import { WebSocketSubject, webSocket } from 'rxjs/webSocket'

export class RPCClient {
  private seq: number
  private httpEndpoint: string
  private _socket$: WebSocketSubject<any>

  constructor(httpEndpoint: string, webSocketEndpoint: string) {
    this.seq = 0
    this.httpEndpoint = httpEndpoint
    this._socket$ = webSocket<any>(webSocketEndpoint)
  }

  public get socket$() {
    return this._socket$
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
      return this.send({
        method: 'Service.ExecPlaylist',
        params: [{
          URL: url,
          Params: args.split(" ").map(a => a.trim()),
          Path: pathOverride,
        }]
      })
    }
    this.send({
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
    this.send({
      method: 'Service.Kill',
      params: [id],
    })
  }

  public killAll() {
    this.send({
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