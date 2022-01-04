# yt-dlp Web UI

A not so terrible web ui for yt-dlp.  
Created for the only purpose of *consume* videos from my server/nas.  
I will eventually make this better as soon as I can. Not in the immediate.  

**Background jobs now are retrieved. It's still rudimentary but it leverages**
**on yt-dlp resume feature**  
  
<img src="https://i.ibb.co/7VBK1PY/1.png">

## Now with dark mode

<img src="https://i.ibb.co/h8S5vKg/2.png">

## Settings

The avaible settings are currently only:
-   Server address
-   Switch theme
-   Retrieve background jobs

Future releases will have:
-   Multi download
-   ~~Exctract audio~~
-   Format selection

## Docker installation
```
docker pull marcobaobao/yt-dlp-webui:latest
docker run -d -p 3022:3022 -v <your dir>:/usr/src/yt-dlp-webui/downloads marcobaobao/yt-dlp-webui
```
or  
```
docker build -t yt-dlp-webui .
docker run -d -p 3022:3022 -v <your dir>:/usr/src/yt-dlp-webui/downloads yt-dlp-webui
```

## Manual installation
```
npm i
npm run build
npm run fetch

// edit the settings.json specifying the download path or 
// it will default to the following created folder

mkdir downloads

node server.js
```

## Todo list
- ~~retrieve background tasks~~
- better ui/ux
