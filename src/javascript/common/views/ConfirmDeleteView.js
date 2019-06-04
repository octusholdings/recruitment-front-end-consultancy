var
    $ = require('jquery'),
    _= require('underscore'),
    Backbone = require('backbone'),
    Marionette = require('backbone.marionette');

module.exports = ConfirmDeleteView = Marionette.ItemView.extend({
    template: require('../templates/confirmDelete.hbs'),
    events: {
        'click .confirm-delete' : 'confirmDelete',
        'click .cancel-delete' : 'cancelDelete'
    },
    initialize: function(options) {
        if (!_.isUndefined(options)) {
            this.message = !_.isUndefined(options.message) ? RecruiterApp.polyglot.t(options.message) : RecruiterApp.polyglot.t('thisRecordWillBeDeletedConfirm');
        } else {
            this.message = RecruiterApp.polyglot.t('thisRecordWillBeDeletedConfirm');
        }
    },
    onShow: function () {
        var toDelete = !_.isUndefined(this.model) ? this.model.get('toDelete') : '';

        var limitLength = 30;
        if (toDelete.length > limitLength) {
            this.model.set('toDelete', toDelete.substring(0, limitLength) + '...');
            this.render()
        } 

        if (!_.isEmpty(toDelete)) {
            if (toDelete.indexOf('tag') != -1) {
                this.$el.find('.message').text(RecruiterApp.polyglot.t('thisTagWillBeDeletedConfirm'));
            }
        }
    },
    confirmDelete: function() {
        this.trigger('deleteConfirmed');
    },
    cancelDelete() {
        this.trigger('cancelDelete');
    },
    serializeData: function() {
        var data = Marionette.ItemView.prototype.serializeData.apply(this, arguments);
        data.message = this.message;
        return data;
    }
});