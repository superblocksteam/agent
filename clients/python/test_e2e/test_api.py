import asyncio
import unittest

from superblocks_agent_sdk.testing.step import Params, on

from .fixtures import get_api, get_client


class TestApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.__client = get_client()

    @classmethod
    def tearDownClass(cls):
        cls.__client.close()

    def test_client_internals(self):
        api = get_api()
        client = get_client()

        with client as c:
            api.run(client=c)
            self.assertTrue(c._expect_alive)
            self.assertIsNotNone(c._channel)
        self.assertFalse(client._expect_alive)
        self.assertIsNone(client._channel)

    def test_basic_api_execution_sync(self):
        api = get_api()

        sync_result = api.run(client=self.__client)

        self.assertEqual("output jg", sync_result.get_result())
        self.assertEqual("output jg", sync_result.get_block_result("Step1"))

    def test_basic_api_execution_async(self):
        api = get_api()

        sync_result = asyncio.run(api.run(client=self.__client, run_async=True))

        self.assertEqual("output jg", sync_result.get_result())
        self.assertEqual("output jg", sync_result.get_block_result("Step1"))

    def test_basic_api_execution_with_context_manager(self):
        api = get_api()
        with get_client() as client:
            sync_result = api.run(client=client)

            self.assertEqual("output jg", sync_result.get_result())
            self.assertEqual("output jg", sync_result.get_block_result("Step1"))

    def test_many_api_executions(self):
        RUNS = 5

        async def run_many_api_executions():
            tasks = []
            for _ in range(RUNS):
                api = get_api()
                tasks.append(api.run(client=self.__client, run_async=True))

            return await asyncio.gather(*tasks)

        import time

        start_time = time.time()
        results = asyncio.run(run_many_api_executions())
        end_time = time.time()
        print("TIME RUN", end_time - start_time)
        self.assertEqual(RUNS, len(results))
        for result in results:
            self.assertEqual("output jg", result.get_result())
            self.assertEqual("output jg", result.get_block_result("Step1"))

    # @pytest.mark.jg
    # TODO: (joey) sync with frank on this. unclear if this should fail orchestrator or sdk
    # def test_api_execution_with_empty_mock(self):
    #     client = get_client()
    #     api = get_api()

    #     mock = on()  # this is bad
    #     sync_result = api.run(client=client, mocks=[mock])

    def test_api_execution_with_mock__no_on_params__return_static(self):
        api = get_api()

        mock = on().return_({"static": "return"})

        sync_result = api.run(client=self.__client, mocks=[mock])

        self.assertEqual({"static": "return"}, sync_result.get_result())
        self.assertEqual({"static": "return"}, sync_result.get_block_result("Step1"))

    def test_api_execution_with_mock__no_on_params__return_dynamic(self):
        api = get_api()

        received_params = None

        def func(params: Params) -> any:
            nonlocal received_params
            received_params = params
            return {"dynamic": "return"}

        mock = on().return_(func)

        sync_result = api.run(client=self.__client, mocks=[mock])

        self.assertEqual({"dynamic": "return"}, sync_result.get_result())
        self.assertEqual({"dynamic": "return"}, sync_result.get_block_result("Step1"))
        self.assertEqual(
            Params(
                integration_type="python",
                step_name="Step1",
                configuration={"body": 'return "output jg"\n'},
            ),
            received_params,
        )

    def test_api_execution_with_mock__on_with_just_params__params__return_static(self):
        api = get_api()

        mock = on(
            Params(
                integration_type="python",
                step_name="Step1",
                configuration={"body": 'return "output jg"\n'},
            )
        ).return_({"dynamic": "return"})

        sync_result = api.run(client=self.__client, mocks=[mock])

        self.assertEqual({"dynamic": "return"}, sync_result.get_result())
        self.assertEqual({"dynamic": "return"}, sync_result.get_block_result("Step1"))

    def test_api_execution_with_mock__on_with_just_when__params__return_static(self):
        api = get_api()

        def func(params: Params) -> any:
            return params == Params(
                integration_type="python",
                step_name="Step1",
                configuration={"body": 'return "output jg"\n'},
            )

        mock = on(when=func).return_({"dynamic": "return"})

        sync_result = api.run(client=self.__client, mocks=[mock])

        self.assertEqual({"dynamic": "return"}, sync_result.get_result())
        self.assertEqual({"dynamic": "return"}, sync_result.get_block_result("Step1"))
