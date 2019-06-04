var Marionette                 = require('backbone.marionette'),
    Backbone                   = require('backbone');
    
module.exports = EmailConfigSetup = Backbone.Model.extend({
    url: function() { return RecruiterApp.config.API_ROOT + '/user/current'; }
});
