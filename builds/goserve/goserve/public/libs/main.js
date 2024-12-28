function get_html_and_del(selector) {
    let module = document.querySelector(selector)
    html = module.innerHTML
    module.remove()
    return html
}

const pie_progress_html = get_html_and_del("htmlstore module.pie_progress");
const monitor_html = get_html_and_del("htmlstore module.monitor");
const innerview_html = get_html_and_del("htmlstore module.innerview");
const sliderbar_html = get_html_and_del("htmlstore module.sliderbar");
const musicplayer_html = get_html_and_del("htmlstore module.musicplayer");
const videoplayer_html = get_html_and_del("htmlstore module.videoplayer");
const fileviewer_html = get_html_and_del("htmlstore module.fileviewer");
const popmenu_html = get_html_and_del("htmlstore module.popmenu");
const codeview_html = get_html_and_del("htmlstore module.codeview");
const plainview_html = get_html_and_del("htmlstore module.plainview");
const htmlview_html = get_html_and_del("htmlstore module.htmlview");
const pdfview_html = get_html_and_del("htmlstore module.pdfview");
const imageview_html = get_html_and_del("htmlstore module.imageview");

const view_type = {
    "pdf": [".pdf"],
    "html": [".html", ".xhtml", ".shtml", ".htm", ".url", ".xml"],
    "markdown": [".md", ".MD"],
    "text": [".py", ".js", ".json", ".php", ".phtml", ".h", ".c", ".hpp", ".cpp", ".class", ".jar", ".java", ".css", ".sass", ".scss", ".less", ".xml", ".bat", ".BAT", ".cmd", ".sh", ".ps", ".m", ".go", ".txt", ".cnf", ".conf", ".map", ".yaml", ".ini", ".nfo", ".info", ".log", ".yml"],
    "image": [".bmp", ".png", ".tiff", ".tif", ".gif", ".jpg", ".jpeg", ".jpe", ".psd", ".ai", ".ico", ".webp", ".svg", ".svgz", ".jfif"],
    "audio": [".aac", ".aif", ".aifc", ".aiff", ".ape", ".au", ".flac", ".iff", ".m4a", ".mid", ".mp3", ".mpa", ".ra", ".wav", ".wma", ".f4a", ".f4b", ".oga", ".ogg", ".xm", ".it", ".s3m", ".mod"],
    "video": [".asf", ".asx", ".avi", ".flv", ".mkv", ".mov", ".mp4", ".mpg", ".rm", ".srt", ".swf", ".vob", ".wmv", ".m4v", ".f4v", ".f4p", ".ogv", ".webm"]
};

const imanager = InnerManager({ 
    box: document.body.appendChild(document.createElement('div')), 
    html: innerview_html,
    zindex_min: 10, 
    zindex_max: 100, 
    basic_size: "12px",
});

const popmenu = PopupMenu({ 
    box: document.body.appendChild(document.createElement('div')), 
    html: popmenu_html,
    zindex: 101, 
});

const action_core = AdminCore({ authFailCallBack: () => { 
    popmenu.appendMessage("fail", "Authorization Fail"); 
}});

let file_preview_List = []; // [/xxx,/xxx/xxx] in path decoded
let file_preview_list_dict = {};
function get_type(path) {
    let type = "plain";
    let suffix = path.slice(path.lastIndexOf("."));
    for (let t in view_type) {
        if (view_type[t].includes(suffix)) {
            type = t;
            break;
        }
    }
    return type;
}

function catagory_file_list(file_list) {
    file_preview_List = file_list;

    // // init file_preview_list_dict ==================
    // for (let key in view_type) {
    //     file_preview_list_dict[key] = []
    // }
    // file_preview_list_dict['plain'] = []

    // // append file_preview_list_dict ================
    // for (let f in file_preview_List) {
    //     file_preview_list_dict[get_type(f)].push(f)
    // }
}

function next_path(type = ["plain"], tag = "next", path = "") {
    let pathList = file_preview_List;
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
                if (get_type(pathList[pos]) == type[j])
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
                if (get_type(pathList[pos]) == type[j])
                    return { path: pathList[pos], tag: "next", type: type[j] };
        }
        return { path: path, tag: "", type: "" };
    }
}

