import os
import setuptools

pkg_vars = dict()
with open("superblocks_types/_version.py") as f:
    exec(f.read(), pkg_vars)

package_version = pkg_vars["__version__"]
minimum_python_version_required = pkg_vars["__version_minimum_python__"]

with open("superblocks_types/requirements.txt", "r", encoding="utf8") as reqs:
    required_packages = reqs.read().splitlines()

with open("superblocks_types/README.md") as f:
    read_me = f.read()


setuptools.setup(
    name="superblocks-types",
    version=package_version,
    author="Superblocks",
    description="Superblocks Official Python Types",
    long_description_content_type="text/markdown",
    long_description=read_me,
    license="MIT",
    url="https://github.com/superblocksteam/types",
    include_package_data=True,
    packages=setuptools.find_packages(where="gen/py"),
    package_dir={"": "gen/py"},
    install_requires=required_packages,
    python_requires=f">={minimum_python_version_required}",
    keywords="superblocks types",
)
