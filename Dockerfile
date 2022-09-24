FROM node:16-alpine3.15
RUN mkdir -p /usr/src/yt-dlp-webui/download
VOLUME /usr/src/yt-dlp-webui/downloads
WORKDIR /usr/src/yt-dlp-webui
COPY package*.json ./
# install core dependencies
RUN apk update
RUN apk add curl wget psmisc python3 ffmpeg
COPY . .
RUN chmod +x ./fetch-yt-dlp.sh
# install node dependencies
RUN yarn
RUN yarn build
RUN yarn build-server
RUN yarn run fetch
# expose and run
EXPOSE 3022
CMD [ "node" , "./dist/main.js" ]
