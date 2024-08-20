{ yt-dlp-web-ui-frontend, buildGoModule, lib, makeWrapper, yt-dlp, ... }:
let
  fs = lib.fileset;
  common = import ./common.nix { inherit lib; };
in
buildGoModule {
  pname = "yt-dlp-web-ui";
  inherit (common) version;
  src = fs.toSource rec {
    root = ../.;
    fileset = fs.difference root (fs.unions [
      ### LIST OF FILES TO IGNORE ###
      # frontend (this is included by the frontend.nix drv instead)
      ../frontend
      # documentation
      ../examples
      # docker
      ../Dockerfile
      ../docker-compose.yml
      # nix
      ./devShell.nix
      ../.envrc
      ./tests
      # make
      ../Makefile # this derivation does not use the project Makefile
      # repo commons
      ../.github
      ../README.md
      ../LICENSE.md
      ../.gitignore
      ../.vscode
    ]);
  };

  # https://github.com/golang/go/issues/44507
  preBuild = ''
    cp -r ${yt-dlp-web-ui-frontend} frontend
  '';

  nativeBuildInputs = [ makeWrapper ];

  postInstall = ''
    wrapProgram $out/bin/yt-dlp-web-ui \
      --prefix PATH : ${lib.makeBinPath [ yt-dlp ]}
  '';

  vendorHash = "sha256-guM/U9DROJMx2ctPKBQis1YRhaf6fKvvwEWgswQKMG0=";

  meta = common.meta // {
    mainProgram = "yt-dlp-web-ui";
  };
}
