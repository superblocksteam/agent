FROM ubuntu:latest

RUN apt-get update -y && apt-get install -y curl sudo
RUN sudo curl -SL https://raw.githubusercontent.com/superblocksteam/agent/main/scripts/quickstart.sh \
    -o /usr/bin/superblocks && \
    sudo chmod +x /usr/bin/superblocks
