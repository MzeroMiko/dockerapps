"use strict"

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

function Comm(opts) {
    let params = {
        prefix: "/home",
        useQueryPath: false,
        currentHost: window.location.origin,
    }
    for (let key in opts) if (key in params) params[key] = opts[key];

    function getUrlParts(iurl = "") {
        // asset url: currentHost + [/xxx] + [?a=x&b=x] + [#x]
        // asset no "?" or "&" or "=" in (a=)x
        let url = iurl.slice(params.currentHost.length);
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
        let url = params.currentHost + path + "?";
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

    function getAction(url = "", callback = (result) => { }, after_get=()=>{}) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Cache-Control", "no-cache"); // disable cache
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200)
                callback(xhr.responseText);
        };
        xhr.send(null);
        after_get();
    }

    function postAction(url = "", postData = null, addition = (xhr) => { }, callback=(result)=>{}, after_post=()=>{}) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Cache-Control", "no-cache"); // disable cache
        addition(xhr);
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200)
                callback(xhr.responseText);
        };
        xhr.send(postData);
        after_post();
    }

    function pathToUrl(path = "", currentParts, addtion = (parts) => { }) {
        // assert path = /x/x/x or / is URIDecoded
        let parts = { path: currentParts.path, query: {}, hash: currentParts.hash };
        for (let key in currentParts.query)
            parts.query[key] = currentParts.query[key];
        // When the first time to start without query.path:
        if (params.useQueryPath && !("path" in parts.query))
            parts.query.path = encodePath("/");
        // when path == "", do not change path
        if (path != "" && path != ".") {
            if (params.useQueryPath)
                parts.query.path = encodePath(path == ""? "/": path);
            else {
                let _prefix = params.prefix;
                _prefix = (_prefix.slice(0,1) == "/")? _prefix : "/" + _prefix;
                _prefix = (_prefix.slice(-1) == "/")? _prefix.slice(0, -1): _prefix; // like "/home" but not "home" or "/home/"
                parts.path = encodePath(path);
                parts.path = (parts.path.slice(0, 1) == "/")? _prefix + parts.path: _prefix + "/" + parts.path;
            }
        }
        addtion(parts);
        return mergeUrlParts(parts.path, parts.query, parts.hash);
    }

    function urlToPath(url = "", currentParts) {
        if (params.useQueryPath)
            return decodePath((url == "") ? currentParts.query.path : getUrlParts(url).query.path);
        let rawpath = decodePath((url == "") ? currentParts.path : getUrlParts(url).path);
        let _prefix = params.prefix;
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

    return {
        getArgs: () => { return params; },
        setArgs: (opts) => { for (let key in opts) if (key in params) params[key] = opts[key]; },
        getUrlParts: getUrlParts,
        getAction: getAction,
        postAction: postAction,
        encodePath: encodePath,
        pathToUrl: pathToUrl,
        urlToPath: urlToPath,
    }
}

function AdminCore(opts = {}) {
    let args = {
        params: {
            prefix: "/home",
            reAuthTime: 5, useQueryPath: false,
            authFail: "authFail", signPass: "pass", signExist: "exist", signFail: "fail",
            chunkSize: 2 << 20, // 2MB 
            uploadConcurrent: 3, // max concurrent
            currentHost: window.location.origin,
            currentParts: {},
        },
    }
    let params = args.params
    let comm = Comm(args.params)
    params.currentParts = comm.getUrlParts(window.location.href); // when assignned, dict is refered as a point, not value!
    for (let key in opts) if (key in params) params[key] = opts[key];

    let authTimeOut = new Number();
    let currentToken = "";

    
    function postAction(url = "", callbacks = {}, postData = null, addition = (xhr) => { }) {
        let signs = {
            authFail: params.authFail,
            pass: params.signPass,
            fail: params.signFail,
            exist: params.signExist,
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

        let after_post = () =>{
            try { clearTimeout(authTimeOut); } catch (err) { }
            authTimeOut = setTimeout(() => { closeSessionCore(); }, params.reAuthTime * 60000);
        }
        comm.postAction(url, postData, addition, parseSigns, after_post)
    }

    function pathToUrl(path = "", addtion = (parts) => { }) {
        return comm.pathToUrl(path, params.currentParts, addtion)
    }

    function urlToPath(url = "") {
        return comm.urlToPath(url, params.currentParts)
    }

    function download(path = "") {
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "getfile";
        });
        window.open(url, "_self");
    }

    function openFolder(path = "", callback = (info) => { }) {
        let newParts = {};
        let url = comm.pathToUrl(path, params.currentParts, (parts) => {
            parts.query.method = "getdir";
            newParts = parts;
        });
        comm.getAction(url, (result) => {
            // if (updateCurrentPath) {
            //     params.currentParts.path = newParts.path;
            //     params.currentParts.query.path = newParts.query.path;
            //     params.currentParts.hash = newParts.hash;
            // }
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
                let fail = (result.trim() == "" || result.toLowerCase().indexOf(params.authFail) != -1);
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
        let url = comm.pathToUrl("/home", params.currentParts, (parts) => {
            parts.query.method = "monitor";
        })
        comm.getAction(url, (result) => {
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
            parts.query.destpath = comm.encodePath(dstPath);
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function copytoCore(path = "", dstPath = "", callbacks = {}) {
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "copyto";
            parts.query.destpath = comm.encodePath(dstPath);
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function archiveCore(path = "", dstPath = "", format = "zip", callbacks = {}) {
        let url = pathToUrl(path, (parts) => {
            parts.query.method = "archive";
            parts.query.format = format; // zip or targz
            parts.query.destpath = comm.encodePath(dstPath);
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function uploadFile(file = null, path = "", callback = (progress, status) => { return false; }) {
        // status: md5, upload, authFail, exist, fail, finish, stop; progress: [0-1]; -1; callback return stop=false/true
        let chunks = Math.ceil(file.size / params.chunkSize);
        let filepath = path + "/" + file.name;
        let merged = new Uint8Array(new ArrayBuffer(1)).fill(0); // 0: false, 1: true;
        let chunkStats = new Int8Array(new ArrayBuffer(chunks)).fill(-1); // -1: not uploaded, 1: upload finished; 0-1: on upload;
        let fileMd5 = "";
        let md5File = (file = null, progressCallBack = (cur, total, md5) => { return false; }, errCallBack = (err) => { }) => {
            let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
            let chunks = Math.ceil(file.size / params.chunkSize);
            let currentChunk = 0;
            let spark = new SparkMD5.ArrayBuffer();
            let fileReader = new FileReader();
            let loadNext = () => {
                let start = currentChunk * params.chunkSize;
                let end = ((start + params.chunkSize) >= file.size) ? file.size : start + params.chunkSize;
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
            let start = currentChunk * params.chunkSize;
            let end = start + params.chunkSize;
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
                    for (let i = 0; i < params.uploadConcurrent; i++)
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
        setArgs: (opts) => { for (let key in opts) if (key in params) params[key] = opts[key]; },
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

