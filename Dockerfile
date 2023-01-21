# Multi stage build Dockerfile

# There's no point in using the edge (development branch of alpine)
FROM alpine:3.17 AS build
# folder structure
WORKDIR /usr/src/yt-dlp-webui
# install core dependencies
RUN apk update && \
    apk add psmisc nodejs yarn go
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

WORKDIR /downloads
VOLUME /downloads

RUN apk update && \
    apk add psmisc ffmpeg yt-dlp

COPY --from=build /usr/src/yt-dlp-webui /usr/bin/yt-dlp-webui
RUN chmod +x /usr/bin/yt-dlp-webui

EXPOSE 3033
CMD [ "/usr/bin/yt-dlp-webui" , "--out", "/downloads" ]
