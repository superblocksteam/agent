import unittest

from aenum import extend_enum

from superblocks_agent_sdk.api import ViewMode
from superblocks_types.api.v1.service_pb2 import ViewMode as ViewModeProto


class TestViewMode(unittest.TestCase):
    def test_items(self):
        self.assertEqual(
            [
                (ViewMode.DEPLOYED, "DEPLOYED"),
                (ViewMode.EDITOR, "EDITOR"),
                (ViewMode.PREVIEW, "PREVIEW"),
            ],
            ViewMode._items(),
        )

    def test_from_str(self):
        self.assertEqual(ViewMode.DEPLOYED, ViewMode._from_str("Deployed"))
        self.assertEqual(ViewMode.EDITOR, ViewMode._from_str("Editor"))
        self.assertEqual(ViewMode.PREVIEW, ViewMode._from_str("Preview"))

        with self.assertRaises(ValueError) as context:
            ViewMode._from_str("invalid")
        self.assertEqual("'invalid' is not a valid ViewMode", str(context.exception))

    def test_to_proto_view_mode(self):
        self.assertEqual(
            ViewModeProto.VIEW_MODE_DEPLOYED, ViewMode.DEPLOYED._to_proto_view_mode()
        )
        self.assertEqual(
            ViewModeProto.VIEW_MODE_EDIT, ViewMode.EDITOR._to_proto_view_mode()
        )
        self.assertEqual(
            ViewModeProto.VIEW_MODE_PREVIEW, ViewMode.PREVIEW._to_proto_view_mode()
        )
        extend_enum(ViewMode, "UNKNOWN", "unknown")
        self.assertEqual(
            ViewModeProto.VIEW_MODE_UNSPECIFIED, ViewMode.UNKNOWN._to_proto_view_mode()
        )
