import { atom, selector } from 'recoil'
import { RPCClient } from '../lib/rpcClient'
import { rpcHTTPEndpoint, rpcWebSocketEndpoint } from './settings'

export const rpcClientState = selector({
  key: 'rpcClientState',
  get: ({ get }) =>
    new RPCClient(
      get(rpcHTTPEndpoint),
      get(rpcWebSocketEndpoint),
      localStorage.getItem('token') ?? ''
    ),
  dangerouslyAllowMutability: true,
})

export const rpcPollingTimeState = atom({
  key: 'rpcPollingTimeState',
  default: Number(localStorage.getItem('rpc-polling-time')) || 1000,
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('rpc-polling-time', a.toString()))
  ]
})