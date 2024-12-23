"use strict"

function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
}

function FileViewer(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
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
        styles: {
            basicSize: "14px", colWidth: ['55%', '25%', '20%'], colmenu_display: "block",
            ctrlHeadColor: "rgba(255,255,255,0.2)", pathHeadColor: "rgba(120,120,180,0.25)",
            listItemColor: "rgba(255,255,255,0.5)", listItemHover: "rgba(196,196,196,0.75)",
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let currentInfo = {};
    // {Name:"", Size:"", Mode:"", Mtim:"", Ctim:"", Path:"", IsDir:true, FileNum:"", FolderNum:""} 
    // + {FileNodes:[], FolderNodes:[]}
    let currentPath = ""; // /xx/xxx/xxx with URIDecoded
    let fileList = [], folderList = [];
    let nameOrder = false, timeOrder = false, sizeOrder = false; // false means sort small -> big
    let container = shadow_module.shadowRoot.querySelector(".listTable");
    let pathHead = container.querySelector(".pathHead");
    let pathChain = pathHead.querySelector(".pathChain");
    let ctrlHead = container.querySelector(".ctrlHead");
    let listPage = container.querySelector(".listPage");
    let listParent = listPage.querySelector(".parent");
    let listFolder = listPage.querySelector(".folder");
    let listFile = listPage.querySelector(".file");
    let template = listPage.querySelector(".padding .item")

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
            let item_html = template.innerHTML;
            // item.Path = currentPath.replace(/(\/$)/g, "") + "/" + item.Name;
            item.IsDir = (item.FileNum != "");
            item_html.replace("__DATA_RAW__", encodeURIComponent(JSON.stringify(item)))
            item_html.replace("__DATA_ICON__", args.params.chooseIcon(item.Name, item.IsDir))
            item_html.replace("__DATA_NAME__", item.Name)
            item_html.replace("__DATA_TIME__", new Date(Number(item.Mtim + "000")).toISOString().slice(0, -5))
            item_html.replace("__DATA_SIZE__", formatSize(Number(item.Size)))
            return item_html;
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
