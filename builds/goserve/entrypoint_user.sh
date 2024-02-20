#!/bin/sh
   
/goserve/goserve -addr [::]:8000 -prefix $PREFIX -scope $SCOPE $PLUGIN -web /config/public -user  $USERNAME -pass $PASSWORD -session $SESSIONTIME > /tmp/__goserve.log 2>&1 &
/goserve/goserve -addr [::]:8001 -prefix $PREFIX -scope $SCOPE $PLUGIN -web /config/public -user  $USERNAME -pass $PASSWORD -session $SESSIONTIME -tls -cert /config/ssl/$CERTFILE -key /config/ssl/$KEYFILE > /tmp/__goserves.log 2>&1 &