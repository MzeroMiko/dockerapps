"use strict"

function PopupMenu(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {
            defTimeOut: 2000, nameHolder: "user name", passHolder: "password",
        },
        style: {
            basicSize: "14px", fontColor: "#fff", zIndex: 8,
            passColor: "#6d8", infoColor: "#6cd", warnColor: "#fc5", failColor: "#e66",
            confirmColor: "#a9e", inputColor: "#abb", authColor: "#8b9",
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.style = '\
        .popBox {position:fixed;top:5%;left:50%;transform:translate(-50%,0);max-height:90%;width:unset;\
            overflow-y:auto;font-size:' + args.style.basicSize + ';z-index:' + args.style.zIndex + ';}\
        .card {display:flex;align-items:center;justify-content:space-between;\
            width:24em;overflow:hidden;padding:0.3em;border-radius:0.3em;margin:1em;}\
        .info {position:relative;height:3em;width:3em;cursor:pointer;\
            flex-shrink:0;border-radius:50%;border:0.2em solid ' + args.style.fontColor + ';}\
        .infoText{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);\
            font-size:2em;font-weight:900;color:' + args.style.fontColor + ';}\
        .close {width:2em;height:100%;padding:0.5em;cursor:pointer;\
            flex-shrink:0;border-left:0.2em solid ' + args.style.fontColor + ';}\
        .closeText {font-size:2em;font-weight:900;color:' + args.style.fontColor + ';}\
        .content{overflow:hidden;padding:0.2em;font-size:1.1em;font-weight:600;}\
        .message {max-height:16em;padding:0.2em;overflow:auto;color:' + args.style.fontColor + ';}\
        .item {padding:0.2em;color:' + args.style.fontColor + ';}\
        .input{outline:none;background:transparent;width:80%;\
            font-size:1em;font-weight:600;padding:0.2em;border-width:0 0 0.2em 0;\
            color:' + args.style.fontColor + ';border-bottom:inset ' + args.style.fontColor + ';}\
        ';
        args.htmlParts.messageHtml = '<div class="message" style=""></div><input class="input" type="text"/>';
        args.htmlParts.authHtml = '<form><div style="display:flex;"><div class="item">N</div>\
        <input class="name input" type="text" autocomplete="off"/></div>\
        <div style="display:flex;"><div class="item">P</div>\
        <input class="pass input" type="password" autocomplete="off"/></div></form>';
        args.htmlParts.popBody = '<div class="card"><div class="info"><div class="infoText"></div></div>\
        <div class="content"></div><div class="close"><div class="closeText">Q</div></div></div>';
        args.htmlParts.main = '<div class="popBox"></div>';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let container = args.box.querySelector(".popBox");

    function appendBody(infoText = "", cardColor = "", timeOut) {
        // timeOut = 0: do not diaspear
        let newBody = document.createElement("div");
        newBody.innerHTML = args.htmlParts.fix(args.htmlParts.popBody);
        container.appendChild(newBody);
        newBody.querySelector(".card").style.backgroundColor = cardColor;
        newBody.querySelector(".infoText").innerText = infoText;
        newBody.querySelector(".close").onclick = function () { container.removeChild(newBody); };
        if (typeof timeOut == "undefined")
            timeOut = args.params.defTimeOut;
        if (timeOut)
            setTimeout(function () { try { container.removeChild(newBody); } catch (err) { } }, timeOut);
        return newBody;
    }
    function clearAll() {
        while (container.lastChild) { container.removeChild(container.lastChild); }
    }
    function appendMessage(sign = "info", message = "", defInput = "", confirmCallBack = (extraInput) => { }, timeOut) {
        // append new Body
        let newMessage = null;
        let colors = {
            pass: args.style.passColor, fail: args.style.failColor, warn: args.style.warnColor,
            info: args.style.infoColor, confirm: args.style.confirmColor, input: args.style.inputColor,
        }
        if (typeof timeOut == "undefined") {
            timeOut = (sign == "input" || sign == "confirm") ? 0 : args.params.defTimeOut;
        }
        switch (sign.trim()) {
            case "input": newMessage = appendBody("#", colors.input, timeOut); break;
            case "confirm": newMessage = appendBody("C", colors.confirm, timeOut); break;
            case "success": case "pass": newMessage = appendBody("S", colors.pass, timeOut); break;
            case "warning": case "warn": newMessage = appendBody("!", colors.warn, timeOut); break;
            case "error": case "fail": newMessage = appendBody("X", colors.fail, timeOut); break;
            case "info": default: newMessage = appendBody("i", colors.info, timeOut); break;
        }
        // set content
        let content = newMessage.querySelector(".content");
        content.innerHTML = args.htmlParts.fix(args.htmlParts.messageHtml);
        content.querySelector(".message").innerText = message;
        let input = content.querySelector("input");
        input.value = defInput;
        input.style.display = (sign == "input") ? "block" : "none";
        input.onkeypress = function (event) {
            if (event.keyCode == 13 || event.which == 13) {
                container.removeChild(newMessage);
                confirmCallBack(input.value);
            }
        };
        newMessage.querySelector(".info").onclick = function () {
            confirmCallBack(input.value);
            container.removeChild(newMessage);
        };

    }
    function appendAuth(confirmCallBack = (name, password) => { }) {
        // append Body
        let newAuth = appendBody("A", args.style.authColor, 0);
        let content = newAuth.querySelector(".content");
        content.innerHTML = args.htmlParts.fix(args.htmlParts.authHtml);
        let nameInput = content.querySelector("input.name");
        let passInput = content.querySelector("input.pass");
        nameInput.placeholder = args.params.nameHolder;
        passInput.placeholder = args.params.passHolder;
        // actions 
        passInput.onkeypress = function (event) {
            if (event.keyCode == "13") {
                container.removeChild(newAuth);
                confirmCallBack(nameInput.value, passInput.value);
            }
        };
        newAuth.querySelector(".info").onclick = function () {
            container.removeChild(newAuth);
            confirmCallBack(nameInput.value, passInput.value);
        };
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        clearAll: clearAll,
        appendMessage: appendMessage,
        appendAuth: appendAuth,
    }
}

function InnerViewer(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {

        },
        style: {
            basicSize: "12px", zIndex: 7, innerBoxWidth: "90%", innerBoxHeight: "90%",
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.minIcon = "data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhcyIgZGF0YS1pY29uPSJ3aW5kb3ctbWluaW1pemUiIGNsYXNzPSJzdmctaW5saW5lLS1mYSBmYS13aW5kb3ctbWluaW1pemUgZmEtdy0xNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNNDY0IDM1Mkg0OGMtMjYuNSAwLTQ4IDIxLjUtNDggNDh2MzJjMCAyNi41IDIxLjUgNDggNDggNDhoNDE2YzI2LjUgMCA0OC0yMS41IDQ4LTQ4di0zMmMwLTI2LjUtMjEuNS00OC00OC00OHoiLz48L3N2Zz4=";
        args.htmlParts.maxIcon = "data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhcyIgZGF0YS1pY29uPSJleHBhbmQiIGNsYXNzPSJzdmctaW5saW5lLS1mYSBmYS1leHBhbmQgZmEtdy0xNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDQ4IDUxMiI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMCAxODBWNTZjMC0xMy4zIDEwLjctMjQgMjQtMjRoMTI0YzYuNiAwIDEyIDUuNCAxMiAxMnY0MGMwIDYuNi01LjQgMTItMTIgMTJINjR2ODRjMCA2LjYtNS40IDEyLTEyIDEySDEyYy02LjYgMC0xMi01LjQtMTItMTJ6TTI4OCA0NHY0MGMwIDYuNiA1LjQgMTIgMTIgMTJoODR2ODRjMCA2LjYgNS40IDEyIDEyIDEyaDQwYzYuNiAwIDEyLTUuNCAxMi0xMlY1NmMwLTEzLjMtMTAuNy0yNC0yNC0yNEgzMDBjLTYuNiAwLTEyIDUuNC0xMiAxMnptMTQ4IDI3NmgtNDBjLTYuNiAwLTEyIDUuNC0xMiAxMnY4NGgtODRjLTYuNiAwLTEyIDUuNC0xMiAxMnY0MGMwIDYuNiA1LjQgMTIgMTIgMTJoMTI0YzEzLjMgMCAyNC0xMC43IDI0LTI0VjMzMmMwLTYuNi01LjQtMTItMTItMTJ6TTE2MCA0Njh2LTQwYzAtNi42LTUuNC0xMi0xMi0xMkg2NHYtODRjMC02LjYtNS40LTEyLTEyLTEySDEyYy02LjYgMC0xMiA1LjQtMTIgMTJ2MTI0YzAgMTMuMyAxMC43IDI0IDI0IDI0aDEyNGM2LjYgMCAxMi01LjQgMTItMTJ6Ii8+PC9zdmc+";
        args.htmlParts.exitIcon = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTcgMTciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgY2xhc3M9InNpLWdseXBoIHNpLWdseXBoLWRlbGV0ZSI+PHBhdGggZD0iTTEyLjU2NiA4bDMuMDQ1LTMuMDQ0Yy40Mi0uNDIxLjQyLTEuMTAzIDAtMS41MjJMMTIuNTY2LjM4OWExLjA3OCAxLjA3OCAwIDAgMC0xLjUyMyAwTDcuOTk5IDMuNDMzIDQuOTU1LjM4OWExLjA3OCAxLjA3OCAwIDAgMC0xLjUyMyAwTC4zODggMy40MzRhMS4wNzQgMS4wNzQgMCAwIDAtLjAwMSAxLjUyMkwzLjQzMSA4IC4zODcgMTEuMDQ0YTEuMDc1IDEuMDc1IDAgMCAwIC4wMDEgMS41MjNsMy4wNDQgMy4wNDRjLjQyLjQyMSAxLjEwMi40MjEgMS41MjMgMGwzLjA0NC0zLjA0NCAzLjA0NCAzLjA0NGExLjA3NiAxLjA3NiAwIDAgMCAxLjUyMyAwbDMuMDQ1LTMuMDQ0Yy40Mi0uNDIxLjQyLTEuMTAzIDAtMS41MjNMMTIuNTY2IDh6IiBmaWxsPSIjNDM0MzQzIiBjbGFzcz0ic2ktZ2x5cGgtZmlsbCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+";
        args.htmlParts.downIcon = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTYgMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgY2xhc3M9InNpLWdseXBoIHNpLWdseXBoLWVuZC1wYWdlIj48ZyBmaWxsPSIjNDM0MzQzIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik04LjMyNyAxMS44ODZsNC40NDctNC45NGEuNjUuNjUgMCAwIDAtLjAwMi0uODQ5bC0yLjg0MS0uMDA1VjEuMDY4YzAtLjU1My0uNDM3LTEtLjk3Ni0xSDcuMDA0YS45ODcuOTg3IDAgMCAwLS45NzYgMXY1LjAybC0yLjk1LS4wMDVhLjY1Mi42NTIgMCAwIDAgLjAwNC44NDhsNC40ODUgNC45NTRhLjUwMS41MDEgMCAwIDAgLjc2LjAwMXpNMTMuOTE4IDE0LjgzNGMwIC41NTItLjQzNyAxLS45NzMgMUgzLjA1NmMtLjUzNyAwLS45NzMtLjQ0OC0uOTczLTFWMTRjMC0uNTUyLjQzNi0xIC45NzMtMWg5Ljg4OWMuNTM2IDAgLjk3My40NDguOTczIDF2LjgzNHoiIGNsYXNzPSJzaS1nbHlwaC1maWxsIi8+PC9nPjwvc3ZnPg==";
        args.htmlParts.prevIcon = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTcgMTciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgY2xhc3M9InNpLWdseXBoIHNpLWdseXBoLXRyaWFuZ2xlLWxlZnQiPjxwYXRoIGQ9Ik0zLjQ0NiAxMC4wNTJhMS40OSAxLjQ5IDAgMCAxIDAtMi4xMDRMOS44OSAxLjUwNmMuNTgxLS41ODIgMi4xMDMtLjgzOSAyLjEwMyAxdjEyLjk4OGMwIDEuOTAxLTEuNTIxIDEuNTgyLTIuMTAzIDEuMDAxbC02LjQ0NC02LjQ0M3oiIGZpbGw9IiM0MzQzNDMiIGNsYXNzPSJzaS1nbHlwaC1maWxsIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=";
        args.htmlParts.nextIcon = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTcgMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgY2xhc3M9InNpLWdseXBoIHNpLWdseXBoLXRyaWFuZ2xlLXJpZ2h0Ij48cGF0aCBkPSJNNi4xMTMgMTUuNDk1Yy0uNTgyLjU4MS0yLjEwMy45LTIuMTAzLTEuMDAxVjEuNTA2YzAtMS44MzkgMS41MjEtMS41ODIgMi4xMDMtMWw2LjQ0NCA2LjQ0MmExLjQ5IDEuNDkgMCAwIDEgMCAyLjEwNGwtNi40NDQgNi40NDN6IiBmaWxsPSIjNDM0MzQzIiBjbGFzcz0ic2ktZ2x5cGgtZmlsbCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+";
        args.htmlParts.style = '\
        .innerBox {position:fixed;overflow:hidden;top:50%;left:50%;transform:translate(-50%,-50%);\
            display:none;background:transparent;font-size:' + args.style.basicSize + ';\
            width:' + args.style.innerBoxWidth + ';height:' + args.style.innerBoxHeight + ';\
            z-index:' + args.style.zIndex + ';cursor:move;padding:1em;}\
        .icontain {position:relative;overflow:hidden;width:100%;height:100%;background:#fff;\
                border-radius:0.5em;box-shadow:0 0 0.5em 0 #888;cursor:default;}\
        .header {position:absolute;top:0;right:0;left:0;}    \
        .header .ctrlBar {float:right;display:flex;}    \
        .header .ctrlBtn img {width:100%;height:100%;}\
        .header .ctrlBtn {padding:0.9em;cursor:pointer;border-radius:0.5em;width:1em;height:1em;flex-shrink:0;}    \
        .header .prevBtn:hover {background:#ccc;} .header .nextBtn:hover {background:#ccc;}    \
        .header .minBtn:hover {background:#fe7;} .header .maxBtn:hover {background:#8f7;}    \
        .header .downBtn:hover {background:#8cf;} .header .exitBtn:hover {background:#f87;}    \
        .header .title {padding:0.6em;cursor:move;overflow:hidden;white-space:nowrap;font-weight:600;color:#000;}\
        .content {position:absolute;top:3em;right:0;bottom:0;left:0;overflow:hidden;}\
        .resizeTop {position:absolute;height:0.5em;width:100%;top:0.5em;left:0.5em;cursor:n-resize;}\
        .resizeBottom {position:absolute;height:0.5em;width:100%;bottom:0.5em;left:0.5em;cursor:s-resize;}\
        .resizeLeft {position:absolute;height:100%;width:0.5em;top:0.5em;left:0.5em;cursor:w-resize;}\
        .resizeRight {position:absolute;height:100%;width:0.5em;top:0.5em;right:0.5em;cursor:e-resize;}\
        .resizeTopLeft {position:absolute;height:0.5em;width:0.5em;top:0.5em;left:0.5em;cursor:nw-resize;}\
        .resizeTopRight {position:absolute;height:0.5em;width:0.5em;top:0.5em;right:0.5em;cursor:ne-resize;}\
        .resizeBottomLeft {position:absolute;height:0.5em;width:0.5em;bottom:0.5em;left:0.5em;cursor:sw-resize;}\
        .resizeBottomRight {position:absolute;height:0.5em;width:0.5em;bottom:0.5em;right:0.5em;cursor:se-resize;}\
        ';
        args.htmlParts.main = '\
        <div class="innerBox"><div class="icontain">\
        <div class="header"><div class="ctrlBar">\
        <div class="ctrlBtn prevBtn"><img src="' + args.htmlParts.prevIcon + '"/></div>\
        <div class="ctrlBtn nextBtn"><img src="' + args.htmlParts.nextIcon + '"/></div>\
        <div class="ctrlBtn downBtn"><img src="' + args.htmlParts.downIcon + '"/></div>\
        <div class="ctrlBtn minBtn"><img src="' + args.htmlParts.minIcon + '"/></div>\
        <div class="ctrlBtn maxBtn"><img src="' + args.htmlParts.maxIcon + '"/></div>\
        <div class="ctrlBtn exitBtn"><img src="' + args.htmlParts.exitIcon + '"/></div>\
        </div><div class="title"></div></div><div class="content"></div></div>\
        <div class="resizeTop"></div><div class="resizeBottom"></div>\
        <div class="resizeLeft"></div><div class="resizeRight"></div>\
        <div class="resizeTopLeft"></div><div class="resizeTopRight"></div>\
        <div class="resizeBottomLeft"></div><div class="resizeBottomRight"></div>\
        </div>';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let container = args.box.querySelector(".innerBox");
    let icontain = args.box.querySelector(".icontain");
    let content = container.querySelector(".content");
    let header = container.querySelector(".header");
    let titleBar = header.querySelector(".title");
    let prevBtn = header.querySelector(".prevBtn");
    let nextBtn = header.querySelector(".nextBtn");
    let downBtn = header.querySelector(".downBtn");
    let minBtn = header.querySelector(".minBtn");
    let maxBtn = header.querySelector(".maxBtn");
    let exitBtn = header.querySelector(".exitBtn");
    let resizeTop = container.querySelector(".resizeTop");
    let resizeBottom = container.querySelector(".resizeBottom");
    let resizeLeft = container.querySelector(".resizeLeft");
    let resizeRight = container.querySelector(".resizeRight");
    let resizeTopLeft = container.querySelector(".resizeTopLeft");
    let resizeTopRight = container.querySelector(".resizeTopRight");
    let resizeBottomLeft = container.querySelector(".resizeBottomLeft");
    let resizeBottomRight = container.querySelector(".resizeBottomRight");
    let changeWindow = false;
    let oriStatus = {};

    // if icontain preventDefault, all click inside icontain would not work;
    // ontorchstart > ontorchmove > ontorchend > click
    maxBtn.onclick = function () { change("max"); };
    minBtn.onclick = function () { change("min"); };
    container.onmousedown = function (evt) { resize(evt, "move"); };
    icontain.onmousedown = function (evt) { evt.cancelBubble = true; };
    titleBar.onmousedown = function (evt) { resize(evt, "move"); };
    resizeTop.onmousedown = function (evt) { resize(evt, "top"); };
    resizeBottom.onmousedown = function (evt) { resize(evt, "bottom"); };
    resizeLeft.onmousedown = function (evt) { resize(evt, "left"); };
    resizeRight.onmousedown = function (evt) { resize(evt, "right"); };
    resizeTopLeft.onmousedown = function (evt) { resize(evt, "topleft"); };
    resizeTopRight.onmousedown = function (evt) { resize(evt, "topright"); };
    resizeBottomLeft.onmousedown = function (evt) { resize(evt, "bottomleft"); };
    resizeBottomRight.onmousedown = function (evt) { resize(evt, "bottomright"); };
    titleBar.ontouchstart = titleBar.onmousedown;
    resizeTop.ontouchstart = resizeTop.onmousedown;
    resizeBottom.ontouchstart = resizeBottom.onmousedown;
    resizeLeft.ontouchstart = resizeLeft.onmousedown;
    resizeRight.ontouchstart = resizeRight.onmousedown;
    resizeTopLeft.ontouchstart = resizeTopLeft.onmousedown;
    resizeTopRight.ontouchstart = resizeTopRight.onmousedown;
    resizeBottomLeft.ontouchstart = resizeBottomLeft.onmousedown;
    resizeBottomRight.ontouchstart = resizeBottomRight.onmousedown;
    minBtn.ontouchend = function (evt) { evt.preventDefault(); this.click(); };
    maxBtn.ontouchend = function (evt) { evt.preventDefault(); this.click(); };
    exitBtn.ontouchend = function (evt) { evt.preventDefault(); this.click(); };
    downBtn.ontouchend = function (evt) { evt.preventDefault(); this.click(); };
    prevBtn.ontouchend = function (evt) { evt.preventDefault(); this.click(); };
    nextBtn.ontouchend = function (evt) { evt.preventDefault(); this.click(); };

    function change(tag = "max") {
        if (changeWindow) {
            oriStatus.changeTop = container.style.top;
            oriStatus.changeLeft = container.style.left;
            container.style.top = oriStatus.top;
            container.style.left = oriStatus.left;
            container.style.width = oriStatus.width;
            container.style.height = oriStatus.height;
            exitBtn.style.display = oriStatus.exitBtnDisplay;
            maxBtn.style.display = oriStatus.maxBtnDisplay;
            minBtn.style.display = oriStatus.minBtnDisplay;
            downBtn.style.display = oriStatus.downBtnDisplay;
            prevBtn.style.display = oriStatus.prevBtnDisplay;
            nextBtn.style.display = oriStatus.nextBtnDisplay;
            changeWindow = false;
        } else {
            oriStatus.top = container.style.top;
            oriStatus.left = container.style.left;
            oriStatus.width = container.style.width;
            oriStatus.height = container.style.height;
            oriStatus.exitBtnDisplay = exitBtn.style.display;
            oriStatus.maxBtnDisplay = maxBtn.style.display;
            oriStatus.minBtnDisplay = minBtn.style.display;
            oriStatus.downBtnDisplay = downBtn.style.display;
            oriStatus.prevBtnDisplay = prevBtn.style.display;
            oriStatus.nextBtnDisplay = nextBtn.style.display;
            changeWindow = true;
            if (tag == "min") {
                exitBtn.style.display = "none";
                minBtn.style.display = "none";
                maxBtn.style.display = "block";
                downBtn.style.display = "none";
                prevBtn.style.display = "none";
                nextBtn.style.display = "none";
                container.style.width = "5.2em";
                container.style.height = "2.6em";
                container.style.top = (typeof oriStatus.changeTop == "undefined") ? "95%" : oriStatus.changeTop;
                container.style.left = (typeof oriStatus.changeLeft == "undefined") ? "4em" : oriStatus.changeLeft;
            } else {
                container.style.width = "100%";
                container.style.height = "100%";
                container.style.top = "50%";
                container.style.left = "50%";
            }
        }
    }
    function resize(evt, tag = "topleft") {
        tag = tag.toLowerCase();
        evt.stopPropagation();
        evt.cancelBubble = true;
        evt.returnValue = false;
        let containerRect = container.getBoundingClientRect();
        let paddingHeight = parseFloat(getStyle(container, "paddingTop")) + parseFloat(getStyle(container, "paddingBottom"));
        let paddingWidth = parseFloat(getStyle(container, "paddingLeft")) + parseFloat(getStyle(container, "paddingRight"));
        let borderHeight = parseFloat(getStyle(container, "borderTop")) + parseFloat(getStyle(container, "borderBottom"));
        let borderWidth = parseFloat(getStyle(container, "borderLeft")) + parseFloat(getStyle(container, "borderRight"));
        let exHeight = paddingHeight + borderHeight;
        let exWidth = paddingWidth + borderWidth;
        let start = { x: evt.clientX, y: evt.clientY };
        if (typeof start.x == "undefined") {
            start = { x: evt.changedTouches[0].clientX, y: evt.changedTouches[0].clientY };
        }
        function getStyle(dom, attr) {
            return dom.currentStyle ? dom.currentStyle[attr] : getComputedStyle(dom, false)[attr];
        }
        function act(delta) {
            let actualTop = containerRect.top;
            let actualLeft = containerRect.left;
            let actualHeight = containerRect.height;
            let actualWidth = containerRect.width;
            if (tag.indexOf("move") != -1) {
                actualTop += delta.y;
                actualLeft += delta.x;
            }
            if (tag.indexOf("top") != -1) {
                actualTop += delta.y;
                actualHeight -= delta.y;
            }
            if (tag.indexOf("bottom") != -1) {
                actualHeight += delta.y;
            }
            if (tag.indexOf("left") != -1) {
                actualLeft += delta.x;
                actualWidth -= delta.x;
            }
            if (tag.indexOf("right") != -1) {
                actualWidth += delta.x;
            }
            actualHeight = (actualHeight > window.innerHeight) ? window.innerHeight : actualHeight;
            actualWidth = (actualWidth > window.innerWidth) ? window.innerWidth : actualWidth;
            actualTop = (actualTop < 0) ? 0 : ((actualTop + 40 > window.innerHeight) ? window.innerHeight - 40 : actualTop);
            actualLeft = (actualLeft < 0) ? 0 : ((actualLeft + 40 > window.innerWidth) ? window.innerWidth - 40 : actualLeft);
            container.style.top = actualTop + actualHeight / 2 + 'px';
            container.style.left = actualLeft + actualWidth / 2 + 'px';
            container.style.height = actualHeight - exHeight + 'px';
            container.style.width = actualWidth - exWidth + 'px';
        }
        document.onmouseup = function (event) {
            document.onmousemove = null; document.onmouseup = null;
            // let client = {x: event.clientX, y: event.clientY};
            // act({x: client.x - start.x, y:client.y - start.y});
        };
        document.ontouchend = function (event) {
            document.ontouchmove = null; document.ontouchend = null;
            // let client = {x:event.changedTouches[0].clientX, y:event.changedTouches[0].clientY};
            // act({x: client.x - start.x, y:client.y- start.y});
        };
        document.onmousemove = function (event) {
            let client = { x: event.clientX, y: event.clientY };
            act({ x: client.x - start.x, y: client.y - start.y });
        };
        document.ontouchmove = function (event) {
            let client = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
            act({ x: client.x - start.x, y: client.y - start.y });
        };
    }
    function draw(node = null, title = "", btnShow = ["prev", "next", "down", "min", "max", "exit"]) {
        titleBar.innerText = title;
        prevBtn.style.display = (btnShow.indexOf("prev") != -1) ? "block" : "none";
        nextBtn.style.display = (btnShow.indexOf("next") != -1) ? "block" : "none";
        downBtn.style.display = (btnShow.indexOf("down") != -1) ? "block" : "none";
        minBtn.style.display = (btnShow.indexOf("min") != -1) ? "block" : "none";
        maxBtn.style.display = (btnShow.indexOf("max") != -1) ? "block" : "none";
        exitBtn.style.display = (btnShow.indexOf("exit") != -1) ? "block" : "none";
        while (content.lastChild) { content.removeChild(content.lastChild); }
        content.appendChild(node);
        container.style.display = "block";
        return {
            container: icontain, titleBar: titleBar,
            exitBtn: exitBtn, prevBtn: prevBtn,
            nextBtn: nextBtn, downBtn: downBtn,
            minBtn: minBtn, maxBtn: maxBtn,
        }
    }
    function hide(sign = "toggle") {
        if (sign != "hide" && sign != "show") {
            sign = (container.style.display == "none") ? "show" : "hide";
        }
        if (sign == "hide") {
            container.style.display = "none";
        } else if (sign == "show") {
            container.style.display = "block";
        }
    }
    function clear() {
        titleBar.innerText = "";
        prevBtn.style = "";
        nextBtn.style = "";
        downBtn.style = "";
        exitBtn.style = "";
        while (content.lastChild) { content.removeChild(content.lastChild); }
        titleBar.onclick = () => { };
        prevBtn.onclick = () => { };
        nextBtn.onclick = () => { };
        downBtn.onclick = () => { };
        exitBtn.onclick = () => { };
        content.onclick = () => { };
        container.style.display = "none";
    }
    function isFree() {
        return !content.lastChild;
    }
    function setView(width = "90%", height = "90%") {
        container.style.width = width;
        container.style.height = height;
    }
    function setZIndex(zIndex = 7) {
        container.style["z-index"] = zIndex + "";
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        setView: setView,
        setZIndex: setZIndex,
        draw: draw,
        hide: hide,
        clear: clear,
        isFree: isFree,
    }
}

function InnerManager(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {

        },
        style: {
            basicSize: "12px", zIndexRange: [9, 100],
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.style = '\
        .viewlist {z-index:' + args.style.zIndexRange[0] + ';position:fixed;bottom:1%;left:1%;\
            max-width:98%;overflow:auto;background:transparent;white-space:nowrap;\
            font-size:' + args.style.basicSize + ';}\
        .minitem {display:inline-block;width:6em;height:100%;border-radius:0.3em;margin:0 0.1em;\
            padding:0.4em;box-sizing:border-box;text-align:center;font-weight:500;\
            cursor:pointer;overflow:hidden;text-overflow:ellipsis;background:#fff;\
            border:solid 2px #ccc;}';
        args.htmlParts.item = '<div class="minitem"></div>';
        args.htmlParts.main = '<div class="viewlist"></div>';
    }
    let itemsample = htmltoElement((insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main))(args.htmlParts.item));

    let innerViewList = []; // {innerView, zIndex}
    let maxZIndex = args.style.zIndexRange[0];
    let icontain = args.box.querySelector(".viewlist");

    function newView(width = "90%", height = "90%") {
        function upperZIndex(iView) {
            function cleanZIndex() {
                let zIndexs = innerViewList.map(function (item) { return item.zIndex; });
                zIndexs.sort(function (a, b) { return a - b; }); // min to max
                innerViewList.forEach(function (item) {
                    item.zIndex = zIndexs.indexOf(item.zIndex) + args.style.zIndexRange[0] + 1;
                    item.innerView.setZIndex(item.zIndex);
                });
                maxZIndex = zIndexs.length + args.style.zIndexRange[0];
            }

            if (maxZIndex > (args.style.zIndexRange[1] - 5)) {
                cleanZIndex();
            }
            innerViewList.forEach(function (item) {
                if (item.innerView == iView) {
                    if (item.zIndex != maxZIndex) {
                        maxZIndex += 1;
                        item.zIndex = maxZIndex;
                        item.innerView.setZIndex(item.zIndex);
                    }
                }
            });
        }
        // choose the free innerView, use maxInd to avoid code error causing while(true)
        let ind = 0, len = innerViewList.length;
        let maxInd = args.style.zIndexRange[1] - args.style.zIndexRange[0] - 5;
        while (ind < maxInd && (len == ind || innerViewList[ind].innerView.isFree() == false)) {
            if (len <= ind) {
                innerViewList.push({
                    innerView: InnerViewer({ box: document.body.appendChild(document.createElement('div')), }),
                    zIndex: 0,
                });
                len = innerViewList.length;
            } else {
                ind += 1;
            }
        }
        maxZIndex += 1;
        let ivobj = innerViewList[ind];
        Array.prototype.slice.call(icontain.children).forEach((it) => {
            if (it.iview == ivobj.innerView)
                it.remove();
        });
        ivobj.zIndex = maxZIndex;
        // use draw blank to keep iview occupied
        let btns = ivobj.innerView.draw(document.createElement("div"), "blank", []);
        ivobj.innerView.hide("hide");
        ivobj.innerView.setView(width, height);
        ivobj.innerView.setZIndex(ivobj.zIndex);
        btns.minBtn.iview = ivobj.innerView;
        btns.container.iview = ivobj.innerView;
        btns.minBtn.onclick = function (evt) {
            evt.cancelBubble = true;
            evt.returnValue = false;
            let item = itemsample.cloneNode(true);
            item.innerText = btns.titleBar.innerText;
            item.iview = this.iview;
            item.iview.hide("hide");
            item.onclick = function (evt) {
                evt.cancelBubble = true;
                evt.returnValue = false;
                let item = this;
                item.iview.hide("show");
                Array.prototype.slice.call(item.parentNode.children).forEach((it) => {
                    if (it.iview == item.iview)
                        it.remove();
                });
                upperZIndex(item.iview);
                item.remove();
            };
            icontain.appendChild(item);
        }
        btns.container.onclick = function (evt) {
            evt.cancelBubble = true;
            evt.returnValue = false;
            upperZIndex(this.iview);
        }
        return ivobj.innerView;
    }

    function buildView(opts = {}) {
        let defopts = {
            width: "90%", height: "90%", title: "", btnShow: ["min", "max", "exit"],
            prev: () => { }, next: () => { }, down: () => { }, exit: () => { },
        }
        for (let key in opts) if (key in defopts) defopts[key] = opts[key];
        let ibox = ("box" in opts && opts.box) ? opts.box : document.createElement('div');
        let iview = newView(defopts.width, defopts.height);
        let itools = iview.draw(ibox, defopts.title, defopts.btnShow);
        iview.hide("hide");
        itools.prevBtn.onclick = () => { defopts.prev(); };
        itools.nextBtn.onclick = () => { defopts.next(); };
        itools.downBtn.onclick = () => { defopts.down(); };
        itools.exitBtn.onclick = () => { defopts.exit(); };
        return {
            ibox: ibox, iview: iview, itools: itools,
        }
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        newView: newView,
        buildView: buildView,
    }
}

function PageViewer(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {
            noMaskLink: false, logAction: (button) => { },
            chooseIcon: (name = "", isFolder = false) => {
                if (isFolder)
                    return '<path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-1.11-.9-2-2-2h-8l-2-2z" fill="#90a4ae" />';
                else
                    return '<path d="M13 9h5.5L13 3.5V9M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m5 2H6v16h12v-9h-7V4z" fill="#42a5f5" />';
            },
            sortCallBack: (cinfo) => { }, openPath: (path, isFolder) => { },
            menuAction: (info, node, thisFolder) => { }, iconAction: (path, ele, isFolder) => { },
            sizeAction: (path, ele, isFolder) => { }, timeAction: (path, ele, isFolder) => { },
        },
        style: {
            basicSize: "14px", colWidth: ['55%', '25%', '20%'], colmenu: true,
            ctrlHeadColor: "rgba(255,255,255,0.2)", pathHeadColor: "rgba(120,120,180,0.25)",
            listItemColor: "rgba(255,255,255,0.5)", listItemHover: "rgba(196,196,196,0.75)",
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.homeIcon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMCAwIDQwMCA0MDAiPjxnIGZpbGwtcnVsZT0iZXZlbm9kZCI+PHBhdGggZD0iTTM1NyAxMjRsLTMgNi00MiA0My00MiA0MnYxMDVjMiA4IDggMTMgMTUgMTVoNThjNy0zIDEzLTggMTQtMTZWMTI0IiBmaWxsPSIjYmMyMmYzIi8+PHBhdGggZD0iTTQxIDIxOWwxIDk5YzEgOCA3IDE1IDE1IDE3aDU3YzctMSAxMi03IDE0LTE0bDEtMlYyMTVsLTQyLTQyYy00NS00NS00My00My00NC00N2EyMyAyMyAwIDAgMS0xLTNjLTEtMS0xIDEtMSA5Nm0yNzEtNDZsLTQyIDQyIDQyLTQyIiBmaWxsPSIjZTMyYTc3Ii8+PHBhdGggZD0iTTkzIDY1Yy0yIDAtNSAxLTcgM2wtNDEgMzljLTMgNC00IDExLTMgMTV2MmwzIDYgMTA0IDEwNGMtNS02LTUtMTQgMC0yMWwyNi0yNiAyNS0yNi00NS00NC00Ny00N2MtNC00LTEwLTYtMTUtNSIgZmlsbD0iIzM0ZTNiYiIvPjxwYXRoIGQ9Ik0zMDEgNjVsLTggMy0xNDQgMTQ1Yy01IDctNCAxNSAwIDIxIDEgMyAzNyAzOCAzOSA0MCA4IDUgMTcgNCAyNC0xbDE0My0xNDRjNC02IDQtMTQtMS0yMWwtNDEtNDBjLTMtMy04LTQtMTItMyIgZmlsbD0iI2ZiZGIwNCIvPjxwYXRoIGQ9Ik0xNDUgMjIzbDEgMWExMyAxMyAwIDAgMCAwLTFoLTEiIGZpbGw9IiM2YzljOWMiLz48L2c+PC9zdmc+";
        args.htmlParts.style = '\
        .listTable {position:absolute;width:100%;height:100%;font-size:' + args.style.basicSize + ';\
            padding:1em;border-radius:0.3em;box-sizing:border-box;display:flex;flex-direction:column;}\
        .listPage {overflow:auto;}\
        .ctrlHead, .pathHead, .item {display:flex;overflow:hidden;}\
        .ctrlHead, .pathHead {border-bottom:1px solid rgba(0, 0, 0, 0.25);}\
        .ctrlHead {background:' + args.style.ctrlHeadColor + '; }\
        .pathHead {background:' + args.style.pathHeadColor + ';}\
        .pathChain {flex:auto;padding:0.7em;overflow:auto;white-space:nowrap;font-weight:600;outline:none;}\
        .pathChain .path {cursor:pointer;}\
        .item {border-top:1px solid rgba(0, 0, 0, 0.125);background:' + args.style.listItemColor + ';}\
        .item:hover { background:' + args.style.listItemHover + '; }\
        .colicon {flex-shrink:0;font-size:2em;height:1em;width:1em;margin:0.2em;cursor:pointer;}\
        .colmenu {flex-shrink:0;font-size:1.3em;height:1em;width:1em;cursor:pointer;font-weight:900;padding:0.6em;color:#8ac;}\
        .colmenu.log {width:2em;font-size:1.1em;text-align:center;color:#000;}\
        .pathHead .colicon img {width:90%;height:90%;}\
        .colmenu img {width:90%;height:90%;}\
        .coltext {flex:auto;overflow:hidden;text-align:left;color:#233;font-weight:600;}\
        .colname {width:' + args.style.colWidth[0] + ';}\
        .coltime {width:' + args.style.colWidth[1] + ';} .colsize {width:' + args.style.colWidth[2] + ';}\
        .colname, .coltime, .colsize {overflow:auto;float:left;cursor:pointer;\
            padding:0.7em;box-sizing:border-box;}\
        .coltime {display:' + ((args.style.colWidth[1] == '0%') ? 'none' : 'block') + ';}\
        .colsize {display:' + ((args.style.colWidth[2] == '0%') ? 'none' : 'block') + ';}\
        .colmenu {display:' + ((args.style.colmenu) ? 'block' : 'none') + ';}\
        .item .colname, .item .coltime, .item .colsize {word-break:break-all;}\
        .ctrlHead .colname, .ctrlHead .coltime, .ctrlHead .colsize {white-space:nowrap;overflow:hidden;}\
        ';
        args.htmlParts.main = '\
        <div class="listTable"><div><div class="pathHead">\
        <div class="colicon"><img src="' + args.htmlParts.homeIcon + '"/>\
        </div><div class="pathChain"></div><div class="colmenu log"></div></div>\
        <div class="ctrlHead"><div class="colicon"></div><div class="coltext">\
        <div class="colname">Name</div><div class="coltime">Date</div>\
        <div class="colsize">Size</div></div><div class="colmenu">#\
        </div></div></div>\
        <div class="listPage" style="width:100%">\
        <div class="item parent"><div class="colicon"></div><div class="coltext">\
        <div class="colname">Parent Directory</div><div class="coltime">-</div>\
        <div class="colsize">-</div></div><div class="colmenu"></div></div>\
        <div class="folder"></div><div class="file"></div><div style="height:2em;"></div></div>\
        </div>\
        ';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let currentInfo = {};
    // {Name:"", Size:"", Mode:"", Mtim:"", Ctim:"", Path:"", IsDir:true, FileNum:"", FolderNum:""} 
    // + {FileNodes:[], FolderNodes:[]}
    let currentPath = ""; // /xx/xxx/xxx with URIDecoded
    let fileList = [], folderList = [];
    let nameOrder = false, timeOrder = false, sizeOrder = false; // false means sort small -> big
    let container = args.box.querySelector(".listTable");
    let pathHead = container.querySelector(".pathHead");
    let pathChain = pathHead.querySelector(".pathChain");
    let ctrlHead = container.querySelector(".ctrlHead");
    let listPage = container.querySelector(".listPage");
    let listParent = listPage.querySelector(".parent");
    let listFolder = listPage.querySelector(".folder");
    let listFile = listPage.querySelector(".file");

    // ======================= //
    ctrlHead.querySelector('.colname').onclick = function () { sortItem("name"); };
    ctrlHead.querySelector('.coltime').onclick = function () { sortItem("time"); };
    ctrlHead.querySelector('.colsize').onclick = function () { sortItem("size"); };
    ctrlHead.querySelector('.colmenu').onclick = function () {
        if (currentInfo.FileNodes.length + currentInfo.FolderNodes.length == 0) {
            Array.prototype.slice.call(listFolder.children).forEach(function (item) {
                currentInfo.FolderNodes.push({ path: item.fileinfo.Path, node: item });
            });
            Array.prototype.slice.call(listFile.children).forEach(function (item) {
                currentInfo.FileNodes.push({ path: item.fileinfo.Path, node: item });
            });
        }
        args.params.menuAction(currentInfo, this.parentNode, true);
    };
    pathHead.querySelector('.colicon').onclick = function () {
        if (listPage.scrollTop != 0)
            listPage.scrollTop = 0;
        else if (pathChain.getAttribute("contenteditable") == "true") {
            pathChain.setAttribute("contenteditable", "false");
            pathChain.setAttribute("path", pathChain.innerText);
            if (pathChain.innerText != currentPath) {
                args.params.openPath(pathChain.innerText, true);
            } else {
                updatePathChain();
            }
        } else {
            pathChain.innerText = pathChain.getAttribute("path");
            pathChain.setAttribute("contenteditable", "true");
        }
    };
    pathChain.onkeypress = function (event) {
        if (event.keyCode == "13") {
            pathChain.setAttribute("contenteditable", "false");
            pathChain.setAttribute("path", pathChain.innerText);
            if (pathChain.innerText != currentPath) {
                args.params.openPath(pathChain.innerText, true);
            } else {
                updatePathChain();
            }
        }
    };
    args.params.logAction(pathHead.querySelector('.colmenu'));


    function updatePathChain() {
        // update pathChain
        let pathList = currentPath.split("/").filter(Boolean).map(function (value, index, array) {
            return { name: value, path: "/" + array.slice(0, index + 1).join("/") };
        });
        let pathChainList = pathList.map(function (value, index, array) {
            return '<a class="path" path="' + value.path + '"> > ' + value.name + '</a>';
        });
        pathChain.innerHTML = args.htmlParts.fix('<a class="path" path="/"> Home </a>' + pathChainList.join("\n"));
        pathChain.setAttribute("path", currentPath);
        let items = pathChain.querySelectorAll('.path');
        let numItem = items.length;
        for (let i = 0; i < numItem; i++) {
            items[i].onclick = function () {
                args.params.openPath(this.getAttribute('path'), true);
                return args.params.noMaskLink;
            };
        }
        // update parentDir
        let parentPath = ((pathList.length < 2) ? "/" : pathList[pathList.length - 2].path);
        listParent.querySelector('.colicon').innerHTML = '<svg style="height:1em;width:1em;">' + args.params.chooseIcon("home", true) + '</svg>';
        listParent.setAttribute("path", parentPath);
        listParent.querySelector('.colname').onclick = function () {
            args.params.openPath(this.parentNode.parentNode.getAttribute('path'), true);
            return args.params.noMaskLink;
        };
    }
    function updateItems(fileList = [], folderList = [], updateCallBack = null) {
        function formatSize(sizeB = 0) {
            // Cautions: >> is limited to 32bit signed int, 1<<31 
            let GB = 1 << 30, MB = 1 << 20, KB = 1 << 10;
            if (sizeB > GB)
                return (sizeB / GB).toFixed(2) + "G";
            else if (sizeB > MB)
                return (sizeB / MB).toFixed(2) + "M";
            else if (sizeB > KB)
                return (sizeB / KB).toFixed(2) + "K";
            else
                return sizeB.toString() + "B";
        }

        function getItemHtml(item = { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", FileNum: "", FolderNum: "" }) {
            item.Path = currentPath.replace(/(\/$)/g, "") + "/" + item.Name;
            item.IsDir = (item.FileNum != "");
            let htmlItem = '<div class="item" '
                + 'raw="' + encodeURIComponent(JSON.stringify(item)) + '" >'
                + '<div class="colicon"><svg style="height:1em;width:1em;">'
                + args.params.chooseIcon(item.Name, item.IsDir) + '</svg></div>'
                + '<div class="coltext"><div class="colname">' + item.Name + '</div>'
                + '<div class="coltime">' + new Date(Number(item.Mtim + "000")).toISOString().slice(0, -5) + '</div>'
                + '<div class="colsize">' + formatSize(Number(item.Size)) + '</div></div>'
                + '<div class="colmenu">#</div></div>';
            return htmlItem;
        }

        function setItemAction(item = null) {
            item.fileinfo = JSON.parse(decodeURIComponent(item.getAttribute("raw")));
            item.setAttribute("raw", "");
            item.querySelector(".colicon").onclick = function () {
                let node = this.parentNode;
                args.params.iconAction(node.fileinfo.Path, node, node.fileinfo.IsDir);
                return args.params.noMaskLink;
            };
            item.querySelector(".colmenu").onclick = function () {
                let node = this.parentNode;
                args.params.menuAction(node.fileinfo, node, false);
                return args.params.noMaskLink;
            };
            item.querySelector(".colname").onclick = function () {
                let node = this.parentNode.parentNode;
                args.params.openPath(node.fileinfo.Path, node.fileinfo.IsDir);
                return args.params.noMaskLink;
            };
            item.querySelector(".coltime").onclick = function () {
                let node = this.parentNode.parentNode;
                args.params.timeAction(node.fileinfo.Path, node, node.fileinfo.IsDir);
                return args.params.noMaskLink;
            };
            item.querySelector(".colsize").onclick = function () {
                let node = this.parentNode.parentNode;
                args.params.sizeAction(node.fileinfo.Path, node, node.fileinfo.IsDir);
                return args.params.noMaskLink;
            };
        }
        // update listFolder and listFile
        let htmlFolder = folderList.map(function (value) { return getItemHtml(value); });
        let htmlFile = fileList.map(function (value) { return getItemHtml(value); });
        listFolder.innerHTML = args.htmlParts.fix(htmlFolder.join(""));
        listFile.innerHTML = args.htmlParts.fix(htmlFile.join(""));
        // append onclick
        setTimeout(function () {
            Array.prototype.slice.call(listFolder.children)
                .concat(Array.prototype.slice.call(listFile.children))
                .forEach(function (item) { setItemAction(item); });
            updateCallBack();
        }, 32); // timeOut to process after (but not exact time to process)
    }
    function sortItem(section = "name") {
        let sortf = function () { };
        switch (section) {
            case "name":
                if (nameOrder)
                    sortf = function (b, a) { return a.Name.localeCompare(b.Name); };
                else
                    sortf = function (a, b) { return a.Name.localeCompare(b.Name); };
                nameOrder = !nameOrder;
                break;
            case "time":
                if (timeOrder)
                    sortf = function (b, a) { return a.Mtim - b.Mtim; };
                else
                    sortf = function (a, b) { return a.Mtim - b.Mtim; };
                timeOrder = !timeOrder;
                break;
            case "size":
                if (sizeOrder)
                    sortf = function (b, a) { return a.Size - b.Size; };
                else
                    sortf = function (a, b) { return a.Size - b.Size; };
                sizeOrder = !sizeOrder;
                break;
            default:
                return;
        }
        fileList.sort(sortf);
        folderList.sort(sortf);
        updateItems(fileList, folderList, function () {
            currentInfo.FileNodes = [];
            currentInfo.FolderNodes = [];
            Array.prototype.slice.call(listFolder.children).forEach(function (item) {
                currentInfo.FolderNodes.push({ path: item.fileinfo.Path, node: item });
            });
            Array.prototype.slice.call(listFile.children).forEach(function (item) {
                currentInfo.FileNodes.push({ path: item.fileinfo.Path, node: item });
            });
            args.params.sortCallBack(currentInfo);
        });
    }
    function updateInfo(info = { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", Path: "", FileList: [], FolderList: [] }) {
        try {
            info.FileList = JSON.parse(info.FileList);
            info.FolderList = JSON.parse(info.FolderList);
        } catch (err) { }
        if (!info.FileList)
            info.FileList = [];
        if (!info.FolderList)
            info.FolderList = [];
        currentInfo = { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", Path: "/", IsDir: true, FileNum: "", FolderNum: "" };
        for (let key in info)
            if (key in currentInfo)
                currentInfo[key] = info[key];
        currentInfo.FileNum = info.FileList.length + "";
        currentInfo.FolderNum = info.FolderList.length + "";
        currentInfo.FileNodes = [];
        currentInfo.FolderNodes = [];
        currentPath = currentInfo.Path; // /xx/xxx/xxx with URIDecoded
        fileList = info.FileList.slice(0);
        folderList = info.FolderList.slice(0);
        nameOrder = false;
        updatePathChain();
        sortItem("name");
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        updateInfo: updateInfo,
    }
}

function CodeViewer(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {

        },
        style: {
            basicSize: "14px", backColor: "#fff",
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.style = '\
        .codeBox {position:absolute;overflow:auto;box-sizing:border-box;height:100%;width:100%;padding:3%;\
            background:' + args.style.backColor + ';font-size:' + args.style.basicSize + '}\
        .codeBox .ctrlBtn {padding:0.5em;cursor:pointer;color:#79b;font-weight:600;font-size:1.2em;outline:none;}\
        .hljs{display:block;overflow-x:auto;padding:.5em;background:white;color:black}\
        .hljs-comment,.hljs-quote,.hljs-variable{color:#008000}\
        .hljs-keyword,.hljs-selector-tag,.hljs-built_in,.hljs-name,.hljs-tag{color:#00f}\
        .hljs-string,.hljs-title,.hljs-section,.hljs-attribute,.hljs-literal,\
        .hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-addition{color:#a31515}\
        .hljs-deletion,.hljs-selector-attr,.hljs-selector-pseudo,.hljs-meta{color:#2b91af}\
        .hljs-doctag{color:#808080}.hljs-attr{color:#f00}.hljs-symbol,.hljs-bullet,.hljs-link{color:#00b0e8}\
        .hljs-emphasis{font-style:italic}.hljs-strong{font-weight:bold}\
        a{text-decoration:none;color:#5ce;}a:hover{text-decoration:underline;}\
        p{line-height:1.5;} blockquote{padding:0 0.5em;margin:0;color:#6a737d;border-left:0.5em solid #dfe2e5;}\
        pre{padding:1em;overflow:auto;line-height:1.5;} table {border-collapse:collapse;}\
        td, th {border:1px solid #ddd;padding:10px 13px;}\
        ';
        args.htmlParts.main = '<div class="codeBox"><div class="ctrlBtn"></div><div class="container"></div></div>';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let htmlDist = args.box.querySelector('.container');
    let ctrlBtn = args.box.querySelector('.ctrlBtn');

    function showCode(link = "", isMarkdown = false) {
        function codeLang(language = "", oriCodeText = "") {
            htmlDist.innerHTML = args.htmlParts.fix('<pre><code></code></pre>');
            let codeBlock = htmlDist.querySelector('pre code');
            let result = "";
            if (language != "") {
                try { result = hljs.highlight(oriCodeText, { language: language, ignoreIllegals: true }); }
                catch (err) { language = ""; }
            }
            if (language == "") {
                try { result = hljs.highlightAuto(oriCodeText); }
                catch (err) { result = hljs.highlight(oriCodeText, { language: "Plaintext", ignoreIllegals: true }); }
            }
            ctrlBtn.innerText = result.language;
            codeBlock.innerHTML = args.htmlParts.fix(result.value);
        }

        let xhr = new XMLHttpRequest();
        if (xhr == null)
            return;
        xhr.open("GET", link, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                let oriCodeText = xhr.responseText;
                if (isMarkdown) {
                    let converter = new showdown.Converter({ emoji: true, underline: true });
                    ctrlBtn.innerText = "markdown";
                    ctrlBtn.onclick = function () { };
                    ctrlBtn.setAttribute("contenteditable", "false");
                    htmlDist.innerHTML = args.htmlParts.fix(converter.makeHtml(oriCodeText));
                    // renderMathInElement(htmlDist, {
                    //     displayMode: true, throwOnError: false, errorColor: '#ff0000',
                    //     delimiters: [
                    //         {left: "$$", right: "$$", display: true},
                    //         {left: "$", right: "$", display: false},
                    //         {left: "\\(", right: "\\)", display: false},
                    //         {left: "\\[", right: "\\]", display: true}
                    //     ],
                    // });
                    let codeBlocks = htmlDist.querySelectorAll('pre code');
                    for (let i = 0; i < codeBlocks.length; i++) {
                        hljs.highlightBlock(codeBlocks[i]);
                    }
                } else {
                    htmlDist.innerHTML = args.htmlParts.fix('<pre><code></code></pre>');
                    ctrlBtn.onclick = function () {
                        ctrlBtn.setAttribute("contenteditable", "true");
                        console.log('.....');
                    };
                    ctrlBtn.onkeypress = function (event) {
                        if (event.keyCode == "13") {
                            let lang = ctrlBtn.innerText.trim();
                            ctrlBtn.setAttribute("contenteditable", "false");
                            lang = (lang == "") ? "plain" : lang;
                            ctrlBtn.innerText = lang;
                            codeLang(lang, oriCodeText);
                        }
                    };
                    codeLang("", oriCodeText);
                }
            }
        };
        xhr.send(null);
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        showCode: showCode,
    }
}

function AdminViewer(opts = {}) {
    let args = {
        box: null,
        params: {
            adminCore: {}, popMenu: {}, iView: {}, PView: (opts)=>{ return {}},
        },
        style: {
            upFontColor: "#777", upProgColor: "#cce", upColWidth: ["48%", "31%", "15%"],
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.upstyle = '\
        .content {overflow:auto;}\
        .itemList {overflow:auto;padding:0.5em;}\
        .item {position:relative;height:2.5em;overflow:hidden;\
            border-bottom:1px solid ' + args.style.upProgColor + ';}\
        .progress {height:100%;width:0%;background:' + args.style.upProgColor + ';}\
        .colline {height:100%;width:100%;transform:translate(0, -100%);color:' + args.style.upFontColor + ';}\
        .colname, .colsize, .colstat {box-sizing:border-box;float:left;overflow:auto;\
            padding:0.7em;white-space:nowrap;font-weight:600;cursor:pointer;}\
        .colname {width:50%;text-align:left;} .colsize {width:35%;text-align:right;}\
        .colstat {width:15%;text-align:right;}\
        .blank {height:4em; border-top:2px #666 dotted;margin:1em;}\
        ';
        args.htmlParts.upitemHtml = '<div class="item"><div class="progress"></div>\
        <div class="colline"><div class="colname"></div>\
        <div class="colsize"></div><div class="colstat"></div></div>';
        args.htmlParts.upmain = '<div class="content">\
        <div class="itemList"></div><div class="blank"></div></div>';
    }

    let authTimeHandler;
    let upBox = document.createElement("div");
    let upItemHtml = (insertStyleHtml(upBox, args.htmlParts.upstyle, args.htmlParts.upmain))(args.htmlParts.upitemHtml);
    let moveBox = document.createElement("div");
    let movePage = args.params.PView({ box: moveBox, colWidth: ["100%", "0%", "0%"], colmenu: false, });

    function popTemplates(sign, finishCallBack) {
        return {
            authFail: (info) => { args.params.popMenu.appendMessage("fail", "Authorization Fail"); },
            fail: (info) => { args.params.popMenu.appendMessage("fail", sign + " : fail " + info); },
            exist: (info) => { args.params.popMenu.appendMessage("warn", sign + " : exist " + info); },
            info: (info) => { args.params.popMenu.appendMessage("info", sign + " : get info " + info); },
            pass: (info) => { args.params.popMenu.appendMessage("pass", sign + " : pass " + info); finishCallBack(); },
            all: (info) => { },
        }
    }
    function login(login = true, loginCallBack = () => { }, logoutCallBack = () => { }) {
        let waitAuthTimeout = (waitTime) => {
            if (!args.params.adminCore.getAuthStat()) { logoutCallBack(); clearTimeout(authTimeHandler); }
            authTimeHandler = setTimeout(function () { waitAuthTimeout(waitTime); }, waitTime);
        }

        if (login) {
            args.params.popMenu.appendAuth((name, key) => {
                if (!(name + key))
                    return false;
                args.params.adminCore.askAuthCore(name + key,
                    () => { waitAuthTimeout(2000); loginCallBack(); },
                    () => { popTemplates("").authFail(); logoutCallBack(); }
                );
            });
        } else {
            args.params.adminCore.closeSessionCore(function () { logoutCallBack(); });
        }
    }
    function download(chosenFiles = []) {
        chosenFiles.slice(0).forEach((path, index) => {
            setTimeout(() => { args.params.adminCore.download(path); }, 800 * index);
        });
    }
    function mkdir(dirPath = "", finishCallBack = () => { }) {
        args.params.popMenu.appendMessage("input", "New Directory", "", (name) => {
            args.params.adminCore.mkdirCore(dirPath + "/" + name, popTemplates("mkdir " + name, finishCallBack));
        });
    }
    function rename(chosenPath = [], finishCallBack = () => { }) {
        chosenPath.slice(0).forEach((srcPath) => {
            let srcName = srcPath.slice(srcPath.lastIndexOf("/") + 1);
            args.params.popMenu.appendMessage("input", "rename " + srcName, srcName, (dstName) => {
                let dstPath = srcPath.slice(0, srcPath.lastIndexOf("/") + 1) + dstName;
                args.params.adminCore.renameCore(srcPath, dstPath, popTemplates("rename " + srcName + " to " + dstName, finishCallBack));
            });
        });
    }
    function archive(chosenPath = [], finishCallBack = () => { }) {
        chosenPath.slice(0).forEach((path) => {
            let name = path.slice(path.lastIndexOf("/") + 1);
            args.params.popMenu.appendMessage("input", "Archive folder " + name.slice(0, 5) + "... to:", name + ".tgz", (dstName) => {
                let suffix = dstName.slice(dstName.lastIndexOf(".") + 1);
                let format = (suffix == "tgz") ? "targz" : "zip";
                let dstPath = path.slice(0, path.lastIndexOf("/") + 1) + dstName;
                args.params.adminCore.archiveCore(path, dstPath, format, popTemplates("archive " + name + " to " + dstPath, finishCallBack));
            });
        });
    }
    function remove(chosenPath = [], finishCallBack = () => { }) {
        chosenPath.slice(0).forEach((path) => {
            let name = path.slice(path.lastIndexOf("/") + 1);
            args.params.popMenu.appendMessage("confirm", "remove " + name + "?", "", () => {
                args.params.adminCore.removeCore(path, popTemplates("remove " + name, finishCallBack));
            });
        });
    }
    function upload(dirPath = "", finishCallBack = () => { }) {
        let uploadFileCore = (file, callback) => { args.params.adminCore.uploadFile(file, dirPath, callback); }
        let upItemList = upBox.querySelector(".itemList");
        upItemList.onclick = (event) => { event.cancelBubble = true; };
        upBox.querySelector(".blank").onclick = () => { appendFiles(); }

        function appendFiles() {
            let fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.multiple = "multiple";
            fileInput.onchange = function () {
                let finput = this;

                function formatSize(sizeB = 0) {
                    // Cautions: >> is limited to 32bit signed int, 1<<31 
                    let GB = 1 << 30, MB = 1 << 20, KB = 1 << 10;
                    if (sizeB > GB)
                        return (sizeB / GB).toFixed(2) + "G";
                    else if (sizeB > MB)
                        return (sizeB / MB).toFixed(2) + "M";
                    else if (sizeB > KB)
                        return (sizeB / KB).toFixed(2) + "K";
                    else
                        return sizeB.toString() + "B";
                }

                for (let i = 0; i < finput.files.length; i++) {
                    let file = finput.files[i];
                    let itemNode = document.createElement('div');
                    itemNode.innerHTML = upItemHtml;
                    itemNode = itemNode.firstChild;
                    itemNode.carryFile = file;
                    itemNode.onUpload = false;
                    itemNode.uploadStop = false;
                    itemNode.uploadFinish = false;
                    itemNode.querySelector('.colname').innerText = itemNode.carryFile.name;
                    itemNode.querySelector('.colsize').innerText = formatSize(itemNode.carryFile.size);
                    itemNode.querySelector('.colstat').innerText = "wait";
                    itemNode.querySelector('.colstat').onclick = function () {
                        let node = this.parentNode.parentNode;
                        if (node.onUpload)
                            node.uploadStop = true;
                        else
                            node.remove();
                    };
                    upItemList.appendChild(itemNode);
                }
                finput.remove();
            };
            fileInput.click();
        }

        function doUpload() {
            let tnode = upItemList.firstChild;
            while (tnode) {
                if (!tnode)
                    break;
                if (tnode.uploadFinish == false && tnode.onUpload == false)
                    break;
                tnode = tnode.nextSibling;
            }
            if (tnode) {
                tnode.onUpload = true;
                uploadFileCore(tnode.carryFile, uploadFileCallBack);
            }

            function uploadFileCallBack(progress, status) {
                // status: md5 / upload / finish / exist / fail / stop; progress: -1 or [0-1] 
                if (progress >= 0) {
                    tnode.querySelector(".progress").style.width = (100 * progress).toFixed(2) + "%";
                }
                tnode.querySelector(".colstat").innerText = status;
                if (status == "stop") {
                    tnode.onUpload = false;
                    tnode.uploadFinish = true;
                    tnode.remove();
                } else if (status == "finish" || status == "exist" || status == "fail") {
                    tnode.onUpload = false;
                    tnode.uploadFinish = true;
                    tnode = tnode.nextSibling;
                    while (tnode) {
                        if (!tnode)
                            break;
                        if (tnode.uploadFinish == false)
                            break;
                        tnode = tnode.nextSibling;
                    }
                    if (tnode) {
                        tnode.onUpload = true;
                        uploadFileCore(tnode.carryFile, uploadFileCallBack);
                    } else {
                        finishCallBack();
                    }
                } // else md5 upload
                return (tnode) ? tnode.uploadStop : false;
            }
        }

        function reset() {
            setTimeout(() => {
                if (!upItemList.firstChild) {
                    return;
                } else if (upItemList.firstChild.onUpload == true) {
                    upItemList.firstChild.uploadStop = true;
                    reset();
                } else {
                    upItemList.firstChild.remove();
                }
            }, 20);
        }

        let tools = args.params.iView.draw(upBox, "upload to " + dirPath, ["down", "exit"]);
        tools.exitBtn.onclick = () => { reset(); args.params.iView.hide("hide"); };
        tools.downBtn.onclick = () => { doUpload(); };
    }
    function mkfile(dirPath = "", finishCallBack = () => { }) {
        args.params.popMenu.appendMessage("input", "New File ", "", (name) => {
            let plainHtml = '<div style="position:relative;width:100%;height:100%;padding:1em;outline:none; overflow:auto;" contenteditable="true"></div>';
            let plainBox = htmltoElement(plainHtml);
            let tools = args.params.iView.draw(plainBox, "write to " + name, ["down", "exit"]);
            tools.exitBtn.onclick = () => { args.params.iView.hide("hide"); };
            tools.downBtn.onclick = () => {
                let content = plainBox.innerText;
                args.params.adminCore.mkfileCore(dirPath + "/" + name, content, popTemplates("mkfile " + name, finishCallBack));
                args.params.iView.hide("hide");
            };
        });
    }
    function moveto(_chosenPath = [], finishCallBack = () => { }) {
        let openFolder = (path = "", isFolder = true) => {
            if (!isFolder)
                return;
            args.params.adminCore.openFolder(path, false, (info) => {
                tools.titleBar.innerText = "move to " + info.Path;
                info.FileList = [];
                movePage.updateInfo(info);
            });
        }

        let chosenPath = _chosenPath.slice(0);
        if (chosenPath.length == 0)
            return;
        let tools = args.params.iView.draw(moveBox, "move to ", ["down", "exit"]);
        movePage.setArgs({ openPath: openFolder, });
        tools.exitBtn.onclick = () => { args.params.iView.hide("hide"); };
        tools.downBtn.onclick = () => {
            let dirPath = tools.titleBar.innerText.slice(("move to ").length);
            let names = chosenPath.map((path) => { return path.slice(path.lastIndexOf("/") + 1); });
            args.params.popMenu.appendMessage("confirm", "move files:\n" + names.join("\n") + "\n to \"" + dirPath + "\"?", "", (inp) => {
                chosenPath.forEach((path) => {
                    let name = path.slice(path.lastIndexOf("/") + 1);
                    let dstPath = dirPath + "/" + name;
                    args.params.adminCore.renameCore(path, dstPath, popTemplates("move " + name + " to " + dirPath, finishCallBack));
                });
            });
            args.params.iView.hide("hide");
        };
        openFolder();


    }
    function copyto(_chosenPath = [], finishCallBack = () => { }) {
        let openFolder = (path = "", isFolder = true) => {
            if (!isFolder)
                return;
            args.params.adminCore.openFolder(path, false, (info) => {
                tools.titleBar.innerText = "copy to " + info.Path;
                info.FileList = [];
                movePage.updateInfo(info);
            });
        }
        let chosenPath = _chosenPath.slice(0);
        if (chosenPath.length == 0)
            return;
        let tools = args.params.iView.draw(moveBox, "copy to ", ["down", "exit"]);
        movePage.setArgs({ openPath: openFolder, });
        tools.exitBtn.onclick = () => { args.params.iView.hide("hide"); };
        tools.downBtn.onclick = () => {
            let dirPath = tools.titleBar.innerText.slice(("move to ").length);
            let names = chosenPath.map((path) => { return path.slice(path.lastIndexOf("/") + 1); });
            args.params.popMenu.appendMessage("confirm", "copy files:\n" + names.join("\n") + "\n to \"" + dirPath + "\"?", "", (inp) => {
                chosenPath.forEach((path) => {
                    let name = path.slice(path.lastIndexOf("/") + 1);
                    let dstPath = dirPath + "/" + name;
                    args.params.adminCore.copytoCore(path, dstPath, popTemplates("copy " + name + " to " + dirPath, finishCallBack));
                });
            });
            args.params.iView.hide("hide");
        };
        openFolder();
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        login: login,
        download: download,
        upload: upload,
        mkdir: mkdir,
        mkfile: mkfile,
        rename: rename,
        archive: archive,
        remove: remove,
        moveto: moveto,
        copyto: copyto,
    }
}

function InfoViewer(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {
            adminView: null, refresh: () => { }, pathToUrl: (path) => { }, getAuthStat: () => { },
            tagChosen: (ele, tag) => { }, changeCallBack: () => { },
        },
        style: {

        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.style = '\
        .tableInfo {padding:0.3em;overflow:auto;}\
        .tableInfo tr td {white-space:nowrap;color:#555;font-weight:600;padding:0.3em;cursor:pointer;}\
        .menuBox0, .menuBox1, .menuBox2 {display:flex;flex-wrap:wrap;padding:0.3em;}\
        .menuItem {padding:0.7em 0.3em;width:6em;background:#99d;border-radius:0.5em;margin:0.2em;\
            font-weight:700;color:#fff;text-align:center;cursor:pointer;}\
            ';
        args.htmlParts.main = '<div class="tableInfo">\
        </div><div class="menuBox0">\
        <div class="menuItem refresh" style="background:#cdc;">refresh</div>\
        <div class="menuItem reverse" style="background:#dcc;">reverse</div>\
        <div class="menuItem chooseall" style="background:#ccd;">chooseAll</div>\
        </div><div class="menuBox1">\
        <div class="menuItem upload" style="background:#cab;">upload</div>\
        <div class="menuItem mkdir" style="background:#bca;">mkdir</div>\
        <div class="menuItem mkfile" style="background:#abc;">mkfile</div>\
        </div><div class="menuBox2">\
        <div class="menuItem download" style="background:#99d;">download</div>\
        <div class="menuItem archive" style="background:#9dd;">archive</div>\
        <div class="menuItem rename" style="background:#9d9;">rename</div>\
        <div class="menuItem moveto" style="background:#dd9;">moveto</div>\
        <div class="menuItem copyto" style="background:#d99;">copyto</div>\
        <div class="menuItem delete" style="background:#d9d;">delete</div>\
        </div>';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let thisFolderInfo = {}, chooseMode = false, chosenFiles = [], chosenFolders = [];
    let menuBox0 = args.box.querySelector(".menuBox0");
    let menuBox1 = args.box.querySelector(".menuBox1");
    let menuBox2 = args.box.querySelector(".menuBox2");
    let tableInfo = args.box.querySelector(".tableInfo");
    let refreshBtn = menuBox0.querySelector(".refresh");
    let reverseBtn = menuBox0.querySelector(".reverse");
    let chooseAllBtn = menuBox0.querySelector(".chooseall");
    let uploadBtn = menuBox1.querySelector(".upload");
    let mkdirBtn = menuBox1.querySelector(".mkdir");
    let mkfileBtn = menuBox1.querySelector(".mkfile");
    let downloadBtn = menuBox2.querySelector(".download");
    let archiveBtn = menuBox2.querySelector(".archive");
    let renameBtn = menuBox2.querySelector(".rename");
    let movetoBtn = menuBox2.querySelector(".moveto");
    let copytoBtn = menuBox2.querySelector(".copyto");
    let deleteBtn = menuBox2.querySelector(".delete");

    refreshBtn.onclick = function () {
        args.params.refresh();
    };
    reverseBtn.onclick = function () {
        chosenFiles.forEach(function (item) {
            if (item.node)
                args.params.tagChosen(item.node, false);
        });
        chosenFolders.forEach(function (item) {
            if (item.node)
                args.params.tagChosen(item.node, false);
        });
        chosenFiles = thisFolderInfo.FileNodes.filter(function (item) {
            return (chosenFiles.findIndex(function (citem) { return (item.path == citem.path); }) == -1);
        });
        chosenFolders = thisFolderInfo.FolderNodes.filter(function (item) {
            return (chosenFolders.findIndex(function (citem) { return (item.path == citem.path); }) == -1);
        });
        chosenFiles.forEach(function (item) {
            if (item.node)
                args.params.tagChosen(item.node, true);
        });
        chosenFolders.forEach(function (item) {
            if (item.node)
                args.params.tagChosen(item.node, true);
        });
        if (chosenFiles.length + chosenFolders.length == 0)
            menuBox2.style.display = "none";
        else
            menuBox2.style.display = "";
        adminItems();
    };
    chooseAllBtn.onclick = function () {
        if (chosenFiles.length + chosenFolders.length == thisFolderInfo.FileNodes.length + thisFolderInfo.FolderNodes.length) {
            chosenFiles.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFolders.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFiles = [];
            chosenFolders = [];
        } else {
            chosenFiles = thisFolderInfo.FileNodes;
            chosenFolders = thisFolderInfo.FolderNodes;
            chosenFiles.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, true);
            });
            chosenFolders.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, true);
            });
        }
        if (chosenFiles.length + chosenFolders.length == 0)
            menuBox2.style.display = "none";
        else
            menuBox2.style.display = "";
        adminItems();
    };
    uploadBtn.onclick = function () {
        args.params.adminView.upload(thisFolderInfo.Path, args.params.refresh);
    };
    mkdirBtn.onclick = function () {
        args.params.adminView.mkdir(thisFolderInfo.Path, args.params.refresh);
    };
    mkfileBtn.onclick = function () {
        args.params.adminView.mkfile(thisFolderInfo.Path, args.params.refresh);
    };
    downloadBtn.onclick = function () {
        args.params.adminView.download(chosenFiles.map(function (item) { return item.path; }));
        if (chooseMode) {
            chosenFiles.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFiles = [];
        }
    };
    archiveBtn.onclick = function () {
        args.params.adminView.archive(chosenFiles.concat(chosenFolders).map(function (item) { return item.path; }), args.params.refresh);
        if (chooseMode) {
            chosenFolders.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFolders = [];
        }
    };
    renameBtn.onclick = function () {
        args.params.adminView.rename(chosenFiles.concat(chosenFolders).map(function (item) { return item.path; }), args.params.refresh);
        if (chooseMode) {
            chosenFiles.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFolders.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFiles = [];
            chosenFolders = [];
        }
    };
    movetoBtn.onclick = function () {
        args.params.adminView.moveto(chosenFiles.concat(chosenFolders).map(function (item) { return item.path; }), args.params.refresh);
        if (chooseMode) {
            chosenFiles.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFolders.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFiles = [];
            chosenFolders = [];
        }
    };
    copytoBtn.onclick = function () {
        args.params.adminView.copyto(chosenFiles.map(function (item) { return item.path; }), args.params.refresh);
        if (chooseMode) {
            chosenFiles.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFiles = [];
        }
    };
    deleteBtn.onclick = function () {
        args.params.adminView.remove(chosenFiles.concat(chosenFolders).map(function (item) { return item.path; }), args.params.refresh);
        if (chooseMode) {
            chosenFiles.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFolders.forEach(function (item) {
                if (item.node)
                    args.params.tagChosen(item.node, false);
            });
            chosenFiles = [];
            chosenFolders = [];
        }
    };

    function setChooseMode(tag = true) {
        chooseMode = tag;
    }
    function adminItems(isDir = true) {
        if (args.params.getAuthStat()) {
            archiveBtn.style.display = (chooseMode) ? "none" : "block";
            renameBtn.style.display = "block";
            movetoBtn.style.display = "block";
            copytoBtn.style.display = (chooseMode || isDir) ? "none" : "block";
            deleteBtn.style.display = "block";
        } else {
            archiveBtn.style.display = "none";
            renameBtn.style.display = "none";
            movetoBtn.style.display = "none";
            copytoBtn.style.display = "none";
            deleteBtn.style.display = "none";
        }
        args.params.changeCallBack();
    }
    function genInfo(info, node, thisFolder = false) {
        function setItem(path = "", node = null, isFolder = true, append = true) {
            if (!append) {
                chosenFiles = [];
                chosenFolders = [];
            }
            if (isFolder) {
                let pos = chosenFolders.findIndex(function (citem) { return (path == citem.path); });
                if (pos == -1) {
                    args.params.tagChosen(node, true);
                    chosenFolders.push({ path: path, node: node });
                } else {
                    args.params.tagChosen(node, false);
                    chosenFolders.splice(pos, 1);
                }
            } else {
                let pos = chosenFiles.findIndex(function (citem) { return (path == citem.path); });
                if (pos == -1) {
                    args.params.tagChosen(node, true);
                    chosenFiles.push({ path: path, node: node });
                } else {
                    args.params.tagChosen(node, false);
                    chosenFiles.splice(pos, 1);
                }
            }
        }

        function setInfo(info) {
            function formatSize(sizeB = 0) {
                // Cautions: >> is limited to 32bit signed int, 1<<31 
                let GB = 1 << 30, sizeG = 0;
                if (sizeB > GB) {
                    sizeG = Math.floor(sizeB / GB);
                    sizeB -= sizeG * GB;
                }
                let sizeK = sizeB >> 10;
                let sizeM = sizeK >> 10;
                sizeB -= sizeK << 10;
                sizeK -= sizeM << 10;
                if (sizeG)
                    return sizeG + 'G ' + sizeM + 'M ' + sizeK + 'K ' + sizeB + 'B ';
                else if (sizeM)
                    return sizeM + 'M ' + sizeK + 'K ' + sizeB + 'B ';
                else if (sizeK)
                    return sizeK + 'K ' + sizeB + 'B ';
                else
                    return sizeB + 'B ';

            }

            let tableHtml = '<table><tbody>\
            <tr><td class="key">Name</td><td class="value">' + info.Name + '</td></tr>\
            <tr><td class="key">Size</td><td class="value">' + formatSize(info.Size) + '</td></tr>\
            <tr><td class="key">Mode</td><td class="value">' + info.Mode + '</td></tr>\
            <tr><td class="key">IsDir</td><td class="value">' + info.IsDir + '</td></tr>\
            <tr><td class="key">Last Modified</td><td class="value">' + new Date(Number(info.Mtim + "000")).toISOString() + '</td></tr>\
            <tr><td class="key">Create Time</td><td class="value">' + new Date(Number(info.Ctim + "000")).toISOString() + '</td></tr>\
            <tr style="display:' + ((info.IsDir) ? "" : "none") + ';"><td class="key">FileNum</td><td class="value">' + info.FileNum + '</td></tr>\
            <tr style="display:' + ((info.IsDir) ? "" : "none") + ';"><td class="key">FolderNum</td><td class="value">' + info.FolderNum + '</td></tr>\
            <tr><td class="key">Path</td><td class="value">' + info.Path + '</td></tr>\
            <tr><td class="key">Link</td><td class="value">' + args.params.pathToUrl(info.Path) + '</td></tr>\
            </tbody></table>';

            tableInfo.innerHTML = args.htmlParts.fix(tableHtml);
            Array.prototype.slice.call(tableInfo.querySelectorAll("tr")).forEach(function (item) {
                item.onclick = function () {
                    let value = this.querySelector(".value");
                    let input = document.body.appendChild(document.createElement('input'));
                    input.value = value.innerText;
                    input.select();
                    document.execCommand("copy");
                    input.remove();
                    value.style.background = "#abf";
                    setTimeout(() => { value.style.background = ""; }, 1000);
                };
            });
        }

        if (thisFolder) {
            thisFolderInfo = info;
            chooseMode = true;
            chosenFiles = [];
            chosenFolders = [];
            setInfo(info);
            menuBox0.style.display = "";
            menuBox1.style.display = (args.params.getAuthStat()) ? "" : "none";
            menuBox2.style.display = "none";
            downloadBtn.style.display = "block";
            adminItems();
        }
        else if (chooseMode) {
            setItem(info.Path, node, info.IsDir, true);
            if (chosenFiles.length + chosenFolders.length == 0)
                menuBox2.style.display = "none";
            else
                menuBox2.style.display = "";
            adminItems();
        } else {
            if (info.IsDir) {
                chosenFiles = [];
                chosenFolders = [{ path: info.Path, node: node }];
            } else {
                chosenFiles = [{ path: info.Path, node: node }];
                chosenFolders = [];
            }
            setInfo(info);
            menuBox0.style.display = "none";
            menuBox1.style.display = "none";
            menuBox2.style.display = "";
            downloadBtn.style.display = (info.IsDir) ? "none" : "block";
            adminItems(info.IsDir);
        }
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        genInfo: genInfo,
        setChooseMode: setChooseMode,
    }
}

