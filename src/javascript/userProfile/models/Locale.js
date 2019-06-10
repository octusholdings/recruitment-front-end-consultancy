/*
 * Locale
 */
var Backbone = require('backbone'),
    ValidatedModel = require('../../common/models/ValidatedModel');

module.exports = Locale  = ValidatedModel.extend({
    initialize: function() {
        this.setupValidation();
    },
    url: function () {
        return RecruiterApp.config.API_ROOT + '/user/locale/';
    },
    parse: function (response) {
        return response;
    },
    validation: {
        language: {
            required: true
        }
    }
});