{
    function LoginPage() {
        let authTimeHandler;
        function login(login = true, loginCallBack = () => { }, logoutCallBack = () => { }) {
            let waitAuthTimeout = (waitTime) => {
                if (!action_core.getAuthStat()) { logoutCallBack(); clearTimeout(authTimeHandler); }
                authTimeHandler = setTimeout(function () { waitAuthTimeout(waitTime); }, waitTime);
            }
    
            if (login) {
                popmenu.appendAuth((name, key) => {
                    if (!(name + key))
                        return false;
                    action_core.askAuthCore(name + key,
                        () => { waitAuthTimeout(2000); loginCallBack(); },
                        () => { pop_templates("").authFail(); logoutCallBack(); }
                    );
                });
            } else {
                action_core.closeSessionCore(function () { logoutCallBack(); });
            }
        }
        return {
            login: login,
        }
    }

    let logAction = (button) => {
        button.innerText = "IN";
        button.onclick = function () {
            let button = this;
            LoginPage().login((button.innerText == "IN"), function () {
                button.innerText = "OUT";
            }, function () {
                button.innerText = "IN";
            });
        };
    }
}

// monitor ================================================
const monitor_app = function () {
    let isMonitorOpen = false
    let monitor_box = document.createElement("div")
    let monitor = new MonitorView({
        box: monitor_box,
        html: monitor_html,
        pie_html: pie_progress_html,
        basic_size: "14px",
        waitTime: 3000,
        getMonitor: action_core.getMonitor,
    })
    let monitor_handler = imanager.build_view({
        box: monitor_box,
        width: "90%", height: "90%", title: "monitor", 
        btnShow: ["min", "max", "exit"],
        exit: () => {
            monitor.close();
            monitor_handler.iview.hide("hide"); 
            isMonitorOpen = false;
        },
    });
    let open_monitor = function () {
        if (isMonitorOpen == false) {
            monitor.open();
            imanager.open_exist_view(monitor_handler.iview);
            isMonitorOpen = true;
        }
    }
    return {
        open_monitor: open_monitor,
    }
}()

document.querySelector(".mainline .flows .card.monitor").onclick = monitor_app.open_monitor


// files ==================================================
let window_push = false;
let history_mode = false;

function address_line_init(url) {
    if (window_push) {
        window.addEventListener('popstate', function (evt) {
            try { 
                open_folder(action_core.urlToPath(evt.state.url), (info)=>{
                    file_view.updateInfo(info);
                });
            } catch (err) { }
        });
    }
}

function address_line_push (url) {
    // update history, not activated by window.onpopState
    if (!history_mode && window_push) {
        window.history.pushState({"title": null, "url": url}, null, url);
    }
}

let explorer_current_parts = {};
function open_folder(path = "", callback=(info)=>{}, simple=false) {
    action_core.openFolder(path, function (info) {
        // explorer_current_parts = {}
        callback(info);
        if (!simple) {
            address_line_push(action_core.pathToUrl(info.Path))
        }
    });
}

function open_file(path = "") {
    let type = get_type(path)
    music_app.music_check(path);
    switch (type) {
        case "audio":
            music_app.music_start(path, type, "");
            break;
        case "video":
            video_app.video_start(path, type, "");
            break;
        case "markdown": case "text":
            code_highlight_app.view_start(path, type, "");
            break;
        case "image":
            image_viewer_app.view_start(path, type, "");
            break;
        case "pdf":
            pdf_viewer_app.view_start(path, type, "");
            break;
        case "html":
            html_viewer_app.view_start(path, type, "");
            break;
        default:
            plain_viewer_app.view_start(path, type, "");
            break;
    }
}

