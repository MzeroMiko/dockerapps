#!/bin/sh     

# add user:group
_GUSER=root; _UUSER=root; _HOME=/root
if [ ! $PGID == 0 ]; then addgroup -g $PGID user; _GUSER=user; fi;     
if [ ! $PUID == 0 ]; then adduser -u $PUID user -G $_GUSER -D; _UUSER=user; _HOME=/home/user; fi;
echo "root:$ROOTPASS" | chpasswd
echo "user:$USERPASS" | chpasswd
echo "user        ALL=(ALL)       NOPASSWD: ALL" >> /etc/sudoers     

# run user:group
mkdir -p /config/ssl /config/plugins     
if [ ! -e /config/public ]; then cp -rp /goserve/public /config/public; fi;     
if [ ! -e /config/links.json ]; then echo "{\n//      \"cockpit\":\"https://__IP__:9090\"\n}"     > /config/links.json; fi;     
ln -sf /config/links.json /config/public/data/links.json     
chown $PUID:$PGID -R /config
su $_UUSER -c /entrypoint_user.sh   

# keep container running
tail -f /dev/null
