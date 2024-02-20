"use strict"

function SliderBar(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {
            changeCallBack: (progress) => { },
        },
        style: {
            basicSize: "2px", pointSize: 5, sliderColor: "#ddd", bufferColor: "#aaa", progressColor: "#2d3",
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.style = '\
        .sliderBar {overflow:hidden;width:100%;}\
        .contain {padding:2em 0;margin:0 2em;cursor:pointer;font-size:' + args.style.basicSize + ';}\
        .slider {position:relative;height:1em;border-radius:0.5em;background:' + args.style.sliderColor + ';}\
        .buffer {height:1em;width:0%;border-radius:0.5em;background:' + args.style.bufferColor + ';}\
        .prog {height:1em;width:0%;transform:translate(0,-1em);border-radius:0.5em;background:' + args.style.progressColor + ';}\
        .point {position:absolute;height:' + args.style.pointSize + 'em;width:' + args.style.pointSize + 'em;\
        transform:translate(-' + args.style.pointSize / 2 + 'em,-' + (args.style.pointSize + 3) / 2 + 'em);\
            border-radius:50%;background:' + args.style.progressColor + ';}\
        ';
        args.htmlParts.main = '\
        <div class="sliderBar"><div class="contain"><div class="slider">\
        <div class="buffer"></div><div class="prog"></div><div class="point"></div>\
        </div></div></div>\
        ';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let container = args.box.querySelector('.contain');
    let slider = container.querySelector('.slider');
    let prog = slider.querySelector('.prog');
    let buffer = slider.querySelector('.buffer');
    let point = slider.querySelector('.point');

    container.onclick = function (evt) {
        let rect = slider.getBoundingClientRect();
        let rate = (evt.clientX - rect.x) / rect.width;
        args.params.changeCallBack(((rate < 0) ? 0 : ((rate > 1) ? 1 : rate)));
    }

    container.onmousedown = function (evt) {
        let rect = slider.getBoundingClientRect();
        document.onmousemove = function (event) {
            let rate = (event.clientX - rect.x) / rect.width;
            args.params.changeCallBack(((rate < 0) ? 0 : ((rate > 1) ? 1 : rate)));
        };
        document.onmouseup = function (event) {
            document.onmousemove = null;
            document.onmouseup = null;
        };
    }

    function updateCurrent(current) {
        // current:  support 0.6 60 60%
        let tmp = Math.abs(100 * parseFloat(current));
        tmp = (tmp <= 100) ? (tmp) + "%" : (tmp / 100) + "%";
        prog.style.width = tmp;
        point.style.left = tmp;
    }

    function updateBuffer(current) {
        // current:  support 0.6 60 60%
        let tmp = Math.abs(100 * parseFloat(current));
        tmp = (tmp <= 100) ? (tmp) + "%" : (tmp / 100) + "%";
        buffer.style.width = tmp;
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        updateCurrent: updateCurrent,
        updateBuffer: updateBuffer,
    }
}

function MusicPlayer(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {
            forwardStep: 5, stopCallBack: () => { }, pathToUrl: (path) => { },
            validSuffix: [".mp3", ".ogg", ".wav", ".acc", ".webm"]
        },
        style: {
            basicSize: "14px", backColor: "#bcd", themeColor: "#fff",
            playBtnColor: "#aeb", ctrlBackColor: "rgba(0,0,0,0)", listColor: "#222",
            volSliderColor: "#ddd", timeSliderColor: "#ddd", sliderBufferColor: "#aaa",
            listItemColor: "rgba(255,255,255,0.2)", listItemHover: "rgba(196,196,196,0.75)",
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.style = '\
        .audiobox {position:absolute;display:flex;flex-direction:column;width:100%;height:100%;\
            background:' + args.style.backColor + ';font-size:' + args.style.basicSize + ';}\
        .musebar {position:relative;width:100%;top:0;box-sizing:border-box;\
            outline:none;padding:0.8em;background:' + args.style.ctrlBackColor + ';}\
        .progline {padding:0.6em;} .timeSlider {flex:auto;}\
        .ctrlline {display:flex;align-items:center;padding:0 0.8em;}\
        .ctrlline .icon {font-size:2em;cursor:pointer;}\
        .volBtn {margin-left:auto;}\
        .volSlider {flex-shrink:0;width:4em;}\
        .mediaTime {margin-left:auto;padding-left:1em;font-weight:600;color:' + args.style.themeColor + ';}\
        .mediaName {font-weight:600;padding:0.4em 0.8em 0.8em 0.8em;white-space:nowrap;\
            overflow:hidden;color:' + args.style.themeColor + ';}\
        .listTable {position:relative;box-sizing:border-box;width:100%;flex:1;overflow:auto;}\
        .mediaList {padding-bottom:3em;font-size:0.8em;font-weight:500;}\
        .mediaList .item {width:100%;padding:0.6em 1em;box-sizing:border-box;\
            cursor:pointer;overflow:hidden;color:' + args.style.listColor + ';\
            border-top:1px solid rgba(0, 0, 0, 0.125);background:' + args.style.listItemColor + ';}\
        .mediaList .item:hover { background:' + args.style.listItemHover + '; }\
        ';
        args.htmlParts.orderBtnHtml = '<divicon style="height:1em;width:1em;'
            + 'display:flex;align-items:center;justify-content:center;">'
            + '<div class="orderStat" style="font-size:0.6em;font-weight:800;overflow:hidden;'
            + 'color:' + args.style.themeColor + '; ">A</div></divicon>';
        args.htmlParts.playBtnHtml = '<divicon style="background:' + args.style.playBtnColor + ';'
            + 'border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0.1em;height:0.5em;"></div>'
            + '<div style="width:0;height:0;border-left:0.5em solid ' + args.style.themeColor + ';'
            + 'border-top:0.25em solid transparent;border-bottom:0.25em solid transparent;"></div>'
            + '</divicon>';
        args.htmlParts.pauseBtnHtml = '<divicon style="background:' + args.style.playBtnColor + ';'
            + 'border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0.17em;height:0.5em;background:' + args.style.themeColor + ';"></div>'
            + '<div style="width:0.16em;height:0.5em;background:transparent;"></div>'
            + '<div style="width:0.17em;height:0.5em;background:' + args.style.themeColor + ';"></div>'
            + '</divicon>';
        args.htmlParts.prevBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0.1em;height:0.5em;background:' + args.style.themeColor + ';"></div>'
            + '<div style="width:0;height:0;border-right:0.4em solid ' + args.style.themeColor + ';'
            + 'border-top:0.25em solid transparent;border-bottom:0.25em solid transparent;"></div>'
            + '</divicon>';
        args.htmlParts.nextBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0;height:0;border-left:0.4em solid ' + args.style.themeColor + ';'
            + 'border-top:0.25em solid transparent;border-bottom:0.25em solid transparent;"></div>'
            + '<div style="width:0.1em;height:0.5em;background:' + args.style.themeColor + ';"></div>'
            + '</divicon>';
        args.htmlParts.volBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0.16em;height:0.24em;background:' + args.style.themeColor + ';"></div>'
            + '<div style="width:0;height:0.24em;border-right:0.24em solid ' + args.style.themeColor + ';'
            + 'box-sizing:content-box;'
            + 'border-top:0.13em solid transparent;border-bottom:0.13em solid transparent;"></div>'
            + '<div style="width:0.1em;height:0.5em;"></div>'
            + '</divicon>';
        args.htmlParts.listItem = '<div class="item"></div>';
        args.htmlParts.main = '\
        <div class="audiobox"><audio></audio>                   \
        <div class="musebar"><div class="mediaName"></div>      \
        <div class="ctrlline">                                  \
        <div class="icon prevBtn">' + args.htmlParts.prevBtnHtml + '</div>   \
        <div class="icon playBtn">' + args.htmlParts.playBtnHtml + '</div>   \
        <div class="icon nextBtn">' + args.htmlParts.nextBtnHtml + '</div>   \
        <div class="icon volBtn">' + args.htmlParts.volBtnHtml + '</div>     \
        <div class="volSlider"></div></div>                         \
        <div class="progline"><div class="timeSlider"></div></div>  \
        <div class="ctrlline"><div class="icon orderBtn">' + args.htmlParts.orderBtnHtml + '</div>\
        <div class="mediaTime">00:00/00:00</div></div></div>        \
        <div class="listTable"><div class="mediaList"></div></div>  \
        </div>\
        ';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let oriPlayList = [], playList = []; // playList [/x/x/x, /x/x/x, ...]
    let playPos = 0, playOrder = "Ascend", currentPath = "", currentName = "", currentVolume = 1;
    let cTime = 0;
    let backdrop = args.box.querySelector(".audiobox");
    let media = backdrop.querySelector('audio');
    let mediaBar = backdrop.querySelector(".musebar");
    let orderBtn = mediaBar.querySelector(".orderBtn");
    let prevBtn = mediaBar.querySelector(".prevBtn");
    let playBtn = mediaBar.querySelector(".playBtn");
    let nextBtn = mediaBar.querySelector(".nextBtn");
    let volBtn = mediaBar.querySelector(".volBtn");
    let mediaName = mediaBar.querySelector(".mediaName");
    let mediaTime = mediaBar.querySelector(".mediaTime");
    let mediaList = args.box.querySelector('.mediaList');
    let timeSlider = SliderBar({
        box: mediaBar.querySelector(".timeSlider"),
        sliderColor: args.style.timeSliderColor,
        bufferColor: args.style.sliderBufferColor,
        progressColor: args.style.themeColor,
        changeCallBack: function (rate) {
            if (!isNaN(media.duration))
                playTime(media.duration * rate);
        },
    });
    let volSlider = SliderBar({
        box: mediaBar.querySelector(".volSlider"),
        sliderColor: args.style.volSliderColor,
        bufferColor: args.style.sliderBufferColor,
        progressColor: args.style.themeColor,
        changeCallBack: function (rate) {
            media.volume = rate;
            volSlider.updateCurrent(media.volume);
        },
    });

    // ======================= //
    mediaBar.setAttribute("tabIndex", "1");
    mediaBar.onkeydown = function (event) {
        switch (event.keyCode || event.which) {
            case 32: event.preventDefault(); playPause(); break; // space
            case 37: event.preventDefault(); playForward(-1 * args.params.forwardStep); break; // left Arrow
            case 39: event.preventDefault(); playForward(+1 * args.params.forwardStep); break; // right Arrow
            case 38: event.preventDefault(); playPrev(); break; // up Arrow
            case 40: event.preventDefault(); playNext(); break; // down Arrow
        }
    };
    media.addEventListener("ended", function () { playEnd(); });
    media.addEventListener("canplay", function () { mediaName.innerText = playPos + ": " + currentName; });
    media.addEventListener("loadstart", function () { mediaName.innerText = "Loading " + currentName; });
    media.addEventListener("timeupdate", function () { updateTime(); });
    orderBtn.onclick = function () { playOrderChange(); };
    prevBtn.onclick = function () { playPrev(); };
    playBtn.onclick = function () { playPause(); };
    nextBtn.onclick = function () { playNext(); };
    volBtn.onclick = function () {
        if (media.volume) {
            currentVolume = media.volume;
            media.volume = 0;
        } else {
            media.volume = currentVolume;
        }
        volSlider.updateCurrent(media.volume);
    };

    function playThis(path = "") {
        let tmpPos = playList.indexOf(path);
        if (tmpPos != -1)
            playPos = tmpPos;
        currentPath = path;
        currentName = path.slice(path.lastIndexOf("/") + 1);
        console.log('play: ', currentName);
        media.src = args.params.pathToUrl(path);
        media.play();
        playBtn.innerHTML = args.htmlParts.fix(args.htmlParts.pauseBtnHtml);
        volSlider.updateCurrent(media.volume);
    }
    function playPause() {
        if (media.src == "") {
            playPos = Math.floor(Math.random() * (playList.length - 1));
            playThis(playList[playPos]);
        } else if (media.paused) {
            media.play();
            playBtn.innerHTML = args.htmlParts.fix(args.htmlParts.pauseBtnHtml);
            volSlider.updateCurrent(media.volume);
        } else {
            media.pause();
            playBtn.innerHTML = args.htmlParts.fix(args.htmlParts.playBtnHtml);
            volSlider.updateCurrent(media.volume);
        }
    }
    function playPrev() {
        let oriPlayPos = playPos;
        if (playPos == 0)
            playPos = playList.length - 1;
        else
            playPos--;
        if (playPos != oriPlayPos)
            playThis(playList[playPos]);
    }
    function playNext() {
        let oriPlayPos = playPos;
        if (playPos == playList.length - 1)
            playPos = 0;
        else
            playPos++;
        if (playPos != oriPlayPos)
            playThis(playList[playPos]);
    }
    function playEnd() {
        if (playOrder == "Loop")
            playThis(playList[playPos]);
        else
            playNext();
    }
    function playStop() {
        try {
            media.pause();
            media.currentTime = 0;
            timeSlider.updateBuffer(0);
            timeSlider.updateCurrent(0);
            playBtn.innerHTML = args.htmlParts.fix(args.htmlParts.playBtnHtml);
            args.params.stopCallBack();
        } catch (err) { console.log(err); }
    }
    function playTime(time) {
        if (time >= media.duration)
            playEnd();
        else {
            media.currentTime = time;
            media.play();
            playBtn.innerHTML = args.htmlParts.fix(args.htmlParts.pauseBtnHtml);
            timeSlider.updateCurrent(media.currentTime / media.duration);
            mediaTime.innerText = formatTime(media.currentTime) + ' / ' + formatTime(media.duration);
        }
    }
    function playForward(step) {
        if (isNaN(media.duration))
            return;
        playTime(media.currentTime + step);
    }
    function playOrderChange() {
        let currentPlay = playList[playPos];
        switch (playOrder) {
            case "Ascend":
                playOrder = "Random";
                playList.sort(function () { return Math.random() > 0.5 ? -1 : 1; });
                break;
            case "Random": playOrder = "Loop"; break;
            case "Loop": playOrder = "Ascend"; playList = oriPlayList.slice(0); break;
            default: playOrder = "Ascend"; playList = oriPlayList.slice(0);
        }
        orderBtn.querySelector(".orderStat").innerText = playOrder.slice(0, 1).toUpperCase();
        playPos = playList.indexOf(currentPlay); // could be -1, if wrong
        if (playPos > playList.length || playPos < 0)
            playPos = 0;
        mediaName.innerText = playPos + ": " + currentName;
        updateItems(playList);
    }
    function formatTime(time) {
        if (isNaN(time))
            time = 0;
        let minute = String(Math.floor(time / 60));
        let second = String(Math.floor(time % 60));
        if (minute < 10)
            minute = "0" + minute;
        if (second < 10)
            second = "0" + second;
        return minute + ':' + second;
    }
    function updateTime() {
        // console.time("upTime");
        function updateTimeCore() {
            if (isNaN(media.duration))
                return;
            let timeBuffered = 0;
            let timeText = "00:00 / 00:00";
            try {
                timeBuffered = media.buffered.end(media.buffered.length - 1);
                timeText = formatTime(media.currentTime) + ' / ' + formatTime(media.duration);
            } catch (err) { }
            mediaTime.innerText = timeText;
            timeSlider.updateBuffer(timeBuffered / media.duration);
            timeSlider.updateCurrent(media.currentTime / media.duration);
        }
        let tTime = new Date().getTime();
        if (tTime - cTime > 800) {
            cTime = tTime;
            updateTimeCore();
        }
    }
    function thisPos(path = "") {
        return playList.indexOf(path);
    }
    function getPlayPath() {
        return currentPath;
    };
    function setPlayList(newPlayList = [], append = false) {
        let currentPlay = (playList.length == 0) ? "" : playList[playPos];
        let extraPlayList = newPlayList.filter(function (path, index, array) {
            let suffix = path.slice(path.lastIndexOf("."));
            if (args.params.validSuffix.indexOf(suffix) != -1)
                return path;
        });
        oriPlayList = (append) ? oriPlayList.concat(extraPlayList) : extraPlayList;
        playList = oriPlayList.slice(0); // to copy but not get memory address
        if (playOrder == "Random") {
            playList.sort(function () { return Math.random() > 0.5 ? -1 : 1; });
        }
        playPos = playList.indexOf(currentPlay);
        if (playPos > playList.length || playPos < 0)
            playPos = 0;
        updateItems(playList);
    }
    function updateItems(playList = []) {
        let htmlItem = playList.map(function (path, index, array) {
            return '<div class="item" path="' + path + '">' + index + ' : ' + path.slice(path.lastIndexOf("/") + 1) + '</div>';
        });
        mediaList.innerHTML = args.htmlParts.fix(htmlItem.join('\n'));
        let items = mediaList.querySelectorAll('.item');
        let numItems = items.length;
        for (let i = 0; i < numItems; i++) {
            items[i].onclick = function () { playThis(this.getAttribute("path")); };
        }
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        thisPos: thisPos,
        playThis: playThis,
        playStop: playStop,
        setPlayList: setPlayList,
        getPlayPath: getPlayPath,
    }
}

function VideoPlayer(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {
            forwardStep: 5, infoTime: 5000, autoRotate: true,
            stopCallBack: () => { }, pathToUrl: (path) => "",
        },
        style: {
            basicSize: "14px", backColor: "#000", themeColor: "#fff",
            playBtnColor: "#aeb", ctrlBackColor: "rgba(0,0,0,0)",
            volSliderColor: "#ddd", timeSliderColor: "#ddd", sliderBufferColor: "#aaa",
            enMediaName: false,
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.style = '\
            .videobox {position:absolute;width:100%;height:100%;\
                background:' + args.style.backColor + ';font-size:' + args.style.basicSize + ';}\
            .videobox video {position:absolute;outline:none;;width:100%;height:100%}\
            .launchBottom {position:absolute;width:100%;height:5em;bottom:0;}\
            .musebar {position:absolute;width:100%;bottom:0;box-sizing:border-box;\
                outline:none;padding:0.8em;background:' + args.style.ctrlBackColor + ';}\
            .progline {display:flex;align-items:center;padding:0 0.6em;}\
            .progline .timeSlider {flex:auto;}\
            .progline .mediaTime {padding-left:1em;font-weight:600;color:' + args.style.themeColor + ';}\
            .ctrlline {display:flex;align-items:center;padding:0 0.8em;}\
            .ctrlline .volSlider {flex-shrink:0;width:4em;}\
            .ctrlline .mediaName {font-weight:600;flex:auto;text-align:center;\
                white-space:nowrap;overflow-y:hidden;overflow-x:auto;color:' + args.style.themeColor + ';}\
            .ctrlline .seperator {margin-left:auto;height:1em;}\
            .ctrlline .speedPop {position:absolute;width:3.6em;border-radius:0.3em;\
                background:' + args.style.backColor + ';\
                transform: translate(-3em, -13.6em);display:none;}\
            .ctrlline .stext {font-weight:600;text-align:center;\
                color: ' + args.style.themeColor + ';padding:0.2em;}\
            .ctrlline .icon {font-size:2em;cursor:pointer;}\
            ';
        args.htmlParts.orderBtnHtml = '<divicon style="height:1em;width:1em;'
            + 'display:flex;align-items:center;justify-content:center;">'
            + '<div class="orderStat" style="font-size:0.6em;font-weight:800;overflow:hidden;'
            + 'color:' + args.style.themeColor + '; ">A</div></divicon>';
        args.htmlParts.playBtnHtml = '<divicon style="background:' + args.style.playBtnColor + ';'
            + 'border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0.1em;height:0.5em;"></div>'
            + '<div style="width:0;height:0;border-left:0.5em solid ' + args.style.themeColor + ';'
            + 'border-top:0.25em solid transparent;border-bottom:0.25em solid transparent;"></div>'
            + '</divicon>';
        args.htmlParts.pauseBtnHtml = '<divicon style="background:' + args.style.playBtnColor + ';'
            + 'border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0.17em;height:0.5em;background:' + args.style.themeColor + ';"></div>'
            + '<div style="width:0.16em;height:0.5em;background:transparent;"></div>'
            + '<div style="width:0.17em;height:0.5em;background:' + args.style.themeColor + ';"></div>'
            + '</divicon>';
        args.htmlParts.prevBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0.1em;height:0.5em;background:' + args.style.themeColor + ';"></div>'
            + '<div style="width:0;height:0;border-right:0.4em solid ' + args.style.themeColor + ';'
            + 'border-top:0.25em solid transparent;border-bottom:0.25em solid transparent;"></div>'
            + '</divicon>';
        args.htmlParts.nextBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0;height:0;border-left:0.4em solid ' + args.style.themeColor + ';'
            + 'border-top:0.25em solid transparent;border-bottom:0.25em solid transparent;"></div>'
            + '<div style="width:0.1em;height:0.5em;background:' + args.style.themeColor + ';"></div>'
            + '</divicon>';
        args.htmlParts.volBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0.16em;height:0.24em;background:' + args.style.themeColor + ';"></div>'
            + '<div style="width:0;height:0.24em;border-right:0.24em solid ' + args.style.themeColor + ';'
            + 'box-sizing:content-box;'
            + 'border-top:0.13em solid transparent;border-bottom:0.13em solid transparent;"></div>'
            + '<div style="width:0.1em;height:0.5em;"></div>'
            + '</divicon>';
        args.htmlParts.fullBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="border:0.05em solid transparent;padding:0.15em;">'
            + '<div style="height:0.2em;width:0.5em;display:flex;'
            + 'justify-content:flex-start;align-items:flex-start;">'
            + '<div style="height:0.2em;width:0.05em;background:' + args.style.themeColor + ';"></div>'
            + '<div style="height:0.05em;width:0.15em;background:' + args.style.themeColor + ';"></div></div>'
            + '<div style="height:0.1em;width:0.5em;"></div>'
            + '<div style="height:0.2em;width:0.5em;display:flex;'
            + 'justify-content:flex-end;align-items:flex-end;">'
            + '<div style="height:0.05em;width:0.15em;background:' + args.style.themeColor + ';"></div>'
            + '<div style="height:0.2em;width:0.05em;background:' + args.style.themeColor + ';"></div></div>'
            + '</div></divicon>';
        args.htmlParts.noFullBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="border:0.05em solid transparent;padding:0.15em;">'
            + '<div style="height:0.2em;width:0.5em;display:flex;'
            + 'justify-content:flex-start;align-items:flex-end;">'
            + '<div style="height:0.05em;width:0.15em;background:' + args.style.themeColor + ';"></div>'
            + '<div style="height:0.2em;width:0.05em;background:' + args.style.themeColor + ';"></div></div>'
            + '<div style="height:0.1em;width:0.5em;"></div>'
            + '<div style="height:0.2em;width:0.5em;display:flex;'
            + 'justify-content:flex-end;align-items:flex-start;">'
            + '<div style="height:0.2em;width:0.05em;background:' + args.style.themeColor + ';"></div>'
            + '<div style="height:0.05em;width:0.15em;background:' + args.style.themeColor + ';"></div></div>'
            + '</div></divicon>';
        args.htmlParts.backwardBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0;height:0;border-right:0.25em solid ' + args.style.themeColor + ';'
            + 'border-top:0.25em solid transparent;border-bottom:0.25em solid transparent;"></div>'
            + '</divicon>';
        args.htmlParts.forwardBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="width:0;height:0;border-left:0.25em solid ' + args.style.themeColor + ';'
            + 'border-top:0.25em solid transparent;border-bottom:0.25em solid transparent;"></div>'
            + '</divicon>';
        args.htmlParts.subtitleBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;'
            + 'flex-direction: column;">'
            + '<div style="width:0.5em;height:0.1em;background:' + args.style.themeColor + '";></div>'
            + '<div style="width:0.5em;height:0.1em;background:transparent";></div>'
            + '<div style="width:0.5em;height:0.1em;background:' + args.style.themeColor + '";></div>'
            + '<div style="width:0.5em;height:0.1em;background:transparent";></div>'
            + '<div style="width:0.5em;height:0.1em;background:' + args.style.themeColor + '";></div>'
            + '</divicon>';
        args.htmlParts.speedBtnHtml = '<divicon style="background:transparent;border-radius:50%;'
            + 'display:flex;align-items:center;justify-content:center;height:1em;width:1em;">'
            + '<div style="color:' + args.style.themeColor + ';font-size:0.5em;">SS</div>'
            + '</divicon>';
        args.htmlParts.main = '\
            <div class="videobox"><video><track src default/></video> \
            <div class="launchBottom"></div>                \
            <div class="musebar"><div class="progline">     \
            <div class="timeSlider"></div>                  \
            <div class="mediaTime">00:00/00:00</div></div>  \
            <div class="ctrlline">                          \
            <div class="icon playBtn">' + args.htmlParts.playBtnHtml + '</div>   \
            <div class="icon volBtn">' + args.htmlParts.volBtnHtml + '</div>     \
            <div class="volSlider"></div>                   \
            <div class="mediaName"></div>                   \
            <div class="icon seperator"></div>              \
            <div class="icon subtitleBtn">' + args.htmlParts.subtitleBtnHtml + '</div>   \
            <div class="icon speedBtn">' + args.htmlParts.speedBtnHtml + '</div>   \
            <div style="position: relative;"><div class="speedPop">\
            <div class="stext">2.0x</div><div class="stext">1.5x</div>\
            <div class="stext">1.25x</div><div class="stext">1.0x</div>\
            <div class="stext">0.75x</div><div class="stext">0.5x</div>\
            </div></div>\
            <div class="icon fullBtn">' + args.htmlParts.fullBtnHtml + '</div>   \
            </div></div></div>\
            ';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let timeoutHandler;
    let isFullScreen = false;
    let currentName = "", currentVolume = 1;
    let cTime = 0;
    let backdrop = args.box.querySelector(".videobox");
    let media = backdrop.querySelector('video');
    let mediaBar = backdrop.querySelector(".musebar");
    let launchBottom = backdrop.querySelector(".launchBottom");
    let playBtn = mediaBar.querySelector(".playBtn");
    let volBtn = mediaBar.querySelector(".volBtn");
    let subtitleBtn = mediaBar.querySelector(".subtitleBtn");
    let speedBtn = mediaBar.querySelector(".speedBtn");
    let speedPop = mediaBar.querySelector(".speedPop");
    let fullBtn = mediaBar.querySelector(".fullBtn");
    let mediaName = mediaBar.querySelector(".mediaName");
    let mediaTime = mediaBar.querySelector(".mediaTime");
    let timeSlider = SliderBar({
        box: mediaBar.querySelector(".timeSlider"),
        sliderColor: args.style.timeSliderColor,
        bufferColor: args.style.sliderBufferColor,
        progressColor: args.style.themeColor,
        changeCallBack: function (rate) {
            if (!isNaN(media.duration))
                playTime(media.duration * rate);
        },
    });
    let volSlider = SliderBar({
        box: mediaBar.querySelector(".volSlider"),
        sliderColor: args.style.volSliderColor,
        bufferColor: args.style.sliderBufferColor,
        progressColor: args.style.themeColor,
        changeCallBack: function (rate) {
            media.volume = rate;
            volSlider.updateCurrent(media.volume);
        },
    });

    // ======================= //
    mediaName.style.display = (args.style.enMediaName) ? "block" : "none";
    launchBottom.onmouseenter = function () { clearCtrlTimeout(); showCtrl(); };
    mediaBar.setAttribute("tabIndex", "1");
    mediaBar.onmouseover = function () { clearCtrlTimeout(); };
    mediaBar.onmouseleave = function () { clearCtrlTimeout(); hideCtrl(); };
    mediaBar.onclick = function (event) { event.cancelBubble = true; };
    mediaBar.ondblclick = function (event) { event.cancelBubble = true; };
    mediaBar.onkeydown = function (event) {
        switch (event.keyCode || event.which) {
            case 32: event.preventDefault(); playPause(); break; // space
            case 37: event.preventDefault(); playForward(-1 * args.params.forwardStep); break; // left Arrow
            case 39: event.preventDefault(); playForward(+1 * args.params.forwardStep); break; // right Arrow
            case 38: event.preventDefault(); playPrev(); break; // up Arrow
            case 40: event.preventDefault(); playNext(); break; // down Arrow
        }
    };
    backdrop.ondblclick = function () { fullBtn.click(); };
    backdrop.onclick = function () { playPause(); showCtrl(); hideCtrl(); };
    media.addEventListener("ended", function () { playStop(); });
    media.addEventListener("canplay", function () { mediaName.innerText = currentName; });
    media.addEventListener("loadstart", function () { mediaName.innerText = "Loading " + currentName; });
    media.addEventListener("timeupdate", function () { updateTime(); });
    playBtn.onclick = function () { playPause(); };
    volBtn.onclick = function () {
        if (media.volume) {
            currentVolume = media.volume;
            media.volume = 0;
        } else {
            media.volume = currentVolume;
        }
        volSlider.updateCurrent(media.volume);
    };
    subtitleBtn.onclick = function () {
        let inp = document.createElement("input");
        inp.type = "file";
        inp.onchange = function () {
            media.querySelector("track").src = URL.createObjectURL(this.files[0]);
        };
        inp.click();
        inp.remove();
    };
    speedBtn.onclick = function () {
        if (speedPop.style.display == "block")
            speedPop.style.display = "none";
        else
            speedPop.style.display = "block";
    };
    let speedItems = speedPop.querySelectorAll(".stext");
    for (let i = 0; i < speedItems.length; i++) {
        speedItems[i].onclick = function () {
            playSpeed(parseFloat(this.innerText));
            speedPop.style.display = "none";
        };
    }
    fullBtn.onclick = function () {
        if (isFullScreen) {
            isFullScreen = false;
            fullBtn.innerHTML = args.htmlParts.fix(args.htmlParts.fullBtnHtml);
            exitFullScreen();
        } else {
            isFullScreen = true;
            fullBtn.innerHTML = args.htmlParts.fix(args.htmlParts.noFullBtnHtml);
            enterFullScreen();
        }
    };

    function playThis(path = "") {
        currentName = path.slice(path.lastIndexOf("/") + 1);
        console.log('play: ', currentName);
        media.src = args.params.pathToUrl(path);
        media.querySelector("track").src = args.params.pathToUrl(path + ".vtt");
        media.play();
        playBtn.innerHTML = args.htmlParts.fix(args.htmlParts.pauseBtnHtml);
        volSlider.updateCurrent(media.volume);
    }
    function playPause() {
        if (media.paused) {
            media.play();
            playBtn.innerHTML = args.htmlParts.fix(args.htmlParts.pauseBtnHtml);
            volSlider.updateCurrent(media.volume);
        } else {
            media.pause();
            playBtn.innerHTML = args.htmlParts.fix(args.htmlParts.playBtnHtml);
            volSlider.updateCurrent(media.volume);
        }
    }
    function playStop() {
        try {
            if (isFullScreen)
                exitFullScreen();
            isFullScreen = false;
            media.pause();
            media.currentTime = 0;
            timeSlider.updateBuffer(0);
            timeSlider.updateCurrent(0);
            playBtn.innerHTML = args.htmlParts.fix(args.htmlParts.playBtnHtml);
            fullBtn.innerHTML = args.htmlParts.fix(args.htmlParts.fullBtnHtml);
            args.params.stopCallBack();
        } catch (err) { console.log(err); }
    }
    function playTime(time) {
        if (time >= media.duration)
            playStop();
        else {
            media.currentTime = time;
            media.play();
            playBtn.innerHTML = args.htmlParts.fix(args.htmlParts.pauseBtnHtml);
            timeSlider.updateCurrent(media.currentTime / media.duration);
            mediaTime.innerText = formatTime(media.currentTime) + ' / ' + formatTime(media.duration);
        }
    }
    function playForward(step) {
        if (isNaN(media.duration))
            return;
        playTime(media.currentTime + step);
    }
    function playSpeed(speed) {
        media.playbackRate = speed;
    }
    function enterFullScreen() {
        let de = args.box;
        let fn = function () { };
        // promise functions as requestFullscreen
        if (de.requestFullscreen)
            de.requestFullscreen().then(fn);
        else if (de.mozRequestFullScreen)
            de.mozRequestFullScreen().then(fn);
        else if (de.webkitRequestFullScreen)
            de.webkitRequestFullScreen().then(fn);
        else if (de.msRequestFullscreen)
            de.msRequestFullscreen().then(fn);
        if (args.params.autoRotate)
            screen.orientation.lock('landscape-primary').catch(function (err) { });
    }
    function exitFullScreen() {
        let de = document;
        let fn = function () { };
        if (de.exitFullscreen)
            de.exitFullscreen().then(fn);
        else if (de.mozCancelFullScreen)
            de.mozCancelFullScreen().then(fn);
        else if (de.webkitCancelFullScreen)
            de.webkitCancelFullScreen().then(fn);
        else if (de.msExitFullscreen)
            de.msExitFullscreen().then(fn);
        if (args.params.autoRotate)
            screen.orientation.lock('any').catch(function (err) { });
    }
    function formatTime(time) {
        if (isNaN(time))
            time = 0;
        let minute = String(Math.floor(time / 60));
        let second = String(Math.floor(time % 60));
        if (minute < 10)
            minute = "0" + minute;
        if (second < 10)
            second = "0" + second;
        return minute + ':' + second;
    }
    function updateTime() {
        // console.time("upTime");
        function updateTimeCore() {
            if (isNaN(media.duration))
                return;
            let timeBuffered = 0;
            let timeText = "00:00 / 00:00";
            try {
                timeBuffered = media.buffered.end(media.buffered.length - 1);
                timeText = formatTime(media.currentTime) + ' / ' + formatTime(media.duration);
            } catch (err) { }
            mediaTime.innerText = timeText;
            timeSlider.updateBuffer(timeBuffered / media.duration);
            timeSlider.updateCurrent(media.currentTime / media.duration);
        }
        let tTime = new Date().getTime();
        if (tTime - cTime > 800) {
            cTime = tTime;
            updateTimeCore();
        }
        // console.timeEnd("upTime");
    }
    function showCtrl() {
        mediaBar.style.display = "";
    }
    function hideCtrl() {
        timeoutHandler = setTimeout(function () { mediaBar.style.display = "none"; }, args.params.infoTime);
    }
    function clearCtrlTimeout() {
        try { clearTimeout(timeoutHandler); }
        catch (err) { }
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        playThis: playThis,
        playPause: playPause,
        playStop: playStop,
    }
}

