"use strict"

function PopupMenu(opts = {}) {
    let args = {
        box: opts.box,
        html: opts.html,
        params: {
            defTimeOut: 2000, nameHolder: "user name", passHolder: "password",
        },
        styles: {
            basicSize: "14px", fontColor: "#fff", zindex: 8,
            passColor: "#6d8", infoColor: "#6cd", warnColor: "#fc5", failColor: "#e66",
            confirmColor: "#a9e", inputColor: "#abb", authColor: "#8b9",
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let container = shadow_module.shadowRoot.querySelector(".popBox");

    function appendBody(infoText = "", cardColor = "", timeOut) {
        // timeOut = 0: do not diaspear
        let newBody = document.createElement("div");
        newBody.innerHTML = container.querySelector(".padding .card_wrapper").innerHTML;
        container.appendChild(newBody);
        newBody.querySelector(".card").style.backgroundColor = cardColor;
        newBody.querySelector(".infoText").innerText = infoText;
        newBody.querySelector(".close").onclick = function () { container.removeChild(newBody); };
        if (typeof timeOut == "undefined")
            timeOut = args.params.defTimeOut;
        if (timeOut)
            setTimeout(function () { try { container.removeChild(newBody); } catch (err) { } }, timeOut);
        return newBody;
    }
    function clearAll() {
        while (container.lastChild) { container.removeChild(container.lastChild); }
    }
    function appendMessage(sign = "info", message = "", defInput = "", confirmCallBack = (extraInput) => { }, timeOut) {
        // append new Body
        let newMessage = null;
        let colors = {
            pass: args.styles.passColor, fail: args.styles.failColor, warn: args.styles.warnColor,
            info: args.styles.infoColor, confirm: args.styles.confirmColor, input: args.styles.inputColor,
        }
        if (typeof timeOut == "undefined") {
            timeOut = (sign == "input" || sign == "confirm") ? 0 : args.params.defTimeOut;
        }
        switch (sign.trim()) {
            case "input": newMessage = appendBody("#", colors.input, timeOut); break;
            case "confirm": newMessage = appendBody("C", colors.confirm, timeOut); break;
            case "success": case "pass": newMessage = appendBody("S", colors.pass, timeOut); break;
            case "warning": case "warn": newMessage = appendBody("!", colors.warn, timeOut); break;
            case "error": case "fail": newMessage = appendBody("X", colors.fail, timeOut); break;
            case "info": default: newMessage = appendBody("i", colors.info, timeOut); break;
        }
        // set content
        let content = newMessage.querySelector(".content");
        content.innerHTML = container.querySelector(".padding .message_wrapper").innerHTML;
        content.querySelector(".message").innerText = message;
        let input = content.querySelector("input");
        input.value = defInput;
        input.style.display = (sign == "input") ? "block" : "none";
        input.onkeydown = function (event) {
            if (event.keyCode == 13 || event.which == 13 || event.key == "Enter") {
                container.removeChild(newMessage);
                confirmCallBack(input.value);
            }
        };
        newMessage.querySelector(".info").onclick = function () {
            confirmCallBack(input.value);
            container.removeChild(newMessage);
        };

    }
    function appendAuth(confirmCallBack = (name, password) => { }) {
        // append Body
        let newAuth = appendBody("A", args.styles.authColor, 0);
        let content = newAuth.querySelector(".content");
        content.innerHTML = container.querySelector(".padding .auth_wrapper").innerHTML;
        let nameInput = content.querySelector("input.name");
        let passInput = content.querySelector("input.pass");
        nameInput.placeholder = args.params.nameHolder;
        passInput.placeholder = args.params.passHolder;
        // actions 
        passInput.onkeypress = function (event) {
            if (event.keyCode == "13") {
                container.removeChild(newAuth);
                confirmCallBack(nameInput.value, passInput.value);
            }
        };
        newAuth.querySelector(".info").onclick = function () {
            container.removeChild(newAuth);
            confirmCallBack(nameInput.value, passInput.value);
        };
    }

    return {
        clearAll: clearAll,
        appendMessage: appendMessage,
        appendAuth: appendAuth,
    }
}
