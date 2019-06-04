var Backbone = require('backbone'),
_ = require('underscore');

module.exports = Configuration = Backbone.Model.extend({
    urlRoot: function() {
        return RecruiterApp.config.API_ROOT + '/configuration';
    },
    initialize: function () {
    	var self = this;
    	self.fetch({
    		success: function (_conf) {
    			self.conf = _conf.toJSON()
    		}
    	})
    },
    hasConfiguration: function (key) {
        var conf        = _.findWhere(this.conf, {key: key});
        var hasKey      = !_.isUndefined(conf);
    	
    	if (!hasKey) {
    		return false;
    	} else {
    		return conf.value === 'true';
    	}
    },
    getConfiguration: function (key) {
        var conf        = _.findWhere(this.conf, {key: key});
        var hasKey      = !_.isUndefined(conf);

        if (!hasKey) {
            return false;
        } else {
            return conf.value;
        }
    }
});
