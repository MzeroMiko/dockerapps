"use strict"

function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
}

function LoginPage() {
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
}

function AdminViewer(opts = {}) {
    let args = {
        box: document.createElement('div'),
        html: opts.html,
        fileviewer_html: opts.fileviewer_html,
        params: {
            adminCore: {}, popMenu: {}, iView: {}, PView: (opts)=>{ return {}},
        },
        styles: {
            upFontColor: "#777", upProgColor: "#cce",
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let authTimeHandler;
    let upBox = document.createElement("div");
    let _upItemHtml = shadow_module.shadowRoot.querySelector(".padding")
    _upItemHtml.remove()
    let upItemHtml = _upItemHtml.innerHTML;
    let moveBox = document.createElement("div");
    let movePage = args.params.PView({ 
        box: moveBox, 
        html: fileviewer_html,
        colname_width: "100%",
        coltime_width: "0%",
        colsize_width: "0%",
        colmenu_display: "none", 
    });

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
    // function download(chosenFiles = []) {
    //     chosenFiles.slice(0).forEach((path, index) => {
    //         setTimeout(() => { args.params.adminCore.download(path); }, 800 * index);
    //     });
    // }
    // function mkdir(dirPath = "", finishCallBack = () => { }) {
    //     args.params.popMenu.appendMessage("input", "New Directory", "", (name) => {
    //         args.params.adminCore.mkdirCore(dirPath + "/" + name, popTemplates("mkdir " + name, finishCallBack));
    //     });
    // }
    // function rename(chosenPath = [], finishCallBack = () => { }) {
    //     chosenPath.slice(0).forEach((srcPath) => {
    //         let srcName = srcPath.slice(srcPath.lastIndexOf("/") + 1);
    //         args.params.popMenu.appendMessage("input", "rename " + srcName, srcName, (dstName) => {
    //             let dstPath = srcPath.slice(0, srcPath.lastIndexOf("/") + 1) + dstName;
    //             args.params.adminCore.renameCore(srcPath, dstPath, popTemplates("rename " + srcName + " to " + dstName, finishCallBack));
    //         });
    //     });
    // }
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
    // function mkfile(dirPath = "", finishCallBack = () => { }) {
    //     args.params.popMenu.appendMessage("input", "New File ", "", (name) => {
    //         let plainHtml = '<div style="position:relative;width:100%;height:100%;padding:1em;outline:none; overflow:auto;" contenteditable="true"></div>';
    //         let plainBox = htmltoElement(plainHtml);
    //         let tools = args.params.iView.draw(plainBox, "write to " + name, ["down", "exit"]);
    //         tools.exitBtn.onclick = () => { args.params.iView.hide("hide"); };
    //         tools.downBtn.onclick = () => {
    //             let content = plainBox.innerText;
    //             args.params.adminCore.mkfileCore(dirPath + "/" + name, content, popTemplates("mkfile " + name, finishCallBack));
    //             args.params.iView.hide("hide");
    //         };
    //     });
    // }
    function moveto(_chosenPath = [], finishCallBack = () => { }) {
        let openFolder = (path = "", isFolder = true) => {
            if (!isFolder)
                return;
            args.params.adminCore.openFolder(path, (info) => {
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
            args.params.adminCore.openFolder(path, (info) => {
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
        // download: download,
        // upload: upload,
        // mkdir: mkdir,
        // mkfile: mkfile,
        // rename: rename,
        // archive: archive,
        // remove: remove,
        // moveto: moveto,
        // copyto: copyto,
    }
}

function InfoViewer(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
        params: {
            adminView: null, refresh: () => { }, pathToUrl: (path) => { }, getAuthStat: () => { },
            tagChosen: (ele, tag) => { }, changeCallBack: () => { },
        },
        styles: {

        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let thisFolderInfo = {}, chooseMode = false, chosenFiles = [], chosenFolders = [];
    let menuBox0 = shadow_module.shadowRoot.querySelector(".menuBox0");
    let menuBox1 = shadow_module.shadowRoot.querySelector(".menuBox1");
    let menuBox2 = shadow_module.shadowRoot.querySelector(".menuBox2");
    let tableInfo = shadow_module.shadowRoot.querySelector(".tableInfo");
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
    let table_template = shadow_module.shadowRoot.querySelector(".padding")
    table_template.remove()

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

            let tableHtml = table_template.innerHTML
            tableHtml = tableHtml.replace("__INFO_NAME__", info.Name)
            tableHtml = tableHtml.replace("__INFO_SIZE__", formatSize(info.Size))
            tableHtml = tableHtml.replace("__INFO_MODE__", info.Mode)
            tableHtml = tableHtml.replace("__INFO_ISDIR__", info.IsDir)
            tableHtml = tableHtml.replace("__INFO_MTIME__", new Date(Number(info.Mtim + "000")).toISOString())
            tableHtml = tableHtml.replace("__INFO_CTIME__", new Date(Number(info.Ctim + "000")).toISOString())
            tableHtml = tableHtml.replace("__INFO_FINUM__", info.FileNum)
            tableHtml = tableHtml.replace("__INFO_FONUM__", info.FolderNum)
            tableHtml = tableHtml.replace("__INFO_PATH__", info.Path)
            tableHtml = tableHtml.replace("__INFO_LINK__", args.params.pathToUrl(info.Path))
            tableInfo.innerHTML = tableHtml;
            tableInfo.querySelectorAll("tr.folder_spec").style.display = ((info.IsDir) ? "" : "none");

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
