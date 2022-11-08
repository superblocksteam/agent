FROM centos:latest

RUN cd /etc/yum.repos.d/
RUN sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*
RUN sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*
RUN yum -y install curl && yum -y install sudo
RUN sudo curl -SL https://raw.githubusercontent.com/superblocksteam/agent/main/scripts/quickstart.sh -o /usr/bin/superblocks && \
sudo chmod +x /usr/bin/superblocks
