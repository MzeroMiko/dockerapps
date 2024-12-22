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

function AdminCore(opts = {}) {
    let args = {
        box: null,
        params: {
            prefix: "/home",
            reAuthTime: 5, useQueryPath: false,
            authFail: "authFail", signPass: "pass", signExist: "exist", signFail: "fail",
            chunkSize: 2 << 20, // 2MB 
            uploadConcurrent: 3, // max concurrent
            currentHost: window.location.origin,
            currentParts: {},
        },
        style: {},
        htmlParts: {},
    }
    args.params.currentParts = getUrlParts(window.location.href); // when assignned, dict is refered as a point, not value!
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];

    let authTimeOut = new Number();
    let currentToken = "";

    function getUrlParts(iurl = "") {
        // asset url: currentHost + [/xxx] + [?a=x&b=x] + [#x]
        // asset no "?" or "&" or "=" in (a=)x
        let url = iurl.slice(args.params.currentHost.length);
        let hashPos = url.indexOf("#");
        let hashStr = (hashPos == -1) ? "" : url.slice(hashPos + 1);
        url = (hashPos == -1) ? url : url.slice(0, hashPos);
        let queryPos = url.indexOf("?");
        let queryStr = (queryPos == -1) ? "" : url.slice(queryPos + 1);
        let pathStr = (queryPos == -1) ? url : url.slice(0, queryPos);
        let queryList = queryStr.split("&");
        let queryDict = {};
        for (let i = 0; i < queryList.length; i++) {
            let query = queryList[i];
            let keyPos = query.indexOf("=");
            if (keyPos != -1) {
                let key = query.slice(0, keyPos);
                queryDict[key] = (key in queryDict) ? (queryDict[key] + query.slice(keyPos + 1)) : query.slice(keyPos + 1);
            }
        }
        return { path: pathStr, query: queryDict, hash: hashStr };
    }

    function mergeUrlParts(path = "", query = {}, hash = "") {
        let url = args.params.currentHost + path + "?";
        for (let key in query) {
            if (query[key] != "undefined" && query[key] != undefined)
                url += key + "=" + query[key] + "&";
        }
        url = url.slice(0, url.length - 1) + ((hash != "") ? ("#" + hash) : "");
        return url;
    }

    function encodePath(upath = "", keepSlash = true) {
        // assert upath = "/x", x is not URIEncoded
        let pathList = [];
        let upathList = upath.split("/").filter(Boolean);
        let slash = (keepSlash) ? "/" : encodeURIComponent("/");
        // format path
        for (let i = 0; i < upathList.length; i++) {
            if (upathList[i].trim() == "..")
                pathList.pop();
            else if (upathList[i].trim() != "")
                pathList.push(upathList[i]);
        }
        // URIEncode path
        pathList = pathList.map((value, index, array) => { return encodeURIComponent(value); });
        return slash + pathList.join(slash);
    }

    function decodePath(upath = "") {
        let pathList = [];
        let upathList = (upath.indexOf("/") == -1) ? upath.split(encodeURIComponent("/")).filter(Boolean) : upath.split("/").filter(Boolean);
        // URIDncode path
        upathList = upathList.map((value, index, array) => { return decodeURIComponent(value); });
        // format path
        for (let i = 0; i < upathList.length; i++) {
            if (upathList[i].trim() == "..")
                pathList.pop();
            else if (upathList[i].trim() != "")
                pathList.push(upathList[i]);
        }
        return "/" + pathList.join("/");
    }

    function getAction(url = "", callback = (result) => { }) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Cache-Control", "no-cache"); // disable cache
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200)
                callback(xhr.responseText);
        };
        xhr.send(null);
    }

    function postAction(url = "", callbacks = {}, postData = null, addition = (xhr) => { }) {
        let signs = {
            authFail: args.params.authFail,
            pass: args.params.signPass,
            fail: args.params.signFail,
            exist: args.params.signExist,
        }
        let defCallBacks = {
            authFail: (info) => { },
            pass: function (info) { }, fail: function (info) { },
            exist: function (info) { }, info: function (info) { }, all: function (info) { },
        }
        for (let key in callbacks) {
            if (key in defCallBacks)
                defCallBacks[key] = callbacks[key];
        }
        let parseSigns = (result) => {
            if (result.indexOf(signs.authFail) != -1) {
                currentToken = "";
                defCallBacks.authFail();
            } else if (result.indexOf(signs.pass) != -1) {
                defCallBacks.pass(result.slice(result.indexOf(signs.pass) + signs.pass.length));
            } else if (result.indexOf(signs.fail) != -1) {
                defCallBacks.fail(result.slice(result.indexOf(signs.fail) + signs.fail.length));
            } else if (result.indexOf(signs.exist) != -1) {
                defCallBacks.exist(result.slice(result.indexOf(signs.exist) + signs.exist.length));
            } else {
                defCallBacks.info(result);
            }
            defCallBacks.all(result)
        }
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Cache-Control", "no-cache"); // disable cache
        addition(xhr);
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200)
                parseSigns(xhr.responseText);
        };
        xhr.send(postData);
        try { clearTimeout(authTimeOut); } catch (err) { }
        authTimeOut = setTimeout(() => { closeSessionCore(); }, args.params.reAuthTime * 60000);
    }

    // public methods ============== //
    function htmltoElement(html = "") {
        let div = document.createElement('div');
        div.innerHTML = html;
        div.remove();
        return div.firstChild;
    }

    function insertStyleHtml(container = null, styleText = "", mainHtml = "") {
        let uniqueStyle = (styleText = "", useID = false) => {
            // find uniqueID =================================
            let prefix = (useID) ? "#ID" : ".ID";
            let uniqueID = "";
            while (true) {
                uniqueID = prefix + Math.floor(new Date().getTime() * Math.random());
                if (document.querySelector(uniqueID) == null) break;
            }
            // sort style text ===============================
            // thinking @media{.a{}}
            if (styleText.indexOf("<style") != -1) {
                styleText = styleText.slice(styleText.indexOf("<style") + 6);
                styleText = styleText.slice(styleText.indexOf(">") + 1);
            }
            if (styleText.indexOf("</style>") != -1)
                styleText = styleText.slice(0, styleText.indexOf("</style>"));
            let styleGroups = styleText.split('@');
            let newStyleGroups = [];
            let styleStore = [{ head: "main", tags: [] }];
            for (let g = 0; g < styleGroups.length; g++) {
                let styleText = styleGroups[g].trim();
                let headInfo = "";
                if (styleText == "") continue;
                // g!=0 means has @ before
                if (g != 0) {
                    headInfo = "@" + styleText.slice(0, styleText.indexOf("{")).trim();
                    styleText = styleText.slice(styleText.indexOf("{") + 1, styleText.lastIndexOf("}")).trim();
                    styleStore.push({ head: headInfo.slice(0), tags: [] });
                }
                let oriStyles = styleText.split('}'), newStyles = [];
                for (let i = 0; i < oriStyles.length; i++) {
                    let style = oriStyles[i].trim(), styleT = "";
                    if (style == "") continue;
                    style = style + "}";
                    let selecters = style.slice(0, style.indexOf("{")).split(',');
                    for (let j = 0; j < selecters.length; j++) {
                        let selecter = selecters[j].trim();
                        // if (selecter != "") styleT += uniqueID + " " + selecter + ", ";
                        if (selecter != "") {
                            // generate styleT
                            styleT += selecter.split(" ").map(function (item) { return item + uniqueID; }).join(" ") + ", ";
                            // append styleStore
                            selecter.split(" ").forEach(function (item) {
                                // fix styleStore: delete a from .a#b.c; if xx#a.b, then item[0] == "x"
                                item.slice(1).split(".").concat(item[0]).forEach(function (item1, index, array) {
                                    if (item1 == "" || index == (array.length - 1)) return;
                                    item1 = (index == 0) ? (array[array.length - 1] + item1) : ("." + item1);
                                    item1.slice(1).split("#").concat(item1[0]).forEach(function (item2, index, array) {
                                        if (item2 == "" || index == (array.length - 1)) return;
                                        item2 = (index == 0) ? (array[array.length - 1] + item2) : ("#" + item2);
                                        if (styleStore[g].tags.indexOf(item2) == -1) styleStore[g].tags.push(item2);
                                    });
                                });
                            });
                        }
                    }
                    if (styleT != "") // slice(0, -2) to remove ", "
                        newStyles.push(styleT.slice(0, -2) + style.slice(style.indexOf("{")));
                }
                if (headInfo == "") newStyleGroups.push(newStyles.join(" "));
                else newStyleGroups.push(headInfo + "{" + newStyles.join(" ") + "}");
            }

            return {
                uniqueID: uniqueID, styleStore: styleStore,
                styleText: "<style>" + newStyleGroups.join(" ") + "</style>"
            };
        }

        let uniqueHtml = (uniqueID, styleStore, htmlText) => {
            if (uniqueID[0] != "#" && uniqueID[0] != ".") return;
            let tag = (uniqueID[0] == "#") ? "id" : "className";
            let div = document.createElement('div');
            div.innerHTML = htmlText;
            for (let g = 0; g < styleStore.length; g++) {
                for (let b = 0; b < styleStore[g].tags.length; b++) {
                    let items = div.querySelectorAll(styleStore[g].tags[b]);
                    for (let i = 0; i < items.length; i++) {
                        if (items[i][tag].indexOf(uniqueID.slice(1)) == -1) items[i][tag] += " " + uniqueID.slice(1);
                    }
                }
            }
            htmlText = div.innerHTML;
            div.remove();
            return htmlText;
        }

        let unique = uniqueStyle(styleText);
        mainHtml = uniqueHtml(unique.uniqueID, unique.styleStore, mainHtml);
        container.innerHTML = unique.styleText + mainHtml;
        if (unique.uniqueID[0] == "#") container.id += " " + unique.uniqueID.slice(1);
        else if (unique.uniqueID[0] == ".") container.className += " " + unique.uniqueID.slice(1);
        return function (htmlText) { return uniqueHtml(unique.uniqueID, unique.styleStore, htmlText); };
    }

    function pathToUrl(path = "", addtion = (parts) => { }) {
        // assert path = /x/x/x or / is URIDecoded
        let parts = { path: args.params.currentParts.path, query: {}, hash: args.params.currentParts.hash };
        for (let key in args.params.currentParts.query)
            parts.query[key] = args.params.currentParts.query[key];
        // When the first time to start without query.path:
        if (args.params.useQueryPath && !("path" in parts.query))
            parts.query.path = encodePath("/");
        // when path == "", do not change path
        if (path != "" && path != ".") {
            if (args.params.useQueryPath)
                parts.query.path = encodePath(path == ""? "/": path);
            else {
                let _prefix = args.params.prefix;
                _prefix = (_prefix.slice(0,1) == "/")? _prefix : "/" + _prefix;
                _prefix = (_prefix.slice(-1) == "/")? _prefix.slice(0, -1): _prefix; // like "/home" but not "home" or "/home/"
                parts.path = encodePath(path);
                parts.path = (parts.path.slice(0, 1) == "/")? _prefix + parts.path: _prefix + "/" + parts.path;
            }
        }
        addtion(parts);
        return mergeUrlParts(parts.path, parts.query, parts.hash);
    }

    function urlToPath(url = "") {
        if (args.params.useQueryPath)
            return decodePath((url == "") ? args.params.currentParts.query.path : getUrlParts(url).query.path);
        let rawpath = decodePath((url == "") ? args.params.currentParts.path : getUrlParts(url).path);
        let _prefix = args.params.prefix;
        _prefix = (_prefix.slice(0,1) == "/")? _prefix : "/" + _prefix;
        _prefix = (_prefix.slice(-1) == "/")? _prefix.slice(0, -1): _prefix; // like "/home" but not "home" or "/home/"
        if (rawpath.indexOf(_prefix) == 0) {
            if (rawpath.length == _prefix.length) return "/";
            else rawpath = rawpath.slice(_prefix.length);
            if (rawpath.slice(0, 1) == "/") return rawpath;
        }
        console.log("url not valid: ", url);
        return "/";
    }

    function download(path = "") {
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "getfile";
        });
        window.open(url, "_self");
    }

    function openFolder(path = "", updateCurrentPath = false, callback = (info) => { }) {
        let newParts = {};
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "getdir";
            newParts = parts;
        });
        getAction(url, (result) => {
            if (updateCurrentPath) {
                args.params.currentParts.path = newParts.path;
                args.params.currentParts.query.path = newParts.query.path;
                args.params.currentParts.hash = newParts.hash;
            }
            try {
                // tmpele: <pre name="" size="" mode="" mtim="" ctim="" error="" filenum="1" foldernum="3"> <div type="folder"><a href="" name="" size="" mode="" mtim="" ctim="" filenum="10" foldernum="0">__BACK</a><br></div><div type="file"></div></pre>
                // info: {Name:"", Size:"", Mode:"", Mtim:"", Ctim:"", Path:"", FileList:[], FolderList:[]}
                // { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", FileNum: "", FolderNum: "" }
                let tmpele = htmltoElement(result); 
                let folderEle = tmpele.firstElementChild;
                let fileEle = tmpele.lastElementChild;
                if (folderEle.getAttribute("type") == "file") {
                    folderEle = tmpele.lastElementChild;
                    fileEle = tmpele.firstElementChild;
                }
                let info = {
                    Path: urlToPath(url), Name: tmpele.getAttribute("name"), Size: tmpele.getAttribute("size"), Mode: tmpele.getAttribute("mode"),
                    Mtim: tmpele.getAttribute("mtim"), Ctim: tmpele.getAttribute("ctim"), Error: tmpele.getAttribute("error"),
                    FileList: Array.from(fileEle.querySelectorAll("a")).map(function(item) {
                        return {
                            Name: item.getAttribute("name"), Size: item.getAttribute("size"), Mode: item.getAttribute("mode"), Mtim: item.getAttribute("mtim"), 
                            Ctim: item.getAttribute("ctim"), FileNum: item.getAttribute("filenum"), FolderNum: item.getAttribute("foldernum"),
                        }
                    }), 
                    FolderList: Array.from(folderEle.querySelectorAll("a")).map(function(item) {
                        return {
                            Name: item.getAttribute("name"), Size: item.getAttribute("size"), Mode: item.getAttribute("mode"), Mtim: item.getAttribute("mtim"), 
                            Ctim: item.getAttribute("ctim"), FileNum: item.getAttribute("filenum"), FolderNum: item.getAttribute("foldernum"),
                        }
                    }),
                }
                if (info.Path == "/") info.Name = "Home";
                tmpele.remove()
                callback(info);
            } catch (err) {
                console.log(err);
                console.log("Error Get Info, Received:\n", result);
            }
        });
    }

    function askAuthCore(key = "", passCallBack = () => { }, failCallBack = () => { }) {
        let authKey = SparkMD5.hash(key);
        let url = pathToUrl(".");
        postAction(url, {
            all: (result) => {
                let fail = (result.trim() == "" || result.toLowerCase().indexOf(args.params.authFail) != -1);
                if (fail) {
                    currentToken = "";
                    failCallBack();
                } else {
                    currentToken = result;
                    passCallBack();
                }
            }
        }, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa("auth" + authKey));
        });
    }

    function closeSessionCore(callback = () => { }) {
        postAction(pathToUrl("."), {}, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa("close" + currentToken));
        });
        currentToken = "";
        callback();
    }

    function getAuthStat() {
        return (currentToken != "");
    }

    function getMonitor(callback = (info) => { }) {
        let url = pathToUrl(".", (parts) => {
            parts.query.method = "monitor";
        });
        getAction(url, (result) => {
            try { callback(JSON.parse(result)); }
            catch (err) {
                console.log(err);
                console.log("Error Get Info, Received:", result);
            }
        });
    }

    function mkdirCore(path = "", callbacks = {}) {
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "mkdir";
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function mkfileCore(path = "", content = "", callbacks = {}) {
        let blob = new Blob([content], { type: 'text/plain' });
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "mkfile";
        });
        let postData = new FormData();
        postData.append("file", blob);
        postAction(url, callbacks, postData, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function removeCore(path = "", callbacks = {}) {
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "remove";
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function renameCore(path = "", dstPath = "", callbacks = {}) {
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "rename";
            parts.query.destpath = encodePath(dstPath);
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function copytoCore(path = "", dstPath = "", callbacks = {}) {
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "copyto";
            parts.query.destpath = encodePath(dstPath);
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function archiveCore(path = "", dstPath = "", format = "zip", callbacks = {}) {
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "archive";
            parts.query.format = format; // zip or targz
            parts.query.destpath = encodePath(dstPath);
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function uploadFile(file = null, path = "", callback = (progress, status) => { return false; }) {
        // status: md5, upload, authFail, exist, fail, finish, stop; progress: [0-1]; -1; callback return stop=false/true
        let chunks = Math.ceil(file.size / args.params.chunkSize);
        let filepath = path + "/" + file.name;
        let merged = new Uint8Array(new ArrayBuffer(1)).fill(0); // 0: false, 1: true;
        let chunkStats = new Int8Array(new ArrayBuffer(chunks)).fill(-1); // -1: not uploaded, 1: upload finished; 0-1: on upload;
        let fileMd5 = "";
        let md5File = (file = null, progressCallBack = (cur, total, md5) => { return false; }, errCallBack = (err) => { }) => {
            let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
            let chunks = Math.ceil(file.size / args.params.chunkSize);
            let currentChunk = 0;
            let spark = new SparkMD5.ArrayBuffer();
            let fileReader = new FileReader();
            let loadNext = () => {
                let start = currentChunk * args.params.chunkSize;
                let end = ((start + args.params.chunkSize) >= file.size) ? file.size : start + args.params.chunkSize;
                fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
            }
            fileReader.onerror = errCallBack;
            fileReader.onload = (e) => {
                spark.append(e.target.result);
                let md5 = "";
                let stop = progressCallBack(currentChunk, chunks, md5);
                if (stop != undefined && stop) {
                    progressCallBack(currentChunk, chunks, "stop");
                    return;
                };
                currentChunk++;
                if (currentChunk < chunks)
                    loadNext();
                else {
                    md5 = spark.end();
                    progressCallBack(currentChunk, chunks, md5);
                }

            };
            loadNext();
        }

        let uploadCheck = (fileMd5 = "", chunks = 0, path = "", callback = (exist, finishList) => { }) => {
            let url = pathToUrl(path, (parts) => {
                parts.query.method = "check";
                parts.query.fileMd5 = fileMd5;
                parts.query.chunks = chunks.toString();
            });
            postAction(url, {
                info: (result) => {
                    let finishList = JSON.parse(result);
                    callback(finishList[0] != "", finishList.slice(1).map(function (item) { return Number(item); }));
                }
            }, null, (xhr)=> {
                xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
            });
        }

        let uploadChunk = (fileMd5 = "", currentChunk = 0, file = null, path = "", callbacks = {}) => {
            let url = pathToUrl(path, (parts) => {
                parts.query.method = "chunk";
                parts.query.fileMd5 = fileMd5;
                parts.query.currentChunk = currentChunk.toString();
            });
            let start = currentChunk * args.params.chunkSize;
            let end = start + args.params.chunkSize;
            if (end > file.size)
                end = file.size;
            let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
            let chunkData = blobSlice.call(file, start, end); // should not be an array
            let postData = new FormData();
            postData.append(currentChunk, chunkData);
            postAction(url, callbacks, postData, function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
                xhr.upload.onprogress = (evt) => { callbacks.progress(evt.loaded / evt.total); };
            });
        }

        let uploadMerge = (fileMd5 = "", chunks = 0, path = "", callbacks = {}) => {
            let url = pathToUrl(path, (parts) => {
                parts.query.method = "merge";
                parts.query.fileMd5 = fileMd5;
                parts.query.chunks = chunks.toString();
            });
            postAction(url, callbacks, null, (xhr)=> {
                xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
            });
        }

        let uploadPieces = () => {
            let current = -1;
            while (true) {
                // when thread A and B together get current = c, c != -1, 
                // then who get -1 in compareExchange can use current = c, while the other need to find next
                current = chunkStats.findIndex(function (item) { return (item == -1); });
                if (current == -1)
                    break; // all in chunckStats are not -1
                else if (Atomics.compareExchange(chunkStats, current, -1, 0) == -1)
                    break; // current is valid
            }
            let progress = 0;
            for (let j = 0; j < chunkStats.length; j++)
                if (chunkStats[j] != -1)
                    progress += chunkStats[j];
            let stop = callback(progress / chunkStats.length, "upload");
            if (stop != undefined && stop) {
                callback(progress / chunkStats.length, "stop");
                return;
            } else if (current == -1) {
                // when the last thread finish, all chunkStats are filled with 1
                // when two threads finished at the same time, they will need to exchange merged
                if (chunkStats.findIndex(function (item) { return (item != 1); }) == -1) {
                    if (Atomics.compareExchange(merged, 0, 0, 1) == 0)
                        checkMerge();
                }
            } else {
                uploadChunk(fileMd5, current, file, filepath, {
                    pass: function () { Atomics.exchange(chunkStats, current, 1); uploadPieces(); },
                    fail: function () { Atomics.exchange(chunkStats, current, -1); callback(-1, "fail"); },
                    exist: function () { Atomics.exchange(chunkStats, current, -1); callback(-1, "fail"); },
                    progress: function (prog) {
                        Atomics.exchange(chunkStats, current, prog);
                        let progress = 0;
                        for (let j = 0; j < chunkStats.length; j++)
                            if (chunkStats[j] != -1)
                                progress += chunkStats[j];
                        callback(progress / chunkStats.length, "upload");
                    },
                });
            }
        }

        let checkUpload = () => {
            uploadCheck(fileMd5, chunks, filepath, function (exist, finishList) {
                if (exist) {
                    callback(1, "exist");
                    return;
                } else {
                    let progress = 0;
                    for (let j = 0; j < chunks; j++) {
                        if (finishList.indexOf(j) != -1) {
                            Atomics.exchange(chunkStats, j, 1);
                            progress += 1;
                        }
                    }
                    callback(progress / chunkStats.length, "upload");
                    // upload concurrently
                    for (let i = 0; i < args.params.uploadConcurrent; i++)
                        uploadPieces();
                }
            });
        }

        let checkMerge = () => {
            uploadCheck(fileMd5, chunks, filepath, function (exist, finishList) {
                if (exist) {
                    callback(-1, "exist");
                    return;
                } else {
                    let progress = 0;
                    for (let j = 0; j < chunks; j++) {
                        if (finishList.indexOf(j) != -1)
                            progress += 1;
                    }
                    if (progress == chunks) {
                        uploadMerge(fileMd5, chunks, filepath, {
                            pass: function () { callback(-1, "finish"); },
                            fail: function () { callback(-1, "fail"); },
                            exist: function () { callback(-1, "exist"); },
                        });
                    } else {
                        setTimeout(checkMerge, 1000);
                    }
                }
            });
        }

        md5File(file, function (currentMd5Chunk, md5Chunks, md5) {
            if (md5 == "stop") {
                callback(currentMd5Chunk / md5Chunks, "stop");
            } else if (currentMd5Chunk < md5Chunks) {
                return callback(currentMd5Chunk / md5Chunks, "md5");
            } else {
                fileMd5 = md5;
                callback(currentMd5Chunk / md5Chunks, "md5");
                checkUpload();
            }
        });
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        htmltoElement: htmltoElement,
        insertStyleHtml: insertStyleHtml,
        pathToUrl: pathToUrl,
        urlToPath: urlToPath,
        download: download,
        openFolder: openFolder,
        askAuthCore: askAuthCore,
        closeSessionCore: closeSessionCore,
        getAuthStat: getAuthStat,
        getMonitor: getMonitor,
        mkdirCore: mkdirCore,
        mkfileCore: mkfileCore,
        removeCore: removeCore,
        renameCore: renameCore,
        copytoCore: copytoCore,
        archiveCore: archiveCore,
        uploadFile: uploadFile,
    }
}

function MainView(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {
            windowPush: true, historyMode: false, 
            exIframes: {}, exLinks: {}, // {name: src,...}
        },
        style: {
            basicSize: "14px", topTitle: "MikoSite", tableItemChose: "rgba(255,255,200,0.75)",
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.style = '\
        .mainBox {overflow:hidden;position:absolute;top:0;right:0;bottom:0;left:0;\
            font-size:' + args.style.basicSize + ';}\
        .viewBox {overflow:hidden;position:absolute;top:3em;right:0;bottom:0;left:0;}\
        .headLine {position:absolute;top:0;right:0;left:0;padding:0.5em;\
            background:#fefefe;box-shadow:6px 0px 6px #ddd;}\
        .headTitle {float:left;padding:0 0.5em;cursor:pointer;color:#ead;font-weight:600;font-size:1.4em;}\
        ._headMenu {display:flex; overflow: auto;flex-direction:row-reverse;}\
        .headMenu {display:flex; overflow: auto;}\
        .headMenu .item {cursor:pointer; border-radius:0.5em;border:2px solid #eee;padding:0.2em 1em;\
            margin:0 0.2em;background:#f4f4f4;font-weight:600;font-size:1em;}\
        ';
        args.htmlParts.main = '\
        <div class="mainBox">\
        <div class="headLine"><div class="headTitle">' + args.style.topTitle + '</div>\
        <div class="_headMenu"><div class="headMenu">\
        </div></div></div><div class="viewBox"</div></div>';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let filePreviewList = []; // [/xxx,/xxx/xxx] in path decoded
    let isMonitorOpen = false;
    let viewType = {
        "pdf": [".pdf"],
        "html": [".html", ".xhtml", ".shtml", ".htm", ".url", ".xml"],
        "markdown": [".md", ".MD"],
        "text": [".py", ".js", ".json", ".php", ".phtml", ".h", ".c", ".hpp", ".cpp", ".class", ".jar", ".java", ".css", ".sass", ".scss", ".less", ".xml", ".bat", ".BAT", ".cmd", ".sh", ".ps", ".m", ".go", ".txt", ".cnf", ".conf", ".map", ".yaml", ".ini", ".nfo", ".info", ".log", ".yml"],
        "image": [".bmp", ".png", ".tiff", ".tif", ".gif", ".jpg", ".jpeg", ".jpe", ".psd", ".ai", ".ico", ".webp", ".svg", ".svgz", ".jfif"],
        "audio": [".aac", ".aif", ".aifc", ".aiff", ".ape", ".au", ".flac", ".iff", ".m4a", ".mid", ".mp3", ".mpa", ".ra", ".wav", ".wma", ".f4a", ".f4b", ".oga", ".ogg", ".xm", ".it", ".s3m", ".mod"],
        "video": [".asf", ".asx", ".avi", ".flv", ".mkv", ".mov", ".mp4", ".mpg", ".rm", ".srt", ".swf", ".vob", ".wmv", ".m4v", ".f4v", ".f4p", ".ogv", ".webm"]
    };
    if (args.params.windowPush) {
        window.addEventListener('popstate', function (evt) {
            try { openFolder(adminCore.urlToPath(evt.state.url)); } catch (err) { }
        });
    }

    let chooseIcon = SVGIcons().chooseIcon;
    let adminCore = AdminCore({ authFailCallBack: () => { popMenu.appendMessage("fail", "Authorization Fail"); } });
    let imanager = InnerManager({ box: document.body.appendChild(document.createElement('div')), zIndexRange: [10, 100] });
    let popMenu = PopupMenu({ box: document.body.appendChild(document.createElement('div')), zIndex: 100, });
    let adminView = AdminViewer({ adminCore: adminCore, popMenu: popMenu, iView: imanager.newView("24em", "80%"), PView: PageViewer });
    let pageView = PageViewer({
        box: args.box.querySelector('.viewBox'),
        chooseIcon: chooseIcon,
        openPath: (path, isFolder) => {
            if (isFolder)
                openFolder(path);
            else
                __openMedia(path);
        },
        sortCallBack: (currentInfo) => {
            filePreviewList = currentInfo.FileNodes.map((info) => { return info.path; });
        },
        menuAction: (info, node, thisFolder) => { infopart.genInfo(info, node, thisFolder); },
        logAction: (button) => {
            button.innerText = "IN";
            button.onclick = function () {
                let button = this;
                adminView.login((button.innerText == "IN"), function () {
                    button.innerText = "OUT";
                }, function () {
                    button.innerText = "IN";
                });
            };
        }
    });
    let infoObj = imanager.buildView({
        width: "22em", height: "44em", title: "info", btnshow: ["min", "max", "exit"],
        exit: () => { infopart.setChooseMode(false); infoObj.iview.hide("hide"); }
    });
    let infopart = InfoViewer({
        box: infoObj.ibox, adminView: adminView,
        pathToUrl: (path) => { return adminCore.pathToUrl(path); },
        getAuthStat: () => { return adminCore.getAuthStat(); },
        refresh: () => { openFolder(); infoObj.itools.exitBtn.click(); },
        tagChosen: (signEle, tag = true) => {
            let bg = (tag) ? args.style.tableItemChose : "";
            signEle.style.background = bg;
        },
        changeCallBack: () => {
            infoObj.iview.hide("show");
            infoObj.iview.setView("22em", infoObj.ibox.getBoundingClientRect().height + 1.5 * infoObj.itools.titleBar.getBoundingClientRect().height + "px");
        },
    });
    let _monitorView = MonitorView;
    let _codeViewer = CodeViewer;
    let _musicPlayer = MusicPlayer;
    let _videoPlayer = VideoPlayer;
    let __openMedia = (path = "") => { }
    setTimeout(buildMediaviewers, 100);
    setTimeout(buildMonitor, 100);
    setTimeout(buildExframes, 100);
    setTimeout(buildLinks, 100);

    function buildMonitor() {
        var monitorObj = imanager.buildView({
            width: "90%", height: "90%", title: "monitor", btnShow: ["min", "max", "exit"],
            exit: () => { monitor.close(); monitorObj.iview.hide("hide"); isMonitorOpen = false; },
        });
        let monitor = _monitorView({ box: monitorObj.ibox, getMonitor: (callback) => { return adminCore.getMonitor(callback); } });
        args.box.querySelector(".headTitle").onclick = () => {
            if (!isMonitorOpen) {
                monitor.open(); monitorObj.iview.hide("show"); isMonitorOpen = true;
            } else {
                monitor.close(); monitorObj.iview.hide("hide"); isMonitorOpen = false;
            }
        }
    }
    function buildMediaviewers() {
        // previews ==================== //
        function nextPath(type = ["plain"], tag = "next", path = "") {
            function getType(path) {
                let type = "plain";
                let suffix = path.slice(path.lastIndexOf("."));
                for (let t in viewType) {
                    if (viewType[t].includes(suffix)) {
                        type = t;
                        break;
                    }
                }
                return type;
            }

            let pathList = filePreviewList;
            let pos = pathList.indexOf(path);
            if (pos == -1)
                return { path: path, tag: "", type: "" };
            else if (tag == "prev") {
                for (let i = 0; i < pathList.length; i++) {
                    if (pos == 0)
                        pos = pathList.length - 1;
                    else
                        pos = pos - 1;
                    for (let j = 0; j < type.length; j++)
                        if (getType(pathList[pos]) == type[j])
                            return { path: pathList[pos], tag: "prev", type: type[j] };
                }
                return { path: path, tag: "", type: "" };
            } else {
                for (let i = 0; i < pathList.length; i++) {
                    if (pos == pathList.length - 1)
                        pos = 0;
                    else
                        pos = pos + 1;
                    for (let j = 0; j < type.length; j++)
                        if (getType(pathList[pos]) == type[j])
                            return { path: pathList[pos], tag: "next", type: type[j] };
                }
                return { path: path, tag: "", type: "" };
            }
        }

        function genViewer(width = "90%", height = "90%", iBox = null, types = [], btnShow = [], startAction = null, stopAction = null) {
            let iobj = imanager.buildView({
                box: iBox, width: width, height: height, title: types[0], btnShow: btnShow,
                prev: () => { startView(iobj.itools._path, "", "", "prev", types); },
                next: () => { startView(iobj.itools._path, "", "", "next", types); },
                down: () => { adminCore.download(iobj.itools._path); },
                exit: () => { stopAction(iobj.itools._path); iobj.iview.hide("hide"); },
            });
            let startView = (path = "", type = "", tag = "", next = "", types = []) => {
                if (next == "prev" || next == "next") {
                    let tmp = nextPath(types, next, path);
                    path = tmp.path;
                    type = tmp.type;
                    tag = tmp.tag;
                }
                try {
                    startAction(path, type, tag);
                    iobj.itools._path = path;
                    iobj.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
                    iobj.iview.hide("show");
                } catch (error) { }
            }
            return startView;
        }

        // music player ====================//
        let musicObj = imanager.buildView({
            width: "22em", height: "44em", title: "Muse", btnShow: ["down", "min", "exit"],
            down: () => { adminCore.download(musicPlayer.getPlayPath()); },
            exit: () => { musicPlayer.playStop(); musicObj.iview.hide("hide"); },
        });
        let musicPlayer = _musicPlayer({ "box": musicObj.ibox, pathToUrl: (path) => { return adminCore.pathToUrl(path); } });
        let __audiocheck = (path) => {
            if (musicPlayer.thisPos(path) == -1) {
                musicPlayer.setPlayList(filePreviewList, true);
                if (musicPlayer.thisPos(path) == -1)
                    musicPlayer.setPlayList([path], true);
            }
        }
        let __audiostart = (path, type, tag) => {
            musicPlayer.playThis(path);
            musicObj.iview.hide("show");
        };

        // video player ====================//
        let videoBox = document.createElement('div');
        let videoPlayer = _videoPlayer({ "box": videoBox, pathToUrl: (path) => { return adminCore.pathToUrl(path); } });
        let __videostart = genViewer("90%", "90%", videoBox,
            ["video"], ["prev", "next", "down", "min", "max", "exit"],
            function (path, type, tag) { videoPlayer.playThis(path); },
            function () { videoPlayer.playStop(); }
        );

        // code viewer ====================//
        let codeBox = document.createElement('div');
        let codeView = _codeViewer({ "box": codeBox, pathToUrl: (path) => { return adminCore.pathToUrl(path); } });
        let __codestart = genViewer("90%", "90%", codeBox,
            ["markdown", "text"], ["prev", "next", "down", "min", "max", "exit"],
            function (path, type, tag) { codeView.showCode(adminCore.pathToUrl(path), (type == "markdown")); },
            function () { }
        );

        // image viewer ====================//
        let imageHtml = '<div style="text-align:center;width:100%;height:95%;"><img src="" style="max-width:100%;max-height:100%;"></img></div>';
        let imageBox = htmltoElement(imageHtml);
        let __imagestart = genViewer("90%", "90%", imageBox,
            ["image"], ["prev", "next", "down", "min", "max", "exit"],
            function (path, type, tag) { imageBox.querySelector('img').src = adminCore.pathToUrl(path); },
            function () { }
        );

        // pdf viewer ============================= //
        // let pdfHtml = '<div style="width:100%;height:100%;position:absolute;"><embed src="" style="overflow:auto;height:100%;width:100%;"/></div>'
        let pdfHtml = '<div style="width:100%;height:100%;position:absolute;"><iframe src="" frameborder=0 style="height:100%;width:100%;"/></div>';
        let pdfBox = htmltoElement(pdfHtml);
        let __pdfstart = genViewer("90%", "90%", pdfBox,
            ["pdf"], ["prev", "next", "down", "min", "max", "exit"],
            function (path, type, tag) { pdfBox.querySelector('iframe').src = "/outLibs/pdfjs/web/viewer.html" + '?file=' + encodeURIComponent(adminCore.pathToUrl(path)); },
            function () { }
        );

        // html viewer =========================//
        let htmlHtml = '<div style="width:100%;height:100%;position:absolute;"><iframe src="" frameborder=0 style="height:100%;width:100%;"/></div>';
        let htmlBox = htmltoElement(htmlHtml);
        let __htmlstart = genViewer("90%", "90%", htmlBox,
            ["html"], ["prev", "next", "down", "min", "max", "exit"],
            function (path, type, tag) { htmlBox.querySelector('iframe').src = adminCore.pathToUrl(path); },
            function () { }
        );

        // plain viewer ============================//
        let plainHtml = '<div style="text-align:center;width:100%;height:95%;font-size:1.2em;padding:1em;"><br><br>binary file<br><br><a><a></div>';
        let plainBox = htmltoElement(plainHtml);
        let __plainstart = genViewer("90%", "90%", plainBox,
            ["plain"], ["prev", "next", "down", "min", "max", "exit"],
            function (path, type, tag) {
                plainBox.querySelector('a').href = adminCore.pathToUrl(path);
                plainBox.querySelector('a').innerText = adminCore.pathToUrl(path);
            },
            function () { }
        );

        __openMedia = (path = "") => {
            let type = "plain";
            let suffix = path.slice(path.lastIndexOf("."));
            for (let t in viewType) {
                if (viewType[t].includes(suffix)) {
                    type = t;
                    break;
                }
            }
            __audiocheck(path);
            switch (type) {
                case "audio":
                    __audiostart(path, type, "");
                    break;
                case "video":
                    __videostart(path, type, "");
                    break;
                case "markdown": case "text":
                    __codestart(path, type, "");
                    break;
                case "image":
                    __imagestart(path, type, "");
                    break;
                case "pdf":
                    __pdfstart(path, type, "");
                    break;
                case "html":
                    __htmlstart(path, type, "");
                    break;
                default:
                    __plainstart(path, type, "");
                    break;
            }
        }

    }
    function buildExframes() {
        for (let key in args.params.exIframes) {
            let node = htmltoElement(args.htmlParts.fix("<div class='item'>" + key + "</div>"));
            node.__box = '<div style="width:100%;height:100%;position:absolute;"><iframe src="" frameborder=0 style="height:100%;width:100%;"/></div>';
            node.__box = htmltoElement(node.__box);
            node.__src = args.params.exIframes[key];
            node.__open = false;
            node.__ipage = node.__box.querySelector("iframe");
            node.__iview = imanager.newView();
            node.__itool = node.__iview.draw(node.__box, key, ["min", "max", "exit"]);
            node.__iview.hide("hide");
            node.__iview.setView("90%", "90%");
            node.__itool.exitBtn.__node = node;
            node.__itool.exitBtn.onclick = function () {
                let node = this.__node;
                node.__ipage.src = "";
                node.__open = false;
                node.__iview.hide("hide");
            };
            node.__startview = function () {
                let node = this;
                node.__ipage.src = node.__src;
                node.__open = true;
                node.__iview.hide("show");
            };
            node.onclick = function () {
                let node = this;
                if (!node.__open) node.__startview();
            };
            args.box.querySelector(".headMenu").appendChild(node);
        }
    }
    function buildLinks() {
        for (let key in args.params.exLinks) {
            let node = htmltoElement(args.htmlParts.fix("<div class='item'>" + key + "</div>"));
            node.style.background = "#eef";
            node.__src = args.params.exLinks[key];
            node.onclick = function () { window.open(this.__src); }
            args.box.querySelector(".headMenu").appendChild(node);
        }
    }
    function openFolder(path = "") {
        adminCore.openFolder(path, true, function (info) {
            pageView.updateInfo(info);
            // update history, not activated by window.onpopState
            if (!args.params.historyMode && args.params.windowPush) {
                window.history.pushState({
                    "title": null, "url": adminCore.pathToUrl(info.Path)
                }, null, adminCore.pathToUrl(info.Path));
            }
        });
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        refresh: openFolder,
    }
}

let htmltoElement = AdminCore().htmltoElement;
let insertStyleHtml = AdminCore().insertStyleHtml;
