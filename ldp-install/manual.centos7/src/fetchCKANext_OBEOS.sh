#!/bin/bash

# Run this script to fetch and compress the current version of ckanext-obeos
# This tar.gz will be deployed in the ckan container.

tar czvf ckanext-obeos.tar.gz ../../../ckanext-obeos/
