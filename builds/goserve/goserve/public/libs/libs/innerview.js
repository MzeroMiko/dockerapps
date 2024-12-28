"use strict"

function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
}

function InnerViewer(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
        styles: {
            basic_size: "12px", innerbox_zindex: 7, innerbox_width: "90%", innerbox_height: "90%",
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let container = shadow_module.shadowRoot.querySelector(".innerBox");
    let icontain = shadow_module.shadowRoot.querySelector(".icontain");
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
    function is_free() {
        return !content.lastChild;
    }
    function set_view(width = "90%", height = "90%") {
        container.style.width = width;
        container.style.height = height;
    }
    function set_zindex(zIndex = 7) {
        container.style["z-index"] = zIndex + "";
    }

    return {
        set_view: set_view,
        set_zindex: set_zindex,
        draw: draw,
        hide: hide,
        clear: clear,
        is_free: is_free,
    }
}

function InnerManager(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
        styles: {
            basic_size: "12px", zindex_min: 9, zindex_max: 100,
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let manager = shadow_module.shadowRoot.querySelector(".manager");
    let icontain = manager.querySelector(".viewlist");
    let itemsample = manager.querySelector(".minitem");
    icontain.innerHTML = "";
    manager.style.display = "block";
    let all_viewers = document.createElement('div');
    document.body.appendChild(all_viewers);

    let innerview_html = args.html;

    let innerViewList = []; // {innerView, zIndex}
    let config_zindex_min = args.styles.zindex_min
    let config_zindex_max = args.styles.zindex_max
    let maxZIndex = config_zindex_min;

    function clean_zindex() {
        let zIndexs = innerViewList.map(function (item) { return item.zIndex; });
        zIndexs.sort(function (a, b) { return a - b; }); // min to max
        innerViewList.forEach(function (item) {
            item.zIndex = zIndexs.indexOf(item.zIndex) + config_zindex_min + 1;
            item.innerView.set_zindex(item.zIndex);
        });
        maxZIndex = zIndexs.length + config_zindex_min;
    }

    function upper_zindex(iView) {
        if (maxZIndex > (config_zindex_max - 5)) {
            clean_zindex();
        }
        let ivobj = innerViewList[iView.__list_index__];
        if (ivobj.zIndex != maxZIndex) {
            maxZIndex += 1;
            ivobj.zIndex = maxZIndex;
            ivobj.innerView.set_zindex(ivobj.zIndex);
        }
    }

    function maybe_create_new_view() {
        // choose the free innerView, use maxInd to avoid code error causing while(true)
        let ind = 0;
        let len = innerViewList.length;
        let maxInd = config_zindex_max - config_zindex_min - 5;
        while (ind < maxInd && (len == ind || innerViewList[ind].innerView.is_free() == false)) {
            if (len <= ind) {
                let innerView = InnerViewer({ 
                    box: all_viewers.appendChild(document.createElement('div')),
                    html: innerview_html,
                    basic_size: args.styles.basic_size,
                })
                innerView.__list_index__ = ind;
                innerViewList.push({innerView: innerView, zIndex: 0});
                len = innerViewList.length;
            } else {
                ind += 1;
            }
        }
        return innerViewList[ind].innerView;
    }

    function open_exist_view(iview) {
        Array.prototype.slice.call(icontain.children).forEach((it) => {
            if (it.iview == iview)
                it.remove();
        });
        upper_zindex(iview);
        iview.hide("show");
    }

    function setup_new_view(innerView, width = "90%", height = "90%") {
        // use draw blank to keep iview occupied
        let btns = innerView.draw(document.createElement("div"), "blank", []);
        innerView.set_view(width, height);
        btns.minBtn.iview = innerView;
        btns.container.iview = innerView;
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
                upper_zindex(item.iview);
                item.remove();
            };
            icontain.appendChild(item);
        }
        btns.container.onclick = function (evt) {
            evt.cancelBubble = true;
            evt.returnValue = false;
            upper_zindex(this.iview);
        }
        return innerView;
    }

    function build_view(opts = {}) {
        let defopts = {
            width: "90%", height: "90%", title: "", btnShow: ["min", "max", "exit"],
            prev: () => { }, next: () => { }, down: () => { }, exit: () => { },
        }
        for (let key in opts) if (key in defopts) defopts[key] = opts[key];
        let ibox = ("box" in opts && opts.box) ? opts.box : document.createElement('div');
        let iview = maybe_create_new_view();
        Array.prototype.slice.call(icontain.children).forEach((it) => {
            if (it.iview == iview)
                it.remove();
        });
        upper_zindex(iview);
        iview = setup_new_view(iview, defopts.width, defopts.height);
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
        build_view: build_view,
        open_exist_view: open_exist_view,
    }
}

