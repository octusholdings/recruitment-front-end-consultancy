var Backbone = require('backbone'),
    BaseDocument  = require('./BaseDocument');
module.exports = GenerateBrandedDocument = Backbone.Model.extend({
    url() {
        return RecruiterApp.config.API_ROOT + '/document/' + 
        		this.get('documentId') + 
        		'/template/' + 
        		this.get('templateId') +
        		'/' +
        		this.get('type');
    }
});