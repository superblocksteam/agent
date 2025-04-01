import pytest
from fixtures import dump_and_load

import superblocks
from utils import extract_vars, get_tree_path_to_disk_path


def test_extract_vars_filters_hidden_variables():
    superblocks_object = dump_and_load({"__hidden": "my-secret"})

    filtered_object = extract_vars(superblocks_object)

    with pytest.raises(AttributeError):
        filtered_object.__hidden

    with pytest.raises(KeyError):
        filtered_object["__hidden"]


def test_extract_vars_returns_superblocks_object():
    superblocks_object = dump_and_load(
        {
            "context": {"foo": {"bar": {"baz": "value"}}, "car": [{"foo": "value"}]},
            "code": {"foo": {"bar": {"baz": "value"}}},
        }
    )

    filtered_object = extract_vars(superblocks_object)

    assert filtered_object.context.foo.bar.baz == "value"
    assert filtered_object.code.foo.bar.baz == "value"
    assert filtered_object.context.car[0].foo == "value"

    assert type(filtered_object.context) is superblocks.Object
    assert type(filtered_object.code) is superblocks.Object
    assert type(filtered_object.context.foo) is superblocks.Object
    assert type(filtered_object.context.car) is superblocks.List


def test_get_tree_path_to_disk_path():
    globals = {
        "$flagWorker": True,
        "$fileServerUrl": "http://localhost:8020/agent/v1/files",
        "body": {
            "data": {
                "encoding": "foobar",
                "type": "abc",
            }
        },
        "Env": {},
        "$agentKey": "dev-agent-key",
    }
    files = []

    assert get_tree_path_to_disk_path(globals, files) == {}

    globals = {
        "$flagWorker": True,
        "$fileServerUrl": "http://localhost:8020/agent/v1/files",
        "body": {
            "data": {
                "name": "foo",
                "extension": "bar",
                "type": "baz",
                "encoding": "foo",
                "$superblocksId": "bar",
                "size": 123,
                "previewUrl": "foo",
            }
        },
        "Env": {},
        "$agentKey": "dev-agent-key",
    }
    files = []

    assert get_tree_path_to_disk_path(globals, files) == {}

    globals = {
        "$flagWorker": True,
        "$fileServerUrl": "http://localhost:8020/agent/v1/files",
        "Global": {
            "user": {
                "id": "a05a43f4-4410-4fcb-a9a0-90788b6f01cc",
                "username": "Bruce Yu",
                "email": "bruce@superblockshq.com",
                "groups": [
                    {
                        "id": "1e7a0355-b662-4f0d-b39e-6886576e136f",
                        "name": "All Users",
                        "size": 0,
                    },
                    {
                        "id": "b88ab91a-8a42-435e-afb8-d68b048ef877",
                        "name": "Admins",
                        "size": 0,
                    },
                ],
            },
            "groups": [
                {
                    "id": "b88ab91a-8a42-435e-afb8-d68b048ef877",
                    "name": "Admins",
                    "size": 0,
                },
                {
                    "id": "1e7a0355-b662-4f0d-b39e-6886576e136f",
                    "name": "All Users",
                    "size": 0,
                },
            ],
            "URL": {
                "fullPath": "http://localhost:3000/applications/7e977895-8036-47d8-9536-769b74fe2c45/"
                "pages/02610802-60cb-4e36-9778-6bd8211bc752/edit/"
                "apis/befce308-07e0-4751-b3e9-124efe71b594/action/"
                "5c21f48a-441f-4a37-ba36-559d7abd5ff8?environment=staging",
                "host": "localhost:3000",
                "hostname": "localhost",
                "queryParams": {"environment": "staging"},
                "protocol": "http:",
                "pathname": "/applications/7e977895-8036-47d8-9536-769b74fe2c45/pages/"
                "02610802-60cb-4e36-9778-6bd8211bc752/edit/"
                "apis/befce308-07e0-4751-b3e9-124efe71b594/action/5c21f48a-441f-4a37-ba36-559d7abd5ff8",
                "port": "3000",
                "hash": "",
            },
            "store": {},
            "mode": "EDIT",
            "createdAt": "2022-10-24T22:02:14.735Z",
            "ENTITY_TYPE": "GLOBAL",
            "skippedEvaluation": False,
        },
        "FilePicker1": {
            "files": [
                {
                    "name": "test.csv",
                    "extension": "csv",
                    "type": "text/csv",
                    "size": 79376,
                    "encoding": "text",
                    "previewUrl": "blob:http://localhost:3000/38bfc103-b374-47b1-ae9f-06d0277cab8e",
                    "$superblocksId": "uppy-test_csv-1e-text_csv-79376-1664833779646",
                }
            ]
        },
        "Env": {},
    }

    files = [
        {
            "fieldname": "files",
            "originalname": "uppy-test_csv-1e-text_csv-79376-1664833779646",
            "encoding": "7bit",
            "mimetype": "text/csv",
            "destination": "/var/folders/1d/rvn3c5b15cx0z9z9thcds79c0000gn/T/dev-agent-key",
            "filename": "uppy-test_csv-1e-text_csv-79376-1664833779646_dev-agent-key",
            "path": "/var/folders/1d/rvn3c5b15cx0z9z9thcds79c0000gn/T/dev-agent-key/"
            "uppy-test_csv-1e-text_csv-79376-1664833779646_dev-agent-key",
            "size": 79376,
        }
    ]

    assert get_tree_path_to_disk_path(globals, files) == {
        "FilePicker1.files.0": "/var/folders/1d/rvn3c5b15cx0z9z9thcds79c0000gn/T/dev-agent-key/"
        "uppy-test_csv-1e-text_csv-79376-1664833779646_dev-agent-key"
    }
