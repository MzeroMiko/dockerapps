"use strict"

function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
}

function LoginPage() {
    let authTimeHandler;
    function login(login = true, loginCallBack = () => { }, logoutCallBack = () => { }) {
        let waitAuthTimeout = (waitTime) => {
            if (!args.params.adminCore.getAuthStat()) { logoutCallBack(); clearTimeout(authTimeHandler); }
            authTimeHandler = setTimeout(function () { waitAuthTimeout(waitTime); }, waitTime);
        }

        if (login) {
            args.params.popMenu.appendAuth((name, key) => {
                if (!(name + key))
                    return false;
                args.params.adminCore.askAuthCore(name + key,
                    () => { waitAuthTimeout(2000); loginCallBack(); },
                    () => { pop_templates("").authFail(); logoutCallBack(); }
                );
            });
        } else {
            args.params.adminCore.closeSessionCore(function () { logoutCallBack(); });
        }
    }
}


