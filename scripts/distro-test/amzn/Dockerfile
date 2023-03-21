FROM amazonlinux:latest

RUN yum -y install sudo
RUN if ! [ -x "$(command -v curl)" ]; then yum -y install curl fi
RUN sudo curl -SL https://raw.githubusercontent.com/superblocksteam/agent/main/scripts/quickstart.sh -o /usr/bin/superblocks && \
  sudo chmod +x /usr/bin/superblocks
