# yt-dlp Web UI

A not so terrible web ui for yt-dlp.  
Created for the only purpose of *fetching* videos from my server/nas. 

Intended to be used with docker and in standalone mode. 😎👍

Developed to be as lightweight as possible (because my server is basically an intel atom sbc). 

The bottleneck remains yt-dlp startup time (until yt-dlp will provide a rpc interface).

**I strongly recomend the ghcr build instead of docker hub one.**

```sh
docker pull ghcr.io/marcopeocchi/yt-dlp-web-ui:latest
```

![](https://i.ibb.co/RCpfg7q/image.png)
![](https://i.ibb.co/N2749CD/image.png)

## Changelog
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

12/01/23: Switched from TypeScript to Golang on the backend. It was a great effort but it was worth it.
```

## Settings

The currently avaible settings are:
-   Server address
-   Switch theme
-   Extract audio
-   Switch language
-   Optional format selection
-   Override the output filename
-   Override the output path
-   Pass custom yt-dlp arguments safely

![](https://i.ibb.co/YdBVcgc/image.png)
![](https://i.ibb.co/Sf102b1/image.png)

## Format selection

![fs1](https://i.ibb.co/8dgS6ym/image.png)

This feature is disabled by default as this intended to be used to retrieve the best quality automatically.

To enable it just go to the settings page and enable the **Enable video/audio formats selection** flag!

Future releases will have:
-   ~~Multi download~~ *done*
-   ~~Exctract audio~~ *done*
-   ~~Format selection~~ *done*
-   Download archive
-   ~~ARM Build~~ *done available through ghcr.io*

## Troubleshooting
-   **It says that it isn't connected/ip in the header is not defined.**
    - You must set the server ip address in the settings section (gear icon).
-   **The download  doesn't start.**
    - As before server address is not specified or simply yt-dlp process takes a lot of time to fire up. (Forking yt-dlp isn't fast especially if you have a lower-end/low-power NAS/server/desktop where the server is running)

## [Docker](https://github.com/marcopeocchi/yt-dlp-web-ui/pkgs/container/yt-dlp-web-ui) installation
```sh
# recomended for ARM and x86 devices 
docker pull ghcr.io/marcopeocchi/yt-dlp-web-ui:latest
docker run -d -p 3033:3033 -v <your dir>:/usr/src/yt-dlp-webui/downloads ghcr.io/marcopeocchi/yt-dlp-web-ui:latest

# or even
docker pull ghcr.io/marcopeocchi/yt-dlp-web-ui:latest
docker create --name yt-dlp-webui -p 8082:3033 -v <your dir>:/usr/src/yt-dlp-webui/downloads ghcr.io/marcopeocchi/yt-dlp-web-ui:latest
```

Or with docker but building the container manually.

```sh
docker build -t yt-dlp-webui .
docker run -d -p 3033:3033 -v <your dir>:/usr/src/yt-dlp-webui/downloads yt-dlp-webui
```

## [Prebuilt binaries](https://github.com/marcopeocchi/yt-dlp-web-ui/releases) installation

```sh
# download the latest release from the releases page
mv yt-dlp-webui_linux-[your_system_arch] /usr/local/bin/yt-dlp-webui

# /home/user/downloads as an example and yt-dlp in $PATH
yt-dlp-webui --out /home/user/downloads

# specifying yt-dlp path
yt-dlp-webui --out /home/user/downloads --driver /opt/soemdir/yt-dlp

# specifying using a config file
yt-dlp-webui --conf /home/user/.config/yt-dlp-webui.conf
```

### Config file
By running `yt-dlp-webui` in standalone mode you have the ability to also specify a config file.
The config file **will overwrite what have been passed as cli argument**.

```yaml
# Simple configuration file for yt-dlp webui

---
port: 8989
downloadPath: /home/ren/archive
downloaderPath: /usr/local/bin/yt-dlp
```

### Systemd integration
By defining a service file in `/etc/systemd/system/yt-dlp-webui.service` yt-dlp webui can be launched as in background.

```
[Unit]
Description=yt-dlp-webui service file
After=network.target

[Service]
User=some_user
ExecStart=/usr/local/bin/yt-dlp-webui --out /mnt/share/downloads --port 8100

[Install]
WantedBy=multi-user.target
```

```shell
systemctl enable yt-dlp-webui
systemctl start yt-dlp-webui
```

## Manual installation
```sh
# the dependencies are: python3, ffmpeg, nodejs, psmisc, go.

cd frontend
npm i
npm run build

go build -o yt-dlp-webui main.go
```

## Extendable
You dont'like the Material feel?
Want to build your own frontend? We got you covered 🤠

`yt-dlp-webui` now exposes a nice **JSON-RPC 1.0** interface through Websockets and HTTP-POST
It is **planned** to also expose a **gRPC** server.

Just as an overview, these are the available methods:
-   Service.Exec
-   Service.Progress
-   Service.Formats
-   Service.Pending
-   Service.Running
-   Service.Kill
-   Service.KillAll
-   Service.Clear

For more information open an issue on GitHub and I will provide more info ASAP.

## FAQ
-   **Will it availabe for Raspberry Pi/ generic ARM devices?**
    - Yes, it's currently available through ghcr.io
      ```
      docker pull ghcr.io/marcopeocchi/yt-dlp-web-ui:master
      ```
      If you plan to use it on a Raspberry Pi ensure to have fast and durable storage.
-   **Why the docker image is so heavy?**
    - Originally it was 1.8GB circa, now it has been slimmed to ~340MB compressed. This is due to the fact that it encapsule a basic Alpine linux image + FFmpeg + Node.js + Python3 + yt-dlp.

-   **Why is it so slow to start a download?**
    - I genuinely don't know. I know that standalone yt-dlp is slow to start up even on my M1 Mac, so....

## What yt-dlp-webui is not
`yt-dlp-webui` isn't your ordinary website where to download stuff from the internet, so don't try asking for links of where this is hosted. It's a self hosted platform for a Linux NAS.
