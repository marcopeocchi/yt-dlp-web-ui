{ pkgs ? import <nixpkgs> {} }:
  pkgs.mkShell {
    nativeBuildInputs = with pkgs.buildPackages; [ yt-dlp nodejs_22 yarn-berry go ];
}