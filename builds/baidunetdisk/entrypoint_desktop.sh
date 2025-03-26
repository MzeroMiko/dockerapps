#!/bin/bash

mkdir -p $HOME/.vnc/;
ln -s /config/vnc/kasmvnc.yaml $HOME/.vnc/kasmvnc.yaml;
echo -e "${PASSWORD}\n${PASSWORD}\n" | vncpasswd -u $(whoami) -w -r
vncserver -noxstartup
sleep 2 && fluxbox > /dev/null 2>&1 &     
echo "flux start"
