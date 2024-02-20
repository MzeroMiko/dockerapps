#!/bin/bash

# add user:group
_GUSER=root; _UUSER=root; _HOME=/root    
if [ ! $PGID == 0 ]; then addgroup --gid $PGID user; _GUSER=user; fi;  
# if [ ! $PUID == 0 ]; then adduser --uid $PUID user -G $_GUSER -D; _UUSER=user; fi;     
if [ ! $PUID == 0 ]; then useradd --gid $PGID --uid $PUID -r -d /home/user -s /bin/bash user; _UUSER=user; _HOME=/home/user; fi;     
echo "root:$ROOTPASS" | chpasswd     
echo "user:$USERPASS" | chpasswd     
echo "user        ALL=(ALL)       NOPASSWD: ALL" >> /etc/sudoers   

# run user:group
mkdir -p /config/ssl $_HOME/.fluxbox     
echo -e 'alias ll="ls -last"' >> $_HOME/.bashrc     
echo -e "session.screen0.toolbar.placement: TopCenter \nsession.screen0.workspaces:     1 " >> $_HOME/.fluxbox/init     
chown $PUID:$PGID -R /config $_HOME     
if [ ! -z $PASSWORD ]; then PASSWORD="-passwd $PASSWORD"; fi;     
rm -r /tmp/.X* ; # rm /tmp/.X* to rm previous Xvfb running     
Xvfb $DISPLAY -ac -screen 0 $RESOLUTION > /dev/null 2>&1 &     
x11vnc -forever -repeat -loop -reopen -shared -listen 0.0.0.0 -rfbport 5900 $PASSWORD -display $DISPLAY > /dev/null 2>&1 &     
/novnc/wsnovnc -novncprefix $VNCPATH -novncroot /novnc/noVNC -bindaddr [::]:8000 -backaddr 127.0.0.1:5900 > /dev/null 2>&1 &     
/novnc/wsnovnc -novncprefix $VNCPATH -novncroot /novnc/noVNC -bindaddr [::]:8001 -backaddr 127.0.0.1:5900 -tls -cert /config/ssl/$CERTFILE -key /config/ssl/$KEYFILE > /dev/null 2>&1 &     
su $_UUSER -c /entrypoint_user.sh 

# keep container running
tail -f /dev/null   
