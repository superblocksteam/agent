#!/bin/bash
set -e
set -o pipefail

# This script is meant to be run in a Docker container that has the repo mounted
# at /repo. It will add a new library to the requirements.txt file, and will also
# add an import statement to src/speed.py.

REPO_PATH="${WORKER_REPO_PATH:-/repo}"
CACHE_DIR="${REPO_PATH}/.cache"
SIZE_ANALYSIS_FILE_PATH="${CACHE_DIR}/site-packages-size.txt"

# Get path to site packages
SITE_PACKAGES_PATH=$(python3 -c "import site; print(site.getsitepackages()[0])")

# Create actual requirements file
# shellcheck disable=SC2261
pip freeze &>/dev/null > actual_requirements.txt

# Check for differences and exit if there is a difference
if ! diff --brief requirements.txt actual_requirements.txt >/dev/null; then
    echo "Requirements files are skewed. Overriding current requirements.txt with actual_requirements.txt. Commit the update to the repo first."
    echo "Actual requirements file:"
    cat "actual_requirements.txt"
    mv actual_requirements.txt "${REPO_PATH}/requirements.txt"
    exit 1
fi

# Create the cache directory
mkdir -p "${CACHE_DIR}"

# Get initial size
initial_size=$(du -hm -d 0 "${SITE_PACKAGES_PATH}" | awk '{print $1}')
echo "Initial size: ${initial_size} MiB" > "${SIZE_ANALYSIS_FILE_PATH}"

# Form the pip install command
if [ -z "$PKG_VERSION" ]; then
    install_cmd="pip install $PKG_NAME"
else
    install_cmd="pip install $PKG_NAME==$PKG_VERSION"
fi

# Install the package
set -x
$install_cmd &>/dev/null
set +x

# Update the requirements.txt file
# shellcheck disable=SC2261
pip freeze &>/dev/null > "${REPO_PATH}/requirements.txt"

# Get final size
final_size=$(du -hm -d 0 "${SITE_PACKAGES_PATH}" | awk '{print $1}')
echo "Final size: ${final_size} MiB" >> "${SIZE_ANALYSIS_FILE_PATH}"

# Log the difference in size
echo "Size difference: $((final_size - initial_size)) MB" >> "${SIZE_ANALYSIS_FILE_PATH}"

# Print a summary of the sizes and the difference
echo -e "\n#### SIZE ANALYSIS"
cat "${SIZE_ANALYSIS_FILE_PATH}"
echo -e "####\n"

# Remove the cache directory
rm -rf "${CACHE_DIR}"

# Add an import statement in src/speed.py for the new package
if [ -z "$IMPORT_NAME" ]; then
    IMPORT_NAME="$PKG_NAME"
fi
echo "import $IMPORT_NAME" >> src/speed.py
mv src/speed.py "${REPO_PATH}/src/speed.py"
