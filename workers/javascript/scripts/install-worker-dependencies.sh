#!/bin/bash

set -eo pipefail

location=$(pwd)

prepareSlimDependencyInstall() {
    cp "${location}/pnpm-lock.yaml" "${location}/pnpm-lock-temp.yaml"
    cp "${location}/pnpm-lock-slim.yaml" "${location}/pnpm-lock.yaml"

    cp "${location}/packages/server/package.json" "${location}/packages/server/package-temp.json"
    cp "${location}/packages/server/package-slim.json" "${location}/packages/server/package.json"
}

installDependencies() {
    npm install
    npx pnpm install --lockfile-only
    npx pnpm install
}

updateSlimDependencyFiles() {
    mv "${location}/packages/server/package.json" "${location}/packages/server/package-slim.json"
    mv "${location}/pnpm-lock.yaml" "${location}/pnpm-lock-slim.yaml"
}

restoreOriginalDependencyFiles() {
    if [[ -e ${location}/pnpm-lock-temp.yaml ]]; then
        mv "${location}/pnpm-lock-temp.yaml" "${location}/pnpm-lock.yaml"
    fi

    if [[ -e ${location}/packages/server/package-temp.json ]]; then
        mv "${location}/packages/server/package-temp.json" "${location}/packages/server/package.json"
    fi
}

# Trap to always attempt to restore original dependency files in the event the script fails/exits early
trap restoreOriginalDependencyFiles EXIT

main() {
    # Install dependencies for slim JavaScript worker
    prepareSlimDependencyInstall
    installDependencies
    updateSlimDependencyFiles

    # Install dependencies for full JavaScript worker
    restoreOriginalDependencyFiles
    installDependencies
}

main "$@"
