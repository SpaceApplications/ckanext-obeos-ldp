#!/bin/bash
set -e
source /bd_build/buildconfig
set -x

## Prevent initramfs updates from trying to run grub and lilo.
## https://journal.paul.querna.org/articles/2013/10/15/docker-ubuntu-on-rackspace/
## http://bugs.debian.org/cgi-bin/bugreport.cgi?bug=594189
export INITRD=no
mkdir -p /etc/container_environment
echo -n no > /etc/container_environment/INITRD

## Update yum packages.
yum -q -y update

## Fix some issues with packages.
## See https://github.com/dotcloud/docker/issues/1024
ln -sf /bin/true /sbin/initctl

## Replace the 'ischroot' tool to make it always return true.
## Prevent initscripts updates from breaking /dev/shm.
## https://journal.paul.querna.org/articles/2013/10/15/docker-ubuntu-on-rackspace/
## https://bugs.launchpad.net/launchpad/+bug/974584
ln -sf /bin/true /usr/bin/ischroot

## Fix locale.
#locale-gen en_US
#localedef -v -c -i en_US -f UTF-8 en_US.UTF-8
#update-locale LANG=en_US.UTF-8 LC_CTYPE=en_US.UTF-8
# echo -n en_US.UTF-8 > /etc/container_environment/LANG
# echo -n en_US.UTF-8 > /etc/container_environment/LC_CTYPE
