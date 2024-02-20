#!/bin/bash     

# add user:group
_GUSER=root; _UUSER=root; _HOME=/root
if [ ! $PGID == 0 ]; then addgroup -g $PGID user; _GUSER=user; fi;     
if [ ! $PUID == 0 ]; then adduser -u $PUID user -G $_GUSER -D; _UUSER=user; _HOME=/home/user; fi;
echo "root:$ROOTPASS" | chpasswd
echo "user:$USERPASS" | chpasswd
echo "user        ALL=(ALL)       NOPASSWD: ALL" >> /etc/sudoers     

# add ssl
mkdir -p /config/ssl/
openssl req -x509 -nodes -keyout /tmp/tmp.key -out /tmp/tmp.crt -days 3650 -newkey rsa:2048 -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=Personal/CN=tmp.com"     
if [ ! -e /config/ssl/$CERTFILE ]; then     
    mv /tmp/tmp.crt /config/ssl/$CERTFILE; 
    mv /tmp/tmp.key /config/ssl/$KEYFILE;     
elif [ ! -e /config/ssl/$KEYFILE ]; then     
    mv /tmp/tmp.crt /config/ssl/$CERTFILE; 
    mv /tmp/tmp.key /config/ssl/$KEYFILE; 
fi;     

# run user:group
sed -i "/ssl_certificate /c \        ssl_certificate /config/ssl/$CERTFILE;" /etc/nginx/http.d/aria2nginx.conf     
sed -i "/ssl_certificate_key/c \        ssl_certificate_key /config/ssl/$KEYFILE;" /etc/nginx/http.d/aria2nginx.conf
if [ ! -e /config/aria2.conf ]; then cp /www/aria2.conf /config/aria2.conf -rp; fi
if [ ! -e /config/aria2.session ]; then touch /config/aria2.session; fi
chown $PUID:$PGID -R /config     
chown $PUID:$PGID -R /www
nginx -s reload || nginx     
su $_UUSER -c /entrypoint_user.sh   

# keep container running
tail -f /dev/null