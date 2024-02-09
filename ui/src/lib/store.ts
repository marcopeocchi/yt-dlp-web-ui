import * as O from 'fp-ts/lib/Option'
import { derived, readable, writable } from 'svelte/store'
import { RPCClient } from './RPCClient'
import { type CustomTemplate, type RPCResult } from './types'

export const rpcHost = writable<string>(localStorage.getItem('rpcHost') ?? 'localhost')
export const rpcPort = writable<number>(Number(localStorage.getItem('rpcPort')) || 3033)

// if authentication is enabled...
export const rpcWebToken = writable<string>(localStorage.getItem('rpcWebToken') ?? '')

// will be used to access the api and archive endpoints
export const serverApiEndpoint = derived(
  [rpcHost, rpcPort],
  ([$host, $port]) => window.location.port == ''
    ? `${window.location.protocol}//${$host}`
    : `${window.location.protocol}//${$host}:${$port}`
)

// access the websocket JSON-RPC 1.0 to gather downloads state
export const websocketRpcEndpoint = derived(
  [rpcHost, rpcPort],
  ([$host, $port]) => window.location.port == ''
    ? `${window.location.protocol.startsWith('https') ? 'wss:' : 'ws:'}//${$host}/rpc/ws`
    : `${window.location.protocol.startsWith('https') ? 'wss:' : 'ws:'}//${$host}:${$port}/rpc/ws`
)

// same as websocket one but using HTTP-POST mainly used to send commands (download, stop, ...)
export const httpPostRpcEndpoint = derived(
  serverApiEndpoint,
  $ep => window.location.port == '' ? `${$ep}/rpc/http` : `${$ep}/rpc/http`
)

/**
 * Will handle Websocket and HTTP-POST communications based on the requested method
*/
export const rpcClient = derived(
  [httpPostRpcEndpoint, websocketRpcEndpoint, rpcWebToken],
  ([$http, $ws, $token]) => new RPCClient($http, $ws, $token)
)

/**
 * Stores all the downloads returned by the rpc
 */
export const downloads = writable<O.Option<RPCResult[]>>(O.none)

export const cookiesTemplate = writable<string>('')

/**
 * fetches download templates, needs manual update
 */
export const downloadTemplates = readable<CustomTemplate[]>([], (set) => {
  serverApiEndpoint
    .subscribe(ep => fetch(`${ep}/api/v1/template/all`)
      .then(res => res.json())
      .then(data => set(data)))
})