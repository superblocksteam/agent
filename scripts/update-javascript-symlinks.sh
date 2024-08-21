#!/bin/bash -e

location=$(pwd)

# Define the roots with nested folders
nested_roots=(
    "${location}/workers/javascript/packages/plugins"
    "${location}/workers/javascript/packages/fleets"
)

# Define the roots without nested folders
simple_roots=(
    "${location}/workers/javascript/packages/server"
    "${location}/workers/javascript/packages/shared"
    "${location}/workers/javascript/packages/types"
)

# Symlink creation function
create_symlinks() {
    local root=$1
    local target=$2

    ln -sf "${target}/.swcrc" .
    ln -sf "${target}/tsconfig.json" .
    ln -sf "${target}/tsconfig.build.json" .
    ln -sf "${target}/.eslintignore" .
    ln -sf "${target}/.eslintrc.yaml" .
    ln -sf "${target}/.prettierrc" .
    ln -sf "${target}/.prettierignore" .
    ln -sf "${target}/jest.config.js" .
    ln -sf "${target}/.jest" .
}

# Handle nested roots
for root in "${nested_roots[@]}"; do
    for plugin in "${root}"/*/; do
        cd "${plugin}"
        create_symlinks "${plugin}" "../../.."
    done
done

# Handle simple roots
for root in "${simple_roots[@]}"; do
    cd "${root}"
    create_symlinks "${root}" "../.."
done