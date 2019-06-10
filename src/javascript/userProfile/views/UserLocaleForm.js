/*
 * UserLocaleFormView
 */
var Marionette = require('backbone.marionette'),
    BaseItemView = require('../../common/views/BaseItemView'),
    stickit = require('backbone.stickit');

module.exports = UserLocaleFormView = BaseItemView.extend({
    template: require('../templates/userLocaleForm.hbs'),
    events: {
        'click .button-save-locale': 'updateLocale'
    },
    bindings: {
        'select#language': {
            selectOptions: {
                collection: function () {
                    return [
                        {id: 'EN', key: 'English'},
                        {id: 'ZH_HK', key: 'Chinese - Hong Kong'},
                        {id: 'JP', key: 'Japanese'}
                        //, {id: 'RU', key: 'Russian'}
                    ];
                },
                defaultOption: {
                    label: function () {return RecruiterApp.polyglot.t('chooseOne');},
                    value: null
                },
                labelPath: 'key',
                valuePath: 'id'
            },
            observe: 'language',
            onGet: function(value) {
                console.log("lang onGet " + value);
                return value;
            }
        }
    },
    initialize: function() {
        //RecruiterApp.core.vent.on('user:locale:updated', this.render);
    },
    onRender: function () {
        this.stickit();
    },
    updateLocale: function (e) {
        e.preventDefault();
        console.log('lang model',this.model);
        if (this.model.isValid(true)) {
            RecruiterApp.core.vent.trigger('userProfile:locale:save', this.model);
        }
        else {
            console.log("Model is not valid");
            RecruiterApp.core.vent.trigger('app:message:error', "Please select a language");
        }
    }
});