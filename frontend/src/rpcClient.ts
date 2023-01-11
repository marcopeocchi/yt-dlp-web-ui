import type { RPCRequest, RPCResponse } from "./types"
import type { IDLMetadata } from './interfaces'

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
      fetch('/rpc-http', {
        method: 'POST',
        body: JSON.stringify(req)
      })
        .then(res => res.json())
        .then(data => resolve(data))
    })
  }

  public download(url: string, args: string) {
    if (url) {
      this.send({
        id: this.incrementSeq(),
        method: 'Service.Exec',
        params: [{
          URL: url.split("?list").at(0)!,
          Params: args.split(" ").map(a => a.trim()),
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

  public decode(data: any): RPCResponse<any> {
    return JSON.parse(data)
  }
}