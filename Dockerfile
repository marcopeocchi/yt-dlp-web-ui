FROM node:16-bullseye
RUN mkdir -p /usr/src/yt-dlp-webui/download
VOLUME /usr/src/yt-dlp-webui/downloads
WORKDIR /usr/src/yt-dlp-webui
COPY package*.json ./
RUN apt-get update
RUN apt-get install curl psmisc wget -y
RUN npm install
RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
RUN tar -xf ffmpeg-release-amd64-static.tar.xz
RUN mv ./ffmpeg-5.0-amd64-static/ff* /usr/bin
COPY . .
RUN chmod +x ./fetch-yt-dlp.sh
RUN npm run build-all
RUN rm -rf .parcel-cache
EXPOSE 3022
CMD [ "node" , "./dist/main.js" ]
