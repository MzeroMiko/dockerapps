// =================================================================
const GLOBAL = window;
const main_page = document.querySelector(".mainPage");
init_headline();
init_searchline();
init_apps();
init_login();

function init_headline() {
    const main_headline = main_page.querySelector(".headline");
    main_headline.querySelector(".head_title").onclick = () => {
    
    }
    
    main_headline.querySelector(".head_menu .login").onclick = () => {
    
    }
}

function init_searchline() {
    const main_searchline = main_page.querySelector(".searchline");
    const do_search = main_searchline.querySelector(".search_go");
    const search_input = main_searchline.querySelector(".search_input input");
    const current_search_engine = main_searchline.querySelector(".search_engine.current");
    const all_search_engine_selections = main_searchline.querySelectorAll(".search_engine_sel .item");
    all_search_engine_selections.forEach((item) => {
        item.onclick = ()=> {
            current_search_engine.querySelector(".icon").setAttribute("class", item.querySelector(".icon").getAttribute("class"))
            current_search_engine.setAttribute("id", item.querySelector(".name").innerText);
        }
    })
    do_search.onclick = () => {
        if (current_search_engine.getAttribute("id") == "bing") {
            window.open("https://www.bing.com/search?q=" + search_input.value)
        } else if (current_search_engine.getAttribute("id") == "google") {
            window.open("https://www.google.com/search?q=" + search_input.value)
        } else if (current_search_engine.getAttribute("id") == "baidu") {
            window.open("https://www.baidu.com/s?wd=" + search_input.value)
        }
    }
    search_input.onkeydown = function (event) {
        if (event.key == "Enter") {
            do_search.click();
        }
    };
    
}

