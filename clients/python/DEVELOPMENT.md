# Development

Install Dependencies

```sh
make deps
```

## Publish New Version to PyPi

Build with a new version

```sh
make bump PYPI_VERSION='{version_here}'
```

Publish to PyPi

```sh
make pkg-test
```

```sh
make pkg-prod
```

# Docs

## Read

```sh
make docs
```

## Generate

```sh
make gen-docs
```

## Document Code

Read about pydoc formatting [here](https://github.com/pdoc3/pdoc/blob/c423762573b227e0025d670b58137fb7aa57498d/pdoc/__init__.py#L1-L343).

Docstrings should be formatted following the [Google Python Docstring Style](https://google.github.io/styleguide/pyguide.html#s3.8-comments-and-docstrings):

Example:

```python3
"""
Brief description.

Args:
    param1 (int): Description of the first parameter.
    param2 (str): Description of the second parameter.

Returns:
    bool: Description of the return value.

Raises:
    ValueError: Description of the error raised.
"""
```

To modify what is generated in the docs, utilize the `modify_pdoc` function in `_util/doc.py`

To customize how docs look, update the `.mako` files in `docs/superblocks_agent`.

Read more about `.mako` files [here](https://pdoc3.github.io/pdoc/doc/pdoc/#gsc.tab=0) and see the defaults [here](https://github.com/pdoc3/pdoc/tree/master/pdoc/templates).
