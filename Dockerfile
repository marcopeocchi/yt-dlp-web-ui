FROM golang:1.20-alpine AS build
# folder structure
WORKDIR /usr/src/yt-dlp-webui
# install core dependencies
RUN apk update && \
    apk add nodejs npm go
# copia la salsa
COPY . .
# build frontend
WORKDIR /usr/src/yt-dlp-webui/frontend
RUN npm install
RUN npm run build
# build backend + incubator
WORKDIR /usr/src/yt-dlp-webui
RUN CGO_ENABLED=0 GOOS=linux go build -o yt-dlp-webui

# but here yes :)
FROM alpine:edge

WORKDIR /downloads
VOLUME /downloads

WORKDIR /app

RUN apk update && \
    apk add psmisc ffmpeg yt-dlp

COPY --from=build /usr/src/yt-dlp-webui/yt-dlp-webui /app

EXPOSE 3033
CMD [ "./yt-dlp-webui" , "--out", "/downloads" ]