function pop_templates(sign, finish_callBack) {
    if (!popmenu) {
        return {
            authFail: (info) => { console.log("fail" + "Authorization Fail"); },
            fail: (info) => { console.log("fail" + sign + " : fail " + info); },
            exist: (info) => { console.log("warn" + sign + " : exist " + info); },
            info: (info) => { console.log("info" + sign + " : get info " + info); },
            pass: (info) => { console.log("pass" + sign + " : pass " + info); finish_callBack(); },
            all: (info) => { },
        }
    }
    return {
        authFail: (info) => { popmenu.appendMessage("fail", "Authorization Fail"); },
        fail: (info) => { popmenu.appendMessage("fail", sign + " : fail " + info); },
        exist: (info) => { popmenu.appendMessage("warn", sign + " : exist " + info); },
        info: (info) => { popmenu.appendMessage("info", sign + " : get info " + info); },
        pass: (info) => { popmenu.appendMessage("pass", sign + " : pass " + info); finish_callBack(); },
        all: (info) => { },
    }
}

const explorer_app = function () {
    let is_file_open = false
    let file_box = document.createElement('div');
    let file_view = FileViewer({
            box: file_box,
            html: fileviewer_html,
            openfile: open_file,
            openfolder: open_folder,
            sort_callback: (currentInfo) => {
                catagory_file_list(currentInfo.FileNodes.map((info) => { return info.path; }))
            },
            download: (chosenFiles = []) => {
                chosenFiles.slice(0).forEach((path, index) => {
                    setTimeout(() => { action_core.download(path); }, 800 * index);
                });
            },
            mkdir: (path, callBack) => {
                action_core.mkdirCore(path, pop_templates("mkdir " + path, callBack));
            },
            mkfile: (path, content, callback) => {
                action_core.mkfileCore(path, content, pop_templates("mkfile " + path, callback));
            },
            rename: (src, dst, callback) => {
                action_core.renameCore(src, dst, pop_templates("rename " + src + " to " + dst, callback));
            },
            moveto: (src, dst, callback) => {
                action_core.renameCore(src, dst, pop_templates("move " + src + " to " + dst, callback));
            },
            copyto: (src, dst, callback) => {
                action_core.copytoCore(src, dst, pop_templates("copy " + src + " to " + dst, callback));
            },
            remove: (path, callback) => {
                action_core.removeCore(path, pop_templates("remove " + path, callback));
            },
    });
    let file_handler = imanager.build_view({
        box: file_box,
        width: "90%", height: "90%", title: "explorer", 
        btnShow: ["min", "max", "exit"],
        exit: () => {
            file_handler.iview.hide("hide"); 
            is_file_open = false;
        },
    });
    let open_explorer = function () {
        if (is_file_open == false) {
            open_folder("/", (info)=>{
                file_view.updateInfo(info);
            }); 
            is_file_open = true;
        }
        imanager.open_exist_view(file_handler.iview);
    }

    return {
        open_explorer: open_explorer,
        update_info: file_view.updateInfo,
    }
}()
document.querySelector(".mainline .flows .card.explorer").onclick = explorer_app.open_explorer

// music player ===========================================
const music_app = function () {
    let is_music_open = false
    let music_box = document.createElement('div');
    let music_player = MusicPlayer({ 
        box: music_box,
        html: musicplayer_html,
        sliderbar_html: sliderbar_html, 
        pathToUrl: (path) => { return action_core.pathToUrl(path); } 
    });
    let music_handler = imanager.build_view({
        box: music_box, 
        width: "22em", height: "44em", title: "muse", 
        btnShow: ["down", "min", "exit"],
        down: () => { action_core.download(music_player.getPlayPath()); },
        exit: () => { music_player.playStop(); music_handler.iview.hide("hide"); },
    });
    
    let music_check = (path) => {
        if (music_player.thisPos(path) == -1) {
            music_player.setPlayList(file_preview_List, true);
            if (music_player.thisPos(path) == -1)
                music_player.setPlayList([path], true);
        }
    }
    let music_start = (path, type, tag) => {
        music_player.playThis(path);
        imanager.open_exist_view(music_handler.iview);
    }
    let music_show = () => {
        imanager.open_exist_view(music_handler.iview);
    }

   return {
        music_check: music_check,
        music_start: music_start,
        music_show: music_show,
   } 
}()


