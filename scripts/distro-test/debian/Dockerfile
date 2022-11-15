FROM debian:latest

RUN apt update -y && apt install -y curl sudo
RUN sudo curl -SL https://raw.githubusercontent.com/superblocksteam/agent/main/scripts/quickstart.sh -o /usr/bin/superblocks && \
  sudo chmod +x /usr/bin/superblocks
