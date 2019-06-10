/*
 * NylasConfig
 */
var Backbone = require('backbone');

module.exports = NylasConfig = Backbone.Model.extend({
    url: function () {
        return RecruiterApp.config.API_ROOT + '/nylas/config/type/' + this.type + '/email/' + this.email + '/';
    }
});