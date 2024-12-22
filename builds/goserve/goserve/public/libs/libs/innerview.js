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
