#!/bin/bash

# run user:group
echo "root:$ROOTPASS" | chpasswd
/usr/sbin/sshd
/flynatc -u $USER -k $TOKEN

# keep container running   
tail -f /dev/null
