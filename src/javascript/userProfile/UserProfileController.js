var Marionette          = require('backbone.marionette'),
    UserNavView         = require('./views/UserNavView'),
    UserTitleView       = require('./views/UserTitleView'),
    UserProfileForm     = require('./views/UserProfileForm'),
    UserPasswordForm    = require('./views/UserPasswordForm'),
    // UserSettingListView = require('./views/UserSettingListView'),
    UserGenericSettingView = require('./views/UserGenericSettingView'),
    UserLocaleForm      = require('./views/UserLocaleForm'),
    UserProfile         = require('./models/UserProfile'),
    UserSettingList     = require('./models/UserSettingList'),
    ReferenceDataList   = require('../common/models/ReferenceDataList'),
    Locale              = require('./models/Locale'),
    PasswordReset       = require('./models/PasswordReset'),
    EmailConfig         = require('./models/EmailConfig'),
    EmailConfigReset    = require('./models/EmailConfigReset'),
    NylasConfig         = require('./models/NylasConfig'),
    UserEmail           = require('./models/UserEmail'),
    UserGenericSetting  = require('./models/UserGenericSetting'),
    UserEmailForm       = require('./views/UserEmailForm'),
    UserEmailStatusForm = require('./views/UserEmailStatusForm'),
    Session             = require('../session/models/Session');

var Layout = Marionette.Layout.extend({
    template: require('./templates/userProfileFormLayout.hbs'),
    regions: {
        header: "#page-title",
        navTab: "#nav-tabs",
        content: "#form-content"
    }
});

var UserEmailLayout = Marionette.Layout.extend({
    template: require('./templates/userEmailLayout.hbs'),
    regions: {
        emailAddress: "#emailAddressInput",
        status: "#emailStatus"
    }
});

var _userProfile = new UserProfile();
var _userSettings = new UserSettingList();

