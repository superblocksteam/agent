from pathlib import Path
from typing import IO

import pytest
from health import mark_worker_healthy, mark_worker_unhealthy
from pytest_mock import MockerFixture


def patch_path_object(
    mocker: MockerFixture, exists: bool, open_raises_err: bool
) -> tuple[MockerFixture, MockerFixture]:
    mock_file_handle = mocker.MagicMock(spec=IO)
    mock_file_handle.__enter__.return_value = mock_file_handle

    mock_path = mocker.MagicMock(spec=Path)
    mock_path.exists.return_value = exists

    if open_raises_err:
        mock_path.open.side_effect = Exception("error writing file")
    else:
        mock_path.open.return_value = mock_file_handle

    mocker.patch.object(Path, "__new__", return_value=mock_path)

    return mock_path, mock_file_handle


@pytest.mark.parametrize("health_file_exists", [True, False])
def test_mark_worker_healthy(health_file_exists: bool, mocker: MockerFixture) -> None:
    mocker.patch(
        "health.SUPERBLOCKS_WORKER_HEALTHY_PATH", return_value="/tmp/worker_healthy"
    )
    mock_path, mock_file_handle = patch_path_object(mocker, health_file_exists, False)
    error_logger = mocker.patch("health.log.error")

    mark_worker_healthy()

    mock_path.exists.assert_called_once()
    error_logger.assert_not_called()

    if health_file_exists:
        mock_path.open.assert_not_called()
    else:
        mock_path.open.assert_called_once_with(mode="w")
        mock_file_handle.write.assert_called_once_with("OK")


@pytest.mark.parametrize("open_raises_err", [True, False])
def test_mark_worker_healthy_logs_error_when_writing_health_file_fails(
    open_raises_err: bool, mocker: MockerFixture
) -> None:
    mocker.patch(
        "health.SUPERBLOCKS_WORKER_HEALTHY_PATH", return_value="/tmp/worker_healthy"
    )
    mock_path, mock_file_handle = patch_path_object(mocker, False, open_raises_err)
    mock_file_handle.write.side_effect = Exception("error writing file")

    error_logger = mocker.patch("health.log.error")

    mark_worker_healthy()

    mock_path.exists.assert_called_once()
    mock_path.open.assert_called_once_with(mode="w")
    error_logger.assert_called_once_with(
        "error writing health file", error="error writing file"
    )

    if open_raises_err:
        mock_file_handle.write.assert_not_called()
    else:
        mock_file_handle.write.assert_called_once_with("OK")


@pytest.mark.parametrize("raises_error", [True, False])
def test_mark_worker_unhealthy(
    raises_error: bool | None, mocker: MockerFixture
) -> None:
    mocker.patch(
        "health.SUPERBLOCKS_WORKER_HEALTHY_PATH", return_value="/tmp/worker_healthy"
    )

    error_logger = mocker.patch("health.log.error")
    mock_path = mocker.MagicMock(spec=Path)
    mock_path.unlink.side_effect = (
        Exception("error removing file") if raises_error else None
    )
    mocker.patch.object(Path, "__new__", return_value=mock_path)

    mark_worker_unhealthy()

    mock_path.unlink.assert_called_once_with(missing_ok=True)

    if raises_error:
        error_logger.assert_called_once_with(
            "could not remove healthy file", error="error removing file"
        )
    else:
        error_logger.assert_not_called()
