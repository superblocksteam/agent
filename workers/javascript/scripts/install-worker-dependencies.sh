#!/bin/bash

set -eo pipefail

location=$(pwd)

# Files that indicate the package has different dependencies for the slim build
file_patterns=("package-slim.json" "pnpm-lock-slim.yaml")
# Directories to exclude from traversal
exclude_dirs=(".git" "coverage" "dist" "node_modules" "src")

# Directories with slim specific dependencies
target_dirs=()

# Find directories that contain any matching file, excluding certain dirs
buildTargetDirectoriesList() {
    # Build an array of exclusion arguments for find
    exclude_args=()
    for dir in "${exclude_dirs[@]}"; do
        exclude_args+=( -path "*/$dir" -o )
    done
    # Remove the trailing -o
    unset 'exclude_args[${#exclude_args[@]}-1]'


    echo "Scanning directories for slim package files..."
    while IFS= read -r -d '' dir; do
        for pattern in "${file_patterns[@]}"; do
            if compgen -G "$dir/$pattern" > /dev/null; then
                echo "Found $pattern in $dir, adding to target directories"
                target_dirs+=("$dir")
                break  # Only add directory once
            fi
        done
    done < <(
        find "$location" \( "${exclude_args[@]}" \) -prune -o -type d -print0
    )
}

prepareSlimDependencyInstall() {
    echo "Moving dependency files to temp location..."
    for dir in "${target_dirs[@]}"; do
        if [[ -e "$dir/pnpm-lock.yaml" ]]; then
            cp "${dir}/pnpm-lock.yaml" "${dir}/pnpm-lock-temp.yaml"
        fi
        if [[ -e "$dir/pnpm-lock-slim.yaml" ]]; then
            cp "${dir}/pnpm-lock-slim.yaml" "${dir}/pnpm-lock.yaml"
        fi

        if [[ -e "$dir/package.json" ]]; then
            cp "${dir}/package.json" "${dir}/package-temp.json"
        fi
        if [[ -e "$dir/package-slim.json" ]]; then
            cp "${dir}/package-slim.json" "${dir}/package.json"
        fi
    done
}

installDependencies() {
    npm install
    npx pnpm install --lockfile-only
    npx pnpm install
}

updateSlimDependencyFiles() {
    for dir in "${target_dirs[@]}"; do
        if [[ -e "$dir/package.json" ]]; then
            mv "${dir}/package.json" "${dir}/package-slim.json"
        fi
        if [[ -e "$dir/pnpm-lock.yaml" ]]; then
            mv "${dir}/pnpm-lock.yaml" "${dir}/pnpm-lock-slim.yaml"
        fi
    done
}

restoreOriginalDependencyFiles() {
    for dir in "${target_dirs[@]}"; do
        # Check if there is a temp lock file
        if [[ -e ${dir}/pnpm-lock-temp.yaml ]]; then
            # If there is a temp lock file and the normal lock file, this means
            # the normal lock file is from the slim build
            # Restore the slim lock file before restoring the original lock file
            if [[ -e "$dir/pnpm-lock.yaml" ]]; then
                mv "${dir}/pnpm-lock.yaml" "${dir}/pnpm-lock-slim.yaml"
            fi
            mv "${dir}/pnpm-lock-temp.yaml" "${dir}/pnpm-lock.yaml"
        fi

        if [[ -e ${dir}/package-temp.json ]]; then
            # If there is a temp package.json and a normal package.json, this
            # means the normal package.json is from the slim build
            # Restore the slim package.json before restoring the original
            # package.json
            if [[ -e "$dir/package.json" ]]; then
                mv "${dir}/package.json" "${dir}/package-slim.json"
            fi
            mv "${dir}/package-temp.json" "${dir}/package.json"
        fi
    done
}

# Trap to always attempt to restore original dependency files in the event the script fails/exits early
trap restoreOriginalDependencyFiles EXIT

main() {
    # Find directories that contain slim specific dependencies
    buildTargetDirectoriesList

    # Install dependencies for slim JavaScript worker
    prepareSlimDependencyInstall
    installDependencies
    updateSlimDependencyFiles

    # Install dependencies for full JavaScript worker
    restoreOriginalDependencyFiles
    installDependencies
}

main "$@"
