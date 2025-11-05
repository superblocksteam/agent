import builtins
import os
from unittest.mock import MagicMock, patch

import pytest

from restricted import (
    ALLOW_BUILTINS,
    build_allowed_builtins,
    restricted_environment,
    restricted_import_wrapper,
)


class TestRestrictedEnvironment:
    @pytest.mark.parametrize(
        "env_vars,expected_env_during,original_env_vars",
        [
            (None, {}, {"ORIGINAL_VAR": "original_value", "PATH": "/usr/bin"}),
            ({}, {}, {"ORIGINAL_VAR": "original_value", "PATH": "/usr/bin"}),
            ({}, {}, {}),
            ({"TEST_VAR": "test_value"}, {"TEST_VAR": "test_value"}, {}),
            (
                {"TEST_VAR": "test_value"},
                {"TEST_VAR": "test_value"},
                {"ORIGINAL_VAR": "original_value"},
            ),
            (
                {"VAR1": "value1", "PATH": "/usr/bin", "VAR2": "value2"},
                {"VAR1": "value1", "PATH": "/usr/bin", "VAR2": "value2"},
                {"ORIGINAL_VAR": "original_value", "PATH": "/usr/bin"},
            ),
            (
                {"VAR1": "new1", "VAR2": "new2", "NEW_VAR": "new_value"},
                {"VAR1": "new1", "VAR2": "new2", "NEW_VAR": "new_value"},
                {"VAR1": "original1", "VAR2": "original2", "VAR3": "original3"},
            ),
            (
                {
                    "SPECIAL_VAR": "value with spaces",
                    "EMPTY_VAR": "",
                    "UNICODE_VAR": "🚀",
                },
                {
                    "SPECIAL_VAR": "value with spaces",
                    "EMPTY_VAR": "",
                    "UNICODE_VAR": "🚀",
                },
                {"ORIGINAL_VAR": "original_value"},
            ),
        ],
    )
    def test_restricted_environment_scenarios(
        self, env_vars, expected_env_during, original_env_vars
    ):
        os.environ.clear()
        os.environ.update(original_env_vars)
        original_env_copy = os.environ.copy()

        with restricted_environment(env_vars):
            # Assert that the environment matches expected state during context
            assert dict(os.environ) == expected_env_during

        # Assert that the original environment is restored
        assert dict(os.environ) == original_env_copy

    def test_restricted_environment_restores_on_exception(self):
        original_env = {"ORIGINAL_VAR": "original_value", "PATH": "/usr/bin"}
        os.environ.clear()
        os.environ.update(original_env)

        with pytest.raises(ValueError, match="Test exception"):
            with restricted_environment({"TEST_VAR": "test_value"}):
                # Assert that the environment is restricted during context
                assert dict(os.environ) == {"TEST_VAR": "test_value"}
                raise ValueError("Test exception")

        # Assert that the original environment is restored despite exception
        assert dict(os.environ) == original_env

    def test_restricted_environment_nested_contexts(self):
        original_env = {"ORIGINAL_VAR": "original_value"}
        os.environ.clear()
        os.environ.update(original_env)

        with restricted_environment({"OUTER_VAR": "outer_value"}):
            assert dict(os.environ) == {"OUTER_VAR": "outer_value"}

            with restricted_environment({"INNER_VAR": "inner_value"}):
                assert dict(os.environ) == {"INNER_VAR": "inner_value"}

            assert dict(os.environ) == {"OUTER_VAR": "outer_value"}

        assert dict(os.environ) == original_env

    def test_restricted_environment_modifying_env_during_context(self):
        # Set up original environment
        original_env = {"ORIGINAL_VAR": "original_value"}
        os.environ.clear()
        os.environ.update(original_env)

        with restricted_environment({"INITIAL_VAR": "initial_value"}):
            # Verify initial state
            assert dict(os.environ) == {"INITIAL_VAR": "initial_value"}

            # Modify environment during context
            os.environ["ADDED_VAR"] = "added_value"
            os.environ["INITIAL_VAR"] = "modified_value"

            # Assert that the modifications are present
            assert dict(os.environ) == {
                "INITIAL_VAR": "modified_value",
                "ADDED_VAR": "added_value",
            }

        # Assert that the original environment is restored
        assert dict(os.environ) == {"ORIGINAL_VAR": "original_value"}


