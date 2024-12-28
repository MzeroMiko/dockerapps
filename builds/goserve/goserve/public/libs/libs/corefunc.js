"use strict"

function get_url_parts(iurl = "", host="") {
    // asset url: currentHost + [/xxx] + [?a=x&b=x] + [#x]
    // asset no "?" or "&" or "=" in (a=)x
    let url = iurl.slice(host.length);
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

function merge_url_parts(path = "", query = {}, hash = "", host="") {
    let url = host + path + "?";
    for (let key in query) {
        if (query[key] != "undefined" && query[key] != undefined)
            url += key + "=" + query[key] + "&";
    }
    url = url.slice(0, url.length - 1) + ((hash != "") ? ("#" + hash) : "");
    return url;
}

function uri_encode_path(upath = "", keepSlash = true) {
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

function uri_decode_path(upath = "") {
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

function get_action(url = "", callback = (result) => { }, after_get=()=>{}) {
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

function post_action(url = "", postData = null, addition = (xhr) => { }, callback=(result)=>{}, after_post=()=>{}) {
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

function AdminCore(opts = {}) {
    let args = {
        params: {
            prefix: "/home",
            reAuthTime: 5, 
            useQueryPath: false,
            authFail: "authFail", signPass: "pass", signExist: "exist", signFail: "fail",
            chunkSize: 2 << 20, // 2MB 
            uploadConcurrent: 3, // max concurrent
            currentHost: window.location.origin,
        },
    }
    let params = args.params;
    let currentParts = get_url_parts(window.location.href, params.currentHost); // when assignned, dict is refered as a point, not value!
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
        post_action(url, postData, addition, parseSigns, after_post)
    }

    function path_to_direct_link(path = "", addtion = (parts) => { }) {
        let useQueryPath = params.useQueryPath;
        let prefix = params.prefix;
        // let currentParts = currentParts;
        let currentHost = params.currentHost;
        
        // assert path = /x/x/x or / is URIDecoded
        let parts = { path: currentParts.path, query: {}, hash: currentParts.hash };
        for (let key in currentParts.query)
            parts.query[key] = currentParts.query[key];
        // When the first time to start without query.path:
        if (useQueryPath && !("path" in parts.query))
            parts.query.path = uri_encode_path("/");
        // when path == "", do not change path
        if (path != "" && path != ".") {
            if (useQueryPath)
                parts.query.path = uri_encode_path(path == ""? "/": path);
            else {
                let _prefix = prefix;
                _prefix = (_prefix.slice(0,1) == "/")? _prefix : "/" + _prefix;
                _prefix = (_prefix.slice(-1) == "/")? _prefix.slice(0, -1): _prefix; // like "/home" but not "home" or "/home/"
                parts.path = uri_encode_path(path);
                parts.path = (parts.path.slice(0, 1) == "/")? _prefix + parts.path: _prefix + "/" + parts.path;
            }
        }
        addtion(parts);
        return merge_url_parts(parts.path, parts.query, parts.hash, currentHost);
    }

    function direct_link_to_path(url = "") {
        let useQueryPath = params.useQueryPath;
        let prefix = params.prefix;
        // let currentParts = currentParts;
        let currentHost = params.currentHost;

        if (useQueryPath)
            return uri_decode_path((url == "") ? currentParts.query.path : get_url_parts(url, currentHost).query.path);
        let rawpath = uri_decode_path((url == "") ? currentParts.path : get_url_parts(url, currentHost).path);
        let _prefix = prefix;
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
        let url = path_to_direct_link(path, (parts) => {
            parts.query.method = "getfile";
        });
        window.open(url, "_self");
    }

    function openFolder(path = "", callback = (info) => { }, is_url=false) {
        let url = path_to_direct_link(path, (parts) => {
            parts.query.method = "getdir";
        });
        if (is_url) url = path;
        get_action(url, (result) => {
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
                    Path: direct_link_to_path(url), Name: tmpele.getAttribute("name"), Size: tmpele.getAttribute("size"), Mode: tmpele.getAttribute("mode"),
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

    function getMonitor(callback = (info) => { }) {
        let url = path_to_direct_link("/home", (parts) => {
            parts.query.method = "monitor";
        })
        get_action(url, (result) => {
            try { callback(JSON.parse(result)); }
            catch (err) {
                console.log(err);
                console.log("Error Get Info, Received:", result);
            }
        });
    }

    function askAuthCore(key = "", passCallBack = () => { }, failCallBack = () => { }) {
        let authKey = SparkMD5.hash(key);
        let url = path_to_direct_link(".");
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
        postAction(path_to_direct_link("."), {}, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa("close" + currentToken));
        });
        currentToken = "";
        callback();
    }

    function getAuthStat() {
        return (currentToken != "");
    }

    function mkdirCore(path = "", callbacks = {}) {
        let url = path_to_direct_link(path, (parts) => {
            parts.query.method = "mkdir";
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function mkfileCore(path = "", content = "", callbacks = {}) {
        let blob = new Blob([content], { type: 'text/plain' });
        let url = path_to_direct_link(path, (parts) => {
            parts.query.method = "mkfile";
        });
        let postData = new FormData();
        postData.append("file", blob);
        postAction(url, callbacks, postData, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function removeCore(path = "", callbacks = {}) {
        let url = path_to_direct_link(path, (parts) => {
            parts.query.method = "remove";
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function renameCore(path = "", dstPath = "", callbacks = {}) {
        let url = path_to_direct_link(path, (parts) => {
            parts.query.method = "rename";
            parts.query.destpath = uri_encode_path(dstPath);
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function copytoCore(path = "", dstPath = "", callbacks = {}) {
        let url = path_to_direct_link(path, (parts) => {
            parts.query.method = "copyto";
            parts.query.destpath = uri_encode_path(dstPath);
        });
        postAction(url, callbacks, null, (xhr)=> {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(currentToken));
        });
    }

    function archiveCore(path = "", dstPath = "", format = "zip", callbacks = {}) {
        let url = path_to_direct_link(path, (parts) => {
            parts.query.method = "archive";
            parts.query.format = format; // zip or targz
            parts.query.destpath = uri_encode_path(dstPath);
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
            let url = path_to_direct_link(path, (parts) => {
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
            let url = path_to_direct_link(path, (parts) => {
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
            let url = path_to_direct_link(path, (parts) => {
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
        pathToUrl: path_to_direct_link,
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

function AdminCoreGithubAPI(opts = {}) {
    const REPO = "https://api.github.com/repos/MzeroMiko/MzeroMiko.github.io/contents";
    const RAW = "https://raw.githubusercontent.com/MzeroMiko/MzeroMiko.github.io/refs/heads/main";

    let args = {
        params: {
            prefix: "/home",
            currentHost: window.location.origin,
        },
    }
    let params = args.params;
    for (let key in opts) if (key in params) params[key] = opts[key];
    
    function path_to_direct_link(path = "", addtion = (parts) => { }) {
        let url = ""
        if (path.startsWith(params.prefix)) {
            url = path.replace(params.prefix, RAW);
        } else if (path == "" || path == "/" || path == "//") {
            url = RAW
        }
        return url;
    }

    function download(path = "") {
        let url = ""
        if (path.startsWith(params.prefix)) {
            url = path.replace(params.prefix, RAW);
        } else if (path == "" || path == "/" || path == "//") {
            url = RAW
        }
        window.open(url, "_self");
    }

    function openFolder(path = "", callback = (info) => { }, is_url=false) {
        let url = "";
        if (path.startsWith(params.prefix)) {
            url = path.replace(params.prefix, REPO);
        } else if (path == "" || path == "/" || path == "//") {
            url = REPO
        }

        if (is_url) url = path;

        get_action(url, (result) => {
            try {
                // [{"name": "Readme.md", "path": "Readme.md", "sha": "26af290b66af341c9f21217b5610bf2f7b98dffb",
                //   "size": 107, 
                // "url": "https://api.github.com/repos/MzeroMiko/MzeroMiko.github.io/contents/Readme.md?ref=main", 
                // "html_url": "https://github.com/MzeroMiko/MzeroMiko.github.io/blob/main/Readme.md",
                //   "git_url": "",
                //   "download_url": "https://raw.githubusercontent.com/MzeroMiko/MzeroMiko.github.io/main/Readme.md",
                //   "type": "file",},...]
                let file_folder_list = JSON.parse(result);
                let file_list = [];
                let folder_list = [];

                for (let i = 0; i< file_folder_list.length; i++) {
                    let name = file_folder_list[i]["name"];
                    let size = file_folder_list[i]["size"];
                    let isdir = file_folder_list[i]["type"] == "dir";
                    if (isdir) {
                        folder_list.push({Name: name, Size: size, Mode: "", Mtim: "", Ctim: "", FileNum: 0, FolderNum: 0})
                    } else {
                        file_list.push({Name: name, Size: size, Mode: "", Mtim: "", Ctim: "", FileNum: 0, FolderNum: 0})
                    }
                }
                let info = {
                    Path: url.replace(REPO, params.prefix), 
                    // Path: url.replace(REPO, "/"), 
                    Name: path.split("/")[-1], Size: "", Mode: "",
                    Mtim: "", Ctim: "", Error: "",
                    FileList: file_list, FolderList: folder_list
                } 
                if (info.Path == "/") info.Name = "Home";
                callback(info);
            } catch (err) {
                console.log(err);
                console.log("Error Get Info, Received:\n", result);
            }
        });
    }

    let empty = (a=null, b=null, c=null, d=null, e=null, f=null) => {};

    return {
        pathToUrl: path_to_direct_link,
        download: download,
        openFolder: openFolder,
        getMonitor: empty,
        askAuthCore: empty,
        closeSessionCore: empty,
        getAuthStat: empty,
        mkdirCore: empty,
        mkfileCore: empty,
        removeCore: empty,
        renameCore: empty,
        copytoCore: empty,
        archiveCore: empty,
        uploadFile: empty,
    }
}

