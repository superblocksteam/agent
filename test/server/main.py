import os

from dotenv import load_dotenv

ENV = os.environ["ENV"]
load_dotenv(dotenv_path=f".env.{ENV}")

import embed  # noqa

print("embed ✅")
print("all tests passed ✅")
