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
RUN npm install
RUN npm run build-all
# cleanup
RUN npm remove parcel react react-dom react-bootstrap react-bootstrap-icons
RUN rm -rf .parcel-cache
# expose and run
EXPOSE 3022
CMD [ "node" , "./dist/main.js" ]
