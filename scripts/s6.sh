#!/bin/sh -e

case "${BUILDARCH}" in
    amd64)
        S6_ARCH="x86_64"
        ;;
    arm64)
        S6_ARCH="aarch64"
        ;;
    arm)
        S6_ARCH="arm"
        ;;
    arm/v6)
        S6_ARCH="armhf"
        ;;
    386)
        S6_ARCH="i686"
        ;;
    riscv64)
        S6_ARCH="riscv64"
        ;;
    s390x)
        S6_ARCH="s390x"
        ;;
    *)
        echo "s6 does not support ${BUILDARCH}"
        exit 1
        ;;
esac

echo ${S6_ARCH}
