/*
 * Person
 */
var Backbone = require('backbone');
module.exports = Person = Backbone.Model.extend({
    url: function () {
        return RecruiterApp.config.API_ROOT + '/person/' + this.id;
    }
});