## yt-dlp Web UI

A terrible web ui for yt-dlp.  
Created for the only purpose of *cough cough* k-pop videos from my server/nas.

<img src="https://i.ibb.co/s9pcXP8/yt.png" alt="yt">

### Docker install
```
// download the yt-dl build and put it in the lib folder

mkdir downloads

docker build -t yt-dlp-webui .
docker run -d -p 3022:3022 yt-dlp-webui
```

### Manual install
```
// download the yt-dl build and put it in the lib folder

npm i
npm run build

// edit the settings.json specifying the download path or 
// it will use the following folder

mkdir downloads

node server.js
```

### Todo list
- retrieve background task
- better ui/ux