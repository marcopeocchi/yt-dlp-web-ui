FROM node:18-alpine3.14
RUN mkdir -p /usr/src/yt-dlp-webui/download
VOLUME /usr/src/yt-dlp-webui/downloads
WORKDIR /usr/src/yt-dlp-webui
COPY package*.json ./
# install core dependencies
RUN apk update
RUN apk add curl wget psmisc python3 ffmpeg
COPY . .
RUN chmod +x ./fetch-yt-dlp.sh
# install pnpm
RUN npm install -g pnpm
# install node dependencies
RUN pnpm install
RUN pnpm fetch
RUN pnpm build
RUN pnpm build-server
# cleanup
RUN pnpm remove parcel
RUN rm -rf .parcel-cache
# expose and run
EXPOSE 3022
CMD [ "node" , "./dist/main.js" ]
