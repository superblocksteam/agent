import os


def add_init_py(directory: str) -> None:
    """Create an __init__.py file in the specified directory and all subdirectories recursively."""
    for root, _, _ in os.walk(directory):
        init_path = os.path.join(root, "__init__.py")
        open(init_path, "a").close()
        os.utime(init_path, None)


if __name__ == "__main__":
    add_init_py(
        os.path.abspath(
            os.path.join(
                os.path.dirname(__file__), "..", "gen", "py", "superblocks_types"
            )
        )
    )
