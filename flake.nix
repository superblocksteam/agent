{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    nixpkgs-python310.url = "github:nixos/nixpkgs/nixos-24.11";
  };

  outputs =
    {
      nixpkgs,
      nixpkgs-python310,
      ...
    }:
    let
      lib = nixpkgs.lib;
      forAllSystems =
        function:
        lib.genAttrs lib.systems.flakeExposed (
          system:
          function {
            pkgs = import nixpkgs { inherit system; };
            pkgsPython310 = import nixpkgs-python310 { inherit system; };
          }
        );
    in
    {
      formatter = forAllSystems ({ pkgs, ... }: pkgs.nixfmt);
      devShells = forAllSystems (
        { pkgs, pkgsPython310 }:
        let
          readVersionOrFallback =
            {
              path,
              fallback,
              label,
              pattern,
            }:
            let
              raw = if builtins.pathExists path then lib.strings.trim (builtins.readFile path) else "";
            in
            if raw != "" && builtins.match pattern raw != null then
              raw
            else
              builtins.trace "warning: invalid or missing ${label}; defaulting to ${fallback}" fallback;

          packageJsonNodeVersion =
            if builtins.pathExists ./package.json then
              let
                packageJsonText = builtins.replaceStrings [ "\n" "\r" ] [ " " " " ] (
                  builtins.readFile ./package.json
                );
                nodeMatch = builtins.match ''.*"engines"[[:space:]]*:[[:space:]]*\{[^}]*"node"[[:space:]]*:[[:space:]]*"([^"]+)".*'' packageJsonText;
              in
              if nodeMatch != null then builtins.elemAt nodeMatch 0 else null
            else
              null;

          goVersion = readVersionOrFallback {
            path = ./.go-version;
            fallback = "1.25.5";
            label = ".go-version";
            pattern = "[0-9]+\\.[0-9]+\\.[0-9]+";
          };
          goAttr = "go_" + builtins.replaceStrings [ "." ] [ "_" ] (lib.versions.majorMinor goVersion);
          goPackage =
            if builtins.hasAttr goAttr pkgs then
              pkgs.${goAttr}
            else
              builtins.trace "warning: unsupported Go version in .go-version: ${goVersion}; defaulting to go_1_25" pkgs.go_1_25;

          fallbackNodeVersion = readVersionOrFallback {
            path = ./.nvmrc;
            fallback = "20.19.5";
            label = ".nvmrc";
            pattern = "[0-9]+(\\.[0-9]+(\\.[0-9]+)?)?.*";
          };
          nodeVersion =
            if packageJsonNodeVersion != null then packageJsonNodeVersion else fallbackNodeVersion;
          nodeMajorMatch = builtins.match "[^0-9]*([0-9]+).*" nodeVersion;
          nodeMajor =
            if nodeMajorMatch != null then
              builtins.elemAt nodeMajorMatch 0
            else
              builtins.trace "warning: unsupported Node version for package.json/.nvmrc: ${nodeVersion}; defaulting to 20" "20";
          nodePackages = {
            "20" = pkgs.nodejs_20;
            "22" = pkgs.nodejs_22;
            "24" = pkgs.nodejs_24;
          };
          corepackPackages = {
            "20" = pkgs.corepack_20;
            "22" = pkgs.corepack_22;
            "24" = pkgs.corepack_24;
          };
          nodePackage =
            if builtins.hasAttr nodeMajor nodePackages then
              nodePackages.${nodeMajor}
            else
              builtins.trace "warning: unsupported Node version for package.json/.nvmrc: ${nodeVersion}; defaulting to nodejs_20" pkgs.nodejs_20;
          corepackPackage =
            if builtins.hasAttr nodeMajor corepackPackages then
              corepackPackages.${nodeMajor}
            else
              builtins.trace "warning: unsupported Node version for package.json/.nvmrc: ${nodeVersion}; defaulting to corepack_20" pkgs.corepack_20;

          pythonVersion = readVersionOrFallback {
            path = ./workers/python/.python-version;
            fallback = "3.10.14";
            label = "workers/python/.python-version";
            pattern = "[0-9]+\\.[0-9]+\\.[0-9]+";
          };
          pythonMinor = lib.versions.majorMinor pythonVersion;
          pythonPackages = {
            "3.10" = pkgsPython310.python310;
          };
          pythonPackage =
            if builtins.hasAttr pythonMinor pythonPackages then
              pythonPackages.${pythonMinor}
            else
              builtins.trace "warning: unsupported Python version in workers/python/.python-version: ${pythonVersion}; defaulting to python310" pkgsPython310.python310;
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.buf
              corepackPackage
              goPackage
              pkgs.go-mockery
              pkgs.gotestsum
              nodePackage
              pkgs.pprof
              pythonPackage
            ];
          };
        }
      );
    };
}
