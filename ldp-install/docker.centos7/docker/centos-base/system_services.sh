#!/bin/bash
set -e
source /bd_build/buildconfig
set -x

## Install init process.
cp /bd_build/bin/my_init /sbin/
mkdir -p /etc/my_init.d
mkdir -p /etc/container_environment
touch /etc/container_environment.sh
touch /etc/container_environment.json
chmod 700 /etc/container_environment

groupadd -g 8377 docker_env
chown :docker_env /etc/container_environment.sh /etc/container_environment.json
chmod 640 /etc/container_environment.sh /etc/container_environment.json
ln -s /etc/container_environment.sh /etc/profile.d/

# Install Python 3.4 to run my_init later on
# echo "Installing Python3 to run my_init script on startup"
# $minimal_yum_install install epel-release
# $minimal_yum_install install python34
# ln -s /usr/bin/python3.4 /usr/bin/python3

## Install runit.
# yum install runit
curl -s https://packagecloud.io/install/repositories/imeyer/runit/script.rpm.sh | bash
$minimal_yum_install runit-2.1.1-7.el7.centos.x86_64

## Install a syslog daemon and logrotate.
[ "$DISABLE_SYSLOG" -eq 0 ] && /bd_build/services/syslog-ng/syslog-ng.sh || true

## Install the SSH server.
[ "$DISABLE_SSH" -eq 0 ] && /bd_build/services/sshd/sshd.sh || true

## Install cron daemon.
[ "$DISABLE_CRON" -eq 0 ] && /bd_build/services/cron/cron.sh || true
