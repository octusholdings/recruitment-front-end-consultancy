var Marionette     = require('backbone.marionette'),
    RecentItem = require ('../../recentItems/models/RecentItem'),
    RecentItemCollection = require ('../../recentItems/models/RecentItemCollection');

module.exports = FooterView = Marionette.ItemView.extend({
    template: require('../templates/footer.hbs'),
    // className: "navbar navbar-inverse",
    events: {
        'click #btnAddNote'         : 'addQuickNote',
        'click #btnAddHotList'      : 'addHotList',
        'click .btnLiveChat'        : 'openLiveChat',
        'click #btnQuickUploadCV'   : 'openUpload',
        'click .new-candidate'      : 'goToNewCandidate',
        'click .new-client'         : 'goToNewClient',
        'click .new-company'        : 'goToNewCompany',
        'click .new-job'            : 'goToNewJob'
    },
    addQuickNote: function() {
       var self = this;
       this.trigger('footer:addQuickNote');
    },
    addHotList: function () {
        var self = this;
        this.trigger('footer:addQuickHotList')
    },
    openLiveChat: function(e) {
        var btnLiveChat = $('.btnLiveChat');
        if (btnLiveChat.attr('data-tooltip') === 'Live Chat') {
            e.target.classList.add('fa-spin');
            btnLiveChat.removeAttr('data-tooltip');
            this.trigger('footer:openLiveChat');

            setTimeout(function () {
                e.target.classList.remove('fa-spin');
                btnLiveChat.attr('data-tooltip','Hide Live Chat');
            }, 5000);
        } else {
            $('#antila-widget-online').remove();
            $('#antila-init').remove();
            btnLiveChat.attr('data-tooltip','Live Chat');
        }
    },
    initializeKendoQuickUpload: function () {

        this.$el.find("#quickUploadCV").kendoUploadEncode({
            async: {
                saveUrl: RecruiterApp.config.API_ROOT + "/document/upload/candidate",
                autoUpload: true
            },
            dropZone: "#btnQuickUploadCV",
            multiple: false,
            success: this.quickUploadSuccess,
            complete: this.quickUploadComplete,
            upload: this.quickUploadUpload,
            error: this.quickUploadError
        });
    },
    openUpload: function () {
        this.$el.find('#quickUploadCV').click();    
    },
    quickUploadComplete: function () {
        RecruiterApp.core.vent.trigger('unBlockUI');
    },
    quickUploadError: function(e) {

        $('[data-notify]').remove();
        $('.footerUploadCv .upload-start').removeClass('hidden');
        $('.footerUploadCv .upload-progress').addClass('hidden');

        if (e.XMLHttpRequest.status == 422) {

            let response = JSON.parse(e.XMLHttpRequest.response);
            let message = '<strong>' + response.message + '</strong><br>';

            if (response.client) {
                message += '<span>CV is already registered as a client <a target="_blank" href="' + RecruiterApp.config.UI_ROOT + '/#/client/' 
                        + response.client.id + '/dashboard">' 
                        + response.client.firstName + ' ' + response.client.lastName 
                        + '</a></span>';
            }

            RecruiterApp.core.vent.trigger('app:message:error', message);
        } else {
            RecruiterApp.core.vent.trigger('app:message:error', '<strong>' + RecruiterApp.polyglot.t("unableImportFile") + '</strong><br> ' + RecruiterApp.polyglot.t("pleaseCheckFileTryAgain"));
        }

        RecruiterApp.core.vent.trigger('ga:send', { 
            hitType: 'event', 
            eventCategory: 'QuickResumeImport',
            eventAction: 'Import',
            eventLabel: 'Fail',
        });

    },
    quickUploadUpload: function(e) {
        $('.footerUploadCv .upload-start').addClass('hidden');
        $('.footerUploadCv .upload-progress').removeClass('hidden');
        $('#btnQuickUploadCV').removeClass('upload-active');

        var session = new Session();
        var xhr = e.XMLHttpRequest;
        if (xhr) {
            xhr.addEventListener("readystatechange", function(e) {
                if (xhr.readyState == 1 /* OPENED */) {
                    xhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
                } else {
                    console.log("XHR readyState != 1");
                }
            });
        } else {
            console.error("XHR is null");
        }
    },
    quickUploadSuccess: function(e) {
        clearTimeout($.data(this, 'uploadTimer'));

        // call upload success once only
        $.data(this, 'uploadTimer', setTimeout(function() {
            $('.footerUploadCv .upload-start').removeClass('hidden');
            $('.footerUploadCv .upload-progress').addClass('hidden');

            var newCandidateWin = window.open("#/candidate/" + e.response.id + "/edit/" + e.response.sourceDocument);

            if (!newCandidateWin || newCandidateWin.closed || typeof newCandidateWin.closed=='undefined') { 
                let warningMsg = `<strong> WARNING: POP UP BLOCKED </strong><br> ${RecruiterApp.polyglot.t("pleaseContinueFillOutRecord")}<br> <a target="_blank" href="#/candidate/${e.response.id}/edit/${e.response.sourceDocument}">${RecruiterApp.polyglot.t('Edit')} ${e.response.allNames} ${RecruiterApp.polyglot.t('inNewWindow')}</a>`;
                let msgOpt = { delay: 0 }

                RecruiterApp.core.vent.trigger('app:message:warning', warningMsg, msgOpt);
            } else {
                let successMsg = `<strong> ${RecruiterApp.polyglot.t("importCVSuccessful")} </strong><br> ${RecruiterApp.polyglot.t("pleaseContinueFillOutRecord")}<br> <a target="_blank" href="#/candidate/${e.response.id}/edit/${e.response.sourceDocument}">${RecruiterApp.polyglot.t('Edit')} ${e.response.allNames} ${RecruiterApp.polyglot.t('inNewWindow')}</a>`;
                
                RecruiterApp.core.vent.trigger('app:message:success', successMsg);
            }

            RecruiterApp.core.vent.trigger('ga:send', { 
                hitType: 'event', 
                eventCategory: 'QuickResumeImport',
                eventAction: 'Import',
                eventLabel: 'Success',
            });
            
        }, 1000));
    },
    behaviors: {
        CheckPermissions: { view: "footer" }
    },
    onShow: function() {
        var self = this;
        var dragTimer;            

        // Initialise 'Quick Add' dropdown menu
        $('.dropdown-toggle').dropdown();

        _.delay(function(){
            self.initializeKendoQuickUpload();
        }, 200);

        $(document).on('dragover', function(e) {
            var dt = e.originalEvent.dataTransfer;

            if (dt.types && (dt.types.indexOf ? dt.types.indexOf('Files') != -1 : dt.types.contains('Files'))) {                
                self.$el.find('#btnQuickUploadCV').addClass('upload-active');
                window.clearTimeout(dragTimer);
            }
        });

        $(document).on('dragleave', function(e) {
            dragTimer = window.setTimeout(function() {
                self.$el.find('#btnQuickUploadCV').removeClass('upload-active');
            }, 25);
        });

        var permissionHelper = new PermissionHelper();
        permissionHelper.processView('footer', self);

        // Recent items
        RecentItem.TYPES().forEach((type) => {

            RecruiterApp.core.vent.on('app:recentitems:' + type.toLowerCase() + ':refresh', function() {

                let recentItemCollection = new RecentItemCollection({}, { type: type, actions: [ RecentItem.ACTION.OPEN, RecentItem.ACTION.CREATE, RecentItem.ACTION.UPDATE ] });
                recentItemCollection.fetch({
                    success(data) {
                        let label = 'new' + type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
                        self.loadDropdownMenu(type, data, label);
                    }
                });

            });

            RecruiterApp.core.vent.trigger('app:recentitems:' + type.toLowerCase() + ':refresh');

        });

    },
    loadDropdownMenu: function(type, collection, newRecentItem) {

        let newRecentItemLabel = RecruiterApp.polyglot.t(newRecentItem);

        let dropdownCdd = this.$('.recent-items-' + type.toLowerCase() + ' > ul.dropdown-menu');
        dropdownCdd.empty();

        var link = type.toLowerCase();
        if (type == RecentItem.TYPE.JOB) {
            link = 'jobDetail';
        }

        collection.forEach((item, index) => {

            var html = '<li><a href="';
            html += RecruiterApp.config.UI_ROOT + '/#/' + link + '/' + item.get('subjectId') 
            html += '/dashboard">' 
            html += item.get('subject');
            html += '</a>';
            html += '</li><li class="divider"></li>';

            dropdownCdd.prepend(html);

        });

        dropdownCdd.append('<li><button class="btn btn-success new-' + type.toLowerCase() + '"><i class="fa fa-user fa-fw"></i> ' + newRecentItemLabel + '</button>');
    },
    goToNewCandidate: function() {
        window.open(RecruiterApp.config.UI_ROOT + '/#/candidate/create' , '_blank');
    },

    goToNewClient: function() {
        window.open(RecruiterApp.config.UI_ROOT + '/#/client/create' , '_blank');
    },

    goToNewCompany: function() {
        window.open(RecruiterApp.config.UI_ROOT + '/#/company/create' , '_blank');
    },

    goToNewJob: function() {
        window.open(RecruiterApp.config.UI_ROOT + '/#/job/create' , '_blank');
    }
});