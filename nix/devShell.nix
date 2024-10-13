{ inputsFrom ? [ ], mkShell, yt-dlp, nodejs, go, lib, pkgs }:
let
  common = import ./common.nix { inherit lib; inherit pkgs; };
in
mkShell {
  inherit inputsFrom;
  packages = [
    yt-dlp
    nodejs
    go
    common.ogen
  ];
}
