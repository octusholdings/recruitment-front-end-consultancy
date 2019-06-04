var Marionette = require('backbone.marionette');

module.exports = LoginView = Marionette.ItemView.extend({
    template: require('../templates/forgotPassword.hbs'),
    events: {
        'submit form' : 'getPassword'
    },
    bindings: {
        '.username': 'username'
    },
    onRender() {
        this.$('.currentYear').text(new Date().getFullYear());
        this.stickit();
        RecruiterApp.core.vent.trigger('unBlockUI');
    },
    getPassword(e) {
        e.preventDefault();

        var $saveButton = $('.reset-password');
            $saveButton.attr('disabled', 'disabled').text(RecruiterApp.polyglot.t('resettingPassword'));
        
        fetch(`${RecruiterApp.config.API_ROOT}/login/forgotpassword`, {
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username : this.model.get('username')}), // body data type must match "Content-Type" header
        })
        .then(response => {
            if (response.status == '200') {
                this.model.unset('username');
                RecruiterApp.core.vent.trigger('app:message:success', RecruiterApp.polyglot.t('passwordSent'));
                window.location.hash = '/login';
            } else {
                RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('userNotFound'));
                this.model.unset('username');
            }
            $saveButton.removeAttr('disabled').text(RecruiterApp.polyglot.t('retrievePassword'));
        })
        .catch(error => {
            RecruiterApp.core.vent.trigger('app:message:error', error);
            this.model.unset('username');
            $saveButton.removeAttr('disabled').text(RecruiterApp.polyglot.t('retrievePassword'));
        });
    }
});