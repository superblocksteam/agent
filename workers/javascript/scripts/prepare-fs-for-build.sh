#!/bin/bash

# This script is used to prepare the filesystem for a JavaScript worker build
# and is primarily intended to be used when building an image for the desired
# agent variant (e.g. slim or standard)

set -eo pipefail

working_dir=""
is_slim_build=false

file_patterns=("package-temp.json" "package-lock-temp.json" "pnpm-lock-temp.yaml")
slim_file_patterns=("package-slim.json" "package-lock-slim.json" "pnpm-lock-slim.yaml")

exclude_dirs=(".git" "coverage" "dist" "node_modules" "src")

# Find directories that contain any matching file, excluding certain dirs
buildTargetDirectoriesList() {
    # Build an array of exclusion arguments for find
    exclude_args=()
    for dir in "${exclude_dirs[@]}"; do
        exclude_args+=( -path "*/$dir" -o )
    done
    # Remove the trailing -o
    unset 'exclude_args[${#exclude_args[@]}-1]'

    patterns=()
    if [[ "$is_slim_build" == true ]]; then
        patterns=("${slim_file_patterns[@]}")
    else
        patterns=("${file_patterns[@]}")
    fi

    echo "Scanning directories for package files..."
    while IFS= read -r -d '' dir; do
        for pattern in "${patterns[@]}"; do
            if compgen -G "$dir/$pattern" > /dev/null; then
                echo "Found $pattern in $dir, adding to target directories"
                target_dirs+=("$dir")
                break  # Only add directory once
            fi
        done
    done < <(
        find "$working_dir" \( "${exclude_args[@]}" \) -prune -o -type d -print0
    )
}

prepareDirectoriesForBuild() {
    if [[ "$is_slim_build" == true ]]; then
        prepareDirectoriesForSlimBuild
    else
        prepareDirectoriesForStandardBuild
    fi
}

prepareDirectoriesForStandardBuild() {
    for dir in "${target_dirs[@]}"; do
        if [[ -e ${dir}/pnpm-lock-temp.yaml ]]; then
            mv "${dir}/pnpm-lock-temp.yaml" "${dir}/pnpm-lock.yaml"
        fi

        if [[ -e ${dir}/package-temp.json ]]; then
            mv "${dir}/package-temp.json" "${dir}/package.json"
        fi

        if [[ -e ${dir}/package-lock-temp.json ]]; then
            mv "${dir}/package-lock-temp.json" "${dir}/package-lock.json"
        fi
    done
}

prepareDirectoriesForSlimBuild() {
    for dir in "${target_dirs[@]}"; do
        if [[ -e "$dir/pnpm-lock-slim.yaml" ]]; then
            mv "${dir}/pnpm-lock-slim.yaml" "${dir}/pnpm-lock.yaml"
        fi

        if [[ -e "$dir/package-slim.json" ]]; then
            mv "${dir}/package-slim.json" "${dir}/package.json"
        fi

        if [[ -e "$dir/package-lock-slim.json" ]]; then
            mv "${dir}/package-lock-slim.json" "${dir}/package-lock.json"
        fi
    done
}

usage() {
    echo "Prepares the filesystem for a JavaScript worker build"
    echo "Usage: $0 --working-dir <path> [--slim]"
    exit 1
}

parse_args() {
    while [[ $# -gt 0 ]]; do
      if [[ "$1" == "--working-dir" ]]; then
        if [[ -n "${2:-}" ]]; then
          working_dir="$2"
          shift 2  # Remove the flag and its value
          continue
        else
          echo "Error: $1 requires a value."
          usage
        fi
      elif [[ "$1" == "--slim" ]]; then
        is_slim_build=true
        shift  # Remove the flag
        continue
      else
        echo "Unknown option: $1"
        usage
      fi
    done

    if [[ -z "$working_dir" ]]; then
        echo "Error: --working-dir is required"
        usage
    fi

    if [[ ! -d "$working_dir" ]]; then
        echo "Error: --working-dir must be a valid directory"
        usage
    fi

    if [[ "$is_slim_build" == true ]]; then
        echo "Slim build selected"
    fi
}

main() {
    parse_args "$@"
    buildTargetDirectoriesList
    prepareDirectoriesForBuild
}

main "$@"
