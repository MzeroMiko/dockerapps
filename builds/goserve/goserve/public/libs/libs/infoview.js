"use strict"

function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
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
            tableHtml.replace("__INFO_NAME__", info.Name)
            tableHtml.replace("__INFO_SIZE__", formatSize(info.Size))
            tableHtml.replace("__INFO_MODE__", info.Mode)
            tableHtml.replace("__INFO_ISDIR__", info.IsDir)
            tableHtml.replace("__INFO_MTIME__", new Date(Number(info.Mtim + "000")).toISOString())
            tableHtml.replace("__INFO_CTIME__", new Date(Number(info.Ctim + "000")).toISOString())
            tableHtml.replace("__INFO_FINUM__", info.FileNum)
            tableHtml.replace("__INFO_FONUM__", info.FolderNum)
            tableHtml.replace("__INFO_PATH__", info.Path)
            tableHtml.replace("__INFO_LINK__", args.params.pathToUrl(info.Path))
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

