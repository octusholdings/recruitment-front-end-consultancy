var Marionette  = require('backbone.marionette'),
    stickit = require('backbone.stickit'),
    Backbone    = require('backbone');

module.exports = UserEmailQueueStatus = Backbone.Model.extend({
    url() {
        return RecruiterApp.config.API_ROOT + "/email/status/" + this.accountId
    }
})

module.exports = UserEmailReprocessThread = Backbone.Model.extend({
    url() {
        return RecruiterApp.config.API_ROOT + "/email/thread/reprocess/" + this.accountId
    }
})

module.exports = UserEmailStatusForm = Marionette.ItemView.extend({
    template: require('../templates/userEmailStatusForm.hbs'),
    ui: {
        'setupEmail'        : '.setup-email',
        'resetEmail'        : '.reset-email',
        'refreshEmail'      : '.refresh-email',
        'reprocessEmail'    : '.reprocess-email'
    },
    events: {
        'click @ui.setupEmail'      : 'setupEmail',
        'click @ui.resetEmail'      : 'resetEmail',
        'click @ui.refreshEmail'    : 'loadQueueStatus',
        'click @ui.reprocessEmail'  : 'reprocessEmailQueue'
    },
    bindings: {
        '.calendar-status': {
            observe: ['mainCalendarId', 'syncState'],
            onGet: statusList => {
                const mainCalendarStatus    = statusList[0];
                const emailSyncStatus       = statusList[1];
                if (mainCalendarStatus && emailSyncStatus === 'running') {
                    return `
                    <div class="btn btn-block btn-success">
                        <i class="fa fa-check fa-fw"></i> 
                        ${RecruiterApp.polyglot.t('calendarSyncRunning')}
                    </div>
                    `;
                } else {
                    return `<div class="btn btn-block btn-warning">
                        <i class="fa fa-exclamation-triangle" aria-hidden="true"></i> 
                        ${RecruiterApp.polyglot.t('calendarSyncNotRunning')}
                    </div>
                    <div class="alert alert-warning" role="alert" style="margin:0; border-radius:3px;">
                        <i class="fa fa-calendar-o" aria-hidden="true"></i> 
                        ${RecruiterApp.polyglot.t('calendarSyncHint')}
                    </div>`
                }
            },
            updateMethod: 'html'
        }
    },
    onRender () {
        this.stickit();
    },
    setupEmail () {
        RecruiterApp.core.vent.trigger('userProfile:email:setup');
    },
    resetEmail () {
        RecruiterApp.core.vent.trigger('userProfile:email:reset');
        this.model.unset('code');
        this.render();
    },
    onShow () {
        if (!_.isUndefined(this.model.get('token')) && !_.isUndefined(this.model.get('namespaceId'))) {
            this.loadQueueStatus();
            this.checkEmailStatus();
        }
    },
    loadQueueStatus (delay) {
        this.ui.refreshEmail.html(`<i class='fa fa-refresh fa-spin fa-fw'></i> ${RecruiterApp.polyglot.t('loading')}`);

        setTimeout(() => {
            let queueStatus = new UserEmailQueueStatus();
                queueStatus.accountId = this.model.get('namespaceId');

            queueStatus.fetch()
            .error((e) => {
                console.error(e);
                this.model.set('online', false);
            })
            .success((e) => {
                this.model.set('online', true);

                this.model.set('emailQueueProcessed', queueStatus.get('success'));
                this.model.set('emailQueuePending', queueStatus.get('pending'));
                this.model.set('emailQueueFailed', queueStatus.get('failed'));

                this.render();
            });
        }, 1000);
    },
    checkEmailStatus () {
        if (this.model.get('syncState') == 'invalid' || this.model.get('syncState') == 'invalid-credentials') {
            RecruiterApp.core.vent.trigger('app:message:error', `${RecruiterApp.polyglot.t('emailIntegrationInvalid')}`);
        }
    },
    reprocessEmailQueue () {
        this.ui.reprocessEmail.html(`<i class='fa fa-refresh fa-spin fa-fw'></i> ${RecruiterApp.polyglot.t('loading')}`);

        setTimeout(() => {
            let reprocessThread = new UserEmailReprocessThread();
                reprocessThread.accountId = this.model.get('namespaceId');

            reprocessThread.fetch()
            .error((e) => {
                console.error(e);
            })
            .success((e) => {
                this.loadQueueStatus();
            });
        }, 1000);
    }
});