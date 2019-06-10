(function() {
    /**
     * Setup the freeze element to be appended
     */
    var freezeHtml = document.createElement('div');
        freezeHtml.classList.add('freeze-ui');

    /** 
    * Freezes the UI
    * options = { 
    *   selector: '.class-name' -> Choose an element where to limit the freeze or leave empty to freeze the whole body. Make sure the element has position relative or absolute,
    *   text: 'Magic is happening' -> Choose any text to show or use the default 'Loading'. Be careful for long text as it will break the design.
    * }
    */
    window.FreezeUI = function (options = { text: 'Loading'}) {
        var parent = document.querySelector(options.selector) || document.body;
        freezeHtml.setAttribute('data-text', options.text ? options.text : 'Loading');
        if (document.querySelector(options.selector)) {
            freezeHtml.style.position = 'absolute';
        }
        parent.appendChild(freezeHtml);
    };
    
    /**
     * Unfreezes the UI.
     * No options here.
     */
    window.UnfreezeUI = function() {
        var element = document.querySelector('.freeze-ui');
        if (element) {
            element.classList.add('is-unfreezing');
            setTimeout(function() {
                element.classList.remove('is-unfreezing');
                if (element.parentElement) {
                    element.parentElement.removeChild(element);
                }
            }, 250);
        }
    };

})();

var $ = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    Marionette = require('backbone.marionette'),
    Config = require('./config'),
    UiSetup = require('./uiSetup'),
    Handlebars = require("hbsfy/runtime"),
    Polyglot = require('polyglot'),
    MenuItem = require('./common/models/MenuItem'),
    MenuItemList = require('./common/models/MenuItemList'),
    Session = require('./session/models/Session'),
    UserBarView = require('./common/views/UserBarView'),
    LeftMenuView = require('./common/views/LeftMenuView'),
    CurrentUser = require('./common/models/CurrentUser'),
    SessionController = require('./session/SessionController'),
    SessionRouter = require('./session/SessionRouter'),
    UserProfileController = require('./userProfile/UserProfileController'),
    UserProfileRouter = require('./userProfile/UserProfileRouter'),
    HomeController = require('./home/HomeController'),
    HomeRouter = require('./home/HomeRouter'),
    PeopleDashboardController = require('./peopleDashboard/PeopleDashboardController'),
    PeopleDashboardRouter = require('./peopleDashboard/PeopleDashboardRouter'),
    ReferenceDataList = require('./common/models/ReferenceDataList'),
    Configuration = require('./admin/configuration/models/Configuration'),
    TeamListForm = require('./common/models/TeamListForm'),
    growl = require('bootstrap-notify'),
    UserPreferenceList = require('./admin/user/models/UserPreferenceList');


window.$ = $;
jQuery = $;

module.exports = RecruiterApp = function RecruiterApp() {};

//TODO - Chatrify Key: Should pull from backend
__ac = {};
__ac.uid = "9d53fc9b5f767562423e4fdc09dd9eed";
__ac.server = "secure.chatrify.com";

