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
            noMaskLink: false,
            chooseIcon: null,
            sortCallBack: (cinfo) => { }, 
            openPath: (path, isFolder) => { },
            // menuAction: (info, node, thisFolder) => { }, 
            // iconAction: (path, ele, isFolder) => { },
            // sizeAction: (path, ele, isFolder) => { }, 
            // timeAction: (path, ele, isFolder) => { },
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

    let currentInfo = {};
    // {Name:"", Size:"", Mode:"", Mtim:"", Ctim:"", Path:"", IsDir:true, FileNum:"", FolderNum:""} 
    // + {FileNodes:[], FolderNodes:[]}

    let currentPath = ""; // /xx/xxx/xxx with URIDecoded
    let fileList = [];
    let folderList = [];
    let nameOrder = false // false means sort small -> big
    let timeOrder = false
    let sizeOrder = false
    let chosenFiles = []
    let chosenFolders = []
    let choose_mode = false
    let item_menu_open = false
    let no_mask_link = args.params.noMaskLink

    let container = shadow_module.shadowRoot.querySelector(".listTable");
    let pathHead = container.querySelector(".pathHead");
    let pathChain = pathHead.querySelector(".pathChain");
    let ctrlHead = container.querySelector(".ctrlHead");
    let listPage = container.querySelector(".listPage");
    let listParent = listPage.querySelector(".parent");
    let listFolder = listPage.querySelector(".folder");
    let listFile = listPage.querySelector(".file");

    let head_menu = container.querySelector(".pathHead .colmenu")

    let item_menu = container.querySelector(".page_container .item_menu")
    let item_menu_icon = item_menu.querySelector(".basic_icon svg")
    let item_menu_name = item_menu.querySelector(".basic_text_name")
    let item_menu_size = item_menu.querySelector(".basic_text_size")

    let detail_info = container.querySelector(".page_container .detail_info")
    let detail_info_icon = detail_info.querySelector(".basic_icon svg")
    let detail_info_name = detail_info.querySelector(".value.name")
    let detail_info_size = detail_info.querySelector(".value.size")
    let detail_info_mode = detail_info.querySelector(".value.mode")
    let detail_info_isdir = detail_info.querySelector(".value.isdir")
    let detail_info_mtime = detail_info.querySelector(".value.mtime")
    let detail_info_ctime = detail_info.querySelector(".value.ctime")
    let detail_info_finum = detail_info.querySelector(".value.finum")
    let detail_info_fonum = detail_info.querySelector(".value.fonum")
    let detail_info_path = detail_info.querySelector(".value.path")
    let detail_info_link = detail_info.querySelector(".value.link")

    init_head_menu_function()
    init_head_path_function()
    init_ctrl_menu_function()
    init_item_menu_function()
    init_item_detail_function()


    let operations = {
        refresh: () => {open_path(currentPath, True)},
        download: args.params.adminView.download,
        archive: args.params.adminView.archive,
        rename: args.params.adminView.rename,
        moveto: args.params.adminView.moveto,
        copyto: args.params.adminView.copyto,
        remove: args.params.adminView.remove,
        upload: args.params.adminView.upload,
        mkdir: args.params.adminView.mkdir,
        mkfile: args.params.adminView.mkfile,
        sort_callback: args.params.sortCallBack,
    }

    
    function open_path(path, is_dir) {
        let ori_background = container.style.background;
        container.style.background = "#666";
        if (args.params.openPath) 
            args.params.openPath(path, is_dir);
        container.style.background = ori_background;
    }

    function path_to_url(path) {
        if (args.params.pathToUrl) 
            return args.params.pathToUrl(path)
        return ""
    }

    function choose_icon(name, is_dir) {
        if (!args.params.chooseIcon) {
            try {
                args.params.chooseIcon = SVGIcons(shadow_module.shadowRoot).chooseIcon
            } catch (error) {
                args.params.chooseIcon = (name = "", isFolder = false) => {
                    if (isFolder)
                        return '<path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-1.11-.9-2-2-2h-8l-2-2z" fill="#90a4ae" />';
                    else
                        return '<path d="M13 9h5.5L13 3.5V9M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m5 2H6v16h12v-9h-7V4z" fill="#42a5f5" />';
                }
            }            
        }
        args.params.chooseIcon(name, is_dir)
    }

    let item_html_list = (() => {
        let template = listPage.querySelector(".padding .item_wrapper")
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

    function get_item_html(item = { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", FileNum: "", FolderNum: "" }) {
        item.Path = currentPath.replace(/(\/$)/g, "") + "/" + item.Name;
        item.IsDir = (item.FileNum != "");
        let item_html = item_html_list[0] + encodeURIComponent(JSON.stringify(item)) + item_html_list[1] + choose_icon(item.Name, item.IsDir) + item_html_list[2] + item.Name + item_html_list[3] + new Date(Number(item.Mtim + "000")).toISOString().slice(0, -5) + item_html_list[4] +  format_size(Number(item.Size)) + item_html_list[5];
        return item_html;
    }

    function init_ctrl_menu_function() {
        ctrlHead.querySelector('.colname').onclick = function () { sort_items("name"); };
        ctrlHead.querySelector('.coltime').onclick = function () { sort_items("time"); };
        ctrlHead.querySelector('.colsize').onclick = function () { sort_items("size"); };
        ctrlHead.querySelector('.colmenu').onclick = function () {
            if (currentInfo.FileNodes.length + currentInfo.FolderNodes.length == 0) {
                Array.prototype.slice.call(listFolder.children).forEach(function (item) {
                    currentInfo.FolderNodes.push({ path: item.fileinfo.Path, node: item });
                });
                Array.prototype.slice.call(listFile.children).forEach(function (item) {
                    currentInfo.FileNodes.push({ path: item.fileinfo.Path, node: item });
                });
            }

            if (choose_mode) {
                choose_mode = false
                chosenFiles.forEach(function (item) {
                    if (item.node) tag_chosen(item.node, false);
                });
                chosenFolders.forEach(function (item) {
                    if (item.node) tag_chosen(item.node, false);
                });
            } else {
                choose_mode = true
            }
        };
    }
    
    function set_head_path_display() {
        // update pathChain
        let pathList = currentPath.split("/").filter(Boolean).map(function (value, index, array) {
            return { name: value, path: "/" + array.slice(0, index + 1).join("/") };
        });
        let pathChainList = pathList.map(function (value, index, array) {
            return '<a class="path" path="' + value.path + '"> > ' + value.name + '</a>';
        });
        pathChain.innerHTML = '<a class="path" path="/"> Home </a>' + pathChainList.join("\n");
        pathChain.setAttribute("path", currentPath);
        let items = pathChain.querySelectorAll('.path');
        let numItem = items.length;
        for (let i = 0; i < numItem; i++) {
            items[i].onclick = function () {
                open_path(this.getAttribute('path'), true);
                return no_mask_link;
            };
        }
        // update parentDir
        let parentPath = ((pathList.length < 2) ? "/" : pathList[pathList.length - 2].path);
        listParent.querySelector('.colicon svg').innerHTML = choose_icon("home", true);
        listParent.setAttribute("path", parentPath);
        listParent.querySelector('.colname').onclick = function () {
            open_path(this.parentNode.parentNode.getAttribute('path'), true);
            return no_mask_link;
        };
    }

    function init_head_path_function() {
        pathHead.querySelector('.colicon').onclick = function () {
            if (listPage.scrollTop != 0)
                listPage.scrollTop = 0;
            else if (pathChain.getAttribute("contenteditable") == "true") {
                pathChain.setAttribute("contenteditable", "false");
                pathChain.setAttribute("path", pathChain.innerText);
                if (pathChain.innerText != currentPath) {
                    open_path(pathChain.innerText, true);
                } else {
                    set_head_path_display();
                }
            } else {
                pathChain.innerText = pathChain.getAttribute("path");
                pathChain.setAttribute("contenteditable", "true");
            }
        };
        pathChain.onkeydown = function (event) {
            if (event.key == "Enter") {
                pathChain.setAttribute("contenteditable", "false");
                pathChain.setAttribute("path", pathChain.innerText);
                if (pathChain.innerText != currentPath) {
                    open_path(pathChain.innerText, true);
                } else {
                    set_head_path_display();
                }
            }
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
            detail_info.operation_time = Date.now()
            function close_display_fn() {
                if (Date.now() - detail_info.operation_time > 3000) set_item_detail_display(null, null, true); 
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
                detail_info.operation_time = Date.now()
            };
        });
    }

    function set_item_menu_display(node=null) {
        if (!node || (item_menu_open && (item_menu.fileinfo == node.fileinfo))) {
            item_menu_icon.innerHTML = "";
            item_menu_name.innerHTML = "";
            item_menu_size.innerHTML = "";
            item_menu.fileinfo = null;
            item_menu.style.display = "none";
            item_menu_open = false;
        } else {
            // <div: relative><listPage: absolute><item_menu: absolute></div>
            item_menu.style.display = "";
            let node_rect = node.getBoundingClientRect();
            let page_rect = listPage.getBoundingClientRect();
            let menu_rect = item_menu.getBoundingClientRect();
            let new_menu_top_min = 10
            let new_menu_top_max = (page_rect.height - menu_rect.height - 10)
            let new_menu_top = node_rect.top - 0.5 * menu_rect.height
            new_menu_top = Math.min(Math.max(new_menu_top, new_menu_top_min), new_menu_top_max)
            item_menu.style.top = new_menu_top + "px";
            item_menu_icon.innerHTML = node.querySelector(".colicon svg").innerHTML;
            item_menu_name.innerHTML = node.querySelector(".colname").innerHTML;
            item_menu_size.innerHTML = node.querySelector(".colsize").innerHTML;
            item_menu.fileinfo = node.fileinfo;
            item_menu_open = true;
            item_menu.operation_time = Date.now()
            function close_display_fn() {
                if (Date.now() - item_menu.operation_time > 3000) set_item_menu_display(null); 
                else setTimeout(close_display_fn, 3000)
            }
            close_display_fn()
        }
    }

    function init_item_menu_function() {
        item_menu.querySelector(".action_item.download").onclick = function () {
            item_menu.operation_time = Date.now()
            if (item_menu.fileinfo.IsDir) {
                // warn("dir can not be downloaded.")
            } else {
                operations.download(item_menu.fileinfo.Path, operations.refresh)
            }
        }
        item_menu.querySelector(".action_item.archive").onclick = function () {
            item_menu.operation_time = Date.now()
            if (!item_menu.fileinfo.IsDir) {
                // warn("file can not be tared.")
            } else {
                operations.archive(item_menu.fileinfo.Path, operations.refresh)
            }
        }
        item_menu.querySelector(".action_item.rename").onclick = function () {
            item_menu.operation_time = Date.now()
            operations.rename(item_menu.fileinfo.Path, operations.refresh);
        }
        item_menu.querySelector(".action_item.moveto").onclick = function () {
            item_menu.operation_time = Date.now()
            operations.moveto(item_menu.fileinfo.Path, operations.refresh);
        }
        item_menu.querySelector(".action_item.copyto").onclick = function () {
            item_menu.operation_time = Date.now()
            operations.copyto(item_menu.fileinfo.Path, operations.refresh);
        }
        item_menu.querySelector(".action_item.delete").onclick = function () {
            item_menu.operation_time = Date.now()
            operations.remove(item_menu.fileinfo.Path, operations.refresh);
        }
        item_menu.querySelector(".action_item.detail").onclick = function () {
            item_menu.operation_time = Date.now()
            set_item_detail_display(item_menu.fileinfo, item_menu_icon.innerHTML)
        }
    }

    function init_head_menu_function() {
        head_menu.querySelector(".action_item.mkdir").onclick = function () {
            head_menu.operation_time = Date.now()
            operations.mkdir(currentInfo.Path, operations.refresh);
        }
        head_menu.querySelector(".action_item.mkfile").onclick = function () {
            head_menu.operation_time = Date.now()
            operations.mkfile(currentInfo.Path, operations.refresh);
        }
        head_menu.querySelector(".action_item.upload").onclick = function () {
            head_menu.operation_time = Date.now()
            operations.upload(currentInfo.Path, operations.refresh);
        }
        head_menu.querySelector(".action_item.download").onclick = function () {
            head_menu.operation_time = Date.now()

            if (choose_mode) {
                let all_path = chosenFiles.map(function (item) { return item.path; })
                operations.download(all_path);
                chosenFiles.forEach(function (item) {
                    if (item.node) tag_chosen(item.node, false);
                });
                chosenFiles = [];
            }
        }
        head_menu.querySelector(".action_item.archive").onclick = function () {
            head_menu.operation_time = Date.now()

            if (choose_mode) {
                let all_path = chosenFiles.concat(chosenFolders).map(function (item) { return item.path; })
                operations.archive(all_path, operations.refresh);
                chosenFolders.forEach(function (item) {
                    if (item.node)
                        tag_chosen(item.node, false);
                });
                chosenFolders = [];
            }
        }
        head_menu.querySelector(".action_item.chooseall").onclick = function () {
            head_menu.operation_time = Date.now()

            if (chosenFiles.length + chosenFolders.length == currentInfo.FileNodes.length + currentInfo.FolderNodes.length) {
                chosenFiles.forEach(function (item) {
                    if (item.node)
                        tag_chosen(item.node, false);
                });
                chosenFolders.forEach(function (item) {
                    if (item.node)
                        tag_chosen(item.node, false);
                });
                chosenFiles = [];
                chosenFolders = [];
            } else {
                chosenFiles = currentInfo.FileNodes;
                chosenFolders = currentInfo.FolderNodes;
                chosenFiles.forEach(function (item) {
                    if (item.node)
                        tag_chosen(item.node, true);
                });
                chosenFolders.forEach(function (item) {
                    if (item.node)
                        tag_chosen(item.node, true);
                });
            }
        }
        head_menu.querySelector(".action_item.reverse").onclick = function () {
            head_menu.operation_time = Date.now()

            chosenFiles.forEach(function (item) {
                if (item.node)
                    tag_chosen(item.node, false);
            });
            chosenFolders.forEach(function (item) {
                if (item.node)
                    tag_chosen(item.node, false);
            });
            chosenFiles = currentInfo.FileNodes.filter(function (item) {
                return (chosenFiles.findIndex(function (citem) { return (item.path == citem.path); }) == -1);
            });
            chosenFolders = currentInfo.FolderNodes.filter(function (item) {
                return (chosenFolders.findIndex(function (citem) { return (item.path == citem.path); }) == -1);
            });
            chosenFiles.forEach(function (item) {
                if (item.node)
                    tag_chosen(item.node, true);
            });
            chosenFolders.forEach(function (item) {
                if (item.node)
                    tag_chosen(item.node, true);
            });
        }
    }

    function tag_chosen(node=null, choose=true) {
        if (choose) {
            node.style.background = "rgba(255,255,200,0.75)"
        } else {
            node.style.background = ""
        }
    }

    function choose_item(node = null, append = true) {
        let path = node.fileinfo.Path
        let isFolder = node.fileinfo.IsDir
        if (!append) {
            chosenFiles = [];
            chosenFolders = [];
        }
        if (isFolder) {
            let pos = chosenFolders.findIndex(function (citem) { return (path == citem.path); });
            if (pos == -1) {
                tag_chosen(node, true)
                chosenFolders.push({ path: path, node: node });
            } else {
                tag_chosen(node, false)
                chosenFolders.splice(pos, 1);
            }
        } else {
            let pos = chosenFiles.findIndex(function (citem) { return (path == citem.path); });
            if (pos == -1) {
                tag_chosen(node, true)
                chosenFiles.push({ path: path, node: node });
            } else {
                tag_chosen(node, false)
                chosenFiles.splice(pos, 1);
            }
        }
    }

    function set_item_action(item = null) {
        item.fileinfo = JSON.parse(decodeURIComponent(item.getAttribute("raw")));
        item.setAttribute("raw", "");
        item.querySelector(".colicon").onclick = function () {
            let node = this.parentNode;
            open_path(node.fileinfo.Path, node.fileinfo.IsDir);
            return no_mask_link;
        };
        item.querySelector(".colmenu").onclick = function () {
            let node = this.parentNode;
            if (choose_mode) {
                choose_item(node)
            } else {
                set_item_menu_display(node)
            }
            return no_mask_link;
        };
        item.querySelector(".colname").onclick = function () {
            let node = this.parentNode.parentNode;
            open_path(node.fileinfo.Path, node.fileinfo.IsDir);
            return no_mask_link;
        };
    }

    function update_items(fileList = [], folderList = [], updateCallBack = null) {
        // update listFolder and listFile
        let htmlFolder = folderList.map(function (value) { return get_item_html(value); });
        let htmlFile = fileList.map(function (value) { return get_item_html(value); });
        listFolder.innerHTML = htmlFolder.join("");
        listFile.innerHTML = htmlFile.join("");
        // append onclick
        setTimeout(function () {
            Array.prototype.slice.call(listFolder.children)
                .concat(Array.prototype.slice.call(listFile.children))
                .forEach(function (item) { set_item_action(item); });
            updateCallBack();
        }, 32); // timeOut to process after (but not exact time to process)
    }

    function sort_items(section = "name") {
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
        update_items(fileList, folderList, function () {
            currentInfo.FileNodes = [];
            currentInfo.FolderNodes = [];
            Array.prototype.slice.call(listFolder.children).forEach(function (item) {
                currentInfo.FolderNodes.push({ path: item.fileinfo.Path, node: item });
            });
            Array.prototype.slice.call(listFile.children).forEach(function (item) {
                currentInfo.FileNodes.push({ path: item.fileinfo.Path, node: item });
            });
            operations.sort_callback(currentInfo);
        });
    }

    function update_info(info = { Name: "", Size: "", Mode: "", Mtim: "", Ctim: "", Path: "", FileList: [], FolderList: [] }) {
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
        set_head_path_display();
        sort_items("name");
    }

    return {
        updateInfo: update_info,
    }
}