class TestRestrictedImportWrapper:
    @pytest.mark.parametrize(
        "inclusion_list,exclusion_list,import_name,expected_allowed",
        [
            # Test case: Allow all imports with "*"
            (["*"], [], "os", True),
            # Test case: Allow all imports with "*" but exclude specific modules
            (["*"], ["os", "sys"], "json", True),
            (["*"], ["os", "sys"], "os", False),
            (["*"], ["os", "sys"], "sys", False),
            # Test case: Specific inclusion list
            (["os", "sys"], [], "os", True),
            (["os", "sys"], [], "sys", True),
            (["os", "sys"], [], "json", False),
            # Test case: Specific inclusion list with exclusions
            (["os", "sys", "json"], ["sys"], "os", True),
            (["os", "sys", "json"], ["sys"], "sys", False),
            (["os", "sys", "json"], ["sys"], "requests", False),
            # Test case: Empty inclusion list (nothing allowed)
            ([], [], "os", False),
            ([], ["os"], "sys", False),
            # Test case: Submodule imports (should check root module)
            (["os"], [], "os.path", True),
            (["requests"], [], "requests.auth", True),
            (["json"], [], "os.path", False),
            (["*"], ["os"], "os.path", False),
        ],
    )
    def test_restricted_import_scenarios(
        self, inclusion_list, exclusion_list, import_name, expected_allowed
    ):
        restricted_import = restricted_import_wrapper(inclusion_list, exclusion_list)

        if expected_allowed:
            # Should not raise an exception
            with patch("restricted._real_import") as mock_real_import:
                mock_real_import.return_value = MagicMock()
                result = restricted_import(import_name)
                mock_real_import.assert_called_once_with(import_name, None, None, (), 0)
                assert result is not None
        else:
            # Should raise ImportError
            with pytest.raises(ImportError, match=f"Import of .* is blocked"):
                restricted_import(import_name)

    def test_restricted_import_with_all_parameters(self):
        restricted_import = restricted_import_wrapper(["os"], [])

        with patch("restricted._real_import") as mock_real_import:
            mock_real_import.return_value = MagicMock()

            # Test with all parameters
            globals_dict = {"__name__": "test"}
            locals_dict = {"local_var": "value"}
            fromlist = ("path",)
            level = 1

            result = restricted_import("os", globals_dict, locals_dict, fromlist, level)

            mock_real_import.assert_called_once_with(
                "os", globals_dict, locals_dict, fromlist, level
            )
            assert result is not None

    def test_submodule_root_extraction(self):
        restricted_import = restricted_import_wrapper(["requests"], [])

        with patch("restricted._real_import") as mock_real_import:
            mock_real_import.return_value = MagicMock()

            # Test deeply nested submodule
            restricted_import("requests.auth.oauth.v2")
            mock_real_import.assert_called_once_with(
                "requests.auth.oauth.v2", None, None, (), 0
            )


