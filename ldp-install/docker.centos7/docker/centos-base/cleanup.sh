#!/bin/bash
set -e
source /bd_build/buildconfig
set -x

rm -rf /bd_build
rm -rf /tmp/* /var/tmp/*

rm -f /etc/ssh/ssh_host_*
