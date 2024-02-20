#!/bin/sh
  
/webdav/wdav -addr [::]:8000 -auth -def $DEFUSER $APPEND_USERS > /tmp/_webdav.log 2>&1 &     
/webdav/wdav -addr [::]:8001 -auth -def $DEFUSER $APPEND_USERS -tls -cert /config/ssl/$CERTFILE -key /config/ssl/$KEYFILE > /tmp/_webdavs.log 2>&1 &     