function init_apps() {
    let crad_info = [{
        Monitor: {
            icon: '<svg viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g fill="#4f8ff7"><path d="M423.59 132.8a31.855 31.855 0 0 0 5.408-17.804c0-17.675-14.33-32-32-32a31.853 31.853 0 0 0-17.805 5.409c-34.486-25.394-77.085-40.409-123.2-40.409-114.88 0-208 93.125-208 208 0 114.88 93.125 208 208 208 114.87 0 208-93.123 208-208 0-46.111-15.016-88.71-40.408-123.2zm-31.762 259.03c-17.646 17.646-38.191 31.499-61.064 41.174-23.672 10.012-48.826 15.089-74.766 15.089s-51.095-5.077-74.767-15.089c-22.873-9.675-43.417-23.527-61.064-41.174s-31.5-38.191-41.174-61.064c-10.013-23.672-15.09-48.828-15.09-74.768s5.077-51.095 15.089-74.767c9.674-22.873 23.527-43.417 41.174-61.064s38.191-31.5 61.064-41.174c23.673-10.013 48.828-15.09 74.768-15.09 25.939 0 51.094 5.077 74.766 15.089a191.221 191.221 0 0 1 37.802 21.327 31.853 31.853 0 0 0-3.568 14.679c0 17.675 14.327 32 32 32 5.293 0 10.28-1.293 14.678-3.568a191.085 191.085 0 0 1 21.327 37.801c10.013 23.672 15.09 48.827 15.09 74.767 0 25.939-5.077 51.096-15.09 74.768-9.675 22.873-23.527 43.418-41.175 61.064z"/><circle cx="256" cy="256" r="96"/></g></svg>',
            link: "monitor_app",
        }, 
        Explorer: {
            icon: '<svg viewBox="-50 -50 425 400" xmlns="http://www.w3.org/2000/svg"><g><rect rx="20" height="240" width="80" y="75" x="25" stroke="#e32a77" fill="#e32a77"/><rect rx="20" height="240" width="80" y="75" x="270" stroke="#bc22df" fill="#bc22df"/><rect transform="rotate(-45 130 145)" rx="20" height="240" width="80" y="25" x="90" stroke="#34e3bb" fill="#34e3bb"/><rect transform="rotate(45 243.5 145)" rx="20" height="240" width="87" y="25" x="200" stroke="#fbdb04" fill="#fbdb04"/></g></svg>',
            link: "explorer_app",
        },
        "Music Player": {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 9V7h-4v5.5c-.42-.31-.93-.5-1.5-.5A2.5 2.5 0 0 0 8 14.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5V9h3m-4-7a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z" fill="#ef5350"/></svg>',
            link: "music_app",
        },
        "Video Player": {
            icon: '<svg viewBox="0 0 24 24" fill="#D90000" xmlns="http://www.w3.org/2000/svg"><g><path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2ZM14.66 13.73L13.38 14.47L12.1 15.21C10.45 16.16 9.1 15.38 9.1 13.48V12V10.52C9.1 8.61 10.45 7.84 12.1 8.79L13.38 9.53L14.66 10.27C16.31 11.22 16.31 12.78 14.66 13.73Z"></path></g></svg>',
            link: "video_app",
        },
        "Pdf Reader": {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" aria-label="PDF" role="img" viewBox="0 0 512 512" fill="#c80a0a"><g><path d="M413 302c-9-10-29-15-56-15-16 0-33 2-53 5a252 252 0 0 1-52-69c10-30 17-59 17-81 0-17-6-44-30-44-7 0-13 4-17 10-10 18-6 58 13 100a898 898 0 0 1-50 117c-53 22-88 46-91 65-2 9 4 24 25 24 31 0 65-45 91-91a626 626 0 0 1 92-24c38 33 71 38 87 38 32 0 35-23 24-35zM227 111c8-12 26-8 26 16 0 16-5 42-15 72-18-42-18-75-11-88zM100 391c3-16 33-38 80-57-26 44-52 72-68 72-10 0-13-9-12-15zm197-98a574 574 0 0 0-83 22 453 453 0 0 0 36-84 327 327 0 0 0 47 62zm13 4c32-5 59-4 71-2 29 6 19 41-13 33-23-5-42-18-58-31z"></path></g></svg>',
            link: "pdf_reader_app",
        },
    }, {
        cockpit: {
            icon: '<svg viewbox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="#0c4eae" ><g><path d="m32.2,0c-17.646,0 -32,14.353 -32,32s14.354,32 32,32s32,-14.354 32,-32s-14.354,-32 -32,-32zm0,4.795c15.057,0 27.218,12.148 27.218,27.204s-12.161,27.205 -27.218,27.205c-15.056,0 -27.204,-12.148 -27.204,-27.204s12.148,-27.205 27.204,-27.205z" color="#000" stroke="null"/><path d="m42.907,18.892c-1.306,-0.048 -3.285,0.978 -5.064,2.747l-3.836,3.815l-11.496,-3.86l-2.242,2.314l8.668,6.587l-1.938,1.928a12.659,12.659 0 0 0 -1.704,2.098l-5.223,-0.39l-1.274,1.292l5.194,3.846l3.798,5.184l1.28,-1.283l-0.386,-5.274c0.658,-0.431 1.33,-0.966 1.977,-1.61l2.04,-2.029l6.652,8.735l2.314,-2.242l-3.878,-11.552l3.716,-3.695c2.372,-2.36 3.465,-5.121 2.451,-6.191c-0.253,-0.268 -0.613,-0.404 -1.049,-0.42zm117.944,-7.674c-1.9,0 -3.638,0.216 -5.267,0.65c-8.852,0 0,0 0,0" stroke="null"/></g></svg>',
            link: "https://localhost:9090",
        }, 
        portainer: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="#3bbced"><path d="M49.32,29.44h-1.88v9.75h1.88V29.44z M57.41,29.44h-1.88v9.75h1.88V29.44z M68.47,10.84L66.54,7.5L34.36,26.1l1.93,3.34L68.47,10.84z" /><path d="M68.28,10.84l1.93-3.34l32.18,18.6l-1.93,3.34L68.28,10.84z" /><path d="M108.08,29.49v-3.86H19.92v3.86H108.08z" /><path d="M73.17,84.01V26.8h3.86v59.98C76,85.61,74.68,84.76,73.17,84.01z M66.59,83.02V2.32h3.86v81.17C69.36,82.97,66.73,83.02,66.59,83.02z M30.04,91.07c-4.7-3.48-7.81-9.04-7.81-15.35c0-3.34,0.89-6.64,2.54-9.51H57.7c1.69,2.87,2.54,6.17,2.54,9.51c0,2.92-0.38,5.65-1.55,8.1c-2.49-2.4-6.16-3.44-9.88-3.44c-6.59,0-12.23,4.1-13.69,10.22c-0.52-0.05-0.85-0.09-1.36-0.09C32.48,90.55,31.26,90.74,30.04,91.07L30.04,91.07z" /><path d="M46.22,43.52h-9.97v10.03h9.97V43.52z M34.97,43.52H25v10.03h9.97V43.52z M34.97,54.68H25v10.03h9.97V54.68zM46.22,54.68h-9.97v10.03h9.97V54.68z M57.41,54.68h-9.97v10.03h9.97V54.68z M57.41,38.15h-9.97v10.03h9.97V38.15z" /><path d="M36.76,92.58c1.36-5.79,6.59-10.12,12.8-10.12c4,0,7.57,1.79,10.02,4.62c2.12-1.46,4.66-2.31,7.43-2.31c7.24,0,13.12,5.88,13.12,13.14c0,1.51-0.23,2.92-0.7,4.28c1.6,2.17,2.59,4.9,2.59,7.82c0,7.25-5.88,13.14-13.13,13.14c-3.2,0-6.12-1.13-8.37-3.01c-2.4,3.34-6.3,5.56-10.73,5.56c-5.08,0-9.5-2.92-11.71-7.16c-0.89,0.19-1.79,0.28-2.73,0.28c-7.24,0-13.17-5.89-13.17-13.14s5.88-13.14,13.17-13.14C35.82,92.49,36.29,92.49,36.76,92.58L36.76,92.58z" /></svg>',
            link: "https://localhost:7001",
        },
        transmission: {
            icon: '<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fill="#dd0055"><path d="m 63.883603,13.266237 c -20.987507,0 -38.002654,4.124517 -38.002654,9.219749 0,4.281481 12.032358,7.890843 28.32191,8.93163 l 0,10.689145 -22.415511,0 c -4.69252,0 -8.055228,3.794065 -8.441833,8.470643 l -4.753921,57.508176 c -0.292882,3.54287 2.151569,6.3962 4.840366,6.3962 l 80.90329,0 c 2.68879,0 5.13147,-2.85319 4.84036,-6.3962 l -4.72512,-57.508176 c -0.38426,-4.676771 -3.77811,-8.470643 -8.470643,-8.470643 l -22.415511,0 0,-10.689145 c 16.289563,-1.040787 28.321914,-4.650149 28.321914,-8.93163 0,-5.095232 -17.015139,-9.219749 -38.002647,-9.219749 z m -27.227065,35.784147 17.546321,0 0,2.765925 -17.546321,0 c -0.963678,0 -1.583315,0.707819 -1.699889,1.843948 l -4.177712,40.710944 c -0.082,0.798441 0.736223,1.555834 1.699901,1.555834 l 61.714687,0 c 0.963678,0 1.781854,-0.757393 1.699888,-1.555834 l -4.1777,-40.710944 c -0.116644,-1.136129 -0.73621,-1.843948 -1.699888,-1.843948 l -16.451489,0 0,-2.765925 16.451489,0 c 2.454984,0 4.233432,2.057074 4.46581,4.321757 l 4.177712,40.710948 c 0.267033,2.602389 -2.010838,4.609868 -4.465822,4.609868 l -61.714687,0 c -2.454996,0 -4.732856,-2.007479 -4.465811,-4.609868 l 4.177688,-40.710948 c 0.23239,-2.264683 2.010827,-4.321757 4.465823,-4.321757 z m 16.883666,6.338577 0.662655,0 0,4.321756 c 0,0.861182 0.698499,1.540272 1.555833,1.555832 l 0.92199,8.06728 c 0.174103,1.542752 1.464757,2.794735 3.284533,2.794735 l 7.836777,0 c 1.819787,0 3.11043,-1.251983 3.284545,-2.794735 l 0.921966,-8.06728 c 0.857334,-0.01556 1.555833,-0.69465 1.555833,-1.555832 l 0,-4.321756 0.662678,0 4.667489,23.683227 7.491044,0 -22.501944,13.541505 -22.501943,-13.541505 7.519855,0 4.638689,-23.683227 z"/></svg>',
            link: "https://localhost:7001",
        },
        aria2: {
            icon: '<svg viewBox="0 0 24 24" fill="#39d2ab" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_iconCarrier"><path d="M16.25 2H13C7.47715 2 3 6.47715 3 12C3 17.5228 7.47715 22 13 22H16.25V17H13C10.2386 17 8 14.7614 8 12C8 9.23858 10.2386 7 13 7H16.25V2Z"></path><path d="M17.75 7H19.5C20.3284 7 21 6.32843 21 5.5V3.5C21 2.67157 20.3284 2 19.5 2H17.75V7Z" ></path> <path d="M17.75 17V22H19.5C20.3284 22 21 21.3284 21 20.5V18.5C21 17.6716 20.3284 17 19.5 17H17.75Z"></path> </g></svg>',
            link: "https://localhost:7001",
        },
        vscode: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs/><path d="m218.62 29.953-105.41 96.92L54.301 82.47 29.955 96.64l58.068 53.359-58.068 53.359 24.346 14.212 58.909-44.402 105.41 96.878 51.424-24.976V54.93zm0 63.744v112.6l-74.719-56.302z" fill="#2196f3" stroke-width="17.15"/></svg>',
            link: "https://localhost:7001",
        },
        firefox: {
            icon: '<svg fill="#ff8000" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M26.562 5.309c-0.896-0.918-1.916-1.71-3.034-2.349l-0.067-0.035c-2.087-1.186-4.584-1.886-7.245-1.886-0.825 0-1.634 0.067-2.422 0.196l0.086-0.012c-0.999 0.16-1.89 0.404-2.739 0.731l0.092-0.031c-1.246 0.453-2.316 1.113-3.223 1.948l0.007-0.006c0.918-0.532 1.981-0.958 3.107-1.224l0.080-0.016c0.866-0.213 1.861-0.334 2.884-0.334 0.627 0 1.242 0.046 1.844 0.134l-0.068-0.008c2.677 0.375 5.028 1.556 6.854 3.286l-0.006-0.005c0.612 0.58 1.148 1.231 1.598 1.942l0.024 0.041c0.841 1.321 1.34 2.93 1.34 4.657 0 1.568-0.412 3.039-1.133 4.312l0.023-0.044c-1.209 1.8-3.179 3.007-5.439 3.16l-0.022 0.001c-1.030-0.038-1.992-0.295-2.852-0.725l0.040 0.018c-1.7-0.775-2.86-2.459-2.86-4.414 0-1.358 0.56-2.586 1.462-3.465l0.001-0.001c-0.101-0.011-0.219-0.017-0.337-0.017-1.264 0-2.368 0.685-2.961 1.704l-0.009 0.016c-0.456 0.819-0.725 1.797-0.725 2.838 0 0.791 0.155 1.546 0.437 2.235l-0.014-0.040c-0.345-0.687-0.603-1.483-0.732-2.323l-0.006-0.045c-0.065-0.421-0.103-0.907-0.103-1.401 0-1.223 0.228-2.393 0.645-3.469l-0.022 0.066c0.437-1.149 1.028-2.14 1.76-3.008l-0.013 0.015c0.892-1.11 2.051-1.97 3.382-2.487l0.055-0.019c-0.799-0.6-1.808-0.96-2.901-0.96-0.044 0-0.087 0.001-0.131 0.002l0.006-0c-0.038-0.001-0.082-0.001-0.127-0.001-2.37 0-4.543 0.842-6.237 2.242l0.016-0.013c-0.999 0.832-1.825 1.833-2.443 2.963l-0.027 0.053c-0.327 0.595-0.622 1.29-0.849 2.015l-0.022 0.082c0.225-1.885 0.777-3.599 1.598-5.146l-0.038 0.079c-1.345 0.939-2.384 2.233-2.992 3.745l-0.020 0.056c-0.69 1.699-1.090 3.669-1.090 5.733 0 0.844 0.067 1.671 0.196 2.479l-0.012-0.089c1.25 7.137 7.4 12.492 14.801 12.492 8.293 0 15.015-6.722 15.015-15.015 0-4.164-1.695-7.932-4.433-10.652l-0.001-0.001z"></path></svg>',
            link: "https://localhost:7001",
        },
        baidunetdisk: {
            icon: '<svg viewBox="-10 -10 70 70" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#262f73" stroke-width="2"><g><circle cx="13.8096" cy="29.9036" r="9.3075"></circle><circle cx="26.4413" cy="17.3207" r="8.5318"></circle><path d="M21.14,35.6386,32.3015,23.5225c3.2871-3.5684,12.4462-1.4954,12.4462,5.8623,0,9.8263-8.6916,13.0451-15.0182,4.7468"></path><path d="M25.132,13.3652c-2.0545,1.2363-3.8009,2.7125-2.62,6.6747"></path><circle cx="13.8096" cy="29.9036" r="9.3075"></circle><circle cx="26.4413" cy="17.3207" r="8.5318"></circle><path d="M21.14,35.6386,32.3015,23.5225c3.2871-3.5684,12.4462-1.4954,12.4462,5.8623,0,9.8263-8.6916,13.0451-15.0182,4.7468"></path><path d="M25.132,13.3652c-2.0545,1.2363-3.8009,2.7125-2.62,6.6747"></path></g></svg>',
            link: "https://localhost:7001",
        },
    }];
    
    const apps = ["monitor_app", "explorer_app", "music_app", "video_app", "pdf_reader_app"];
    const page_mainline = main_page.querySelector(".mainline");
    const flow_html = page_mainline.querySelector(".flow_wrapper").innerHTML;
    const card_html = page_mainline.querySelector(".card_wrapper").innerHTML;

    for (let i = 0; i < crad_info.length; i++) {
        let flow = document.createElement('div');
        flow.innerHTML = flow_html;
        flow = flow.firstElementChild;
        page_mainline.appendChild(flow);
        for (let key in crad_info[i]) {
            let card = document.createElement('div');
            card.innerHTML = card_html;
            card = card.firstElementChild;
            flow.appendChild(card);
            card.setAttribute("class", card.getAttribute("class") + " " + key);
            card.querySelector(".colicon").innerHTML = crad_info[i][key]["icon"];
            card.querySelector(".colname").innerText = key;
            card.__info__ = {'link': crad_info[i][key]['link']};
            card.onclick = function () {
                let link = this.__info__['link'];
                if (link.startsWith("http")) {
                    window.open(link);
                } else if (apps.indexOf(link) != -1) {
                    eval(link).open();
                }         
            }
        }
    }
}


function init_login() {

}

// ==================================================================

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
        open: open_monitor,
    }
}()

// document.querySelector(".mainline .flows .card.monitor").onclick = monitor_app.open_monitor


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
            pdf_reader_app.view_start(path, type, "");
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
        open: open_explorer,
        update_info: file_view.updateInfo,
    }
}()

const music_app = function () {
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
        open: music_show,
   } 
}()


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
        video_start: video_start,
        open: video_show,
   } 
}()


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

const pdf_reader_app = function () {
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
        open: view_start,
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

