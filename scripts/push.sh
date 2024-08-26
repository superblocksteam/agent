#!/bin/bash

# shellcheck disable=SC2155

set -e

function _join { local IFS="$1"; shift; echo "$*"; }

pushd () { command pushd "$@" > /dev/null; } # quiet
popd  () { command popd > /dev/null;  } # quiet

function _usage() {
  echo "usage: $0 [options]"
  echo ""
  echo "    -f, --force         Enable the force option; use with care."
  echo "    -v, --verbose       Enable verbose output."
  echo "    -d, --dry           Dry run."
  echo "    -e, --exclude       Exclude a path from the patch when applying."
  echo "    -p, --push          Push the changes to the destination repository."
  echo "    -d, --destination   The fully qualified url for the destination repository."
  echo "    -h, --help          Display this help message."
  return
}

function _do() {
  local dry=$1
  local verbose=$2

  shift
  shift

  if [[ "$verbose" -eq 0 ]]; then
    echo "[DEBUG] Executing the following command:"
    echo ""
    echo "    $(echo "$@" | tr '\n' ' ')"
    echo ""
  fi

  if [[ "$dry" -eq 1 ]]; then
    "$@"
  fi

  return 0
}

function push() {
  local force=1
  local verbose=1
  local dry=1
  local push=1
  local exclude=()
  local destination="https://github.com/superblocksteam/agent"
  local tag="superblocksteam/agent"

  while [[ $# -gt 0 ]]; do
    case $1 in
      -f|--force)
        force=0
        shift
        ;;
      -v|--verbose)
        verbose=0
        shift
        ;;
      -d|--dry)
        dry=0
        shift
        ;;
      -e|--exclude)
        exclude+=("$2")
        shift
        shift
        ;;
      -dest|--destination)
        destination=$2
        shift
        shift
        ;;
      -p|--push)
        push=0
        shift
        ;;
      -t|--tag)
        tag=$2
        shift
        shift
        ;;
      -h|--help)
        _usage
        return 0
        ;;
      *)
        echo "unknown option: $1"
        echo ""
        _usage
        return 1
        ;;
    esac
  done

  # using closure so we don't need to pass the flags around every time we call _do
  function __do() {
    _do "${dry}" "${verbose}" "$@"
  }

  if [[ "$dry" -eq 0 ]]; then
    echo " [INFO] Dry run is enabled; no changes will be made."
  fi

   if [[ "$verbose" -eq 0 ]]; then
    echo " [INFO] Verbose logging is enabled."
  fi

  if [[ "$force" -eq 0 ]]; then
    echo " [WARN] The force option has been enabled; use with care."
  fi

  if [[ "$(git rev-parse --show-toplevel)" != "$(pwd)" ]]; then
    echo "[FATAL] This scripts must be run from the root of the git repository."
    exit 1
  else
    echo "[DEBUG] Verified that we are in the root of the git repository."
  fi

  if [[ $(git diff --stat) != '' && "$force" -eq 1 ]]; then
    echo "[FATAL] The repository must not be dirty."
    exit 1
  elif [[ "$force" ]]; then
    echo " [WARN] Ignoring dirty repository with the force option enabled."
  else
    echo "[DEBUG] Verified that the repository is clean."
  fi

  local head=$(git rev-parse HEAD)
  local last_synced_commit=$(git rev-list -n 1 "${tag}")
  local commits_to_sync=$(git rev-list "${last_synced_commit}"..HEAD)

  echo " [INFO] The last synced commit is ${last_synced_commit}."
  echo " [INFO] We will sync these commits:"
  echo ""

  local authors=()

  for commit in $commits_to_sync; do
    local name=$(git -c log.showSignature=false log --format='%an' "${commit}"^!)
    local email=$(git -c log.showSignature=false log --format='%ae' "${commit}"^!)

    local blurb="Co-authored-by: ${name} <${email}>"

    if [[ "${commit}" == "${head}" ]]; then
      echo "    HEAD (internal) -> [$commit] $name"
    else
      echo "                       [$commit] $name"
    fi

    # shellcheck disable=SC2199,SC2076
    if [[ ! " ${authors[@]} " =~ " ${blurb} " ]]; then
      authors+=("${blurb}")
    fi
  done

  echo "    HEAD (external) -> [$last_synced_commit]" 

  if [ ${#authors[@]} -eq 0 ]; then
      echo ""
      echo " [INFO] No commits to sync; bye."
      exit 0
  fi

  local tmp=$(mktemp -d)
  local internal=$(pwd)

  __do git diff "${last_synced_commit}" HEAD > "${tmp}"/code.patch

  echo ""
  echo " [INFO] The patch to be applied has been staged here (${tmp}/code.patch)."
  echo " [INFO] Ingoring the following paths from the patch:"
  echo ""

  __do git checkout --quiet "${last_synced_commit}"

  echo ""
  echo " [INFO] Cloning ${destination} into (${tmp}/dest)."

  mkdir -p "${tmp}"/dest
  pushd "${tmp}"/dest
  
  __do git clone --quiet "${destination}" .

  echo " [INFO] Moving the github directory to a safe place while we apply the patching."
  __do cp -r .github "${tmp}/"
  __do cp -r "${internal}"/.github .

  echo " [INFO] Temporarily copying excluded files into the staged destination."
  for path in "${exclude[@]}"; do
    __do cp -r "${internal}/${path}" "${tmp}"/dest/"${path}"
  done

  echo " [INFO] Applying the patch."
  __do git apply --whitespace=nowarn "${tmp}"/code.patch

  echo " [INFO] Removing excluded files from the staged destination."
  for path in "${exclude[@]}"; do
    __do rm -rf "${tmp}"/dest/"${path}"
  done

  echo " [INFO] Restoring the .github directory."
  __do cp -r "${tmp}"/.github .

  echo " [INFO] Adding the changes."
  __do git add .

  echo " [INFO] Committing changes."
  __do git commit --quiet -m "syncing up to ${head}"$'\n\n'"$(_join $'\n' "${authors[@]}")"
  
  if [[ "$push" -eq 1 ]]; then
    echo " [INFO] Refusing to push changes to the destination repository unless the push option is enabled."
    exit 0
  fi

  echo " [INFO] Pushing the changes to the destination repository."
  __do git push -u origin main

  popd

  echo " [INFO] Updating the tag on the source repository."
  __do git checkout --quiet main
  __do git tag -f "${tag}"

  echo " [INFO] Pushing the updated tag to the source repository."
  __do git push -f -u origin "${tag}"
}

push "$@"
