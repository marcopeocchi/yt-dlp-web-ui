import type { RPCRequest, RPCResponse, IDLMetadata } from "../../types"

import { getHttpRPCEndpoint } from '../../utils'

export class RPCClient {
  private socket: WebSocket
  private seq: number

  constructor(socket: WebSocket) {
    this.socket = socket
    this.seq = 0
  }

  private incrementSeq() {
    return String(this.seq++)
  }

  private send(req: RPCRequest) {
    this.socket.send(JSON.stringify(req))
  }

  private sendHTTP<T>(req: RPCRequest) {
    return new Promise<RPCResponse<T>>((resolve, reject) => {
      fetch(getHttpRPCEndpoint(), {
        method: 'POST',
        body: JSON.stringify(req)
      })
        .then(res => res.json())
        .then(data => resolve(data))
    })
  }

  public download(url: string, args: string, pathOverride = '', renameTo = '') {
    if (url) {
      this.send({
        id: this.incrementSeq(),
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
      return this.sendHTTP<IDLMetadata>({
        id: this.incrementSeq(),
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

  public decode(data: any): RPCResponse<any> {
    return JSON.parse(data)
  }
}