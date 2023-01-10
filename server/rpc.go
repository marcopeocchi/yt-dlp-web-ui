package server

import (
	"bytes"
	"io"
	"net/rpc/jsonrpc"
)

// Wrapper for HTTP RPC request that implements io.Reader interface
type rpcRequest struct {
	r    io.Reader
	rw   io.ReadWriter
	done chan bool
}

func NewRPCRequest(r io.Reader) *rpcRequest {
	var buf bytes.Buffer
	done := make(chan bool)
	return &rpcRequest{r, &buf, done}
}

func (r *rpcRequest) Read(p []byte) (n int, err error) {
	return r.r.Read(p)
}

func (r *rpcRequest) Write(p []byte) (n int, err error) {
	return r.rw.Write(p)
}

func (r *rpcRequest) Close() error {
	r.done <- true
	return nil
}

func (r *rpcRequest) Call() io.Reader {
	go jsonrpc.ServeConn(r)
	<-r.done
	return r.rw
}