// video app ==============================================
const video_app = function () {
    let video_box = document.createElement('div');
    let video_player = VideoPlayer({
        box: video_box, 
        html: videoplayer_html,
        sliderbar_html: sliderbar_html, 
        pathToUrl: (path) => { return action_core.pathToUrl(path); } 
    });
    let view_handler = imanager.build_view({
        box: video_box, 
        width: "90%", height: "90%", title: "video", 
        btnShow: ["prev", "next", "down", "min", "max", "exit"],
        prev: () => { video_start(view_handler.itools._path, "", "", "prev", ["video"]); },
        next: () => { video_start(view_handler.itools._path, "", "", "next", ["video"]); },
        down: () => { action_core.download(view_handler.itools._path); },
        exit: () => { video_player.playStop(); view_handler.iview.hide("hide"); },
    });

    let video_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
        }
        try {
            video_player.playThis(path);
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            imanager.open_exist_view(view_handler.iview);
        } catch (error) { }
    }

    let video_show = () => {
        imanager.open_exist_view(view_handler.iview);
    }

    return {
        // video_check: video_check,
        video_start: video_start,
        video_show: video_show,
   } 
}()


// codeview app ============================================
const code_highlight_app = function () {
    let code_box = document.createElement('div');
    let code_view = CodeViewer({ 
        box: code_box, 
        html: codeview_html,
        pathToUrl: (path) => { return action_core.pathToUrl(path); } 
    });
    let view_handler = imanager.build_view({
        box: code_box, 
        width: "90%", height: "90%", title: "code", 
        btnShow: ["prev", "next", "down", "min", "max", "exit"],
        prev: () => { view_start(view_handler.itools._path, "", "", "prev", ["markdown", "text"]); },
        next: () => { view_start(view_handler.itools._path, "", "", "next", ["markdown", "text"]); },
        down: () => { action_core.download(view_handler.itools._path); },
        exit: () => { view_handler.iview.hide("hide"); },
    });

    let view_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
            type = tmp.type;
        }
        try {
            code_view.showCode(action_core.pathToUrl(path), (type == "markdown"));
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            imanager.open_exist_view(view_handler.iview);
        } catch (error) { }
    }

    let view_show = () => {
        imanager.open_exist_view(view_handler.iview);
    }

    return {
        view_start: view_start,
        view_show: view_show,
    }
}()

// plain app ============================================
function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
}

function PlainViewer(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
    }

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let alink = shadow_module.shadowRoot.querySelector('a');

    function set_info(link) {
        alink.href = link;
        alink.innerText = link;
    }
    
    return {
        set_info: set_info,
    }
}

const plain_viewer_app = function () {
    let box = document.createElement('div');
    let view = PlainViewer({ 
        box: box, 
        html: plainview_html,
    });
    let view_handler = imanager.build_view({
        box: box, 
        width: "90%", height: "90%", title: "plain", 
        btnShow: ["prev", "next", "down", "min", "max", "exit"],
        prev: () => { view_start(view_handler.itools._path, "", "", "prev", ["plain"]); },
        next: () => { view_start(view_handler.itools._path, "", "", "next", ["plain"]); },
        down: () => { action_core.download(view_handler.itools._path); },
        exit: () => { view.set_info(""); view_handler.iview.hide("hide"); },
    });

    let view_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
        }
        try {
            view.set_info(action_core.pathToUrl(path));
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            imanager.open_exist_view(view_handler.iview);
        } catch (error) { }
    }

    let view_show = () => {
        imanager.open_exist_view(view_handler.iview);
    }

    return {
        view_start: view_start,
        view_show: view_show,
    }
}()

// html app ============================================
function HtmlViewer(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
    }

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    let alink = shadow_module.shadowRoot.querySelector('iframe');

    function set_info(link) {
        alink.src = link;
    }
    
    return {
        set_info: set_info,
    }
}

