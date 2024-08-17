{ pkgs ? import <nixpkgs> { } }:
pkgs.mkShell {
  nativeBuildInputs = [
    pkgs.yt-dlp
    pkgs.nodejs_22
    pkgs.go
  ];
}
