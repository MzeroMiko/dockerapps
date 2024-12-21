// ===========================================
// this class is to create the desktop of the web view
// it create a main html and has apps in it, when clicking an app, a embeded web page is opened.
// ===========================================
function MainDesktop(opts = {}) {


    return {
        getArgs: () => { return args; },
        setArgs: (opts) => { for (let key in opts) if (key in args.params) args.params[key] = opts[key]; },
        refresh: openFolder,
    }
}


