{ lib, pkgs }: {
  version = "v3.1.2";
  meta = {
    description = "A terrible web ui for yt-dlp. Designed to be self-hosted.";
    homepage = "https://github.com/marcopeocchi/yt-dlp-web-ui";
    license = lib.licenses.mpl20;
  };
  ogen = pkgs.buildGo123Module {
    pname = "ogen";
    version = "v1.4.1";

    src = pkgs.fetchFromGitHub {
      owner = "ogen-go";
      repo = "ogen";
      rev = "v1.4.1";
      sha256 = "sha256-SwJY9VQafclAxEQ/cbRJALvMLlnSIItIOz92XzuCoCk=";
    };

    vendorHash = "sha256-IxG7y0Zy0DerCh5DRdSWSaD643BG/8Wj2wuYvkn+XzE=";
  };
}
