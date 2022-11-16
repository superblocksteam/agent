#!/bin/sh
# Superblock On-Premise-Agent installation script for Linux
# Supported OS:
#   - AmazonLinux
#   - Ubuntu

set -e

compose_yaml="https://raw.githubusercontent.com/superblocksteam/agent/main/docker/compose.yaml"
env_file="/etc/superblocks.conf"
log_file="/var/log/superblocks.log"

get_distro() {
    distro=""
    if [ -r /etc/os-release ]; then
        # shellcheck disable=SC1091
        distro="$(. /etc/os-release && echo "$ID")"
    fi
    echo "$distro"
}

get_compose_cmd() {
    if [ "$(get_distro)" = "amzn" ]; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

command_exists() {
    command -v "$@" > /dev/null 2>&1
}

install_docker_on_linux() {
    if ! (command_exists docker); then
        echo "Installing docker on $(get_distro)..."
        /bin/sh -c "$(curl -fsSL https://get.docker.com/)"
    fi
}

install_docker_on_amzn() {
    if ! (command_exists docker); then
        echo "Installing docker on Amazon..."
        #Install docker
        yum update -y
        amazon-linux-extras install docker

        #Install docker-compose standalone
        curl -SL https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-linux-x86_64 -o /usr/bin/docker-compose
        chmod +x /usr/bin/docker-compose
    fi
}

install_docker() {
    if [ "$(get_distro)" = "amzn" ]; then
        install_docker_on_amzn
    else
        install_docker_on_linux
    fi
}

stop() {
    echo "Stopping Superblocks On-Premise-Agent..."
    ids=$(docker ps -q --filter name=superblocks*)
    for id in $ids; do docker kill "$id"; done
    echo ">>>On-Premise-Agent is stopped"
}

status() {
    docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
}

log() {
    echo "Press Ctrl+C to stop logging..."
    tail -f $log_file
}

conf() {
    if [ "$1" = "clear" ]; then
        rm $env_file
        exit 1
    fi

    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "Key and value are required."
        echo "Usage: ./quickstart.sh conf KEY VALUE"
        exit 1
    fi

    if ! [ -e $env_file ]; then
        touch $env_file
    fi

    if grep -q "$1" $env_file; then
        sed -i "s|$1=.*|$1=$2|" $env_file
    else
        echo "$1=$2" >> $env_file
    fi

    # Extract SUPERBLOCKS_AGENT_CUSTOM_DOMAIN from SUPERBLOCKS_AGENT_HOST_URL
    if [ "$1" = "SUPERBLOCKS_AGENT_HOST_URL" ]; then
        if [ "$2" != "${2#http}" ]; then
            domain=$(echo "$2" | awk -F/ '{print $3}' -)
            conf "SUPERBLOCKS_AGENT_CUSTOM_DOMAIN" "$domain"
        else
            conf "SUPERBLOCKS_AGENT_CUSTOM_DOMAIN" "$2"
        fi
    fi
}

show_instructions() {
    echo ""
    echo "Superblocks On-Premise-Agent"
    echo ""
    echo "Usage: sudo superblocks [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  start      Start Superblocks OPA, install docker if necessary"
    echo "  status     Check the status of running containers"
    echo "  stop       Stop running containers"
    echo "  conf       Set configuration variables"
    echo "  log        View logs, press Ctrl+C to stop"
    echo ""
    echo "Options:"
    echo "  -d|--debug   Run Superblocks OPA in debug mode"
    echo ""
}

start() {
    # Install and run docker
    # Docker's installation script doesn't support AmazonLinux
    # and we need to install docker-compose standalone
    install_docker

    echo "Running docker..."
    systemctl start docker

    compose_cmd=$(get_compose_cmd)

    # Launch OPA
    if [ "$4" = 1 ]; then
        echo "Starting Superblocks On-Premise-Agent in debug mode..."

        conf "SUPERBLOCKS_AGENT_DEBUG_MODE" 1
        conf "SUPERBLOCKS_PROXY_LOG_LEVEL" "DEBUG"

        echo ""
        echo "Configured Variables----------"
        cat -- "$2"

        echo ""
        echo "Container Status--------------"
        status

        echo ""
        echo "Logs--------------------------"
        curl -s "$1" | ${compose_cmd} -p superblocks --env-file "$2" -f - up
    else
        echo "Starting Superblocks On-Premise-Agent..."

        conf "SUPERBLOCKS_AGENT_DEBUG_MODE" 0
        conf "SUPERBLOCKS_PROXY_LOG_LEVEL" "INFO"
        curl -s "$1" | ${compose_cmd} -p superblocks --env-file "$2" -f - up > "$3" &
    fi
}

DEBUG_ENABLED=0
while [ $# -gt 0 ]; do
    case "$1" in
        start)
            start "$compose_yaml" "$env_file" "$log_file" "$DEBUG_ENABLED"
            shift
            ;;
        stop)
            stop
            shift
            ;;
        status)
            status
            shift
            ;;
        conf)
            conf "$2" "$3"
            shift
            shift
            shift
            ;;
        log)
            log
            shift
            ;;
        -d|--debug)
            DEBUG_ENABLED=1
            shift
            ;;
        *)
            echo "[Error] Unknown commands or options $1"
            show_instructions
            exit 1
            ;;
    esac
done