module.exports = UserProfileController = Marionette.Controller.extend({

    // private
    initializeLayout : function () {
        RecruiterApp.core.vent.trigger('app:log', ['UserProfileController', 'initializeLayout...'])
        UserProfileController.layout = new Layout();
        RecruiterApp.core.vent.trigger('app:show', UserProfileController.layout);
        $(".list-group-item").removeClass('active');
        $('.subItem').removeClass('active');
        $('.collapse.in').collapse('hide');
    },

    initializeEmailLayout : function () {
        console.log('initializeEmailLayout...');
        RecruiterApp.core.vent.trigger('unBlockUI');
        UserProfileController.emailLayout = new UserEmailLayout();
        UserProfileController.layout.content.show(UserProfileController.emailLayout);
    },

    cleanUpModal: function() {
        RecruiterApp.core.vent.trigger('app:modal:close');
    },

    initialize: function() {

        var self = this;

        RecruiterApp.core.vent.on('userProfileForm:cancel', function () {
            RecruiterApp.core.vent.trigger('userProfileSearch:show');
        });

        RecruiterApp.core.vent.on('user:profile:show', function () {
            self.ShowProfile();
        });


        RecruiterApp.core.vent.on('userProfile:locale:save', function (locale) {
            locale.save(null, { success: function () {
                //RecruiterApp.core.vent.trigger('app:message:info', 'Language updated successfully');

                RecruiterApp.core.vent.trigger('blockUI', 'Changing system language ...');        

                var session = new Session();
                session.set('language', locale.get('language'));
                RecruiterApp.core.vent.trigger('octus:changeLanguage', locale.get('language'));
                setTimeout(function(){ RecruiterApp.core.vent.trigger('unBlockUI'); location.reload(); }, 2000);
            }});
        });

        // RecruiterApp.core.vent.on('userProfile:setting:save', function (view) {
    
        //     if (!view.model.isValid(true)) {
        //         RecruiterApp.core.vent.trigger('app:message:error', 'Setting not saved! Name and value are required');
        //         return;
        //     }

        //     view.model.save(null, { success: function (model, response) {
        //         RecruiterApp.core.vent.trigger('app:message:info', 'Setting added');
        //         view.settingsSaved();
        //     }, error: function (xhr) {
        //         console.error(xhr);
        //         RecruiterApp.core.vent.trigger('app:message:error', 'Error adding setting');
        //     }});

        //     var session = new Session();
        //     session.set(view.model.get('key'), view.model.get('value'));
        // });


        RecruiterApp.core.vent.on('userProfile:nav:change', function (tab) {
            self.UpdateNav(tab);
        });

        RecruiterApp.core.vent.on('userProfile:email:setup', function () {
            self.SetupEmail();
        });

        RecruiterApp.core.vent.on('userProfile:email:reset', function () {
            self.ResetEmail();
        });
    },


    SetupCommonViews: function(title) {
        UserProfileController.layout.header.show(new UserTitleView({title:title}));
        UserProfileController.layout.navTab.show(new UserNavView());
    },
    UpdateNav: function (tab) {
        if (tab == 'settings') {
            window.location.hash = "/user/settings";
        } else if (tab == 'profile') {
            window.location.hash = "/user/profile";
        } else if (tab == 'locale') {
            window.location.hash = "/user/locale";
        } else if (tab == 'password') {
            window.location.hash = "/user/password";
        } else if (tab == 'email') {
            // this sh
            window.location.hash = "/user/email/status";
        } else {
            console.log("unknown nav tab " + tab);
        }
    },
    ToggleNav : function (activeTab) {
        $(".userTab").removeClass('active');
        $("#nav-"+activeTab).parent().addClass('active');
    },
    ShowProfile : function () {

        this.initializeLayout();
        this.SetupCommonViews(RecruiterApp.polyglot.t('profile'));
        this.ShowBreadcrumbs('PROFILE');

        var _teamList = new ReferenceDataList({ type: "teamList"});
        var _divisionList = new ReferenceDataList({ type: "divisionList"});
        var _countryList = new ReferenceDataList({ type: "countryList"});

        $.when(
            _userProfile.fetch(), 
            _teamList.fetch(),
            _divisionList.fetch()
        ).done(function () {
            console.log("Got teamList", _teamList);
            window.Octus.teamList = _teamList;
            window.Octus.divisionList = _divisionList;

            var userProfileView = new UserProfileForm({ model: _userProfile });
            UserProfileController.layout.content.show(userProfileView);
            RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('profile'));

            userProfileView.on('userProfile:save', function(userProfile) {
                console.log("Saving userProfile", userProfile);
                var promise = userProfile.save();
                $.when(promise).done(function () {
                    RecruiterApp.core.vent.trigger('userProfileSearch:show');
                    RecruiterApp.core.vent.trigger('app:message:success', 'User changes saved');
                });
                $.when(promise).fail(function () {
                    console.log("Save failed");
                    RecruiterApp.core.vent.trigger('app:message:error', 'Error: could not save user changes');
                });

            });

        }).fail(function () {
            console.log("Cannot get profile for user...");
        });

        this.ToggleNav('profile');
        this.ShowBreadcrumbs('profile');
    },

    ShowSettings : function () {

        this.initializeLayout();
        this.SetupCommonViews(RecruiterApp.polyglot.t('settings'));

        var userSettingsChoiceList = new ReferenceDataList({type: 'userSetting'});
        var timeZoneList = new ReferenceDataList({type: 'timezone'});
        RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('settings'));

        $.when(
            _userSettings.fetch(), 
            userSettingsChoiceList.fetch(),
            timeZoneList.fetch()
        ).done(function () {
            window.Octus.userSettingsChoiceList = userSettingsChoiceList;
            window.Octus.timeZoneList           = timeZoneList;
            // UserProfileController.layout.content.show(new UserSettingListView({ collection: _userSettings }));
            UserProfileController.layout.content.show(new UserGenericSettingView({
                model: new UserGenericSetting(), 
                oldSettings: _userSettings
            }));
        }).fail(function() {
            console.log("Cannot get profile for user...");
        });

        this.ToggleNav('settings');
        this.ShowBreadcrumbs('settings');

    },
    SetupEmail : function () {
        //client_id: Your Nylas App ID
        //response_type: code
        //scope: email
        //login_hint: The user’s email address, if available. If no login_hint is present, Nylas will ask your user for their email address.
        //    redirect_uri: The web page Nylas should redirect to after sign-in is complete. Must be one of the Redirect URIs registered with your application in the Nylas developer console.
        //    state: (optional) Arbitrary string that is returned as a URL paremeter in your redirect_uri. You can pass a value here to keep track of a specific user’s authentication flow. Also may be used to protect against CSRF attacks.

        RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('email'));

        var subdomain   = location.host.indexOf("localhost") > -1 ? "" : location.host.split(".")[0];
        var userEmail   = new UserEmail();
        var nylasConfig = new NylasConfig();
            nylasConfig.type = "user";

        userEmail.fetch().then(() => {

            nylasConfig.email = userEmail.get('address');

            nylasConfig.fetch().then(() => {
                window.location = "https://api.nylas.com/oauth/authorize" +
                    "?client_id=" + nylasConfig.get('appCode') +
                    "&response_type=code" +
                    "&scope=email" +
                    "&state=" + subdomain +
                    "&login_hint=" + nylasConfig.get('loginHint')+
                    "&redirect_uri=" + encodeURIComponent(nylasConfig.get('redirectUri'));
            });            
        });

    },
    ResetEmail : function () {
        var emailConfigReset = new EmailConfigReset();
        var self = this;
        emailConfigReset.save(null, {success: function() {
            RecruiterApp.core.vent.trigger('app:message:info', 'Email reset');
            UserProfileController.emailLayout.status.close()
            self.ShowEmailStatus();
        }, error: function(xhr, message) {
            RecruiterApp.core.vent.trigger('app:message:error', 'Error resetting email');
        }});
    },
    ShowEmailStatus: function () {
        this.cleanUpModal();
        this.initializeLayout();
        this.SetupCommonViews(RecruiterApp.polyglot.t('email'));
        this.initializeEmailLayout();

        RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('email'));

        var emailConfig = new EmailConfig();
        emailConfig.fetch({ success: function() {
            UserProfileController.emailLayout.status.show(new UserEmailStatusForm({ model: emailConfig }));
        }});

        var userEmail = new UserEmail();
        userEmail.fetch({ success: function() {
            UserProfileController.emailLayout.emailAddress.show(new UserEmailForm({ model: userEmail }));
        }});

        this.ToggleNav('email');
        this.ShowBreadcrumbs('email');
    },

    ReceiveEmailCallback: function (codeParam) {
        _.delay(() => {
            RecruiterApp.core.vent.trigger('blockUI', 'Getting status from Nylas');

            var self = this;
            var urlObj = new URL(location.href);
                urlObj.search = "?" + codeParam;

            var code    = urlObj.searchParams.get("code");
            var error   = urlObj.searchParams.get("error");
            var reason  = urlObj.searchParams.get("reason");

            if (!_.isEmpty(error) && !_.isEmpty(reason)) {
                console.log("Received error from nylas reason=" + error + " error=" + reason);
                this.initializeLayout();
                this.SetupCommonViews();
            } else if (!_.isEmpty(code)) {
                console.log("Received code from nylas", code);
                
                var emailConfig = new EmailConfig({
                    type: "USER",
                    code: code
                });

                emailConfig.save().then(() => {
                    self.UpdateNav('email');
                }, () => {
                    RecruiterApp.core.vent.trigger('app:message:error', "Atleast 1 of the calendar attached to your email needs to be public. Please check your email calendar settings.");
                    window.location.hash = "/user/email/status";
                });
            } 
        
        }, 500);

    },

    // ReceiveEmailCallbackError: function (reason, error) {
    //     var reason_msg = reason.split("=")[1];
    //     var error_msg = error.split("=")[1];
    //     console.log("Received error from nylas reason=" + reason_msg + " error=" + error_msg);
    //     this.initializeLayout();
    //     this.SetupCommonViews();
    // },

    ShowPasswordChange : function () {

        this.initializeLayout();
        this.SetupCommonViews(RecruiterApp.polyglot.t('password'));
        RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('password'));
        
        var userPassword = new PasswordReset();
        var userPasswordForm = new UserPasswordForm({ model: userPassword });
        UserProfileController.layout.content.show(userPasswordForm);
        this.ToggleNav('password-change');
        this.ShowBreadcrumbs('password');

        //event for updating password
        userPasswordForm.on('userProfile:password:update', function (model) {
            this.model.unset('confirmNewPassword');
            model.save(null, {success: function() {
                RecruiterApp.core.vent.trigger('app:message:info', "Updated Password");
            }, error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log('get textStatus',textStatus.responseText);
                var textObj = jQuery.parseJSON( textStatus.responseText );
                //console.log('message',textObj.message);
                RecruiterApp.core.vent.trigger('app:message:error', "Error! "+textObj.message);
            }});
        });
    },

    ShowLocale : function () {
        this.initializeLayout();
        this.SetupCommonViews(RecruiterApp.polyglot.t('language'));
        RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('language'));

        var userLocale = new Locale();
        userLocale.fetch({ success: function () {
            UserProfileController.layout.content.show(new UserLocaleForm({ model: userLocale }));
        }});
        this.ToggleNav('locale');
        this.ShowBreadcrumbs('locale');
    },

    ShowBreadcrumbs: function (tabName) {
        var breadcrumbsList = new Array();

        switch (tabName) {
            case 'profile': 
                breadcrumbsList.push(RecruiterApp.polyglot.t('userProfile')); 
                break;

            case 'email': 
                breadcrumbsList.push('<a href="' + RecruiterApp.config.UI_ROOT + '/#/user/profile">' + RecruiterApp.polyglot.t('userProfile') + '</a>'); 
                breadcrumbsList.push(RecruiterApp.polyglot.t('email')); 
                break;

            case 'settings': 
                breadcrumbsList.push('<a href="' + RecruiterApp.config.UI_ROOT + '/#/user/profile">' + RecruiterApp.polyglot.t('userProfile') + '</a>'); 
                breadcrumbsList.push(RecruiterApp.polyglot.t('settings')); 
                break;

            case 'locale': 
                breadcrumbsList.push('<a href="' + RecruiterApp.config.UI_ROOT + '/#/user/profile">' + RecruiterApp.polyglot.t('userProfile') + '</a>'); 
                breadcrumbsList.push(RecruiterApp.polyglot.t('language')); 
                break;

            case 'password': 
                breadcrumbsList.push('<a href="' + RecruiterApp.config.UI_ROOT + '/#/user/profile">' + RecruiterApp.polyglot.t('userProfile') + '</a>'); 
                breadcrumbsList.push(RecruiterApp.polyglot.t('password')); 
                break;
        }

        RecruiterApp.core.vent.trigger('app:breadcrumbs:update', breadcrumbsList);
    }

});