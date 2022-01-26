# yt-dlp Web UI

A not so terrible web ui for yt-dlp.  
Created for the only purpose of *consume* videos from my server/nas.  
I will eventually make this better as soon as I can. Not in the immediate.  

Changelog:
```
26/01/22: Multiple downloads are being implemented. Maybe by next release they will be there.
Refactoring and JSDoc.

04/01/22: Background jobs now are retrieved!! It's still rudimentary but it leverages on yt-dlp resume feature

```
<img src="https://i.ibb.co/7VBK1PY/1.png">

## Now with dark mode

<img src="https://i.ibb.co/h8S5vKg/2.png">

## Settings

The avaible settings are currently only:
-   Server address
-   Switch theme
-   Extract audio

Future releases will have:
-   Multi download *on its way*
-   ~~Exctract audio~~ *done*
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


## Regarding multiple downloads
There's a way to circumvent the single download restriction **BUT IT LEADS TO UNDEFINED BEHAVIOUR**.  
Fire up multiple tabs and make a download for each tab. I know that's horrible but it's gonna be fixed by next release.

## Todo list
- ~~retrieve background tasks~~
- better ui/ux
