var db = localStorage['permissions'] ? localStorage['permissions'].indexOf('DEBUG') > -1 : -1;
var L_cc = {},
    _jsf = [],
    _lib = ['./libs/libs.js'],
    _proLs = ['authToken','authenticated','cacheConfig','current.job.flow.showMine','fullName','id','language','notes.showMine','permissions','roleList','tasks.showMine','userName'],
    _kendoVars = ['GridOpt','GridSaved','CurrentPage','Filter','Menu','SearchCriteria'],
    PUBLIC_API_ROOT = 'https://SERVER_LOCATION/server/public',
    _jsf_c = 0,
    // Get Config Control
    gcc = (theUrl, callback, callbackError) => {
        var _x = new XMLHttpRequest();
        _x.open("GET", theUrl, true);
        _x.onreadystatechange = function() { 
            if (_x.readyState === 4) {
                if (_x.status === 200) { 
                    callback(_x.responseText) 
                } else {
                    window.location.hash = "/login";
                    throw "ERROR: Backend seems to not be running";
                    callbackError()
                }
            }
        }
        _x.send(null);
    },
    // Load Scripts
    ls = (_u, _cb) => {
        var hd = document.getElementsByTagName('head')[0];
        var sc = document.createElement('script');
        sc.type = 'text/javascript';
        sc.src = _u;
        sc.onreadystatechange = _cb;
        sc.onload = _cb;
        hd.appendChild(sc);
    },
    // Load Scripts Array
    lsp = function () {
        ls(_jsf[_jsf_c], () => {
            _jsf_c ++;
            if (_jsf_c < _jsf.length) lsp()
        })
    },
    // Local Config Control Vs Remote Config Control
    lccVsRcc = (l, r) => {
        return l != r;
    },
    // Remove Kendo Variables
    rmKV = (t) => {
        for (var i = 0; i < _kendoVars.length; i++) {
            console.log('Removing ' + t + _kendoVars[i])
            localStorage.removeItem(t + _kendoVars[i])
        }
    },
    // Echo 
    eh = () => {
        if (db) console.warn('cache/config [×]\nstarting system without cache config')
        _jsf = ['./infrastructure.js', './app.js']
    },
    // No Once
    nonce = (l) => {
        var t = "", p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < l; i++) {
            t += p.charAt(Math.floor(Math.random() * p.length));
        }
        return t;
    };

gcc(PUBLIC_API_ROOT + '/system/client/cache/config', function (res) { 
    if (db) console.info('cache/config [✓]\nstarting system with cache config')
    var R_cc = JSON.parse(res), cc = localStorage.getItem('cacheConfig')
    
    L_cc = cc != null && cc != undefined ? JSON.parse(cc) : JSON.parse(res)
    _jsf = [];

    for (var i in R_cc) {
        // console.log('REMOTE:', i, ':', R_cc[i], ' ----- LOCAL:', i, ':', L_cc[i])
        var _l = L_cc[i], _r = R_cc[i];
        if (i.indexOf('local.storage.full') > -1 && lccVsRcc(_l, _r)) { 
            if (db) console.warn('clean local.storage.full')
            for (var j in localStorage) { if (_proLs.indexOf(j) == -1) localStorage.removeItem(j) }; L_cc[i] = R_cc[i];
        }
        if (i.indexOf('gridstack.home') > -1 && lccVsRcc(_l, _r)) { 
            if (db) console.warn('clean gridstack.home')
            localStorage.removeItem('homeLayoutGridStack')
        }
        if (i.indexOf('gridstack.company') > -1 && lccVsRcc(_l, _r)) { 
            if (db) console.warn('clean gridstack.company')
            localStorage.removeItem('companyLayoutGridStack')
        }
        if (i.indexOf('gridstack.job') > -1 && lccVsRcc(_l, _r)) { 
            if (db) console.warn('clean gridstack.job')
            localStorage.removeItem('jobDetailDashboardGridStack')
        }
        if (i.indexOf('gridstack.candidate') > -1 && lccVsRcc(_l, _r)) { 
            if (db) console.warn('clean gridstack.candidate')
            localStorage.removeItem('candidateLayoutGridStack')
        }
        if (i.indexOf('gridstack.contact') > -1 && lccVsRcc(_l, _r)) { 
            if (db) console.warn('clean gridstack.contact')
            localStorage.removeItem('clientLayoutGridStack')
        }
        if (i.indexOf('kendogrid.contact') > -1 && lccVsRcc(_l, _r)) { 
            if (db) console.warn('clean kendogrid.contact')
            rmKV('client')
        }
        if (i.indexOf('kendogrid.candidate') > -1 && lccVsRcc(_l, _r)) { 
            if (db) console.warn('clean kendogrid.candidate')
            rmKV('candidate')
        }
        if (i.indexOf('kendogrid.job') > -1 && lccVsRcc(_l, _r)) { 
            if (db) console.warn('clean kendogrid.job')
            rmKV('job')
        }
        if (i.indexOf('kendogrid.company') > -1 && lccVsRcc(_l, _r)) { 
            if (db) console.warn('clean kendogrid.company')
            rmKV('company')
        }
        if (i.indexOf('.js') > -1) { 
            if (db) console.warn('clean js')
            var r = '';
            if (db) {
                r = '&r=' + nonce(9);
                console.warn('debug mode [✓]')
            }

            _jsf.push(i.replace('client.file.', './') + '?v=' + R_cc[i] + r);
        }
        if (i.indexOf('undefined') > -1) {
            console.error('cache/config mongodb [undefined]')
        }
    }
    _jsf = _jsf.concat(_lib);
    lsp()
    localStorage.setItem('cacheConfig', JSON.stringify(R_cc))
}, eh ())