RecruiterApp.prototype.start = function() {

    // Resource routing
    // - Need to point to the same domain for every calls in production
    // - ! Does not apply for localhost
    if (location.hostname.indexOf("localhost") == -1 && location.hostname != "127.0.0.1") {
        
        let extractHostname = url => {
            var hostname;

            if (url.indexOf("://") > -1) hostname = url.split('/')[2]
            else hostname = url.split('/')[0];

            hostname = hostname.split(':')[0];
            hostname = hostname.split('?')[0];
            return hostname;
        }

        // let rootDomain = location.protocol + '//' + extractHostname(window.location.href);
        let rootDomain = 'https://' + extractHostname(window.location.href);

        RecruiterApp.config = {
            UI_ROOT :               rootDomain + '/ui',
            API_ROOT :              rootDomain + '/server',
            PUBLIC_API_ROOT :       rootDomain + '/server/public',
            ADMIN_API_ROOT :        rootDomain + '/server/admin',
            TRANSLATION_SERVICE :   rootDomain + '/server/translate'    
        }
    } else {
        RecruiterApp.config = Config;
    }

    RecruiterApp.core = new Marionette.Application();
    RecruiterApp.core.addRegions({
        pageContent: "#octus-page"
    });

    RecruiterApp.configuration = new Configuration()
    var session = new Session();

    var ModalRegion = Marionette.Region.extend({
        constructor: function () {
            Marionette.Region.prototype.constructor.apply(this, arguments);

            this.ensureEl();
            this.$el.on('hidden', {region: this}, function (event) {
                event.data.region.close();
            });
        },

        onShow: function () {
            this.$el.modal({backdrop: false, show: true});
        },

        onClose: function () {
            this.$el.modal('hide');
        }
    });

    /**
     * Load user preferences to localStorage (Async call).
     */
    RecruiterApp.core.loadUserPreferences = () => {
        new UserPreferenceList().fetch({
            async: false,
            success: (list) => {
                list.forEach((userPreference) => {
                    console.log('Loading user preference ', userPreference.get('key'));
                    localStorage.setItem(userPreference.get('key'), userPreference.get('item'));
                });
                // RecruiterApp.core.loadGridStack();
            }, 
            error: (model, r) => {
                console.error('User preferences not loaded');
            }
        });
    }

        /**
     * Load user preferences to localStorage.
     */
    RecruiterApp.core.resetUserPreferences = () => {

        var userPreferenceKeys = [
            'candidateMenu',
            'candidateGridOpt',
            'candidateLayoutGridStack',
            'clientMenu',
            'clientGridOpt',
            'clientLayoutGridStack',
            'companyMenu',
            'companyGridOpt',
            'companyLayoutGridStack',
            'jobMenu',
            'jobGridOpt',
            'jobDetailDashboardGridStack',
            'homeLayoutGridStack'
        ];

        userPreferenceKeys.forEach((key) => { localStorage.removeItem(key); });
    }

    var AppLayout = Marionette.Layout.extend({
        template: require('./common/templates/appLayout.hbs'),
        regions: {
            content: "#main-content",
            breadcrumb: ".breadcrumbs-nav",
            leftMenu: "#mainSideMenu",
            searchBar: ".search-global",
            userBar: ".user-bar",
            footer: "#footer-content",
            defaultModal: "#defaultModal",
            fullScreenSearch: '.full-screen-search-wrapper'
        },
        behaviors: {
            CheckPermissions: { view: "appLayout" }
        },
        onRender: function () {
            var _currentUser = new CurrentUser();
            var self = this;

            // Clean older preferences
            RecruiterApp.core.resetUserPreferences();

            RecruiterApp.core.loadUserPreferences();

            var _leftMenuItems = new MenuItemList();
            _leftMenuItems.add(new MenuItem({
                url: RecruiterApp.config.UI_ROOT + "/#",
                dataIcon: "fa-home",
                name: "home"
            }));

            _leftMenuItems.add(new MenuItem({
                url: RecruiterApp.config.UI_ROOT + "/#/people/candidates",
                dataIcon: "fa-user",
                name: "candidate"
            }));
            _leftMenuItems.add(new MenuItem({
                url: RecruiterApp.config.UI_ROOT + "/#/people/clients",
                dataIcon: "fa-address-card",
                name: "clientPerson"
            }));

                       
            var leftMenuView = new LeftMenuView({collection: _leftMenuItems});
            this.leftMenu.show(leftMenuView);

            var noteTypeList = new ReferenceDataList({ type: "noteType" });
            $.when(noteTypeList.fetch() ).then( function() {
                window.Octus.quickNoteTypeList = noteTypeList;
            });

            var userBarView = new UserBarView({model: _currentUser});
            this.userBar.show(userBarView);

            UiSetup.Setup();
            UiSetup.SetupCore();

        }
    });

    var BlankLayout = Marionette.Layout.extend({
        template: require('./common/templates/blankLayout.hbs'),
        regions: {
            content: ".signin-content"
        }
    });

    var initializeAppLayout = function () {
                
        if ($('body').hasClass('sidebar-right')) {
            $('body').addClass('header-sticky sidebar-right');
        } else {
            $('body').addClass('header-sticky sidebar-left');
        }
        $('body').removeClass('signin signin-vertical');

        RecruiterApp.appLayout = new AppLayout();
        RecruiterApp.appLayout.on("show", function () {
            RecruiterApp.core.vent.trigger("appLayout:rendered");
        });
        RecruiterApp.core.pageContent.show(RecruiterApp.appLayout);
        var language = (session.get('language')) ? session.get('language') : 'EN';
        RecruiterApp.core.vent.trigger('app:info', ['Session Lang', session.get('language')]);
        RecruiterApp.core.vent.trigger('octus:changeLanguage', language);
    };

    var initializeBlankLayout = function () {

        $('body').removeClass('header-sticky sidebar-left');
        $('body').addClass('signin signin-vertical');

        RecruiterApp.blankLayout = new BlankLayout();
        RecruiterApp.blankLayout.on("show", function () {
            RecruiterApp.core.vent.trigger("blankLayout:rendered");
        });
        RecruiterApp.core.pageContent.show(RecruiterApp.blankLayout);
    };

    RecruiterApp.core.vent.on('app:show', function (appView, afterLogin) {
        if (afterLogin) {
            initializeAppLayout();
        }
 
        RecruiterApp.appLayout.content.show(appView);
    });

    RecruiterApp.core.vent.on('menu:blur', function () {
        
    });

    RecruiterApp.core.vent.on('menu:highlight', function (id) {
        var element = $('#leftMenuItems .'+id);
        $(".list-group-item, .leftMenuItem").removeClass('active');
        $(".list-group-item").next('.list-group').removeClass('in')

        element.addClass('active');

        if (element.parent().prev('a').length) {
            element.parent().addClass('in')
            element.parent().prev('a').addClass('active')
        }
    });

    RecruiterApp.core.vent.on('app:breadcrumbs:update', function (list) {
        var breadcrumbs = $('.breadcrumbs-nav');
        breadcrumbs.empty();

        for (var i = 0; i < list.length; i++) {
            breadcrumbs.append('<li>' + list[i] + '</li>');
        }
    });

    RecruiterApp.core.vent.on('app:modal:show', function (view, size) {
        var modalId = '#defaultModal'

        if ($('#defaultModal').is(':visible'))
            modalId = '#secondaryModal'
        else
            modalId = '#defaultModal'

        var modal = new ModalRegion({el: modalId});
        modal.show(view);

        switch (size) {
            case "xl":
                $(modalId + " .modal-dialog").addClass('modal-xl');
                break;
            case "lg":
            case "big":
                $(modalId + " .modal-dialog").addClass('modal-lg');
                break;
            case "small":
                $(modalId + " .modal-dialog").addClass('modal-sm');
                break;
            default:
                $(modalId + " .modal-dialog").removeClass('modal-lg');
                break;
        }

        $(modalId).on('hidden.bs.modal', (e) => {
            if ($('.modal.in').length > 0) {
                $('body').addClass('modal-open');
            }
        })

        RecruiterApp.core.vent.on('app:modal:close', function (view) {
            if (view) view.close()
            else modal.close()
        });
    });


    RecruiterApp.core.vent.on('blank:show', function (appView) {
        console.log("Showing appView on blank layout");
        initializeBlankLayout();
        RecruiterApp.blankLayout.content.show(appView);
    });

    RecruiterApp.core.vent.on('debug:on', function () {
        var _j = JSON.parse(localStorage['permissions']); _j.push('DEBUG'); localStorage.setItem('permissions', JSON.stringify(_j));
        location.reload();
    })

    RecruiterApp.core.vent.on('debug:off', function () {
        var _j = JSON.parse(localStorage['permissions']); _j.splice(_j.indexOf('DEBUG')); localStorage.setItem('permissions', JSON.stringify(_j));
        location.reload();
    })

    RecruiterApp.core.on("initialize:before", function (options) {
        initializeBlankLayout();

        RecruiterApp.core.vent.trigger('app:warn', ['App','Initializing']);

        var language = (session.get('language')) ? session.get('language') : 'EN';

        var initialPromise = $.ajax({
            url: RecruiterApp.config.TRANSLATION_SERVICE + '/' + language,
            type: 'GET',
            dataType: 'json'
        });

        $.ajaxSetup({
            cache: false,
            beforeSend: function(xhr) {
                if (session.get('authToken')) {
                    xhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
                } else {
                    if (!window.location.href.includes('forgotPassword')) {
                        RecruiterApp.core.vent.trigger('app:error',["Octus User","Not defined, this is an un-authenticated session"]);
                        window.location.hash = "/login";
                        xhr.abort();
                    }
                }
            },
            statusCode: {
                400: function() {
                    RecruiterApp.core.vent.trigger('app:message:error', "An error has occurred");
                },
                401: function () {
                    session.unset('authToken');
                    localStorage.removeItem('authToken')
                    RecruiterApp.core.vent.trigger("app:error",["401 error", "redirecting to login"]);
                    console.log("window.location.hash", window.location.hash);
                    if (!window.location.href.includes('forgotPassword')) {
                        window.location.hash = "/login";

                        if (RecruiterApp.started) RecruiterApp.core.vent.trigger("app:login", window.location.hash);
                        else RecruiterApp.core.vent.trigger("app:start");
                    }
                    
                },
                403: function() {
                    RecruiterApp.core.vent.trigger("app:error",["403 error", "redirecting to login"]);
                    session.unset('authToken');
                    localStorage.removeItem('authToken')
                    
                    if (RecruiterApp.started) RecruiterApp.core.vent.trigger("app:login", window.location.hash);
                    else RecruiterApp.core.vent.trigger("app:start");
                },
                409: function() {
                    RecruiterApp.core.vent.trigger("app:error",["403 error", "redirecting to login"]);
                    RecruiterApp.core.vent.trigger('app:message:error', "There has been a conflict deleting the object");
                },
                500: function() {
                    RecruiterApp.core.vent.trigger("app:error",["500 error", "An error has occurred"]);
                }
            }
        });

        var growlTemplate = `<div data-notify='container' class='col-xs-11 col-sm-3 alert alert-{0}' role='alert'>
                                <button type='button' aria-hidden='true' class='close' data-notify='dismiss'>×</button>
                                <span data-notify='icon'></span>
                                <span data-notify='title'>{1}</span>
                                <span data-notify='message'>{2}</span>
                                <div class='progress' data-notify='progressbar'>
                                    <div class='progress-bar progress-bar-{0}' role='progressbar' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100' style='width: 0%;'></div>
                                </div>
                            </div>`;

        RecruiterApp.core.vent.on('app:message:debug', (message, opt) => {
            let optDelay     = opt && !_.isUndefined(opt.delay) ? opt.delay : 5000;

            $.notify({message: message}, {
                type: 'info',
                template: growlTemplate,
                delay: optDelay,
                placement: {
                    from: "bottom",
                    align: "right"
                },
                offset: {
                    y: 60,
                    x: 20
                }
            });
        });
        RecruiterApp.core.vent.on('app:message:info', (message, opt) => {
            let optDelay     = opt && !_.isUndefined(opt.delay) ? opt.delay : 5000;

            $.notify({message: message}, {
                type: 'info',
                template: growlTemplate,
                delay: optDelay,
                placement: {
                    from: "bottom",
                    align: "right"
                },
                offset: {
                    y: 60,
                    x: 20
                }
            });
        });

        RecruiterApp.core.vent.on('app:message:warning', (message, opt) => {
            let optDelay     = opt && !_.isUndefined(opt.delay) ? opt.delay : 5000;

            $.notify({message: message}, {
                type: 'warning',
                template: growlTemplate,
                delay: optDelay,
                placement: {
                    from: "bottom",
                    align: "right"
                },
                offset: {
                    y: 60,
                    x: 20
                }
            });
        });

        RecruiterApp.core.vent.on('app:message:success', (message, opt) => {
            let optDelay     = opt && !_.isUndefined(opt.delay) ? opt.delay : 5000;

            $.notify({message: message}, {
                type: 'success',
                template: growlTemplate,
                delay: optDelay,
                placement: {
                    from: "bottom",
                    align: "right"
                },
                offset: {
                    y: 60,
                    x: 20
                }
            });
        });

        RecruiterApp.core.vent.on('app:message:error', (message, opt) => {
            let optDelay     = opt && !_.isUndefined(opt.delay) ? opt.delay : 5000;

            $.notify({message: message}, {
                type: 'danger',
                template: growlTemplate,
                delay: optDelay,
                placement: {
                    from: "bottom",
                    align: "right"
                },
                offset: {
                    y: 60,
                    x: 20
                }
            });
        });

        RecruiterApp.core.vent.on('duplicate:noduplicates', (opt) => {
            if ($("body>.alert.alert-danger[data-notify]").length == 0 && $("body>.alert.alert-warning[data-notify]").length == 0) {
                return false;
            }

            let msg         =  RecruiterApp.polyglot.t('thisRecordHaveNoDuplicates')
            let noDupMsg    =  `<h4>${RecruiterApp.polyglot.t('noDuplicates')}</h4>
                                ${msg}`

            if ($("body>[data-notify]").length > 0) {
                $.notifyClose();
                setTimeout(() => {
                    RecruiterApp.core.vent.trigger('app:message:success', noDupMsg);
                }, 300)
            } else {
                RecruiterApp.core.vent.trigger('app:message:success', noDupMsg);
            }
        });

        RecruiterApp.core.vent.on('duplicate:warn', (opt) => {
            let duplicateList   = opt.duplicateList || [];
            let duplicateType   = opt.duplicateType || '';
            let recordType      = opt.recordType || false;
            let messageType = duplicateType == 'CONFIRM' ? 'app:message:error' : 'app:message:warning';
            let duplicateErrMsg = {
                candidate: {
                    CONFIRM: 'thereIsAlreadyACandidateWithTheName',
                    POSSIBLE: 'thereIsPossiblyAlreadyACandidateWithTheName'
                },
                client: {
                    CONFIRM: 'thereIsAlreadyAClientWithTheName',
                    POSSIBLE: 'thereIsPossiblyAlreadyAClientWithTheName'
                },
                company: {
                    CONFIRM: 'thereIsAlreadyACompanyWithTheName',
                    POSSIBLE: 'thereIsPossiblyAlreadyACompanyWithTheName'
                }
            }
            let msg = RecruiterApp.polyglot.t(duplicateErrMsg[recordType][duplicateType]);

            if (!msg) {
                RecruiterApp.core.vent.trigger('app:message:error', 'duplicate:warn: recordType not provided');
                return false;
            }

            let dupComUrl       = dup  => `${RecruiterApp.config.UI_ROOT}/#/${dup.get('typeList')[0].toLowerCase()}/${dup.get('id')}/edit`;
            let getDuplicates   = dups => 
                dups.map(dup => {
                    if (dup.get('typeList').includes('CONSULTANT')) {
                        return `<li>${dup.get('name')} [${RecruiterApp.polyglot.t('consultant')}]</li>`;
                    } else {
                        return `<li><a href="${dupComUrl(dup)}" target="_blank">${dup.get('name')}</a></li>`;
                    }
                }).join('');
            let header          = duplicateType == 'CONFIRM' ? RecruiterApp.polyglot.t('confirmDuplicate') : RecruiterApp.polyglot.t('possibleDuplicate');
            let warningMsg      = `<h4>${header}</h4>
                                       ${msg}
                                   <ul>${getDuplicates(duplicateList)}</ul>`;
            let msgOpt          = { delay: 0};

            if ($("body>[data-notify]").length > 0) {
                $.notifyClose();
                setTimeout(() => {
                    RecruiterApp.core.vent.trigger(messageType, warningMsg, msgOpt);
                }, 300)
            } else {
                RecruiterApp.core.vent.trigger(messageType, warningMsg, msgOpt);
            }
        });

        RecruiterApp.core.vent.on("collection:sortedBy", function(collection,keyword) {
            collection.sort(function(a, b){
                var termA = ( a.get(keyword) )? a.get(keyword).toLowerCase() : "";
                var termB = ( b.get(keyword) )? b.get(keyword).toLowerCase() : "";
                if (termA < termB) //sort string ascending
                    return -1
                if (termA > termB)
                    return 1
                return 0 //default return value (no sorting)
            })
        });

        RecruiterApp.core.vent.on('octus:changeLanguage', function(language) {
            RecruiterApp.core.vent.trigger("app:info", ["Set Lang",language]);
            var promise = $.ajax({
                url: RecruiterApp.config.TRANSLATION_SERVICE + '/' + language,
                type: 'GET',
                dataType: 'json'
            });
            promise.done(function(data) {
                RecruiterApp.core.vent.trigger("app:info", ["Change Lang: Polyglot", language]);
                RecruiterApp.dictionary.polyglot = new Polyglot({ 
                    phrases: data,
                    allowMissing: true
                });
                RecruiterApp.polyglot = RecruiterApp.dictionary;
            });
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                console.error("this promise failed ", jqXHR, textStatus, errorThrown);
                window.location.hash = "/login";
            });
        });

        RecruiterApp.core.vent.on("appLayout:rendered", function() {
            RecruiterApp.core.vent.trigger("app:warn", ["App", "Layout rendered, setting up standard dom items"]);
            RecruiterApp.core.vent.trigger('setup:ui');
        });

        RecruiterApp.core.vent.on("ga:start", function (newPage) {
            var tld     = location.hostname.split('.').shift();
            var ga_js   = 'https://www.google-analytics.com/analytics.js';

            if (tld == 'localhost' && session.hasPermission('DEBUG')) { 
                window.ga_debug = {trace: true};
                ga_js = 'https://www.google-analytics.com/analytics_debug.js';
            }

            /* Docs can be found here:
               https://developers.google.com/analytics/devguides/collection/analyticsjs/ */
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script', ga_js,'ga');

            ga('create', {
              trackingId: 'UA-105717391-1',
              cookieDomain: 'auto',
            });

            RecruiterApp.core.vent.trigger('ga:set', 'RecruiterApp');
        });

        RecruiterApp.core.vent.on("ga:set", function (newPage) {
            if (!window.ga || !window.ga.loaded) {
                _.delay(function(){ RecruiterApp.core.vent.trigger("ga:set", newPage) }, 1000);
                return false;
            }
        
            ga('set', 'page', newPage);
            RecruiterApp.core.vent.trigger('app:ga', ["GA: set page", newPage] );
        });

        RecruiterApp.core.vent.on("ga:send", function (res) {
            if (!window.ga || !window.ga.loaded) {
                _.delay(function(){ RecruiterApp.core.vent.trigger("ga:send", res) }, 1000);
                return false;
            }
            
            var gaRes = {};
            var tld = location.hostname.split('.').shift(); // tld ie: demo, acihr, jacasia, netxwave etc

            if (res.hitType)        gaRes.hitType = res.hitType;

            // pageView attributes:
            if (res.page)           gaRes.page = res.page;
            // event attributes:
            if (res.eventCategory)  gaRes.eventCategory = res.eventCategory.charAt(0).toUpperCase() + res.eventCategory.slice(1);
            if (res.eventAction)    gaRes.eventAction   = res.eventAction.charAt(0).toUpperCase()   + res.eventAction.slice(1);
            if (res.eventLabel)     gaRes.eventLabel    = res.eventLabel.charAt(0).toUpperCase()    + res.eventLabel.slice(1);

            gaRes['dimension1'] = tld;                      // -- domain
            gaRes['dimension2'] = session.get('userName');  // -- username

            ga('send', gaRes)

            RecruiterApp.core.vent.trigger('app:ga', ["GA: send", JSON.stringify(gaRes)] );
        })

        RecruiterApp.views = {};
        RecruiterApp.data = {};
        RecruiterApp.started = false;

        initialPromise.done(function(data) {
            RecruiterApp.core.vent.trigger('app:info', ["Initial: Polyglot", language] );
            RecruiterApp.core.vent.trigger("app:info", ['AuthToken', localStorage.getItem('authToken')])
            
            RecruiterApp.dictionary.polyglot = new Polyglot({ phrases: data});
            RecruiterApp.polyglot = RecruiterApp.dictionary; //new Polyglot({ phrases: data});

            if (localStorage.getItem('authToken') == null || !localStorage.getItem('authToken')) {
                RecruiterApp.core.vent.trigger('app:start');
            } else {
                RecruiterApp.core.vent.trigger('app:loadData');
            }
        });
    });

    RecruiterApp.core.vent.bind('app:loadData', function(url) {
        RecruiterApp.core.vent.trigger('app:warn', ['App','Load Data']);

        RecruiterApp.core.vent.trigger('blockUI', RecruiterApp.polyglot.t('loading'))
        
        window.Octus.choiceClientCompanyList     = new ReferenceDataList({ type: "company" });
        window.Octus.languageList                = new ReferenceDataList({ type: "language" });
        window.Octus.languageProficiencyList     = new ReferenceDataList({ type: "languageProficiency" });
        window.Octus.salutationList              = new ReferenceDataList({ type: "salutation" });
        window.Octus.genderList                  = new ReferenceDataList({ type: "gender" });
        window.Octus.employmentTypeList          = new ReferenceDataList({ type: "employmentType" });
        window.Octus.nationalityList             = new ReferenceDataList({ type: "nationality" });
        window.Octus.currencyList                = new ReferenceDataList({ type: "currencySymbol" });
        window.Octus.locationList                = new ReferenceDataList({ type: "location" });
        window.Octus.consultantList              = new ReferenceDataList({ type: "consultant" });
        window.Octus.sourceList                  = new ReferenceDataList({ type: "candidateSource" });
        window.Octus.candidateStatusList         = new ReferenceDataList({ type: "candidateStatus" });
        window.Octus.religionList                = new ReferenceDataList({ type: "religion" });
        window.Octus.candidateCodeList           = new ReferenceDataList({ type: "candidateCode" });
        window.Octus.ownVehicleList              = new ReferenceDataList({ type: "ownVehicle" });
        window.Octus.placementStatusList         = new ReferenceDataList({ type: "placementStatus" });
        window.Octus.companyTypeList             = new ReferenceDataList({ type: "companyType" });
        window.Octus.companyStatusList           = new ReferenceDataList({ type: "companyStatus" });
        window.Octus.salaryPeriod                = new ReferenceDataList({ type: "salaryPeriod" });
        window.Octus.countryDialingCodes         = new ReferenceDataList({ type: "dialingCodeCountryGroupByDialingCode" });
        window.Octus.translationList             = new ReferenceDataList({ type: "translation" });
        window.Octus.interestList                = new ReferenceDataList({ type: "interest" });
        window.Octus.jobStatus                   = new ReferenceDataList({ type: "jobStatus" });
        window.Octus.companySourceDetailList     = new ReferenceDataList({ type: "companySourceDetail" });
        window.Octus.countryList                 = new ReferenceDataList({ type: "countryList" });
        window.Octus.jobShortlistStatus          = new ReferenceDataList({ type: "jobShortlistStatus" });
        window.Octus.jobSourceDetails            = new ReferenceDataList({ type: "jobSourceDetails" });
        window.Octus.workflowStatus              = new ReferenceDataList({ type: "workflowStatus" });
        window.Octus.saturdayWork                = new ReferenceDataList({ type: "saturdayWork" });
        window.Octus.clientStatus                = new ReferenceDataList({ type: "clientStatus" });
        window.Octus.commission                  = new ReferenceDataList({ type: "commission" });

        window.Octus.departmentList              = new TeamListForm();
        window.Octus.departmentList.suggest      = false;
        window.Octus.departmentList.query        = '';

        $.when(

            window.Octus.choiceClientCompanyList.fetch(),
            window.Octus.languageList.fetch(),
            window.Octus.languageProficiencyList.fetch(),
            window.Octus.genderList.fetch(),
            window.Octus.salutationList.fetch(),
            window.Octus.employmentTypeList.fetch(),
            window.Octus.nationalityList.fetch(),
            window.Octus.currencyList.fetch(),
            window.Octus.locationList.fetch(),
            window.Octus.consultantList.fetch(),
            window.Octus.sourceList.fetch(),
            window.Octus.candidateStatusList.fetch(),
            window.Octus.religionList.fetch(),
            window.Octus.candidateCodeList.fetch(),
            window.Octus.ownVehicleList.fetch(),
            window.Octus.placementStatusList.fetch(),
            window.Octus.companyTypeList.fetch(),
            window.Octus.companyStatusList.fetch(),
            window.Octus.salaryPeriod.fetch(),
            window.Octus.countryDialingCodes.fetch(),
            window.Octus.translationList.fetch(),
            window.Octus.interestList.fetch(),
            window.Octus.jobStatus.fetch(),
            window.Octus.companySourceDetailList.fetch(),
            window.Octus.countryList.fetch(),
            window.Octus.departmentList.fetch(),
            window.Octus.jobShortlistStatus.fetch(),
            window.Octus.jobSourceDetails.fetch(),
            window.Octus.workflowStatus.fetch(),
            window.Octus.saturdayWork.fetch(),
            window.Octus.clientStatus.fetch(),
            window.Octus.commission.fetch(),

        ).done(function () {
            RecruiterApp.core.vent.trigger('app:warn', ['App','Data Loaded'])

            window.Octus.choiceConsultantList = window.Octus.consultantList;
            window.Octus.activeConsultantList = new Backbone.Collection(window.Octus.consultantList.models
                .filter(
                    consultant => consultant.get('accountEnabled') == "true" 
                    && consultant.get('accountLocked') == "false"));

            window.Octus.statusRefData = _.union(
                window.Octus.jobStatus.toJSON(), 
                window.Octus.candidateStatusList.toJSON(),
                window.Octus.companyStatusList.toJSON(),
                window.Octus.jobShortlistStatus.toJSON(),
                window.Octus.workflowStatus.toJSON(),
                window.Octus.clientStatus.toJSON()
            );


            window.Octus.dictionary = _.union(
                window.Octus.choiceClientCompanyList.toJSON(), 
                window.Octus.languageList.toJSON(), 
                window.Octus.nationalityList.toJSON(), 
                window.Octus.languageProficiencyList.toJSON(), 
                window.Octus.genderList.toJSON(), 
                window.Octus.salutationList.toJSON(), 
                window.Octus.employmentTypeList.toJSON(), 
                window.Octus.currencyList.toJSON(), 
                window.Octus.locationList.toJSON(), 
                window.Octus.consultantList.toJSON(), 
                window.Octus.choiceConsultantList.toJSON(), 
                window.Octus.sourceList.toJSON(), 
                window.Octus.candidateStatusList.toJSON(),
                window.Octus.religionList.toJSON(),
                window.Octus.candidateCodeList.toJSON(),
                window.Octus.ownVehicleList.toJSON(),
                window.Octus.placementStatusList.toJSON(), 
                window.Octus.departmentList.toJSON(),
                window.Octus.companyTypeList.toJSON(),
                window.Octus.companyStatusList.toJSON(), 
                window.Octus.salaryPeriod.toJSON(), 
                window.Octus.countryDialingCodes.toJSON(), 
                window.Octus.translationList.toJSON(), 
                window.Octus.interestList.toJSON(), 
                window.Octus.jobStatus.toJSON(), 
                window.Octus.companySourceDetailList.toJSON(),
                window.Octus.countryList.toJSON(),
                window.Octus.jobShortlistStatus.toJSON(),
                window.Octus.jobSourceDetails.toJSON(),
                window.Octus.workflowStatus.toJSON(),
                window.Octus.saturdayWork.toJSON(),
                window.Octus.clientStatus.toJSON(),
                window.Octus.commission.toJSON(),
            );

            if (!_.isUndefined(url)) {
                window.location.href = url;
            } else if (RecruiterApp.started) {
                window.location.hash = "/";
            } else {
                RecruiterApp.core.vent.trigger('app:start');    
            }

            RecruiterApp.core.vent.trigger('unBlockUI');
        })
    });

    RecruiterApp.core.vent.bind('app:start', function(options) {
        RecruiterApp.core.vent.trigger('app:warn', ['App','Starting']);
        RecruiterApp.core.vent.trigger('app:info', ['App AuthToken', localStorage.getItem('authToken')]);

        if (_.isUndefined(window.kendo)) {
            setTimeout(() => RecruiterApp.core.vent.trigger("app:start"), 1000);
            return false;
        } else {
            var kendoUploadEncode = kendo.ui.Upload.extend({
                init: function (element, options) {
                    var self = this;

                    kendo.ui.Upload.fn.init.call(self, element, options);

                    self._module.populateFormData = function (e,t) {
                        var n, i = this.upload, r = t.length;

                        for (n = 0; r > n; n++) {
                            e.append(i.options.async.saveField || i.name, t[n].rawFile, encodeURI(t[n].rawFile.name))
                        };

                        return e
                    }
                },
                options: {
                    name: "UploadEncode"
                }
            })

            kendo.ui.plugin(kendoUploadEncode);
        }

        RecruiterApp.core.vent.trigger('ga:start');

        if (Backbone.history && !RecruiterApp.started) {

            RecruiterApp.started = true

            RecruiterApp.core.vent.on('loginComplete', function(activeSession) {
                console.log("Set activeSession onto window object", activeSession);
                window.Octus.activeSession = activeSession;
            });

            RecruiterApp.core.vent.on('logout', function() {
                window.Octus.activeSession.id = "";
                window.Octus.activeSession.clear();
            });

            SetupHandlebarsHelpers();
            initializeAppLayout();
            RecruiterApp.appRouteList = {};
            
            RecruiterApp.sessionController = new SessionController();
            RecruiterApp.sessionRouter = new SessionRouter({ controller: RecruiterApp.sessionController});
            _.extend(RecruiterApp.appRouteList, RecruiterApp.sessionRouter.appRoutes);

            RecruiterApp.homeController = new HomeController();
            RecruiterApp.homeRouter = new HomeRouter({ controller: RecruiterApp.homeController});
            _.extend(RecruiterApp.appRouteList, RecruiterApp.homeRouter.appRoutes);

            RecruiterApp.peopleDashboardController = new PeopleDashboardController();
            RecruiterApp.peopleDashboardRouter = new PeopleDashboardRouter({ controller: RecruiterApp.peopleDashboardController});
            _.extend(RecruiterApp.appRouteList, RecruiterApp.peopleDashboardRouter.appRoutes);


            RecruiterApp.userProfileController = new UserProfileController();
            RecruiterApp.userProfileRouter = new UserProfileRouter({ controller: RecruiterApp.userProfileController});
            _.extend(RecruiterApp.appRouteList, RecruiterApp.userProfileRouter.appRoutes);

            RecruiterApp.core.vent.trigger("app:warn", ["App","Backbone.history starting"]);

            Backbone.history.start();
        }

        if (_.isNull(localStorage.getItem('authToken')) && !window.location.hash.includes('forgotPassword')) {
            window.location.hash = "/login";
        }

        RecruiterApp.core.vent.trigger('app:warn', ['App','Done starting and we are now running!']);
    });

    RecruiterApp.core.vent.bind('app:DEBUG:log', function(msg) {
        // only if there is a DEBUG permission
        if (session.hasPermission('DEBUG')) {
            if (_.isArray(msg)) {
                console.log('%c' + msg[0], 'font-style: italic; font-weight: bold;', msg[1])
            } else {
                console.log(msg);
            }
        }
    });

    RecruiterApp.core.vent.bind('app:DEBUG:warn', function(msg) {
        // only if there is a DEBUG permission
        if (session.hasPermission('DEBUG')) {
            if (_.isArray(msg)) {
                console.log('%c' + msg[0] + '%c ' + msg[1], 'color: #FFA500; background: #664200; padding: 2px 4px; border-radius: 3px;', 'color: #996300;')
            } else {
                console.warn(msg);
            }
        }
    });

    RecruiterApp.core.vent.bind('app:DEBUG:info', function(msg) {
        // only if there is a DEBUG permission
        if (session.hasPermission('DEBUG')) {
            if (_.isArray(msg)) {
                console.log('%c' + msg[0] + '%c ' + msg[1], 'color: #F0F8FF; background: #1E90FF; padding: 2px 4px; border-radius: 3px;', 'color: #1873cc;')
            } else {
                console.info(msg);
            }
        }
    });

    RecruiterApp.core.vent.bind('app:DEBUG:error', function(msg) {
        // only if there is a DEBUG permission
        if (session.hasPermission('DEBUG')) {
            if (_.isArray(msg)) {
                console.log('%c' + msg[0] + '%c ' + msg[1], 'color: #ffe5e5; background: #990000; padding: 2px 4px; border-radius: 3px;', 'color: #990000;')
            } else {
                console.error(msg);
            }
        }
    });

    RecruiterApp.core.vent.bind('app:log', function(msg) {
        if (_.isArray(msg)) {
            console.log('%c' + msg[0], 'font-style: italic; font-weight: bold;', msg[1])
        } else {
            console.log(msg);
        }
    });

    RecruiterApp.core.vent.bind('app:warn', function(msg) {
        if (_.isArray(msg)) {
            console.log('%c' + msg[0] + '%c ' + msg[1], 'color: #FFA500; background: #664200; padding: 2px 4px; border-radius: 3px;', 'color: #996300;')
        } else {
            console.warn(msg);
        }
    });

    RecruiterApp.core.vent.bind('app:error', function(msg) {
        if (_.isArray(msg)) {
            console.log('%c' + msg[0] + '%c ' + msg[1], 'color: #ffe5e5; background: #990000; padding: 2px 4px; border-radius: 3px;', 'color: #990000;')
        } else {
            console.error(msg);
        }
    });

    RecruiterApp.core.vent.bind('app:info', function(msg) {
        if (_.isArray(msg)) {
            console.log('%c' + msg[0] + '%c ' + msg[1], 'color: #F0F8FF; background: #1E90FF; padding: 2px 4px; border-radius: 3px;', 'color: #1873cc;')
        } else {
            console.info(msg);
        }
    });

    RecruiterApp.core.vent.bind('app:ga', function(msg) {
        if (_.isArray(msg)) {
            console.log('%c' + msg[0] + '%c ' + msg[1], 'color: #ecc3b7; background: #bf360c; padding: 2px 4px; border-radius: 3px;', 'color: #ecc3b7;')
        } else {
            console.info(msg);
        }
    });

    RecruiterApp.core.vent.on('emailConfigErrorNotification', () => {
        let errorMsg = `<h4>${RecruiterApp.polyglot.t("warning")}</h4>
                        ${RecruiterApp.polyglot.t('invalid-credentials')}<br>
                        <a href="#/user/email/status" target="_blank">${RecruiterApp.polyglot.t('clickHereToSetupYourEmail')}</a>`;
        RecruiterApp.core.vent.trigger('app:message:error', errorMsg);
    });


    RecruiterApp.core.vent.on('blockUI', (msg, element) => {
        FreezeUI({selector: element, text: msg});
    });
        

    RecruiterApp.core.vent.on('unBlockUI', function () {
        UnfreezeUI();
    });

    RecruiterApp.core.vent.on('setup:ui', function() {
        UiSetup.Setup();
        UiSetup.SetupCore();
    });

    RecruiterApp.core.vent.on('domchange:title', function (title) {
        $(document).attr('title', title);
    });

    // Append recent item controller
    // RecentItemController.appendTriggers(RecruiterApp.core.vent);

    var SetupHandlebarsHelpers = function() {
        Handlebars.registerHelper('sessionFullName', function() {
            return session.get('fullName');
        });
        Handlebars.registerHelper('sessionEmail', function() {
            return session.get('email');
        });
        Handlebars.registerHelper('sessionUserName', function() {
            return session.get('userName');
        });
        // Handlebars.registerHelper('sessionMainRole', function() {
        //     return session.get('mainRole');
        // });
        Handlebars.registerHelper('sessionProfilePicture', function() {
            return RecruiterApp.config.UI_ROOT + "/img/default-avatar.png";
        });

        Handlebars.registerHelper('notEmpty', function(value) {
            return value != undefined;
        });

        Handlebars.registerHelper('equal', function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        });

        Handlebars.registerHelper('translate', function(key) {
            var translation = RecruiterApp.polyglot.t(key);
            if (_.isNull(translation)) {
                return key
            } else {
                return new Handlebars.SafeString(translation);
            }
        });

        Handlebars.registerHelper('hasTranslate', function(key) {
            return RecruiterApp.polyglot.has(key);
        });

        Handlebars.registerHelper('uiRoot', function() {
            return new Handlebars.SafeString(RecruiterApp.config.UI_ROOT);
        });

        Handlebars.registerHelper("log", function(context) {
            return console.log(context);
        });

        Handlebars.registerHelper('if_eq', function(a, b, opts) {
            if(a == b) // Or === depending on your needs
                return opts.fn(this);
            else
                return opts.inverse(this);
        });

        Handlebars.registerHelper('if_gt', function(a, b, opts) {
            if(a > b) 
                return opts.fn(this);
            else
                return opts.inverse(this);
        });

        Handlebars.registerHelper('if_lt', function(a, b, opts) {
            if(a < b) 
                return opts.fn(this);
            else
                return opts.inverse(this);
        });

        Handlebars.registerHelper('if_neq', function(a, b, opts) {
            if(a != b) // Or === depending on your needs
                return opts.fn(this);
            else
                return opts.inverse(this);
        });

        Handlebars.registerHelper('eachInMap', function ( map, block ) {
            var out = '';
            Object.keys( map ).map(function( prop ) {
                out += block.fn( {key: prop, value: map[ prop ]} );
            });
            return out;
        });

        /**
         * Helper proxy to session object, used to determine if a UI
         * element should be displayed or not.
         *
         * Note: even if the permission set is modified by a malicious user,
         * they would still be blocked from making API calls for which they are
         * not entitled
         *
         */
        Handlebars.registerHelper('hasConfiguration', function (key) {
            return !!RecruiterApp.configuration.hasConfiguration(key);
        })
        
        Handlebars.registerHelper('hasPermission', function(uiElement) {
            return !!session.hasPermission(uiElement);
        });

        Handlebars.registerHelper('hasPermissionsForView', function(name, field) {
            return !!session.hasPermissionsForView(name, field);
        });

        Handlebars.registerHelper('hasRole', function(role) {
            return !!session.hasRole(role);
        });

        Handlebars.registerHelper('hasType', function(typeString, type) {

            if (type === undefined || typeString === undefined) {
                return false;
            } else {
                return typeString.contains(type);
            }
        });

        Handlebars.registerHelper('doesntHaveType', function(typeString, type) {
            console.log("Checking", typeString, type);
            if (type === undefined || typeString === undefined) {
                return false;
            } else {
                return !typeString.contains(type);
            }
        });


        Handlebars.registerHelper('returnRole', function() {
            return JSON.parse(session.get('roleList'));
        });

        Handlebars.registerHelper('compare', function(v1, operator, v2, opt) {

            if (arguments.length < 3)
                throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

            switch (operator) {
                case '==':
                    return (v1 == v2) ? opt.fn(this) : opt.inverse(this);
                case '===':
                    return (v1 === v2) ? opt.fn(this) : opt.inverse(this);
                case '!=':
                    return (v1 != v2) ? opt.fn(this) : opt.inverse(this);
                case '!==':
                    return (v1 !== v2) ? opt.fn(this) : opt.inverse(this);
                case '<':
                    return (v1 < v2) ? opt.fn(this) : opt.inverse(this);
                case '<=':
                    return (v1 <= v2) ? opt.fn(this) : opt.inverse(this);
                case '>':
                    return (v1 > v2) ? opt.fn(this) : opt.inverse(this);
                case '>=':
                    return (v1 >= v2) ? opt.fn(this) : opt.inverse(this);
                case '&&':
                    return (v1 && v2) ? opt.fn(this) : opt.inverse(this);
                case '||':
                    return (v1 || v2) ? opt.fn(this) : opt.inverse(this);
                default:
                    return opt.inverse(this);
            }
        });
    };

    RecruiterApp.core.start();

};
