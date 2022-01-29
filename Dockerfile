FROM node:16-bullseye
RUN mkdir -p /usr/src/yt-dlp-webui/download
VOLUME /usr/src/yt-dlp-webui/downloads
WORKDIR /usr/src/yt-dlp-webui
COPY package*.json ./
RUN apt-get update
RUN apt-get install curl ffmpeg -y
RUN apt-get install psmisc
RUN npm install
COPY . .
RUN chmod +x ./fetch-yt-dlp.sh
RUN npm run build-all
RUN rm -rf .parcel-cache
EXPOSE 3022
CMD [ "node" , "./dist/main.js" ]
