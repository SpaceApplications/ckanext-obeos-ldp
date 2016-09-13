#FROM ubuntu:14.04
FROM centos:7
MAINTAINER Space Applications Services

ENV PS4 '+(${BASH_SOURCE}:${LINENO}): ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'
ENV TERM xterm
# Disable Syslog-ng
ENV DISABLE_SYSLOG 1
# Disable Cron
ENV DISABLE_CRON 1

RUN echo "alias l=ls" >> ~/.bashrc
RUN echo "alias ..='cd ..'" >> ~/.bashrc

ADD . /bd_build

RUN /bd_build/prepare.sh && \
	/bd_build/system_services.sh && \
	/bd_build/utilities.sh && \
	/bd_build/cleanup.sh

#CMD ["/sbin/my_init"]
