default:
	go build -o yt-dlp-webui main.go

all:
	cd frontend && pnpm build && cd ..
	go build -o yt-dlp-webui main.go

multiarch:
	GOOS=linux GOARCH=arm go build -o yt-dlp-webui_linux-arm *.go
	GOOS=linux GOARCH=arm64 go build -o yt-dlp-webui_linux-arm64 *.go
	GOOS=linux GOARCH=amd64 go build -o yt-dlp-webui_linux-amd64 *.go
	mkdir -p build
	mv yt-dlp-webui* build

clean:
	rm -rf build