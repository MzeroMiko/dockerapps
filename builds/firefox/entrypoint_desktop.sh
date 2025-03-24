#!/bin/bash

mkdir -p $HOME/.vnc/;
cp -rp /config/kasmvnc.yaml $HOME/.vnc/kasmvnc.yaml;
echo -e "${PASSWORD}\n${PASSWORD}\n" | vncpasswd -u $(whoami) -w -r
sleep 2 && fluxbox > /dev/null 2>&1 &     

