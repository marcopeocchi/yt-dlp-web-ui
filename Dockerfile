# Multi stage build Dockerfile

# There's no point in using the edge (development branch of alpine)
FROM alpine:3.17 AS build
# folder structure
WORKDIR /usr/src/yt-dlp-webui
# install core dependencies
RUN apk update && \
    apk add curl wget psmisc ffmpeg nodejs yarn go yt-dlp
# copia la salsa
COPY . .
# build frontend
WORKDIR /usr/src/yt-dlp-webui/frontend
RUN yarn install && \
    yarn build
# build backend + incubator
WORKDIR /usr/src/yt-dlp-webui
RUN go build -o yt-dlp-webui


FROM alpine:3.17

WORKDIR /usr/src/yt-dlp-webui/downloads
VOLUME /downloads

COPY --from=build /usr/src/yt-dlp-webui /usr/bin/yt-dlp-webui

EXPOSE 3033
CMD [ "/usr/bin/yt-dlp-webui" , "--out", "/downloads" ]
