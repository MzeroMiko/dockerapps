"use strict"

function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
}

function CodeViewer(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
        params: {

        },
        styles: {
            basicSize: "14px", backColor: "#fff",
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    
    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let htmlDist = shadow_module.shadowRoot.querySelector('.container');
    let ctrlBtn = shadow_module.shadowRoot.querySelector('.ctrlBtn');

    function showCode(link = "", isMarkdown = false) {
        function codeLang(language = "", oriCodeText = "") {
            htmlDist.innerHTML = '<pre><code></code></pre>';
            let codeBlock = htmlDist.querySelector('pre code');
            let result = "";
            if (language != "") {
                try { result = hljs.highlight(oriCodeText, { language: language, ignoreIllegals: true }); }
                catch (err) { language = ""; }
            }
            if (language == "") {
                try { result = hljs.highlightAuto(oriCodeText); }
                catch (err) { result = hljs.highlight(oriCodeText, { language: "Plaintext", ignoreIllegals: true }); }
            }
            ctrlBtn.innerText = result.language;
            codeBlock.innerHTML = result.value;
        }

        let xhr = new XMLHttpRequest();
        if (xhr == null)
            return;
        xhr.open("GET", link, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                let oriCodeText = xhr.responseText;
                if (isMarkdown) {
                    let converter = new showdown.Converter({ emoji: true, underline: true });
                    ctrlBtn.innerText = "markdown";
                    ctrlBtn.onclick = function () { };
                    ctrlBtn.setAttribute("contenteditable", "false");
                    htmlDist.innerHTML = converter.makeHtml(oriCodeText);
                    // renderMathInElement(htmlDist, {
                    //     displayMode: true, throwOnError: false, errorColor: '#ff0000',
                    //     delimiters: [
                    //         {left: "$$", right: "$$", display: true},
                    //         {left: "$", right: "$", display: false},
                    //         {left: "\\(", right: "\\)", display: false},
                    //         {left: "\\[", right: "\\]", display: true}
                    //     ],
                    // });
                    let codeBlocks = htmlDist.querySelectorAll('pre code');
                    for (let i = 0; i < codeBlocks.length; i++) {
                        hljs.highlightBlock(codeBlocks[i]);
                    }
                } else {
                    htmlDist.innerHTML = '<pre><code></code></pre>';
                    ctrlBtn.onclick = function () {
                        ctrlBtn.setAttribute("contenteditable", "true");
                        console.log('.....');
                    };
                    ctrlBtn.onkeydown = function (event) {
                        if (event.key == "Enter") {
                            let lang = ctrlBtn.innerText.trim();
                            ctrlBtn.setAttribute("contenteditable", "false");
                            lang = (lang == "") ? "plain" : lang;
                            ctrlBtn.innerText = lang;
                            codeLang(lang, oriCodeText);
                        }
                    };
                    codeLang("", oriCodeText);
                }
            }
        };
        xhr.send(null);
    }

    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        showCode: showCode,
    }
}


