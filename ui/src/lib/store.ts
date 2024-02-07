import { derived, readable, writable } from 'svelte/store'
import { RPCClient } from './RPCClient'
import type { RPCResponse, RPCResult } from './types'

export const rpcHost = writable<string>(localStorage.getItem('rpcHost') ?? 'localhost')
export const rpcPort = writable<number>(Number(localStorage.getItem('rpcPort')) || 3033)

export const rpcWebToken = writable<string>(localStorage.getItem('rpcWebToken') ?? '')

export const serverApiEndpoint = derived(
  [rpcHost, rpcPort],
  ([$host, $port]) => window.location.port == ''
    ? `${window.location.protocol}//${$host}`
    : `${window.location.protocol}//${$host}:${$port}`
)

export const websocketRpcEndpoint = derived(
  [rpcHost, rpcPort],
  ([$host, $port]) => window.location.port == ''
    ? `${window.location.protocol.startsWith('https') ? 'wss:' : 'ws:'}//${$host}/rpc/ws`
    : `${window.location.protocol.startsWith('https') ? 'wss:' : 'ws:'}//${$host}:${$port}/rpc/ws`
)

export const httpPostRpcEndpoint = derived(
  serverApiEndpoint,
  $ep => window.location.port == '' ? `${$ep}/rpc/http` : `${$ep}/rpc/http`
)

export const rpcClient = derived(
  [httpPostRpcEndpoint, websocketRpcEndpoint, rpcWebToken],
  ([$http, $ws, $token]) => new RPCClient($http, $ws, $token)
)

export const downloads = readable<RPCResponse<RPCResult[]>>({
  id: '',
  error: null,
  result: [],
})