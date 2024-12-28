"use strict"
function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
}

function SliderBar(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
        params: {
            changeCallBack: (progress) => { },
        },
        style: {
            basicSize: "2px", pointSize: 5, sliderColor: "#ddd", bufferColor: "#aaa", progressColor: "#2d3",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let container = shadow_module.shadowRoot.querySelector('.contain');
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
        box: opts.box,
        html: opts.html,
        sliderbar_html: opts.sliderbar_html,
        params: {
            forwardStep: 5, stopCallBack: () => { }, pathToUrl: (path) => { },
            validSuffix: [".mp3", ".ogg", ".wav", ".acc", ".webm"]
        },
        styles: {
            basicSize: "14px", backColor: "#cdd", themeColor: "#fff",
            playBtnColor: "#aeb", ctrlBackColor: "rgba(0,0,0,0)", listColor: "#222",
            volSliderColor: "#ddd", timeSliderColor: "#ddd", sliderBufferColor: "#aaa",
            listItemColor: "rgba(255,255,255,0.2)", listItemHover: "rgba(196,196,196,0.75)",
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let oriPlayList = [], playList = []; // playList [/x/x/x, /x/x/x, ...]
    let playPos = 0, playOrder = "Ascend", currentPath = "", currentName = "", currentVolume = 1;
    let cTime = 0;
    let backdrop = shadow_module.shadowRoot.querySelector(".audiobox");
    let media = backdrop.querySelector('audio');
    let mediaBar = backdrop.querySelector(".musebar");
    let orderBtn = mediaBar.querySelector(".orderBtn");
    let prevBtn = mediaBar.querySelector(".prevBtn");
    let playBtn = mediaBar.querySelector(".playBtn");
    let nextBtn = mediaBar.querySelector(".nextBtn");
    let volBtn = mediaBar.querySelector(".volBtn");
    let mediaName = mediaBar.querySelector(".mediaName");
    let mediaTime = mediaBar.querySelector(".mediaTime");
    let mediaList = shadow_module.shadowRoot.querySelector('.mediaList');
    let timeSlider = SliderBar({
        box: mediaBar.querySelector(".timeSlider"),
        html: args.sliderbar_html,
        sliderColor: args.styles.timeSliderColor,
        bufferColor: args.styles.sliderBufferColor,
        progressColor: args.styles.themeColor,
        changeCallBack: function (rate) {
            if (!isNaN(media.duration))
                playTime(media.duration * rate);
        },
    });
    let volSlider = SliderBar({
        box: mediaBar.querySelector(".volSlider"),
        html: args.sliderbar_html,
        sliderColor: args.styles.volSliderColor,
        bufferColor: args.styles.sliderBufferColor,
        progressColor: args.styles.themeColor,
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

    function set_play_button(play=true){
        if (play) {
            playBtn.querySelector(".playBtn_icon").style.display = "flex";
            playBtn.querySelector(".pauseBtn_icon").style.display = "none";
        } else {
            playBtn.querySelector(".playBtn_icon").style.display = "none";
            playBtn.querySelector(".pauseBtn_icon").style.display = "flex";
        }
    }

    function playThis(path = "") {
        let tmpPos = playList.indexOf(path);
        if (tmpPos != -1)
            playPos = tmpPos;
        currentPath = path;
        currentName = path.slice(path.lastIndexOf("/") + 1);
        console.log('play: ', currentName);
        media.src = args.params.pathToUrl(path);
        media.play();
        set_play_button(false);
        volSlider.updateCurrent(media.volume);
    }
    function playPause() {
        if (media.src == "") {
            playPos = Math.floor(Math.random() * (playList.length - 1));
            playThis(playList[playPos]);
        } else if (media.paused) {
            media.play();
            set_play_button(false);
            volSlider.updateCurrent(media.volume);
        } else {
            media.pause();
            set_play_button(true);
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
            set_play_button(true);
            args.params.stopCallBack();
        } catch (err) { console.log(err); }
    }
    function playTime(time) {
        if (time >= media.duration)
            playEnd();
        else {
            media.currentTime = time;
            media.play();
            set_play_button(false);
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
        mediaList.innerHTML = htmlItem.join('\n');
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
        box: opts.box,
        html: opts.html,
        sliderbar_html: opts.sliderbar_html,
        params: {
            enMediaName: false,
            forwardStep: 5, infoTime: 5000, autoRotate: true,
            stopCallBack: () => { }, pathToUrl: (path) => "",
        },
        styles: {
            basicSize: "14px", backColor: "#000", themeColor: "#fff",
            playBtnColor: "#aeb", ctrlBackColor: "rgba(0,0,0,0)",
            volSliderColor: "#ddd", timeSliderColor: "#ddd", sliderBufferColor: "#aaa",
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let timeoutHandler;
    let isFullScreen = false;
    let currentName = "", currentVolume = 1;
    let cTime = 0;
    let backdrop = shadow_module.shadowRoot.querySelector(".videobox");
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
        html: args.sliderbar_html,
        sliderColor: args.styles.timeSliderColor,
        bufferColor: args.styles.sliderBufferColor,
        progressColor: args.styles.themeColor,
        changeCallBack: function (rate) {
            if (!isNaN(media.duration))
                playTime(media.duration * rate);
        },
    });
    let volSlider = SliderBar({
        box: mediaBar.querySelector(".volSlider"),
        html: args.sliderbar_html,
        sliderColor: args.styles.volSliderColor,
        bufferColor: args.styles.sliderBufferColor,
        progressColor: args.styles.themeColor,
        changeCallBack: function (rate) {
            media.volume = rate;
            volSlider.updateCurrent(media.volume);
        },
    });

    // ======================= //
    mediaName.style.display = (args.styles.enMediaName) ? "block" : "none";
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

    function set_play_button(play=true){
        if (play) {
            playBtn.querySelector(".playBtn_icon").style.display = "flex";
            playBtn.querySelector(".pauseBtn_icon").style.display = "none";
        } else {
            playBtn.querySelector(".playBtn_icon").style.display = "none";
            playBtn.querySelector(".pauseBtn_icon").style.display = "flex";
        }
    }
    
    function set_full_button(full=true){
        if (full) {
            fullBtn.querySelector(".fullBtn_icon").style.display = "block";
            fullBtn.querySelector(".noFullBtn_icon").style.display = "none";
        } else {
            fullBtn.querySelector(".fullBtn_icon").style.display = "none";
            fullBtn.querySelector(".noFullBtn_icon").style.display = "block";
        }
    }

    fullBtn.onclick = function () {
        if (isFullScreen) {
            isFullScreen = false;
            set_full_button(true);
            exitFullScreen();
        } else {
            isFullScreen = true;
            set_full_button(false);
            enterFullScreen();
        }
    };



    function playThis(path = "") {
        currentName = path.slice(path.lastIndexOf("/") + 1);
        console.log('play: ', currentName);
        media.src = args.params.pathToUrl(path);
        media.querySelector("track").src = args.params.pathToUrl(path + ".vtt");
        media.play();
        set_play_button(false);
        volSlider.updateCurrent(media.volume);
    }
    function playPause() {
        if (media.paused) {
            media.play();
            set_play_button(false);;
            volSlider.updateCurrent(media.volume);
        } else {
            media.pause();
            set_play_button(true);
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
            set_play_button(true);
            set_full_button(true);
            args.params.stopCallBack();
        } catch (err) { console.log(err); }
    }
    function playTime(time) {
        if (time >= media.duration)
            playStop();
        else {
            media.currentTime = time;
            media.play();
            set_play_button(false);
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
        let de = shadow_module;
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

