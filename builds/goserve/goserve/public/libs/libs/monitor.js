"use strict"
function html_to_shadow(module_html) {
    let shadow_module = document.createElement('div')
    shadow_module.attachShadow({mode: "open"})
    shadow_module.shadowRoot.innerHTML = module_html
    return shadow_module
}

function PieProgress(opts={}) {
    let args = {
        box: opts.box,
        html: opts.html,
        styles: {
            basic_size: "120px", 
            centerColor: "#fff", 
            progressColor: "#ddd", 
            noProgressColor: "#dadada",
        },
        params: {
            speedTime: 8,
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];
    
    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let lastPercent = 0;
    let centerInfo = shadow_module.shadowRoot.querySelector(".centerInfo");
    let rightCircle = shadow_module.shadowRoot.querySelector(".rightCircle");

    function updateProg(percent) {
        function updatePie(current = 0, percent = 0) {
            let degree = 0;
            if (current == percent)
                return;
            if (current < percent)
                current++;
            else if (current > percent)
                current--;
            else
                current = percent;
            centerInfo.innerText = current + " %";
            if (current < 0)
                degree = 0;
            else if (current < 50)
                degree = current * 3.6;
            else if (current < 100)
                degree = current * 3.6 - 180;
            else
                degree = 180;
            rightCircle.style.transform = 'rotate(' + degree + 'deg' + ')';
            rightCircle.style.backgroundColor = (current < 50) ? args.styles.noProgressColor : args.styles.progressColor;
            setTimeout(function () { updatePie(current, percent); }, args.params.speedTime);
        }
        updatePie(lastPercent, percent);
        lastPercent = percent;
    }

    return {
        update: updateProg,
    }
}

function MonitorView(opts={}) {
    let args = {
        box: opts.box,
        html: opts.html,
        pie_html: opts.pie_html,
        styles: {
            basic_size: "14px",
        },
        params: {
            waitTime: 3000, getMonitor: (callback) => { },
        },
    }
    for (let key in opts) if (key in args.styles) args.styles[key] = opts[key];
    for (let key in opts) if (key in args.params) args.params[key] = opts[key];

    let shadow_module = html_to_shadow(args.html)
    args.box.appendChild(shadow_module)
    for (let key in args.styles) shadow_module.style.setProperty('--' + key, args.styles[key]);

    let cpuPie = PieProgress({ 
        box: shadow_module.shadowRoot.querySelector(".cpu .pie"), 
        html: args.pie_html, 
        progressColor: "#eda"
    });
    let memPie = PieProgress({ 
        box: shadow_module.shadowRoot.querySelector(".mem .pie"), 
        html: args.pie_html, 
        progressColor: "#aed"
    });
    let diskPie = PieProgress({ 
        box: shadow_module.shadowRoot.querySelector(".disk .pie"), 
        html: args.pie_html, 
        progressColor: "#aae"
    });
    let infoTimeout;
    let lastCpuIdles = [], lastCpuTotals = [], cpuUsages = [33];
    let lastRxBytes = 0, lastTxBytes = 0, lastTime = 0;

    // ===================================//
    function getInfo() {
        args.params.getMonitor((monitorInfo) => {
            function updateText(selector, info) {
                if (!info) info = "-";
                shadow_module.shadowRoot.querySelector(selector).innerText = info;
            }

            function updateCpu(CpuInfo) {
                if (!CpuInfo) return;
                try {
                    let detailCpu = "core: " + CpuInfo.Core + "\n"
                        + "temp: " + (CpuInfo.Temperature ? CpuInfo.Temperature : "-") + " tC\n"
                        + "name: " + CpuInfo.Name + "\n";
                    let cpuTotals = JSON.parse(CpuInfo.Totals);
                    let cpuIdles = JSON.parse(CpuInfo.Idles);
                    if (cpuTotals.length != lastCpuTotals.length) {
                        lastCpuTotals = [], lastCpuIdles = [];
                        for (let i = 0; i < cpuTotals.length; i++) {
                            lastCpuTotals.push(0);
                            lastCpuIdles.push(0);
                        }
                    }
                    for (let i = 0; i < cpuTotals.length; i++) {
                        if (lastCpuTotals[i] != cpuTotals[i]) {
                            cpuUsages[i] = (cpuIdles[i] - lastCpuIdles[i]) / (cpuTotals[i] - lastCpuTotals[i]);
                            cpuUsages[i] = 100 - 100 * cpuUsages[i];
                            lastCpuIdles[i] = cpuIdles[i], lastCpuTotals[i] = cpuTotals[i];
                            if (i != 0)
                                detailCpu += "cpu" + i.toString() + ': ' + cpuUsages[i].toFixed(3) + '%\n';
                        }

                    }
                    cpuPie.update(Math.round(cpuUsages[0]));
                    updateText(".cpu .preinfo", detailCpu);
                    updateText(".cpu .info", "load: " + CpuInfo.Loadavg);
                } catch (err) { console.log(err); }
            }

            function updateMem(MemInfo) {
                if (!MemInfo) return;
                try {
                    let memTotal = MemInfo.MemTotal;
                    let memUsed = memTotal - MemInfo.MemFree - MemInfo.Cached;
                    let detailMem = "MemTotal: \t" + (memTotal >> 10) + " MB\n"
                        + "MemFree: \t" + (MemInfo.MemFree >> 10) + " MB\n"
                        + "MemCached: \t" + (MemInfo.Cached >> 10) + " MB\n"
                        + "SwapTotal: \t" + (MemInfo.SwapTotal >> 10) + " MB\n"
                        + "SwapFree: \t" + (MemInfo.SwapFree >> 10) + " MB\n"
                        + "SwapCached: \t" + (MemInfo.SwapCached >> 10) + " MB\n"
                        + "Buffers: \t" + (MemInfo.Buffers >> 10) + " MB\n";
                    memPie.update((memTotal) ? Math.round(100 * memUsed / memTotal) : 0);
                    updateText(".mem .info", (memUsed >> 10) + " / " + (memTotal >> 10) + " MB");
                    updateText(".mem .preinfo", detailMem);
                } catch (err) { console.log(err.toString()); }
            }

            function updateNet(Network) {
                if (!Network) return;
                try {
                    let netNumber = Network.length, detailNet = "";
                    let rxSpeed = 0, txSpeed = 0;
                    let rxBytes = 0, txBytes = 0, time = new Date().getTime();
                    for (let i = 0; i < netNumber; i++) {
                        let netInfo = Network[i];
                        rxBytes += Number(netInfo.RxBytes);
                        txBytes += Number(netInfo.TxBytes);
                        detailNet = detailNet
                            + "Devices: " + netInfo.Dev + "\n"
                            + "TotalRx: " + (Number(netInfo.RxBytes) / (1 << 30)).toFixed(3) + " GB\n"
                            + "TotalTx: " + (Number(netInfo.TxBytes) / (1 << 30)).toFixed(3) + " GB\n\n";
                    }
                    rxSpeed = (rxBytes - lastRxBytes) / (time - lastTime);
                    txSpeed = (txBytes - lastTxBytes) / (time - lastTime);
                    lastRxBytes = rxBytes; lastTxBytes = txBytes; lastTime = time;
                    updateText(".rxSpeed .info", "Rx Speed: " + rxSpeed.toFixed(2) + " KB/s");
                    updateText(".txSpeed .info", "Tx Speed: " + txSpeed.toFixed(2) + " KB/s");
                    updateText(".totalSpeed .info", "Total Speed: " + (rxSpeed + txSpeed).toFixed(2) + " KB/s");
                    updateText(".net .preinfo", detailNet);
                } catch (err) { console.log(err); }
            }

            function updateDisk(DiskInfo) {
                if (!DiskInfo) return;
                try {
                    diskPie.update(Math.round(DiskInfo.Usage));
                    updateText(".disk .info", "usage of / : " + DiskInfo.Usage + " %");
                    updateText(".disk .preinfo", DiskInfo.Detail);
                } catch (err) { console.log(err.toString()); }
            }

            try {
                updateCpu(JSON.parse(monitorInfo.CpuInfo));
                updateMem(JSON.parse(monitorInfo.MemInfo));
                updateNet(JSON.parse(monitorInfo.Network));
                updateDisk(JSON.parse(monitorInfo.DiskInfo));
                updateText(".uptime .info", monitorInfo.Uptime);
                updateText(".distro .info", monitorInfo.Distro);
                updateText(".host .info", monitorInfo.Host);
                updateText(".version .item", monitorInfo.Version);
            } catch (err) { console.log(err.toString()); }

            infoTimeout = setTimeout(() => { getInfo(); }, args.params.waitTime);
        });
    }

    function close() {
        clearTimeout(infoTimeout);
    }

    return {
        open: getInfo,
        close: close,
    }
}
