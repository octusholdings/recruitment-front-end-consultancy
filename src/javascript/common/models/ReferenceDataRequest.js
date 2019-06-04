var $ = require('jquery'),
    Backbone = require('backbone'),
    ReferenceData = require('./ReferenceData');

module.exports = ReferenceData = Backbone.Model.extend({
        url: function() {
            return RecruiterApp.config.API_ROOT +  '/refData/request';
        }
});