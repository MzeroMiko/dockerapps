function get_html_and_del(selector) {
    let module = document.querySelector(selector)
    html = module.innerHTML
    module.remove()
    return html
}

let pie_progress_html = get_html_and_del("htmlstore module.pie_progress")
let monitor_html = get_html_and_del("htmlstore module.monitor")
let innerview_html = get_html_and_del("htmlstore module.innerview")
let innerview_manager_html = get_html_and_del("htmlstore module.innerview_manager")
let sliderbar_html = get_html_and_del("htmlstore module.sliderbar")
let musicplayer_html = get_html_and_del("htmlstore module.musicplayer")
let videoplayer_html = get_html_and_del("htmlstore module.videoplayer")
let fileviewer_html = get_html_and_del("htmlstore module.fileviewer")
let popmenu_html = get_html_and_del("htmlstore module.popmenu")
let infoview_html = get_html_and_del("htmlstore module.infoview")
let codeview_html = get_html_and_del("htmlstore module.codeview")
let adminview_html = get_html_and_del("htmlstore module.adminview")
let plainview_html = get_html_and_del("htmlstore module.plainview")
let htmlview_html = get_html_and_del("htmlstore module.htmlview")
let pdfview_html = get_html_and_del("htmlstore module.pdfview")
let imageview_html = get_html_and_del("htmlstore module.imageview")


// ========================================================
let imanager = InnerManager({ 
    box: document.body.appendChild(document.createElement('div')), 
    html: innerview_manager_html,
    innerview_html: innerview_html,
    zindex_min: 10, 
    zindex_max: 100, 
    basic_size: "12px",
});


// ========================================================
let popMenu = PopupMenu({ 
    box: document.body.appendChild(document.createElement('div')), 
    html: popmenu_html,
    zindex: 100, 
});
// popMenu.appendMessage("fail", "Authorization Fail");
// popMenu.appendMessage("fail", " test")
// popMenu.appendMessage("warn", " test")
// popMenu.appendMessage("info", " test")
// popMenu.appendMessage("pass", " test")

// ========================================================
const view_type = {
    "pdf": [".pdf"],
    "html": [".html", ".xhtml", ".shtml", ".htm", ".url", ".xml"],
    "markdown": [".md", ".MD"],
    "text": [".py", ".js", ".json", ".php", ".phtml", ".h", ".c", ".hpp", ".cpp", ".class", ".jar", ".java", ".css", ".sass", ".scss", ".less", ".xml", ".bat", ".BAT", ".cmd", ".sh", ".ps", ".m", ".go", ".txt", ".cnf", ".conf", ".map", ".yaml", ".ini", ".nfo", ".info", ".log", ".yml"],
    "image": [".bmp", ".png", ".tiff", ".tif", ".gif", ".jpg", ".jpeg", ".jpe", ".psd", ".ai", ".ico", ".webp", ".svg", ".svgz", ".jfif"],
    "audio": [".aac", ".aif", ".aifc", ".aiff", ".ape", ".au", ".flac", ".iff", ".m4a", ".mid", ".mp3", ".mpa", ".ra", ".wav", ".wma", ".f4a", ".f4b", ".oga", ".ogg", ".xm", ".it", ".s3m", ".mod"],
    "video": [".asf", ".asx", ".avi", ".flv", ".mkv", ".mov", ".mp4", ".mpg", ".rm", ".srt", ".swf", ".vob", ".wmv", ".m4v", ".f4v", ".f4p", ".ogv", ".webm"]
};

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

// =========================================================
let adminCore = AdminCore({ authFailCallBack: () => { popMenu.appendMessage("fail", "Authorization Fail"); } });
// let innerview = new InnerViewer({
//     box: document.body.appendChild(document.createElement('div')),
//     html: innerview_html,
//     basic_size: "12px",
// })
{
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
                let tmp = next_path(types, next, path);
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
        return {iobj: iobj, start: startView};
    }

    let logAction = (button) => {
        button.innerText = "IN";
        button.onclick = function () {
            let button = this;
            admin_view.login((button.innerText == "IN"), function () {
                button.innerText = "OUT";
            }, function () {
                button.innerText = "IN";
            });
        };
    }
}

