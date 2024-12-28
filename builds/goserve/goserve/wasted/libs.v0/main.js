"use strict"

function _factory(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {

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

    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
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

function PieProgress(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {
            speedTime: 8,
        },
        style: {
            basicSize: "120px", centerColor: "#fff", progressColor: "#ddd", noProgressColor: "#dadada",
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.style = '\
        .pieBox {margin:auto;overflow:hidden;height:1em;width:1em;position:relative;font-size:' + args.style.basicSize + ';}\
        .backCircle,.leftCircle,.rightCircle{position:absolute;border-radius:50%;height:1em;width:1em;}\
        .centerCircle,.centerInfo{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);}\
        .backCircle{background:' + args.style.progressColor + ';}\
        .leftCircle{background:' + args.style.noProgressColor + ';clip:rect(0,0.5em,1em,0);}\
        .leftCircle{background:' + args.style.noProgressColor + ';clip:rect(0,0.5em,1em,0);}\
        .rightCircle{background:' + args.style.noProgressColor + ';clip:rect(0,1em,1em,0.5em);}\
        .centerCircle{height:0.86em;width:0.86em;border-radius:50%;background:' + args.style.centerColor + ';}\
        .centerInfo{font-size:0.23em;font-weight:600;white-space:nowrap;}\
        ';
        args.htmlParts.main = '<div class="pieBox"><div class="backCircle"></div>\
        <div class="leftCircle"></div><div class="rightCircle"></div>\
        <div class="centerCircle"></div><div class="centerInfo">-%</div></div>\
        ';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let lastPercent = 0;
    let centerInfo = args.box.querySelector(".centerInfo");
    let rightCircle = args.box.querySelector(".rightCircle");

    function updateProg(percent) {
        function updatePie(current = 0, percent = 0) {
            let degree = 0;
            if (current == percent)
                return;
            if (current < percent)
                current++;
            else if (current > percent)
                current--;
            else
                current = percent;
            centerInfo.innerText = current + " %";
            if (current < 0)
                degree = 0;
            else if (current < 50)
                degree = current * 3.6;
            else if (current < 100)
                degree = current * 3.6 - 180;
            else
                degree = 180;
            rightCircle.style.transform = 'rotate(' + degree + 'deg' + ')';
            rightCircle.style.backgroundColor = (current < 50) ? args.style.noProgressColor : args.style.progressColor;
            setTimeout(function () { updatePie(current, percent); }, args.params.speedTime);
        }
        updatePie(lastPercent, percent);
        lastPercent = percent;
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        update: updateProg,
    }
}

function MonitorView(opts = {}) {
    let args = {
        box: ("box" in opts) ? opts.box : document.createElement('div'),
        params: {
            waitTime: 3000, getMonitor: (callback) => { },
        },
        style: {
            basicSize: "14px",
        },
        htmlParts: {
            style: "", main: "", fix: (str) => "",
        },
    }
    for (let key in opts) if (key in args.style) args.style[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    {
        args.htmlParts.style = '\
        .backdrop {position:absolute;overflow:auto;height:100%;width:100%;\
            font-size:' + args.style.basicSize + '}\
        .cardmain {box-sizing:border-box;overflow:hidden;}\
        .leftcol {width:21%;float:left;} .rightcol {overflow:hidden;}\
        .card {box-sizing:border-box;display:block;padding:0.8em;\
            margin:0.6em 0.6em;border-radius:0.4em;overflow:hidden;background-color:#fff;}\
        .card .title {font-size:1.2em;font-weight:600;}\
        .card .item {font-weight:600;text-align:center;color:#666;}\
        .card .info {font-size:1.1em;font-weight:600;text-align:center;}\
        .card .preinfo {font-weight:550;text-align:left;color:#333;\
            overflow:auto;white-space:pre;font-family:"consolas","monospace","serif",\
            "sans-serif","Segoe UI","Sans","Arial","Microsoft Yahei","Helvetica";}\
        .column2, .column3 {box-sizing:border-box;display:block;float:left;overflow:hidden;}\
        .column2 {width:50%;} .column3 {width:33.33333%;}\
        @media screen and (max-width:42em) {\
            .leftcol, .rightcol, .column2,.column3 {float:none;width:100%;padding:0;}}\
        ';
        args.htmlParts.cardGeneral = '\
        <div class="card uptime" style="background-color: #fed;">           \
        <div class="item">Uptime</div><div class="info">-</div></div>       \
        <div class="card distro" style="background-color: #ffd;">           \
        <div class="item">Distribution</div><div class="info">-</div></div> \
        <div class="card host" style="background-color: #efd;">             \
        <div class="item">Hostname</div><div class="info">-</div></div>     \
        <div class="card net" style="background-color: #dfd;">              \
        <div class="preinfo" style="height: 8em;"></div></div>              \
        <div class="card version" style="background-color: #def;">          \
        <div class="item">-</div></div>                                     ';
        args.htmlParts.cardMain3 = '\
        <div class="column3 cpu"><div class="card"><div class="title">Cpu</div>         \
        <div class="pie" style="padding-bottom: 1.5em;"></div><div class="info">-</div> \
        <div class="card" style="background-color: #ffe;">                              \
        <div class="preinfo" style="height: 12em;"></div></div></div></div>             \
        <div class="column3 mem"><div class="card"><div class="title">Memory</div>      \
        <div class="pie" style="padding-bottom: 1.5em;"></div><div class="info">-</div> \
        <div class="card" style="background-color: #efe;">                              \
        <div class="preinfo" style="height: 12em;"></div></div></div></div>             \
        <div class="column3 disk"><div class="card"><div class="title">Disk</div>       \
        <div class="pie" style="padding-bottom: 1.5em;"></div><div class="info">-</div> \
        <div class="card" style="background-color: #eef;">                              \
        <div class="preinfo" style="height: 12em;"></div></div></div></div>            ';
        args.htmlParts.cardTransmission = '\
        <div class="column3 rxSpeed">                                   \
        <div class="card" style="background-color: #eff; color: #333;"> \
        <div class="info">Rx Speed: 0 KB/s</div></div></div>            \
        <div class="column3 txSpeed">                                   \
        <div class="card" style="background-color: #eef; color: #333;"> \
        <div class="info">Tx Speed: 0 KB/s</div></div></div>            \
        <div class="column3 totalSpeed">                                \
        <div class="card" style="background-color: #fef; color: #333;"> \
        <div class="info">Total Speed: 0 KB/s</div></div></div>         ';
        args.htmlParts.main = '<div class="backdrop">\
        <div class="leftcol"><div class="card"><div class="title">General</div>\
        ' + args.htmlParts.cardGeneral + '</div>\
        </div><div class="rightcol">\
        <div class="cardmain">' + args.htmlParts.cardMain3 + '</div>\
        <div class="card" style="margin-top:0;">\
        <div class="title">Transmission</div>' + args.htmlParts.cardTransmission + '</div>\
        </div></div>\
        ';
    }
    args.htmlParts.fix = insertStyleHtml(args.box, args.htmlParts.style, args.htmlParts.main);

    let cpuPie = PieProgress({ box: args.box.querySelector(".cpu .pie"), progressColor: "#eda" });
    let memPie = PieProgress({ box: args.box.querySelector(".mem .pie"), progressColor: "#aed" });
    let diskPie = PieProgress({ box: args.box.querySelector(".disk .pie"), progressColor: "#aae" });
    let infoTimeout;
    let lastCpuIdles = [], lastCpuTotals = [], cpuUsages = [33];
    let lastRxBytes = 0, lastTxBytes = 0, lastTime = 0;

    // ===================================//
    function getInfo() {
        args.params.getMonitor((monitorInfo) => {
            function updateText(selector, info) {
                if (!info) info = "-";
                args.box.querySelector(selector).innerText = info;
            }

            function updateCpu(CpuInfo) {
                if (!CpuInfo) return;
                try {
                    let detailCpu = "core: " + CpuInfo.Core + "\n"
                        + "temp: " + (CpuInfo.Temperature ? CpuInfo.Temperature : "-") + " tC\n"
                        + "name: " + CpuInfo.Name + "\n";
                    let cpuTotals = JSON.parse(CpuInfo.Totals);
                    let cpuIdles = JSON.parse(CpuInfo.Idles);
                    if (cpuTotals.length != lastCpuTotals.length) {
                        lastCpuTotals = [], lastCpuIdles = [];
                        for (let i = 0; i < cpuTotals.length; i++) {
                            lastCpuTotals.push(0);
                            lastCpuIdles.push(0);
                        }
                    }
                    for (let i = 0; i < cpuTotals.length; i++) {
                        if (lastCpuTotals[i] != cpuTotals[i]) {
                            cpuUsages[i] = (cpuIdles[i] - lastCpuIdles[i]) / (cpuTotals[i] - lastCpuTotals[i]);
                            cpuUsages[i] = 100 - 100 * cpuUsages[i];
                            lastCpuIdles[i] = cpuIdles[i], lastCpuTotals[i] = cpuTotals[i];
                            if (i != 0)
                                detailCpu += "cpu" + i.toString() + ': ' + cpuUsages[i].toFixed(3) + '%\n';
                        }

                    }
                    cpuPie.update(Math.round(cpuUsages[0]));
                    updateText(".cpu .preinfo", detailCpu);
                    updateText(".cpu .info", "load: " + CpuInfo.Loadavg);
                } catch (err) { console.log(err); }
            }

            function updateMem(MemInfo) {
                if (!MemInfo) return;
                try {
                    let memTotal = MemInfo.MemTotal;
                    let memUsed = memTotal - MemInfo.MemFree - MemInfo.Cached;
                    let detailMem = "MemTotal: \t" + (memTotal >> 10) + " MB\n"
                        + "MemFree: \t" + (MemInfo.MemFree >> 10) + " MB\n"
                        + "MemCached: \t" + (MemInfo.Cached >> 10) + " MB\n"
                        + "SwapTotal: \t" + (MemInfo.SwapTotal >> 10) + " MB\n"
                        + "SwapFree: \t" + (MemInfo.SwapFree >> 10) + " MB\n"
                        + "SwapCached: \t" + (MemInfo.SwapCached >> 10) + " MB\n"
                        + "Buffers: \t" + (MemInfo.Buffers >> 10) + " MB\n";
                    memPie.update((memTotal) ? Math.round(100 * memUsed / memTotal) : 0);
                    updateText(".mem .info", (memUsed >> 10) + " / " + (memTotal >> 10) + " MB");
                    updateText(".mem .preinfo", detailMem);
                } catch (err) { console.log(err.toString()); }
            }

            function updateNet(Network) {
                if (!Network) return;
                try {
                    let netNumber = Network.length, detailNet = "";
                    let rxSpeed = 0, txSpeed = 0;
                    let rxBytes = 0, txBytes = 0, time = new Date().getTime();
                    for (let i = 0; i < netNumber; i++) {
                        let netInfo = Network[i];
                        rxBytes += Number(netInfo.RxBytes);
                        txBytes += Number(netInfo.TxBytes);
                        detailNet = detailNet
                            + "Devices: " + netInfo.Dev + "\n"
                            + "TotalRx: " + (Number(netInfo.RxBytes) / (1 << 30)).toFixed(3) + " GB\n"
                            + "TotalTx: " + (Number(netInfo.TxBytes) / (1 << 30)).toFixed(3) + " GB\n\n";
                    }
                    rxSpeed = (rxBytes - lastRxBytes) / (time - lastTime);
                    txSpeed = (txBytes - lastTxBytes) / (time - lastTime);
                    lastRxBytes = rxBytes; lastTxBytes = txBytes; lastTime = time;
                    updateText(".rxSpeed .info", "Rx Speed: " + rxSpeed.toFixed(2) + " KB/s");
                    updateText(".txSpeed .info", "Tx Speed: " + txSpeed.toFixed(2) + " KB/s");
                    updateText(".totalSpeed .info", "Total Speed: " + (rxSpeed + txSpeed).toFixed(2) + " KB/s");
                    updateText(".net .preinfo", detailNet);
                } catch (err) { console.log(err); }
            }

            function updateDisk(DiskInfo) {
                if (!DiskInfo) return;
                try {
                    diskPie.update(Math.round(DiskInfo.Usage));
                    updateText(".disk .info", "usage of / : " + DiskInfo.Usage + " %");
                    updateText(".disk .preinfo", DiskInfo.Detail);
                } catch (err) { console.log(err.toString()); }
            }

            try {
                updateCpu(JSON.parse(monitorInfo.CpuInfo));
                updateMem(JSON.parse(monitorInfo.MemInfo));
                updateNet(JSON.parse(monitorInfo.Network));
                updateDisk(JSON.parse(monitorInfo.DiskInfo));
                updateText(".uptime .info", monitorInfo.Uptime);
                updateText(".distro .info", monitorInfo.Distro);
                updateText(".host .info", monitorInfo.Host);
                updateText(".version .item", monitorInfo.Version);
            } catch (err) { console.log(err.toString()); }

            infoTimeout = setTimeout(() => { getInfo(); }, args.params.waitTime);
        });
    }

    function close() {
        clearTimeout(infoTimeout);
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        open: getInfo,
        close: close,
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
