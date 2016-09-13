#!/bin/sh

if [ -f _src/fetchCKANext_OBEOS.sh ]
then 
  echo "Fetch latest Ckan-ext sources"
  cd _src
  ./fetchCKANext_OBEOS.sh 
  cd ..
fi

echo "Stop any container running, if needeed"
docker-compose stop

echo "Remove instantied containers"
yes | docker-compose rm

echo "Build base image of CentOS and Strabon"
docker-compose build centos-base strabon-base

echo "Build Container Images"
docker-compose build