// monitor ================================================
let monitor_app = function () {
    let isMonitorOpen = false
    let monitor_box = document.createElement("div")
    let monitor = new MonitorView({
        box: monitor_box,
        html: monitor_html,
        pie_html: pie_progress_html,
        basic_size: "14px",
        waitTime: 3000,
        getMonitor: adminCore.getMonitor,
    })
    let monitor_handler = imanager.buildView({
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
            monitor_handler.iview.hide("show"); 
            isMonitorOpen = true;
        }
    }
    return {
        open_monitor: open_monitor,
    }
}()

document.querySelector(".mainline .flows .card.monitor").onclick = monitor_app.open_monitor
// // use set timeout to save time for first view rendering
// setTimeout(()=>{
//     let monitor_app = monitor_app_builder()
//     document.querySelector(".mainline .flows .card.monitor").onclick = monitor_app.open_monitor
// }, 100);


// files ==================================================
let windowPush = false;
let historyMode = false;

function address_line_init(url) {
    if (windowPush) {
        window.addEventListener('popstate', function (evt) {
            try { open_folder(adminCore.urlToPath(evt.state.url)); } catch (err) { }
        });
    }
}

function address_line_push (url) {
    // update history, not activated by window.onpopState
    if (!historyMode && windowPush) {
        window.history.pushState({"title": null, "url": url}, null, url);
    }
}

