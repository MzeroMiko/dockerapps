#!/bin/bash

# run user:group
echo "root:$ROOTPASS" | chpasswd
/usr/sbin/sshd
/ngrok $SERVE --authtoken $TOKEN

# keep container running   
tail -f /dev/null