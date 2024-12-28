"use strict"

const MIcon = '<svg viewBox="-50 -50 425 400" xmlns="http://www.w3.org/2000/svg"><g><rect rx="20" height="240" width="80" y="75" x="25" stroke="#e32a77" fill="#e32a77"/><rect rx="20" height="240" width="80" y="75" x="270" stroke="#bc22df" fill="#bc22df"/><rect transform="rotate(-45 130 145)" rx="20" height="240" width="80" y="25" x="90" stroke="#34e3bb" fill="#34e3bb"/><rect transform="rotate(45 243.5 145)" rx="20" height="240" width="87" y="25" x="200" stroke="#fbdb04" fill="#fbdb04"/></g></svg>';


function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
}

function html_to_element(html = "") {
    let div = document.createElement('div');
    div.innerHTML = html;
    div.remove();
    return div.firstElementChild;
}

function format_size(sizeB = 0) {
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

function SimpPageActions(simple_page, operations, popmenu=null) {
    let simple_page_do = simple_page.querySelector(".title");
    let simple_page_quit = simple_page.querySelector(".quit");
    let simple_page_src = simple_page.querySelector(".from");
    let simple_page_dst = simple_page.querySelector(".to");
    let simple_page_src_input = simple_page.querySelector(".from .input");
    let simple_page_dst_input = simple_page.querySelector(".to .input");
    let simple_page_content = simple_page.querySelector(".content");
    let simple_page_item_folder = simple_page.querySelector(".content .folder");
    let simple_page_item_parent = simple_page.querySelector(".content .parent");
    let simple_page_blank = simple_page.querySelector(".blank");
    let simple_page_writeboard = simple_page.querySelector(".write_board");
    let simple_page_upload = simple_page.querySelector(".upload");

    let update_info_callback = () => {};

    init_simple_page_function()

    function init_simple_page_function() {
        simple_page.querySelector('.item.parent .colicon svg').innerHTML = operations.choose_icon("home", true);
        simple_page.querySelector('.item.parent .colname').onclick = function () {
            operations.openfolder(this.parentNode.parentNode.getAttribute('path'), (info)=>{ 
                simple_page_update_info(info); 
            });
        };
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

    function do_mkdir(cpath) {
        function init() {
            simple_page_do.innerText = "New Directory";
            simple_page_dst_input.value = (cpath + "/" + "New Directory").replace("//", "/");
            simple_page.style.display = "";
            simple_page_src.style.display = "none";
        }

        function clean() {
            simple_page_do.innerText = "";
            simple_page_dst_input.value = "";
            simple_page.style.display = "none";
            simple_page_src.style.display = "";
        }

        init();
        simple_page_do.onclick = function () {
            let input = simple_page_dst_input.value;
            clean();
            operations.mkdir(input, operations.refresh);
        }
        simple_page_quit.onclick = () => { clean(); }
    }

    function do_mkfile(cpath) {
        function init() {
            simple_page_do.innerText = "Touch";
            simple_page_dst_input.value = (cpath + "/" + "New File").replace("//", "/");
            simple_page.style.display = "";
            simple_page_src.style.display = "none";
            simple_page_blank.style.display = "";
        }

        function clean() {
            simple_page_do.innerText = "";
            simple_page_dst_input.value = "";
            simple_page.style.display = "none";
            simple_page_src.style.display = "";
            simple_page_blank.style.display = "none";
        }

        init();
        simple_page_do.onclick = function () {
            let input = [simple_page_dst_input.value, simple_page_writeboard.innerText];
            clean();
            // confirm pop menu
            operations.mkfile(input[0], input[1], operations.refresh);
        }
        simple_page_quit.onclick = () => { clean(); }
    }

    function do_rename(path) {
        function init() {
            simple_page_do.innerText = "Rename";
            simple_page_src_input.value = path;
            simple_page_dst_input.value = path;
            simple_page.style.display = "";
        }

        function clean() {
            simple_page_do.innerText = "";
            simple_page_src_input.value = "";
            simple_page_dst_input.value = "";
            simple_page.style.display = "none";
        }

        init();
        simple_page_do.onclick = function () {
            let input = [simple_page_src_input.value, simple_page_dst_input.value];
            clean();
            operations.rename(input[0], input[1], operations.refresh);
        }
        simple_page_quit.onclick = () => { clean(); }
    }

    function do_moveto(cpath, path) {
        function init() {
            simple_page_do.innerText = "Move To";
            simple_page_src_input.value = path;
            simple_page_dst_input.value = cpath;
            simple_page.style.display = "";
            simple_page_content.style.display = "";
            update_info_callback = ()=>{
                simple_page_dst_input.value = simple_page.__this_info__.Path;
            };
            operations.openfolder(cpath, (info)=>{ 
                simple_page_update_info(info); 
            });
        }

        function clean() {
            simple_page_do.innerText = "";
            simple_page_src_input.value = "";
            simple_page_dst_input.value = "";
            simple_page.style.display = "none";
            simple_page_content.style.display = "none";
        }

        init();
        simple_page_do.onclick = function () {
            let input = [simple_page_src_input.value, simple_page_dst_input.value];
            clean();
            operations.moveto(input[0], input[1], operations.refresh);
        }
        simple_page_quit.onclick = () => { clean(); }
    }

    function do_copyto(cpath, path) {
        function init() {
            simple_page_do.innerText = "Copy To";
            simple_page_src_input.value = path;
            simple_page_dst_input.value = cpath;
            simple_page.style.display = "";
            simple_page_content.style.display = "";
            update_info_callback = ()=>{
                simple_page_dst_input.value = simple_page.__this_info__.Path;
            };
            operations.openfolder(cpath, (info)=>{ 
                simple_page_update_info(info); 
            });
        }

        function clean() {
            simple_page_do.innerText = "";
            simple_page_src_input.value = "";
            simple_page_dst_input.value = "";
            simple_page.style.display = "none";
            simple_page_content.style.display = "none";
        }

        init();
        simple_page_do.onclick = function () {
            let input = [simple_page_src_input.value, simple_page_dst_input.value];
            clean();
            // confirm pop menu
            operations.copyto(input[0], input[1], operations.refresh);
        }
        simple_page_quit.onclick = () => { clean(); }
    }

    function do_remove(path) {
        let input = path;
        operations.remove(input, pop_templates("remove " + input, operations.refresh));;
    }

    function do_archive(cpath, paths) {
        function init() {
            simple_page_do.innerText = "Archive [.tgz | .zip]";
            simple_page_dst_input.value = (cpath + "/" + "Archive.tgz").replace("//", "/");
            simple_page.style.display = "";
            simple_page_src.style.display = "none";
        }

        function clean() {
            simple_page_do.innerText = "";
            simple_page_dst_input.value = "";
            simple_page.style.display = "none";
            simple_page_src.style.display = "";
        }

        init();
        simple_page_do.onclick = function () {
            let input = simple_page_dst_input.value;
            clean();
            let suffix = dstName.slice(dstName.lastIndexOf(".") + 1);
            let format = (suffix == "tgz") ? "targz" : "zip";
            operations.archive(paths, input, format, operations.refresh);
        }
        simple_page_quit.onclick = () => { clean(); }
    }

    function do_upload(path) {
        init();

        let finish_callback = () => {
            operations.refresh();
        }

        let upload_file_core = (file, callback) => { operations.upload(file, path, callback); }
        let up_item_html = simple_page_upload.querySelector(".item_wrapper").innerHTML
        let up_item_container = simple_page_upload.querySelector(".files")
        up_item_container.onclick = (event) => { event.cancelBubble = true; };
        simple_page_upload.querySelector(".final").onclick = () => { append_file(); }
        simple_page_do.onclick = () => { start_upload(); }
        simple_page_quit.onclick = () => { 
            reset();
            clean();
        }
        
        function init() {
            simple_page_do.innerText = "Upload";
            simple_page.style.display = "";
            simple_page_upload.style.display = "";
            simple_page_src.style.display = "none";
            simple_page_dst_input.value = path;
        }

        function clean() {
            simple_page_do.innerText = "";
            simple_page.style.display = "none";
            simple_page_upload.style.display = "none";
            simple_page_src.style.display = "";
            simple_page_dst_input.value = "";
        }

        function append_file() {
            let file_input = document.createElement("input");
            file_input.type = "file";
            file_input.multiple = "multiple";
            file_input.onchange = function () {
                let finput = this;
                for (let i = 0; i < finput.files.length; i++) {
                    let file = finput.files[i];
                    let item_node = html_to_element(up_item_html);
                    item_node.__this_info__ = {
                        carry_file: file,
                        on_upload: false,
                        upload_stop: false,
                        upload_finish: false,
                    }

                    item_node.querySelector('.colicon svg').innerHTML = operations.choose_icon(file.name, false);
                    item_node.querySelector('.colname').innerText = file.name;
                    item_node.querySelector('.coltime').innerText = format_size(file.size);
                    item_node.querySelector('.colsize').innerText = "wait";
                    item_node.querySelector('.colsize').onclick = function () {
                        let node = this.parentNode.parentNode;
                        if (node.__this_info__.on_upload)
                            node.__this_info__.upload_stop = true;
                        else
                            node.remove();
                    };
                    up_item_container.appendChild(item_node);
                }
                finput.remove();
            };
            file_input.click();
        }
    
        function upload_file_callback(tnode, progress, status) {
            // status: md5 / upload / finish / exist / fail / stop; progress: -1 or [0-1] 
            if (progress >= 0) {
                tnode.querySelector(".colprog").style.width = (100 * progress).toFixed(2) + "%";
            }
            tnode.querySelector(".colsize").innerText = status;
            if (status == "stop") {
                tnode.__this_info__.on_upload = false;
                tnode.__this_info__.upload_finish = true;
                tnode.remove();
            } else if (status == "finish" || status == "exist" || status == "fail") {
                tnode.__this_info__.on_upload = false;
                tnode.__this_info__.upload_finish = true;
                tnode = tnode.nextSibling;
                while (tnode) {
                    if (!tnode)
                        break;
                    if (tnode.__this_info__.upload_finish == false)
                        break;
                    tnode = tnode.nextSibling;
                }
                if (tnode) {
                    tnode.__this_info__.on_upload = true;
                    upload_file_core(tnode.__this_info__.carry_file, (progress, status) => {
                        upload_file_callback(tnode, progress, status);
                    });
                } else {
                    finish_callback();
                }
            } // else md5 upload

            return (tnode) ? tnode.__this_info__.upload_stop : false;
        }

        function start_upload() {
            let tnode = up_item_container.firstChild;
            while (tnode) {
                if (!tnode)
                    break;
                if (tnode.__this_info__.upload_finish == false && tnode.__this_info__.on_upload == false)
                    break;
                tnode = tnode.nextSibling;
            }
            if (tnode) {
                tnode.__this_info__.on_upload = true;
                upload_file_core(tnode.__this_info__.carry_file, (progress, status) => {
                    upload_file_callback(tnode, progress, status);
                });
            }
    

        }
    
        function reset() {
            setTimeout(() => {
                if (!up_item_container.firstChild) {
                    return;
                } else if (up_item_container.firstChild.__this_info__.on_upload == true) {
                    up_item_container.firstChild.__this_info__.upload_stop = true;
                    reset();
                } else {
                    up_item_container.firstChild.remove();
                }
            }, 20);
        }
    }

    function simple_page_update_info(info = { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", Path: "", FileList: [], FolderList: [] }) {
        let this_info = operations.get_open_folder_info(info);
        let current_path = this_info.Path;
        let sortf = function (a, b) { return a.Name.localeCompare(b.Name); };
        simple_page.__this_info__ = this_info;
        this_info.FileList.sort(sortf);
        this_info.FileList.sort(sortf);
        update_info_callback();

        let htmlFolder = this_info.FolderList.map(function (value) { return operations.get_item_html(value, current_path); });
        // let htmlFile = this_info.FileList.map(function (value) { return operations.get_item_html(value, current_path); });
        simple_page_item_folder.innerHTML = htmlFolder.join("");
        // simple_page_item_file.innerHTML = htmlFile.join("");
        
        // append onclick
        setTimeout(function () {
            let all_items = Array.prototype.slice.call(simple_page_item_folder.children);
            // all_items = all_items.concat(Array.prototype.slice.call(simple_page_item_file.children));
            all_items.forEach(function (item) {
                item.__fileinfo__ = JSON.parse(decodeURIComponent(item.getAttribute("raw")));
                item.setAttribute("raw", "");
                item.onclick = function () {
                    let node = this;
                    if (node.__fileinfo__.IsDir) {
                        operations.openfolder(node.__fileinfo__.Path, (info)=>{ 
                            simple_page_update_info(info); 
                        });
                    }
                };
            });
        }, 32); // timeOut to process after (but not exact time to process)
        
        // set parent path
        let pathList = current_path.split("/").filter(Boolean).map(function (value, index, array) {
            return { name: value, path: "/" + array.slice(0, index + 1).join("/") };
        });
        let parentPath = ((pathList.length < 2) ? "/" : pathList[pathList.length - 2].path);
        simple_page_item_parent.setAttribute("path", parentPath);
    }

    return {
        do_mkdir: do_mkdir,
        do_mkfile: do_mkfile,
        do_rename: do_rename,
        do_moveto: do_moveto,
        do_copyto: do_copyto,
        do_remove: do_remove,
        do_archive: do_archive,
        do_upload: do_upload,
    }

}

function FileViewer(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
        params: {
            noMaskLink: false,
            sort_callback: (cinfo) => { }, 
            openfile: (path) => { },
            openfolder: (path, callback, simple=false) => { },
            download: (paths) => { },
            archive: (paths, input, format, callback) => {},
            rename: (src, dst, callback) => {},
            moveto: (src, dst, callback) => {},
            copyto: (src, dst, callback) => {},
            remove: (path, callback) => {},
            upload: (file, path, callback) => {},
            mkdir: (path, callback) => {},
            mkfile: (path, content, callback) => {},
        },
        styles: {
            basicSize: "14px",
            colname_width: "55%",
            coltime_width: "25%",
            colsize_width: "20%",
            colmenu_display: "block",
            ctrlHeadColor: "rgba(255,255,255,0.2)", pathHeadColor: "rgba(120,120,180,0.25)",
            listItemColor: "rgba(255,255,255,0.5)", listItemHover: "rgba(196,196,196,0.75)",
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let current_info = {};
    // {Name:"", Size:"", Mode:"", Mtim:"", Ctim:"", IsDir:true, FileNum:"", FolderNum:""} 
    // + {Path: ""/xx/xxx/xxx with URIDecoded }
    // + {FileNodes:[], FolderNodes:[]}
    // + {FileList:[], FolderList:[]}

    let name_order = false; // false means sort small -> big
    let time_order = false;
    let size_order = false;
    let chosen_files = [];
    let chosen_folders = [];
    let choose_mode = false;
    let no_mask_link = args.params.noMaskLink;

    let container = shadow_module.shadowRoot.querySelector(".listTable");

    let func_head = container.querySelector(".pathHead");
    
    let path_chain = container.querySelector(".pathHead .pathChain");

    let control_head = container.querySelector(".ctrlHead");

    let head_menu = container.querySelector(".pathHead .colmenu");

    let item_menu = container.querySelector(".page_container .item_menu");
    let item_menu_icon = item_menu.querySelector(".basic_icon svg");
    let item_menu_name = item_menu.querySelector(".basic_text_name");
    let item_menu_size = item_menu.querySelector(".basic_text_size");

    let list_page = container.querySelector(".listPage");
    let list_page_parent = list_page.querySelector(".parent");
    let list_page_folder = list_page.querySelector(".folder");
    let list_page_file = list_page.querySelector(".file");

    let detail_info = container.querySelector(".page_container .detail_info");
    let detail_info_icon = detail_info.querySelector(".basic_icon svg");
    let detail_info_name = detail_info.querySelector(".value.name");
    let detail_info_size = detail_info.querySelector(".value.size");
    let detail_info_mode = detail_info.querySelector(".value.mode");
    let detail_info_isdir = detail_info.querySelector(".value.isdir");
    let detail_info_mtime = detail_info.querySelector(".value.mtime");
    let detail_info_ctime = detail_info.querySelector(".value.ctime");
    let detail_info_finum = detail_info.querySelector(".value.finum");
    let detail_info_fonum = detail_info.querySelector(".value.fonum");
    let detail_info_path = detail_info.querySelector(".value.path");
    let detail_info_link = detail_info.querySelector(".value.link");

    let choose_icon = null;
    try {
        choose_icon = SVGIcons(shadow_module.shadowRoot).chooseIcon
    } catch (error) {
        choose_icon = (name = "", isFolder = false) => {
        if (isFolder)
            return '<path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-1.11-.9-2-2-2h-8l-2-2z" fill="#90a4ae" />';
            else
                return '<path d="M13 9h5.5L13 3.5V9M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m5 2H6v16h12v-9h-7V4z" fill="#42a5f5" />';
        }
    }

    init_head_menu_function();
    init_head_path_function();
    init_ctrl_menu_function();
    init_item_menu_function();
    init_item_detail_function();

    let operations = {
        choose_icon: choose_icon,
        get_item_html: (item, path) => {return get_item_html(item, path);},
        get_open_folder_info: (info) => {return get_open_folder_info(info); },
        refresh: () => {open_path(current_info.Path, True)},
        openfile: args.params.openfile,
        openfolder: args.params.openfolder,
        download: args.params.download,
        archive: args.params.archive,
        rename: args.params.rename,
        moveto: args.params.moveto,
        copyto: args.params.copyto,
        remove: args.params.remove,
        upload: args.params.upload,
        mkdir: args.params.mkdir,
        mkfile: args.params.mkfile,
        sort_callback: args.params.sort_callback,
    }

    let simple_page = container.querySelector(".simple_page");
    let actions = SimpPageActions(simple_page, operations);
    change_auth_state(false);
    change_auth_state(true);

    function open_path(path, is_dir) {
        let ori_background = container.style.background;
        container.style.background = "#666";
        if (is_dir)
            operations.openfolder(path, (info)=>{ update_info(info); });
        else
            operations.openfile(path);
        container.style.background = ori_background;
    }

    function path_to_url(path) {
        if (args.params.pathToUrl) 
            return args.params.pathToUrl(path)
        return ""
    }

    let item_html_list = (() => {
        let template = list_page.querySelector(".padding .item_wrapper")
        template.remove()
        let item_html = template.innerHTML;
        let item_html_list = [];
        let pos = [0]
        let key_list = ["__DATA_RAW__", "__DATA_ICON__", "__DATA_NAME__", "__DATA_TIME__", "__DATA_SIZE__"]
        for (let i=0; i<key_list.length; i++) {
            let start = item_html.indexOf(key_list[i])
            let end = start + key_list[i].length
            pos.push(start)
            pos.push(end)
        }
        for (let i = 0; i < pos.length; i+=2) {
            item_html_list.push((i == pos.length - 1)? item_html.slice(pos[i]): item_html.slice(pos[i], pos[i+1]))
        }
        return item_html_list
    })()

    function get_item_html(item = { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", FileNum: "", FolderNum: "" }, current_path) {
        item.Path = current_path.replace(/(\/$)/g, "") + "/" + item.Name;
        item.IsDir = (item.FileNum != "");
        let item_html = item_html_list[0] + encodeURIComponent(JSON.stringify(item)) + item_html_list[1] + choose_icon(item.Name, item.IsDir) + item_html_list[2] + item.Name + item_html_list[3] + new Date(Number(item.Mtim + "000")).toISOString().slice(0, -5) + item_html_list[4] +  format_size(Number(item.Size)) + item_html_list[5];
        return item_html;
    }

    function init_ctrl_menu_function() {
        control_head.querySelector('.colname').onclick = function () { sort_items("name"); };
        control_head.querySelector('.coltime').onclick = function () { sort_items("time"); };
        control_head.querySelector('.colsize').onclick = function () { sort_items("size"); };
        control_head.querySelector('.colmenu').onclick = function () { set_choose_mode();  };
    }
    
    function set_head_path_display() {
        // update path_chain
        let pathList = current_info.Path.split("/").filter(Boolean).map(function (value, index, array) {
            return { name: value, path: "/" + array.slice(0, index + 1).join("/") };
        });
        let pathChainList = pathList.map(function (value, index, array) {
            return '<a class="path" path="' + value.path + '"> > ' + value.name + '</a>';
        });
        path_chain.innerHTML = '<a class="path" path="/"> Home </a>' + pathChainList.join("\n");
        path_chain.setAttribute("path", current_info.Path);
        let items = path_chain.querySelectorAll('.path');
        let numItem = items.length;
        for (let i = 0; i < numItem; i++) {
            items[i].onclick = function () {
                open_path(this.getAttribute('path'), true);
                return no_mask_link;
            };
        }
        // update parentDir
        let parentPath = ((pathList.length < 2) ? "/" : pathList[pathList.length - 2].path);
        list_page_parent.setAttribute("path", parentPath);
    }

    function init_head_path_function() {
        func_head.querySelector('.colicon').innerHTML = MIcon;
        func_head.querySelector('.colicon').onclick = function () {
            if (list_page.scrollTop != 0)
                list_page.scrollTop = 0;
            else if (path_chain.getAttribute("contenteditable") == "true") {
                path_chain.setAttribute("contenteditable", "false");
                path_chain.setAttribute("path", path_chain.innerText);
                if (path_chain.innerText != current_info.Path) {
                    open_path(path_chain.innerText, true);
                } else {
                    set_head_path_display();
                }
            } else {
                path_chain.innerText = path_chain.getAttribute("path");
                path_chain.setAttribute("contenteditable", "true");
            }
        };
        path_chain.onkeydown = function (event) {
            if (event.key == "Enter") {
                path_chain.setAttribute("contenteditable", "false");
                path_chain.setAttribute("path", path_chain.innerText);
                if (path_chain.innerText != current_info.Path) {
                    open_path(path_chain.innerText, true);
                } else {
                    set_head_path_display();
                }
            }
        };
        list_page_parent.querySelector('.colicon svg').innerHTML = choose_icon("home", true);
        list_page_parent.querySelector('.colname').onclick = function () {
            open_path(this.parentNode.parentNode.getAttribute('path'), true);
            return no_mask_link;
        };
        
    }

    function set_item_detail_display(info=null, icon=null, stop=false) {
        if (stop) {
            detail_info.style.display = "none"
        } else {
            detail_info_icon.innerHTML = icon
            detail_info_name.innerText = info.Name
            detail_info_size.innerText = format_size(info.Size)
            detail_info_mode.innerText = info.Mode
            detail_info_isdir.innerText = info.IsDir
            detail_info_mtime.innerText = new Date(Number(info.Mtim + "000")).toISOString()
            detail_info_ctime.innerText = new Date(Number(info.Ctim + "000")).toISOString()
            detail_info_finum.innerText = info.FileNum
            detail_info_fonum.innerText = info.FolderNum
            detail_info_path.innerText = info.Path
            detail_info_link.innerText = path_to_url(info.Path)
            Array.prototype.slice.call(detail_info.querySelectorAll(".folder_spec")).forEach(function (item) {
                item.style.display = ((info.IsDir) ? "" : "none");
            });
            detail_info.style.display = ""
            detail_info.__operation_time__ = Date.now()
            function close_display_fn() {
                if (Date.now() - detail_info.__operation_time__ > 3000) set_item_detail_display(null, null, true); 
                else setTimeout(close_display_fn, 3000)
            }
            close_display_fn()
        }
    }

    function init_item_detail_function() {
        detail_info_icon.onclick = function () {
            set_item_detail_display(null, null, true);
        }
        Array.prototype.slice.call(detail_info.querySelectorAll("tr")).forEach(function (item) {
            item.querySelector(".value").onclick = function () {
                let value = this;
                let input = document.body.appendChild(document.createElement('input'));
                input.value = value.innerText;
                input.select();
                document.execCommand("copy");
                input.remove();
                value.style.background = "#abf";
                setTimeout(() => { value.style.background = ""; }, 1000);
                detail_info.__operation_time__ = Date.now()
            };
        });
    }

    function set_item_menu_display(node=null) {
        if (!node) {
            item_menu_icon.innerHTML = "";
            item_menu_name.innerHTML = "";
            item_menu_size.innerHTML = "";
            item_menu.__fileinfo__ = null;
            item_menu.style.display = "none";
        } else {
            // <div: relative><list_page: absolute><item_menu: absolute></div>
            item_menu.style.display = "";
            let node_rect = node.getBoundingClientRect();
            let page_rect = list_page.getBoundingClientRect();
            let menu_rect = item_menu.getBoundingClientRect();
            let new_menu_top_min = 10
            let new_menu_top_max = (page_rect.height - menu_rect.height - 10)
            let new_menu_top = node_rect.top - 0.9 * menu_rect.height
            new_menu_top = Math.min(Math.max(new_menu_top, new_menu_top_min), new_menu_top_max)
            item_menu.style.top = new_menu_top + "px";
            item_menu_icon.innerHTML = node.querySelector(".colicon svg").innerHTML;
            item_menu_name.innerHTML = node.querySelector(".colname").innerHTML;
            item_menu_size.innerHTML = node.querySelector(".colsize").innerHTML;
            item_menu.__fileinfo__ = node.__fileinfo__;
            item_menu.__operation_time__ = Date.now();
            item_menu_icon.onclick = function () {
                set_item_menu_display(null);
            }
            function close_display_fn() {
                if (Date.now() - item_menu.__operation_time__ > 3000) set_item_menu_display(null); 
                else setTimeout(close_display_fn, 3000)
            }
            close_display_fn();
        }
    }

    function init_item_menu_function() {
        item_menu.querySelector(".action_item.download").onclick = function () {
            item_menu.__operation_time__ = Date.now()
            if (item_menu.__fileinfo__.IsDir) {
                // warn("dir can not be downloaded.")
            } else {
                operations.download([item_menu.__fileinfo__.Path])
            }
        }
        item_menu.querySelector(".action_item.archive").onclick = function () {
            item_menu.__operation_time__ = Date.now()
            if (!item_menu.__fileinfo__.IsDir) {
                // warn("file can not be tared.")
            } else {
                // confirm pop menu
                actions.do_archive(current_info.Path, [item_menu.__fileinfo__.Path]);
            }
        }
        item_menu.querySelector(".action_item.rename").onclick = function () {
            item_menu.__operation_time__ = Date.now()
            actions.do_rename(item_menu.__fileinfo__.Path);
        }
        item_menu.querySelector(".action_item.moveto").onclick = function () {
            item_menu.__operation_time__ = Date.now()
            actions.do_moveto(current_info.Path, item_menu.__fileinfo__.Path);
        }
        item_menu.querySelector(".action_item.copyto").onclick = function () {
            item_menu.__operation_time__ = Date.now()
            actions.do_copyto(current_info.Path, item_menu.__fileinfo__.Path);
        }
        item_menu.querySelector(".action_item.delete").onclick = function () {
            item_menu.__operation_time__ = Date.now()
            // confirm pop menu
            actions.do_remove(item_menu.__fileinfo__.Path);
        }
        item_menu.querySelector(".action_item.detail").onclick = function () {
            item_menu.__operation_time__ = Date.now()
            set_item_detail_display(item_menu.__fileinfo__, item_menu_icon.innerHTML)
        }
    }

    function init_head_menu_function() {
        head_menu.querySelector(".action_item.mkdir").onclick = function () {
            head_menu.__operation_time__ = Date.now()
            actions.do_mkdir(current_info.Path);
        }
        head_menu.querySelector(".action_item.mkfile").onclick = function () {
            head_menu.__operation_time__ = Date.now()
            actions.do_mkfile(current_info.Path);
        }
        head_menu.querySelector(".action_item.upload").onclick = function () {
            head_menu.__operation_time__ = Date.now()
            actions.do_upload(current_info.Path);
        }
        head_menu.querySelector(".action_item.download").onclick = function () {
            head_menu.__operation_time__ = Date.now()

            if (choose_mode) {
                let all_path = chosen_files.map(function (item) { return item.path; })
                operations.download(all_path);
                chosen_files.forEach(function (item) {
                    if (item.node) tag_chosen(item.node, false);
                });
                chosen_files = [];
            }
        }
        head_menu.querySelector(".action_item.archive").onclick = function () {
            head_menu.__operation_time__ = Date.now()

            if (choose_mode) {
                let all_path = chosen_files.concat(chosen_folders).map(function (item) { return item.path; })
                actions.do_archive(current_info.Path, all_path);
                chosen_folders.forEach(function (item) {
                    if (item.node)
                        tag_chosen(item.node, false);
                });
                chosen_folders = [];
            }
        }
        head_menu.querySelector(".action_item.chooseall").onclick = function () {
            head_menu.__operation_time__ = Date.now();
            choose_all();
        }
        head_menu.querySelector(".action_item.reverse").onclick = function () {
            head_menu.__operation_time__ = Date.now();
            reverse_choose();
        }
    }

    function set_choose_mode() {
        // if (current_info.FileNodes.length + current_info.FolderNodes.length == 0) {
        //     Array.prototype.slice.call(list_page_folder.children).forEach(function (item) {
        //         current_info.FolderNodes.push({ path: item.__fileinfo__.Path, node: item });
        //     });
        //     Array.prototype.slice.call(list_page_file.children).forEach(function (item) {
        //         current_info.FileNodes.push({ path: item.__fileinfo__.Path, node: item });
        //     });
        // }

        if (choose_mode) {
            choose_mode = false
            chosen_files.forEach(function (item) {
                if (item.node) tag_chosen(item.node, false);
            });
            chosen_folders.forEach(function (item) {
                if (item.node) tag_chosen(item.node, false);
            });
        } else {
            choose_mode = true
        }
    }

    function choose_all() {
        let all_chosen = (chosen_files.length + chosen_folders.length == current_info.FileNodes.length + current_info.FolderNodes.length);
        if (all_chosen) {
            chosen_files.forEach(function (item) {
                if (item.node)
                    tag_chosen(item.node, false);
            });
            chosen_folders.forEach(function (item) {
                if (item.node)
                    tag_chosen(item.node, false);
            });
            chosen_files = [];
            chosen_folders = [];
        } else {
            chosen_files = current_info.FileNodes.slice(0);
            chosen_folders = current_info.FolderNodes.slice(0);
            chosen_files.forEach(function (item) {
                if (item.node)
                    tag_chosen(item.node, true);
            });
            chosen_folders.forEach(function (item) {
                if (item.node)
                    tag_chosen(item.node, true);
            });
        }
    }

    function reverse_choose() {
        chosen_files.forEach(function (item) {
            if (item.node)
                tag_chosen(item.node, false);
        });
        chosen_folders.forEach(function (item) {
            if (item.node)
                tag_chosen(item.node, false);
        });
        chosen_files = current_info.FileNodes.filter(function (item) {
            return (chosen_files.findIndex(function (citem) { return (item.path == citem.path); }) == -1);
        });
        chosen_folders = current_info.FolderNodes.filter(function (item) {
            return (chosen_folders.findIndex(function (citem) { return (item.path == citem.path); }) == -1);
        });
        chosen_files.forEach(function (item) {
            if (item.node)
                tag_chosen(item.node, true);
        });
        chosen_folders.forEach(function (item) {
            if (item.node)
                tag_chosen(item.node, true);
        });
    }

    function tag_chosen(node=null, choose=true) {
        if (choose) {
            node.style.background = "rgba(255,255,200,0.75)"
        } else {
            node.style.background = ""
        }
    }

    function choose_item(node = null, append = true) {
        let path = node.__fileinfo__.Path
        let isFolder = node.__fileinfo__.IsDir
        if (!append) {
            chosen_files = [];
            chosen_folders = [];
        }
        if (isFolder) {
            let pos = chosen_folders.findIndex(function (citem) { return (path == citem.path); });
            if (pos == -1) {
                tag_chosen(node, true)
                chosen_folders.push({ path: path, node: node });
            } else {
                tag_chosen(node, false)
                chosen_folders.splice(pos, 1);
            }
        } else {
            let pos = chosen_files.findIndex(function (citem) { return (path == citem.path); });
            if (pos == -1) {
                tag_chosen(node, true)
                chosen_files.push({ path: path, node: node });
            } else {
                tag_chosen(node, false)
                chosen_files.splice(pos, 1);
            }
        }
    }

    function get_open_folder_info(info = { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", Path: "", FileList: [], FolderList: [] }) {
        try {
            info.FileList = JSON.parse(info.FileList);
            info.FolderList = JSON.parse(info.FolderList);
        } catch (err) { }
        if (!info.FileList)
            info.FileList = [];
        if (!info.FolderList)
            info.FolderList = [];
        let this_info = { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", Path: "/", IsDir: true, FileNum: "", FolderNum: "" };
        for (let key in info)
            if (key in this_info)
                this_info[key] = info[key];
        this_info.FileNum = info.FileList.length + "";
        this_info.FolderNum = info.FolderList.length + "";
        this_info.FileNodes = [];
        this_info.FolderNodes = [];
        this_info.FileList = info.FileList.slice(0);
        this_info.FolderList = info.FolderList.slice(0);
        return this_info
    }

    function set_item_action(item = null) {
        item.__fileinfo__ = JSON.parse(decodeURIComponent(item.getAttribute("raw")));
        item.setAttribute("raw", "");
        item.querySelector(".colicon").onclick = function (evt) {
            evt.cancelBubble = true;
            evt.returnValue = false;
            let node = this.parentNode;
            open_path(node.__fileinfo__.Path, node.__fileinfo__.IsDir);
            return no_mask_link;
        };
        item.querySelector(".colname").onclick = function (evt) {
            evt.cancelBubble = true;
            evt.returnValue = false;
            let node = this.parentNode.parentNode;
            open_path(node.__fileinfo__.Path, node.__fileinfo__.IsDir);
            return no_mask_link;
        };
        item.querySelector(".colmenu").onclick = function (evt) {
            let node = this.parentNode;
            if (choose_mode) {
                choose_item(node)
            } else {
                set_item_menu_display(node)
            }
            return no_mask_link;
        };
    }

    function update_items(fileList = [], folderList = [], updateCallBack = null) {
        // update list_page_folder and list_page_file
        let current_path = current_info.Path;
        let htmlFolder = folderList.map(function (value) { return get_item_html(value, current_path); });
        let htmlFile = fileList.map(function (value) { return get_item_html(value, current_path); });
        list_page_folder.innerHTML = htmlFolder.join("");
        list_page_file.innerHTML = htmlFile.join("");
        // append onclick
        setTimeout(function () {
            let all_items = Array.prototype.slice.call(list_page_folder.children);
            all_items = all_items.concat(Array.prototype.slice.call(list_page_file.children));
            all_items.forEach(function (item) { set_item_action(item); });
            updateCallBack();
        }, 32); // timeOut to process after (but not exact time to process)
    }

    function sort_items(section = "name") {
        let sortf = function () { };
        switch (section) {
            case "name":
                if (name_order)
                    sortf = function (b, a) { return a.Name.localeCompare(b.Name); };
                else
                    sortf = function (a, b) { return a.Name.localeCompare(b.Name); };
                name_order = !name_order;
                break;
            case "time":
                if (time_order)
                    sortf = function (b, a) { return a.Mtim - b.Mtim; };
                else
                    sortf = function (a, b) { return a.Mtim - b.Mtim; };
                time_order = !time_order;
                break;
            case "size":
                if (size_order)
                    sortf = function (b, a) { return a.Size - b.Size; };
                else
                    sortf = function (a, b) { return a.Size - b.Size; };
                size_order = !size_order;
                break;
            default:
                return;
        }
        current_info.FileList.sort(sortf);
        current_info.FolderList.sort(sortf);
        update_items(current_info.FileList, current_info.FolderList, function () {
            current_info.FileNodes = [];
            current_info.FolderNodes = [];
            Array.prototype.slice.call(list_page_folder.children).forEach(function (item) {
                current_info.FolderNodes.push({ path: item.__fileinfo__.Path, node: item });
            });
            Array.prototype.slice.call(list_page_file.children).forEach(function (item) {
                current_info.FileNodes.push({ path: item.__fileinfo__.Path, node: item });
            });
            operations.sort_callback(current_info);
        });
    }

    function update_info(info = { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", Path: "", FileList: [], FolderList: [] }) {
        current_info = get_open_folder_info(info);
        name_order = false;
        sort_items("name");
        set_head_path_display();
    }

    function change_auth_state(auth=false) {
        // do not use archive for now
        if (!auth) {
            head_menu.querySelector(".action_item.mkdir").style.display = "none";
            head_menu.querySelector(".action_item.mkfile").style.display = "none";
            head_menu.querySelector(".action_item.upload").style.display = "none";
            head_menu.querySelector(".action_item.archive").style.display = "none";
            item_menu.querySelector(".action_item.archive").style.display = "none";
            item_menu.querySelector(".action_item.rename").style.display = "none";
            item_menu.querySelector(".action_item.moveto").style.display = "none";
            item_menu.querySelector(".action_item.copyto").style.display = "none";
            item_menu.querySelector(".action_item.delete").style.display = "none";
        } else {
            head_menu.querySelector(".action_item.mkdir").style.display = "";
            head_menu.querySelector(".action_item.mkfile").style.display = "";
            head_menu.querySelector(".action_item.upload").style.display = "";
            head_menu.querySelector(".action_item.archive").style.display = "none";
            item_menu.querySelector(".action_item.archive").style.display = "none";
            item_menu.querySelector(".action_item.rename").style.display = "";
            item_menu.querySelector(".action_item.moveto").style.display = "";
            item_menu.querySelector(".action_item.copyto").style.display = "";
            item_menu.querySelector(".action_item.delete").style.display = "";
        }
    }


    return {
        updateInfo: update_info,
        change_auth_state: change_auth_state,
    }
}