let explorer_current_parts = {}
function open_folder(path = "") {
    adminCore.openFolder(path, function (info) {
        // explorer_current_parts = {}
        explorer_app.update_info(info);
        address_line_push(adminCore.pathToUrl(info.Path))
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

let explorer_app = function () {
    let chooseIcon = SVGIcons().chooseIcon;
    let is_file_open = false
    let file_box = document.createElement('div');
    let file_view = FileViewer({
            box: file_box,
            html: fileviewer_html,
            chooseIcon: chooseIcon,
            openPath: (path, isFolder) => {
                if (isFolder)
                    open_folder(path);
                else
                    open_file(path);
            },
            sortCallBack: (currentInfo) => {
                catagory_file_list(currentInfo.FileNodes.map((info) => { return info.path; }))
            },
            menuAction: (info, node, thisFolder) => { 
                deltailed_info.genInfo(info, node, thisFolder); 
            },
    });
    let file_handler = imanager.buildView({
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
            file_handler.iview.hide("show"); 
            is_file_open = true;
        }
    }

    return {
        open_explorer: open_explorer,
        update_info: file_view.updateInfo,
    }
}()
document.querySelector(".mainline .flows .card.explorer").onclick = explorer_app.open_explorer

// music player ===========================================
let music_app = function () {
    let is_music_open = false
    let music_box = document.createElement('div');
    let music_player = MusicPlayer({ 
        box: music_box,
        html: musicplayer_html,
        sliderbar_html: sliderbar_html, 
        pathToUrl: (path) => { return adminCore.pathToUrl(path); } 
    });
    let music_handler = imanager.buildView({
        box: music_box, 
        width: "22em", height: "44em", title: "muse", 
        btnShow: ["down", "min", "exit"],
        down: () => { adminCore.download(music_player.getPlayPath()); },
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
        music_handler.iview.hide("show");
    }
    let music_show = () => {
        music_handler.iview.hide("show");
    }

   return {
        music_check: music_check,
        music_start: music_start,
        music_show: music_show,
   } 
}()

// music_app.music_show()

// video app ==============================================
let video_app = function () {
    let video_box = document.createElement('div');
    let video_player = VideoPlayer({
        box: video_box, 
        html: videoplayer_html,
        sliderbar_html: sliderbar_html, 
        pathToUrl: (path) => { return adminCore.pathToUrl(path); } 
    });
    let view_handler = imanager.buildView({
        box: video_box, 
        width: "90%", height: "90%", title: "video", 
        btnShow: ["prev", "next", "down", "min", "max", "exit"],
        prev: () => { video_start(iobj.itools._path, "", "", "prev", ["video"]); },
        next: () => { video_start(iobj.itools._path, "", "", "next", ["video"]); },
        down: () => { adminCore.download(view_handler.itools._path); },
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
            view_handler.iview.hide("show");
        } catch (error) { }
    }

    let video_show = () => {
        view_handler.iview.hide("show");
    }

    return {
        // video_check: video_check,
        video_start: video_start,
        video_show: video_show,
   } 
}()

// video_app.video_show()

// codeview app ============================================
let code_highlight_app = function () {
    let code_box = document.createElement('div');
    let code_view = CodeViewer({ 
        box: code_box, 
        html: codeview_html,
        pathToUrl: (path) => { return adminCore.pathToUrl(path); } 
    });
    let view_handler = imanager.buildView({
        box: code_box, 
        width: "90%", height: "90%", title: "code", 
        btnShow: ["prev", "next", "down", "min", "max", "exit"],
        prev: () => { view_start(iobj.itools._path, "", "", "prev", ["markdown", "text"]); },
        next: () => { view_start(iobj.itools._path, "", "", "next", ["markdown", "text"]); },
        down: () => { adminCore.download(view_handler.itools._path); },
        exit: () => { view_handler.iview.hide("hide"); },
    });

    let view_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
            type = tmp.type;
        }
        try {
            code_view.showCode(adminCore.pathToUrl(path), (type == "markdown"));
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            view_handler.iview.hide("show");
        } catch (error) { }
    }

    let view_show = () => {
        view_handler.iview.hide("show");
    }

    return {
        view_start: view_start,
        view_show: view_show,
    }
}()
// code_highlight_app.view_show()

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

let plain_viewer_app = function () {
    let box = document.createElement('div');
    let view = PlainViewer({ 
        box: box, 
        html: plainview_html,
    });
    let view_handler = imanager.buildView({
        box: box, 
        width: "90%", height: "90%", title: "plain", 
        btnShow: ["prev", "next", "down", "min", "max", "exit"],
        prev: () => { view_start(iobj.itools._path, "", "", "prev", ["plain"]); },
        next: () => { view_start(iobj.itools._path, "", "", "next", ["plain"]); },
        down: () => { adminCore.download(view_handler.itools._path); },
        exit: () => { view.set_info(""); view_handler.iview.hide("hide"); },
    });

    let view_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
        }
        try {
            view.set_info(adminCore.pathToUrl(path));
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            view_handler.iview.hide("show");
        } catch (error) { }
    }

    let view_show = () => {
        view_handler.iview.hide("show");
    }

    return {
        view_start: view_start,
        view_show: view_show,
    }
}()
// plain_viewer_app.view_show()

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

let html_viewer_app = function () {
    let box = document.createElement('div');
    let view = HtmlViewer({ 
        box: box, 
        html: htmlview_html,
    });
    let view_handler = imanager.buildView({
        box: box, 
        width: "90%", height: "90%", title: "html", 
        btnShow: ["min", "max", "exit"],
        // prev: () => { view_start(iobj.itools._path, "", "", "prev", ["html"]); },
        // next: () => { view_start(iobj.itools._path, "", "", "next", ["html"]); },
        // down: () => { adminCore.download(view_handler.itools._path); },
        exit: () => { view.set_info(""); view_handler.iview.hide("hide"); },
    });

    let view_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
        }
        try {
            link = path.startsWith("http")? path: adminCore.pathToUrl(path)
            view.set_info(link);
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            view_handler.iview.hide("show");
        } catch (error) { }
    }

    let view_show = () => {
        view_handler.iview.hide("show");
    }

    return {
        view_start: view_start,
        view_show: view_show,
    }
}()
// html_viewer_app.view_show()
// html_viewer_app.view_start("https://localhost:9090/")
// html_viewer_app.view_start("https://www.bilibili.com/")
// html_viewer_app.view_start("https://nav.yhz610.com/")
// html_viewer_app.view_start("https://www.bing.com/")

