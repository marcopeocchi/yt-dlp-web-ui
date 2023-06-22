import type { DLMetadata, RPCRequest, RPCResponse } from '../types'

import { webSocket } from 'rxjs/webSocket'
import { getHttpRPCEndpoint, getWebSocketEndpoint } from '../utils'

export const socket$ = webSocket<any>(getWebSocketEndpoint())

export class RPCClient {
  private seq: number

  constructor() {
    this.seq = 0
  }

  private incrementSeq() {
    return String(this.seq++)
  }

  private send(req: RPCRequest) {
    socket$.next({
      ...req,
      id: this.incrementSeq(),
    })
  }

  private async sendHTTP<T>(req: RPCRequest) {
    const res = await fetch(getHttpRPCEndpoint(), {
      method: 'POST',
      body: JSON.stringify({
        ...req,
        id: this.incrementSeq(),
      })
    })
    const data: RPCResponse<T> = await res.json()

    return data
  }

  public download(url: string, args: string, pathOverride = '', renameTo = '') {
    if (url) {
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