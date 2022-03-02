# yt-dlp Web UI

A not so terrible web ui for yt-dlp.  
Created for the only purpose of *consuming* videos from my server/nas.  
I will eventually make this better as soon as I can. Not in the immediate.  

Changelog:
```
02/03/22: cut-down docker container size by using ffmpeg static builds

01/03/22: Chinese translation by deluxghost

03/02/22: i18n enabled! I need help with the translations :/

27/01/22: Multidownload implemented!

26/01/22: Multiple downloads are being implemented. Maybe by next release they will be there.
Refactoring and JSDoc.

04/01/22: Background jobs now are retrieved!! It's still rudimentary but it leverages on yt-dlp resume feature
```
<img src="https://i.ibb.co/tcq3mtq/Screenshot-20220204-122644.png">

## Now with dark mode

<img src="https://i.ibb.co/1qd2RMs/Screenshot-20220204-122713.png">

## Settings

The avaible settings are currently only:
-   Server address
-   Switch theme
-   Extract audio
-   Switch language

Future releases will have:
-   ~~Multi download~~ *done*
-   ~~Exctract audio~~ *done*
-   Format selection *in-progess*

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
npm run build-all

// edit the settings.json specifying the download path or 
// it will default to the following created folder

mkdir downloads

node dist/main.js
```


## Todo list
- ~~retrieve background tasks~~
- format selection
- better ui/ux


_static ffmpeg builds by johnvansickle https://johnvansickle.com/ffmpeg/_ 