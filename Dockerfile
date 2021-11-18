FROM node:14
VOLUME /downloads
WORKDIR /usr/src/yt-dlp-webui
COPY package*.json ./
RUN npm install
RUN npm run build
COPY . .
EXPOSE 3022
CMD [ "node" , "./server.js" ]