// pdf app ============================================
let pdf_viewer_app = function () {
    let box = document.createElement('div');
    let view = HtmlViewer({ 
        box: box, 
        html: pdfview_html,
    });
    let view_handler = imanager.buildView({
        box: box, 
        width: "90%", height: "90%", title: "pdf", 
        btnShow: ["prev", "next", "down", "min", "max", "exit"],
        prev: () => { view_start(iobj.itools._path, "", "", "prev", ["pdf"]); },
        next: () => { view_start(iobj.itools._path, "", "", "next", ["pdf"]); },
        down: () => { adminCore.download(view_handler.itools._path); },
        exit: () => { view.set_info(""); view_handler.iview.hide("hide"); },
    });

    let view_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
        }
        try {
            view.set_info("./outLibs/pdfjs/web/viewer.html" + '?file=' + encodeURIComponent(adminCore.pathToUrl(path)));
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            view_handler.iview.hide("show");
        } catch (error) { }
    }

    let view_show = () => {
        view_handler.iview.hide("show");
    }

    return {
        view_start: view_start,
        view_show: view_show,
    }
}()
// pdf_viewer_app.view_show()

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

let image_viewer_app = function () {
    let box = document.createElement('div');
    let view = ImageViewer({ 
        box: box, 
        html: imageview_html,
    });
    let view_handler = imanager.buildView({
        box: box, 
        width: "90%", height: "90%", title: "image", 
        btnShow: ["prev", "next", "down", "min", "max", "exit"],
        prev: () => { view_start(iobj.itools._path, "", "", "prev", ["image"]); },
        next: () => { view_start(iobj.itools._path, "", "", "next", ["image"]); },
        down: () => { adminCore.download(view_handler.itools._path); },
        exit: () => { view.set_info(""); view_handler.iview.hide("hide"); },
    });

    let view_start = (path = "", type = "", tag = "", next = "", types = []) => {
        if (next == "prev" || next == "next") {
            let tmp = next_path(types, next, path);
            path = tmp.path;
        }
        try {
            view.set_info(adminCore.pathToUrl(path));
            view_handler.itools._path = path;
            view_handler.itools.titleBar.innerText = path.slice(path.lastIndexOf("/") + 1);
            view_handler.iview.hide("show");
        } catch (error) { }
    }

    let view_show = () => {
        view_handler.iview.hide("show");
    }

    return {
        view_start: view_start,
        view_show: view_show,
    }
}()
// image_viewer_app.view_show()

// ======================================================

let admin_view = AdminViewer({ 
    html: adminview_html,
    fileviewer_html: fileviewer_html,
    adminCore: adminCore, 
    popMenu: popMenu,
    iView: imanager.newView("24em", "80%"), 
    PView: FileViewer, 
});
let info_handler = imanager.buildView({
    width: "22em", height: "44em", title: "info", 
    btnshow: ["min", "max", "exit"],
    exit: () => { deltailed_info.setChooseMode(false); info_handler.iview.hide("hide"); }
});
let deltailed_info = InfoViewer({
    box: info_handler.ibox, 
    html: infoview_html,
    admin_view: admin_view,
    pathToUrl: (path) => { return adminCore.pathToUrl(path); },
    getAuthStat: () => { return adminCore.getAuthStat(); },
    refresh: () => { open_folder(); info_handler.itools.exitBtn.click(); },
    tagChosen: (signEle, tag = true) => {
        let bg = (tag) ? args.styles.tableItemChose : "";
        signEle.style.background = bg;
    },
    changeCallBack: () => {
        info_handler.iview.hide("show");
        info_handler.iview.setView("22em", info_handler.ibox.getBoundingClientRect().height + 1.5 * info_handler.itools.titleBar.getBoundingClientRect().height + "px");
    },
});

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

