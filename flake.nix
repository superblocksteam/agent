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

          goVersion = readVersionOrFallback {
            path = ./.go-version;
            fallback = "1.26.1";
            label = ".go-version";
            pattern = "[0-9]+\\.[0-9]+\\.[0-9]+";
          };
          goAttr = "go_" + builtins.replaceStrings [ "." ] [ "_" ] (lib.versions.majorMinor goVersion);
          goPackage =
            if builtins.hasAttr goAttr pkgs then
              pkgs.${goAttr}
            else
              builtins.trace "warning: unsupported Go version in .go-version: ${goVersion}; defaulting to pkgs.go" pkgs.go;

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
              pkgs.corepack_22
              goPackage
              pkgs.go-mockery
              pkgs.gotestsum
              pkgs.nodejs_22
              pkgs.pprof
              pythonPackage
            ];
          };
        }
      );
    };
}
