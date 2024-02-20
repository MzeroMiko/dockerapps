#!/bin/bash

# add user:group
_GUSER=root; _UUSER=root; _HOME=/root    
if [ ! $PGID == 0 ]; then addgroup --gid $PGID user; _GUSER=user; fi;  
# if [ ! $PUID == 0 ]; then adduser --uid $PUID user -G $_GUSER -D; _UUSER=user; fi;     
if [ ! $PUID == 0 ]; then useradd --gid $PGID --uid $PUID -r -d /home/user -s /bin/bash user; _UUSER=user; _HOME=/home/user; fi;     
echo "root:$ROOTPASS" | chpasswd     
echo "user:$USERPASS" | chpasswd     
echo "user        ALL=(ALL)       NOPASSWD: ALL" >> /etc/sudoers   

# add ssl
mkdir -p /config/ssl
openssl req -x509 -nodes -keyout /tmp/tmp.key -out /tmp/tmp.crt -days 3650 -newkey rsa:2048 -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=Personal/CN=tmp.com"     
if [ ! -e /config/ssl/$CERTFILE ]; then     
    mv /tmp/tmp.crt /config/ssl/$CERTFILE; mv /tmp/tmp.key /config/ssl/$KEYFILE;     
elif [ ! -e /config/ssl/$KEYFILE ]; then     
    mv /tmp/tmp.crt /config/ssl/$CERTFILE; mv /tmp/tmp.key /config/ssl/$KEYFILE; 
fi;     

# run user:group
sed -i "/ssl_certificate /c \        ssl_certificate /config/ssl/$CERTFILE;" /etc/nginx/conf.d/codeserver.conf
sed -i "/ssl_certificate_key/c \        ssl_certificate_key /config/ssl/$KEYFILE;" /etc/nginx/conf.d/codeserver.conf
mkdir -p /workspace  
chown $PUID:$PGID /workspace && chown $PUID:$PGID -R /config $_HOME     
nginx -s reload > /dev/null 2>&1 || nginx     
su $_UUSER -c /entrypoint_user.sh     

# keep container running
tail -f /dev/null   
