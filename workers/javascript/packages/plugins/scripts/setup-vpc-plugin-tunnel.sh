#!/bin/sh
apk --upgrade --no-cache add socat
socat TCP-LISTEN:13306,fork TCP:plugin-mysql:3306 &
socat TCP-LISTEN:5432,fork TCP:plugin-postgres:5432 &
socat TCP-LISTEN:23306,fork TCP:plugin-mariadb:3306 &
socat TCP-LISTEN:1433,fork TCP:plugin-mssql:1433 &
socat TCP-LISTEN:61379,fork TCP:plugin-redis:6379 &
socat TCP-LISTEN:58703,fork TCP:plugin-smtp:58703 &
socat TCP-LISTEN:8901,fork TCP:plugin-couchbase:8901 &
socat TCP-LISTEN:8902,fork TCP:plugin-couchbase:8902 &
socat TCP-LISTEN:8903,fork TCP:plugin-couchbase:8903 &
socat TCP-LISTEN:8904,fork TCP:plugin-couchbase:8904 &
socat TCP-LISTEN:8905,fork TCP:plugin-couchbase:8905 &
socat TCP-LISTEN:8906,fork TCP:plugin-couchbase:8906 &
socat TCP-LISTEN:8907,fork TCP:plugin-couchbase:8907 &
socat TCP-LISTEN:9123,fork TCP:plugin-couchbase:9123 &
socat TCP-LISTEN:11207,fork TCP:plugin-couchbase:11207 &
socat TCP-LISTEN:11210,fork TCP:plugin-couchbase:11210 &
socat TCP-LISTEN:11280,fork TCP:plugin-couchbase:11280 &
socat TCP-LISTEN:18901,fork TCP:plugin-couchbase:18901 &
socat TCP-LISTEN:18902,fork TCP:plugin-couchbase:18902 &
socat TCP-LISTEN:18903,fork TCP:plugin-couchbase:18903 &
socat TCP-LISTEN:18904,fork TCP:plugin-couchbase:18904 &
socat TCP-LISTEN:18905,fork TCP:plugin-couchbase:18905 &
socat TCP-LISTEN:18906,fork TCP:plugin-couchbase:18906 &
socat TCP-LISTEN:18907,fork TCP:plugin-couchbase:18907 &
wait
# while true; do sleep 1; done
