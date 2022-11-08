# yt-dlp Web UI


**To anyone who is interested i'm working on a [RPC server for yt-dlp](https://github.com/marcopeocchi/yt-dlp-rpc).**


A not so terrible web ui for yt-dlp.  
Created for the only purpose of *fetching* videos from my server/nas. 

Intended to be used with docker but standalone is fine too. 😎👍

Developed to be as lightweight as possible (because my server is basically an intel atom sbc). 

The bottleneck remains yt-dlp startup time (until yt-dlp will provide a rpc interface).

**I strongly recomend the ghcr build instead of docker hub one.**

```shell
docker pull ghcr.io/marcopeocchi/yt-dlp-web-ui:master
```

---

Changelog:
```
05/03/22: Korean translation by kimpig

03/03/22: cut-down image size by switching to Alpine linux based container

01/03/22: Chinese translation by deluxghost

03/02/22: i18n enabled! I need help with the translations :/

27/01/22: Multidownload implemented!

26/01/22: Multiple downloads are being implemented. Maybe by next release they will be there.
Refactoring and JSDoc.

04/01/22: Background jobs now are retrieved!! It's still rudimentary but it leverages on yt-dlp resume feature.

05/05/22: Material UI update.

03/06/22: The most requested feature finally implemented: Format Selection!!

08/06/22: ARM builds.

28/02/22: Reworked resume download feature. Now it's pratically instantaneous. It no longer stops and restarts each process, references to each process are saved in memory.
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
-   Optional format selection

<img src="https://i.imgur.com/2zPs8FH.png">
<img src="https://i.imgur.com/b4Jhkfk.png">
<img src="https://i.imgur.com/knjLa8c.png">

## Format selection

![fs1](https://i.ibb.co/fNxDHJd/localhost-1234-2.png)

This feature is disabled by default as this WebUI/Wrapper/Software/Bunch of Code is intended to be used to retrieve the best quality automatically.

To enable it go to the settings page:

![fs2](https://i.ibb.co/YdXRwKc/localhost-1234-3.png)

And set it :D

Future releases will have:
-   ~~Multi download~~ *done*
-   ~~Exctract audio~~ *done*
-   ~~Format selection~~ *done*
-   Download archive
-   ~~ARM Build~~ *done available through ghcr.io*

## Troubleshooting
-   **It says that it isn't connected/ip in the footer is not defined.**
    - You must set the server ip address in the settings section (gear icon).
-   **The download  doesn't start.**
    - As before server address is not specified or simply yt-dlp process takes a lot of time to fire up. (Forking yt-dlp isn't fast especially if you have a lower-end/low-power NAS/server/desktop where the server is running)
-   **Background jobs are not retrieved.**
    -   ~~As before forking yt-dlp isn't fast so resuming n background jobs takes _n_*_time to exec yt-dlp_ Just have patience.~~ Fixed.

## Docker installation
```shell 
# recomended for ARM and x86 devices 
docker pull ghcr.io/marcopeocchi/yt-dlp-web-ui:master
docker run -d -p 3022:3022 -v <your dir>:/usr/src/yt-dlp-webui/downloads ghcr.io/marcopeocchi/yt-dlp-web-ui:master

# or even
docker pull ghcr.io/marcopeocchi/yt-dlp-web-ui:master
docker create --name yt-dlp-webui -p 8082:3022 -v <your dir>:/usr/src/yt-dlp-webui/downloads ghcr.io/marcopeocchi/yt-dlp-web-ui:master
```

or  

```shell
docker build -t yt-dlp-webui .
docker run -d -p 3022:3022 -v <your dir>:/usr/src/yt-dlp-webui/downloads yt-dlp-webui
```

## Manual installation
```shell
# the dependencies are: python3, ffmpeg, nodejs, psmisc.

npm i
npm run build-all

# edit the settings.json specifying port and download path or 
# it will default to the following created folder

mkdir downloads

node dist/main.js
```

## FAQ
-   **Will it availabe for Raspberry Pi/ generic ARM devices?**
    - Yes, it's currently available through ghcr.io
      ```
      docker pull ghcr.io/marcopeocchi/yt-dlp-web-ui:master
      ```
      If you plan to use it on a Raspberry Pi ensure to have fast and durable storage.
-   **Why the docker image is so heavy?**
    - Originally it was 1.8GB circa, now it has been slimmed to ~340MB compressed. This is due to the fact that it encapsule a basic Alpine linux image + FFmpeg + Node.js + Python3 + yt-dlp.
-   **Am I forced to run it on port 3022?**
    -   Well, yes (until now).
-   **Why is it so slow to start a download?**
    - I genuinely don't know. I know that standalone yt-dlp is slow to start up even on my M1 Mac, so....
