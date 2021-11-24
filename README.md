# yt-dlp Web UI

A terrible web ui for yt-dlp.  
Created for the only purpose of *cough cough* k-pop videos from my server/nas.  
I will eventually make this better as soon as I can. Not in the immediate.  

<img src="https://i.ibb.co/drt0LWc/Screenshot-2021-11-24-at-13-11-09-yt-dlp-Web-UI.png" alt="ytdlpwebui">

## Docker install
```
docker pull marcobaobao/yt-dlp-webui:latest
docker run -d -p 3022:3022 -v <your dir>:/usr/src/yt-dlp-webui/downloads marcobaobao/yt-dlp-webui
```
or  
```
docker build -t yt-dlp-webui .
docker run -d -p 3022:3022 -v <your dir>:/usr/src/yt-dlp-webui/downloads yt-dlp-webui
```

## Manual install
```
// download the yt-dl build and put it in the lib folder and make it executable

npm i
npm run build
npm run fetch

// edit the settings.json specifying the download path or 
// it will use the following folder

mkdir downloads

node server.js
```

## Todo list
- retrieve background task
- better ui/ux
