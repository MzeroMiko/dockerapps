#!/bin/bash

export LC_ALL=zh_CN.UTF-8     
# sleep 2 && fluxbox > /dev/null 2>&1 &     
sleep 2 && GTK_IM_MODULE=fcitx QT_IM_MODULE=fcitx XMODIFIERS=@im=fcitx fcitx -r -d;
sleep 2 && GTK_IM_MODULE=fcitx QT_IM_MODULE=fcitx XMODIFIERS=@im=fcitx firefox;