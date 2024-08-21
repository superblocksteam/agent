import unittest

from superblocks_agent_sdk._util.generate import get_unique_id_for_object


class TestGenerate(unittest.TestCase):
    def test_get_unique_id_for_object(self):
        dicts = []
        funcs = []
        for _ in range(20):
            dicts.append({"foo": "bar"})
            funcs.append(lambda x: x)

        all_objs = dicts + funcs
        obj_ids = [get_unique_id_for_object(obj) for obj in all_objs]
        self.assertEqual(len(obj_ids), len(set(obj_ids)))
