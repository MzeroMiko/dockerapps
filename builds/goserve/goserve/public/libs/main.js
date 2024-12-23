"use strict"

function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
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
