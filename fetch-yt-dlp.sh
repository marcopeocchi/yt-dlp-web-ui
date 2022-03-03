#!/bin/sh

echo "Downloading latest yt-dlp build..."

rm -f yt-dlp

RELEASE=$(curl --silent "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

wget "https://github.com/yt-dlp/yt-dlp/releases/download/$RELEASE/yt-dlp"

chmod +x yt-dlp

echo "Done!"