class TestBuildAllowedBuiltins:
    @pytest.mark.parametrize(
        "inclusion_list,exclusion_list,builtins_exclusion_list,expected_builtins",
        [
            # Test case: Default parameters (empty lists)
            ([], [], [], set(dir(builtins))),
            # Test case: Exclude specific builtins
            ([], [], ["eval", "exec"], set(dir(builtins)) - {"eval", "exec"}),
            # Test case: Various combinations
            (["os"], ["sys"], ["eval"], set(dir(builtins)) - {"eval"}),
            (["*"], ["os"], ["exec", "eval"], set(dir(builtins)) - {"exec", "eval"}),
        ],
    )
    def test_build_allowed_builtins_scenarios(
        self, inclusion_list, exclusion_list, builtins_exclusion_list, expected_builtins
    ):
        result = build_allowed_builtins(
            inclusion_list, exclusion_list, builtins_exclusion_list
        )

        # Check that all expected builtins are present (except __import__ which is replaced)
        expected_keys = expected_builtins | {"__import__"}
        assert set(result.keys()) == expected_keys

        # Check that excluded builtins are not present
        for excluded in builtins_exclusion_list:
            assert excluded not in result

        # Check that __import__ is replaced with restricted version
        assert "__import__" in result
        assert callable(result["__import__"])
        assert result["__import__"] != getattr(builtins, "__import__")

    def test_build_allowed_builtins_import_wrapper_integration(self):
        result = build_allowed_builtins(["os"], ["sys"], [])

        # Test that the wrapped __import__ function works
        restricted_import = result["__import__"]

        # Should allow 'os'
        with patch("restricted._real_import") as mock_real_import:
            mock_real_import.return_value = MagicMock()
            restricted_import("os")
            mock_real_import.assert_called_once()

        # Should block 'sys'
        with pytest.raises(ImportError):
            restricted_import("sys")

    def test_build_allowed_builtins_preserves_builtin_values(self):
        result = build_allowed_builtins([], [], ["eval"])

        # Assert that non-excluded builtins have the same values
        for builtin_name in [
            name for name in dir(builtins) if name not in ["__import__", "eval"]
        ]:
            assert result[builtin_name] is getattr(builtins, builtin_name)

        # Assert that eval is excluded
        assert "eval" not in dir(result)

    def test_build_allowed_builtins_empty_exclusion(self):
        result = build_allowed_builtins([], [], [])

        # Should include all builtins plus the restricted __import__
        expected_count = len(dir(builtins))
        assert len(result) == expected_count
        assert "__import__" in result


class TestAllowBuiltinsConstant:
    def test_allow_builtins_is_dict(self):
        assert isinstance(ALLOW_BUILTINS, dict)

    def test_allow_builtins_has_import(self):
        assert "__import__" in ALLOW_BUILTINS
        assert callable(ALLOW_BUILTINS["__import__"])

    @patch("restricted.SUPERBLOCKS_PYTHON_EXECUTION_IMPORT_ALLOW_LIST", ["test_module"])
    @patch(
        "restricted.SUPERBLOCKS_PYTHON_EXECUTION_IMPORT_DENY_LIST", ["blocked_module"]
    )
    @patch("restricted.SUPERBLOCKS_PYTHON_EXECUTION_BUILTINS_DENY_LIST", ["eval"])
    def test_allow_builtins_with_mocked_constants(self):
        # Import the module again to get the constant with mocked values
        import importlib

        import restricted

        importlib.reload(restricted)

        restricted_import = restricted.ALLOW_BUILTINS["__import__"]

        with patch("restricted._real_import") as mock_real_import:
            mock_real_import.return_value = MagicMock()
            restricted_import("test_module")
            mock_real_import.assert_called_once()

        with pytest.raises(ImportError):
            restricted_import("blocked_module")

        # Assert that non-excluded builtins have the same values
        for builtin_name in [
            name for name in dir(builtins) if name not in ["__import__", "eval"]
        ]:
            assert restricted.ALLOW_BUILTINS[builtin_name] is getattr(
                builtins, builtin_name
            )

        # Assert that eval is excluded
        assert "eval" not in dir(restricted.ALLOW_BUILTINS)


class TestEdgeCases:
    def test_import_error_message_format(self):
        restricted_import = restricted_import_wrapper([], [])

        with pytest.raises(ImportError, match=r"Import of 'os' is blocked"):
            restricted_import("os")

        with pytest.raises(ImportError, match=r"Import of 'sys' is blocked"):
            restricted_import("sys")

    def test_exclusion_takes_precedence(self):
        # Even with "*" allowing everything, exclusion should block
        restricted_import = restricted_import_wrapper(["*"], ["os"])

        with pytest.raises(ImportError, match=r"Import of 'os' is blocked"):
            restricted_import("os")

    def test_case_sensitivity(self):
        restricted_import = restricted_import_wrapper(["os"], [])

        # Should allow "os"
        with patch("restricted._real_import") as mock_real_import:
            mock_real_import.return_value = MagicMock()
            restricted_import("os")
            mock_real_import.assert_called_once()

        # Should block "OS" (different case)
        with pytest.raises(ImportError):
            restricted_import("OS")
