#!/bin/sh     

# add user:group
_GUSER=root; _UUSER=root; _HOME=/root
if [ ! $PGID == 0 ]; then addgroup -g $PGID user; _GUSER=user; fi;     
if [ ! $PUID == 0 ]; then adduser -u $PUID user -G $_GUSER -D; _UUSER=user; _HOME=/home/user; fi;
echo "root:$ROOTPASS" | chpasswd
echo "user:$USERPASS" | chpasswd
echo "user        ALL=(ALL)       NOPASSWD: ALL" >> /etc/sudoers     

# run user:group
mkdir -p /config/ssl /data/share;
chown $PUID:$PGID -R /config     
nginx -s reload || nginx     
su $_UUSER -c /entrypoint_user.sh   

# keep container running
tail -f /dev/null
