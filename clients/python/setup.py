import setuptools

pkg_vars = dict()
with open("superblocks_agent_sdk/_version.py") as f:
    exec(f.read(), pkg_vars)

package_version = pkg_vars["__version__"]
minimum_python_version_required = pkg_vars["__version_minimum_python__"]

with open("requirements.txt", "r", encoding="utf8") as reqs:
    required_packages = reqs.read().splitlines()

with open("README.md") as f:
    read_me = f.read()

setuptools.setup(
    name="superblocks-agent-sdk",
    version=package_version,
    author="Joey Greco",
    author_email="joeyagreco@gmail.com",
    description="The Official Python SDK for Superblocks",
    long_description_content_type="text/markdown",
    long_description=read_me,
    license="MIT",
    url="https://github.com/superblocksteam/orchestrator/tree/main/clients/python",
    include_package_data=True,
    packages=setuptools.find_packages(exclude=("test_e2e", "test_unit")),
    install_requires=required_packages,
    python_requires=f">={minimum_python_version_required}",
    keywords="superblocks api sdk",
)
