#!/bin/bash

aria2c --conf-path=/config/aria2.conf --log=/tmp/__aria2.log --rpc-secret=$SECRET --listen-port=$BTPORT --dht-listen-port=$BTPORT --rpc-secure=false;     
tail -f /tmp/__aria2.log
