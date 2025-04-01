from typing import Any, Dict, List, Optional, Tuple

import redis
import ujson
from redis.asyncio import Redis

import superblocks_json
from exceptions import QuotaError
from kvstore.kvstore import KV, KVStore, WriteOps
from log import error, info, warn


class RedisKVStore(KVStore):
    def __init__(self, url="", key_retention_seconds=3600, redis_options: dict = {}):
        if url:
            self._client: Redis = Redis.from_url(url, **redis_options)
        else:
            self._client = Redis(**redis_options)  # type: ignore
        self._key_retention_seconds = key_retention_seconds

    async def read(self, keys: List[str]) -> Tuple[List[Dict], int]:
        if not keys:
            return [], 0

        try:
            values = await self._client.mget(keys)
            result = []
            size_in_bytes = 0
            for idx, value in enumerate(values):
                if value:
                    # Bytstrings are not properly included in the typing lib...
                    result.append(superblocks_json.loads(value.decode()))  # type: ignore
                    size_in_bytes += len(value)
                else:
                    result.append({})
                    try:
                        empty_key = keys[idx]
                    except IndexError:
                        empty_key = "Unknown"
                        error("redis returned an unexpected response when reading keys")

                    warn(f"attempted to read empty key from redis: {empty_key}")
        except Exception as e:
            error(f"Failed to get keys from redis: {e}")
            raise e
        return result, size_in_bytes

    async def write(
        self, key: str, value: Any, expiration_seconds: Optional[int] = None
    ) -> int:
        ttl = expiration_seconds if expiration_seconds else self._key_retention_seconds
        try:
            string_val = ujson.dumps(value)
        except Exception as e:
            error(f"Failed to parse value: {str(e)}")
            raise e

        try:
            if self._key_retention_seconds != -1:
                is_success: Optional[bool] = await self._client.setex(
                    key, ttl, string_val
                )
            else:
                is_success = await self._client.set(key, string_val)

            if not is_success:
                raise Exception(
                    "Attempt to write to redis resulted in a NON-OK response."
                )
        except Exception as e:
            error("failed to write to redis", err=str(e))
            raise e

        return len(string_val.encode())

    async def write_many(self, payload: List[KV], ops: Optional[WriteOps]) -> int:
        if len(payload) == 0:
            return 0
        size_in_bytes = 0
        try:
            async with self._client.pipeline(transaction=True) as pipe:
                for kv in payload:
                    ttl = (
                        kv.expiration if kv.expiration else self._key_retention_seconds
                    )
                    string_val = ujson.dumps(kv.value)
                    this_size = len(string_val.encode())

                    if ops and ops.get("maxSize") and this_size > ops.get("maxSize"):  # type: ignore
                        warn(
                            "This value's size has exceeded the limit.",
                            size=this_size,
                            limit=ops.get("maxSize"),
                        )
                        raise QuotaError()

                    size_in_bytes += len(string_val.encode())

                    pipe.set(kv.key, string_val, ex=ttl)

                results = await pipe.execute()

            for result in results:
                if not result:
                    raise Exception(
                        "Attempt to write to redis resulted in a NON-OK response."
                    )

        except QuotaError:
            raise

        except redis.exceptions.TimeoutError as e:
            error("redis client timed out when trying to write", err=str(e))
            raise e

        except Exception as e:
            error("failed to write to redis", err=str(e))
            raise e

        log_fields = {"io": {"writes": size_in_bytes}}

        if ops and ops.get("baggage"):
            log_fields = {**log_fields, **ops.get("baggage")}  # type: ignore

        info("commited transaction", **log_fields)

        return size_in_bytes

    async def delete(self, keys: str) -> None:
        try:
            resp = await self._client.delete(keys)

            if not resp:
                raise Exception(
                    "Attempt to delete key in redis resulted in a NON-OK response"
                )
        except Exception as e:
            error(f"Failed to write to redis: {str(e)}")
            raise e

    async def close(self, reason: str = "") -> None:
        try:
            await self._client.close()
        except Exception as e:
            reason_string = f"Closing reason: {reason}, " if reason else ""
            error(f"{reason_string}Failed to close redis connection: {str(e)}")