const html_viewer_app = function () {
    let box = document.createElement('div');
    let view = HtmlViewer({ 
        box: box, 
        html: htmlview_html,
    });
    let view_handler = imanager.build_view({
        box: box, 
        width: "90%", height: "90%", title: "html", 
        btnShow: ["min", "max", "exit"],
        exit: () => { view.set_info(""); view_handler.iview.hide("hide"); },
    });

    let view_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
        }
        try {
            link = path.startsWith("http")? path: action_core.pathToUrl(path)
            view.set_info(link);
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            imanager.open_exist_view(view_handler.iview);
        } catch (error) { }
    }

    let view_show = () => {
        imanager.open_exist_view(view_handler.iview);
    }

    return {
        view_start: view_start,
        view_show: view_show,
    }
}()
// html_viewer_app.view_start("http://localhost:9090/")
// html_viewer_app.view_start("https://www.bilibili.com/")
// html_viewer_app.view_start("https://nav.yhz610.com/")
// html_viewer_app.view_start("https://www.bing.com/")

// pdf app ============================================
const pdf_viewer_app = function () {
    let box = document.createElement('div');
    let view = HtmlViewer({ 
        box: box, 
        html: pdfview_html,
    });
    let view_handler = imanager.build_view({
        box: box, 
        width: "90%", height: "90%", title: "pdf", 
        btnShow: ["prev", "next", "down", "min", "max", "exit"],
        prev: () => { view_start(view_handler.itools._path, "", "", "prev", ["pdf"]); },
        next: () => { view_start(view_handler.itools._path, "", "", "next", ["pdf"]); },
        down: () => { action_core.download(view_handler.itools._path); },
        exit: () => { view.set_info(""); view_handler.iview.hide("hide"); },
    });

    let view_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
        }
        try {
            view.set_info("./outLibs/pdfjs/web/viewer.html" + '?file=' + encodeURIComponent(action_core.pathToUrl(path)));
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            imanager.open_exist_view(view_handler.iview);
        } catch (error) { }
    }

    let view_show = () => {
        imanager.open_exist_view(view_handler.iview);
    }

    return {
        view_start: view_start,
        view_show: view_show,
    }
}()

// image app ============================================
function ImageViewer(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
    }

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    let alink = shadow_module.shadowRoot.querySelector('img');

    function set_info(link) {
        alink.src = link;
    }
    
    return {
        set_info: set_info,
    }
}

const image_viewer_app = function () {
    let box = document.createElement('div');
    let view = ImageViewer({ 
        box: box, 
        html: imageview_html,
    });
    let view_handler = imanager.build_view({
        box: box, 
        width: "90%", height: "90%", title: "image", 
        btnShow: ["prev", "next", "down", "min", "max", "exit"],
        prev: () => { view_start(view_handler.itools._path, "", "", "prev", ["image"]); },
        next: () => { view_start(view_handler.itools._path, "", "", "next", ["image"]); },
        down: () => { action_core.download(view_handler.itools._path); },
        exit: () => { view.set_info(""); view_handler.iview.hide("hide"); },
    });

    let view_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
        }
        try {
            view.set_info(action_core.pathToUrl(path));
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            imanager.open_exist_view(view_handler.iview);
        } catch (error) { }
    }

    let view_show = () => {
        imanager.open_exist_view(view_handler.iview);
    }

    return {
        view_start: view_start,
        view_show: view_show,
    }
}()

// ============================================================
function buildLinks(exLinks) {
    for (let key in exLinks) {
        let node = htmltoElement("<div class='item'>" + key + "</div>");
        node.style.background = "#eef";
        node.__src = args.params.exLinks[key];
        node.onclick = function () { window.open(this.__src); }
        document.querySelector(".headMenu").appendChild(node);
    }
}

function set_outer_links() {
    let host = window.location.host;
    let protocal = window.location.protocol;
    let _host = host.slice(0, host.lastIndexOf(":"));
    let exLinks = {};
    let xhr = new XMLHttpRequest();
    xhr.open("GET", protocal + "//" + host + "/data/links.json", true);
    xhr.setRequestHeader("Cache-Control", "no-cache"); // disable cache
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            try {
                exLinks = JSON.parse(xhr.responseText.replace(/\/\/__IP__:/g, "//" + _host + ":"));
                buildLinks(exLinks);
            } catch (error) {}
        }
    };
    xhr.send(null);
}

