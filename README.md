# yt-dlp Web UI

A not so terrible web ui for yt-dlp.  
Created for the only purpose of *consuming* videos from my server/nas.  
I will eventually make this better as soon as I can. Not in the immediate.  

Changelog:
```
05/03/22: Korean translation by kimpig

03/03/22: cut-down image size by switching to Alpine linux based container

01/03/22: Chinese translation by deluxghost

03/02/22: i18n enabled! I need help with the translations :/

27/01/22: Multidownload implemented!

26/01/22: Multiple downloads are being implemented. Maybe by next release they will be there.
Refactoring and JSDoc.

04/01/22: Background jobs now are retrieved!! It's still rudimentary but it leverages on yt-dlp resume feature

05/05/22: Material UI update
```


<img src="https://i.imgur.com/gRNYKjI.png">

## Now with dark mode

<img src="https://i.imgur.com/g52mjdD.png">

## Settings

The avaible settings are currently only:
-   Server address
-   Switch theme
-   Extract audio
-   Switch language

<img src="https://i.imgur.com/2zPs8FH.png">
<img src="https://i.imgur.com/b4Jhkfk.png">
<img src="https://i.imgur.com/knjLa8c.png">

Future releases will have:
-   ~~Multi download~~ *done*
-   ~~Exctract audio~~ *done*
-   Format selection *in-progess*

## Troubleshooting
-   **It says that it isn't connected/ip in the footer is not defined.**
    - You must set the server ip address in the settings section (gear icon).
-   **The download  doens't start.**
    - As before server address is not specified or simply yt-dlp process takes a lot of time to fire up. (Forking yt-dlp isn't fast especially if you have a lower-end/low-power NAS/server/desktop where the server is running)
-   **Background jobs are not retrieved.**
    -   As before forking yt-dlp isn't fast so resuming _n_ background jobs takes _n_*_time to exec yt-dlp_ Just have patience.

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
# the dependencies are: python3, ffmpeg, nodejs, psmisc.

npm i
npm run build-all

# edit the settings.json specifying the download path or 
# it will default to the following created folder

mkdir downloads

node dist/main.js
```

## FAQ
-   **Will it availabe for Raspberry Pi/ generic ARM devices?**
    - Yes, absolutely a multi-arch docker image is planned to be released.  
      Alternatively use the **non-docker / Manual** installation method.  
      If you plan to use it on a Raspberry Pi ensure to have fast and durable storage.
-   **Why the docker image is so heavy?**
    - Originally it was 1.8GB circa, now it has been slimmed to ~340MB compressed. This is due to the fact that it encapsule a basic Alpine linux image + FFmpeg + Node.js + Python3 + yt-dlp.
-   **Am I forced to run it on port 3022?**
    -   Well, yes (until now).
-   **Why is it so slow to start a download**
    - I genuinely don't know. I know that yt-dlp is slow starting up even on my M1 Mac, so....

## Todo list
- ~~retrieve background tasks~~
- format selection
- better ui/ux
