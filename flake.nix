{
  description = "A terrible web ui for yt-dlp. Designed to be self-hosted.";

  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = inputs@{ self, flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
      ];
      systems = [ "x86_64-linux" ];
      perSystem = { config, self', inputs', pkgs, system, ... }: {
        packages = {
          default =
            let
              frontendApplied = import ./nix/server.nix { inherit (self'.packages) frontend; };
            in
            pkgs.callPackage frontendApplied { };
          frontend = pkgs.callPackage ./nix/frontend.nix { };
        };
        devShells.default = pkgs.callPackage ./env.nix { };
        formatter = pkgs.nixpkgs-fmt;
      };
      flake = {
        nixosModules.default = import ./nix/module.nix self.packages;
      };
    };
}
