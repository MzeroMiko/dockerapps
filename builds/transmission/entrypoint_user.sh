#!/bin/bash     

mkdir -p /config/watch  
# INCOMPLETEDIR="--incomplete-dir /downloads/incomplete"     
if [ -z $INCOMPLETEDIR ]; then INCOMPLETEDIR="--no-incomplete-dir"; fi;     
transmission-daemon -g /config --auth --username $USERNAME --password $PASSWORD --port 9091 --peerport $PEERPORT --watch-dir /config/watch --download-dir /downloads $INCOMPLETEDIR     