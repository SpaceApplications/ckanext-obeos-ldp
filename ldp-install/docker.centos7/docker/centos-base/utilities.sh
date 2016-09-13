#!/bin/bash
set -e
source /bd_build/buildconfig
set -x

## Often used tools.
$minimal_yum_install tree nano curl less psmisc
# ln -s /usr/bin/vim.tiny /usr/bin/vim

## This tool runs a command as another user and sets $HOME.
cp /bd_build/bin/setuser /sbin/setuser
