#!/bin/bash

# Ensure SSH directory exists
mkdir -p /root/.ssh

# Generate SSH key pair if not already present
if [ ! -f /root/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 2048 -f /root/.ssh/id_rsa -N ""
fi

# Ensure permissions are correct
chmod 700 /root/.ssh
chmod 600 /root/.ssh/id_rsa
chmod 644 /root/.ssh/id_rsa.pub
