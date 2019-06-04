/**
 * Created by Stanley on 29/9/15.
 */
var Marionette = require('backbone.marionette'),
    VersionView = require('./VersionView'),
    stickit = require('backbone.stickit');

module.exports = UserBarView = Marionette.ItemView.extend({
    template: require('../templates/userBar.hbs'),
    bindings: {
        //'.name' : 'name'
    },
    events: {
    	'click .about-octus'        : 'aboutOctus',
        'click .full-screen-search' : 'openFullScreenSearch'
    },
    onRender: function() {
        this.stickit();
    },
    aboutOctus: function () {
    	// Todo: Popup to show version
        var view = new VersionView({
            modules: JSON.parse(localStorage.cacheConfig)
        });
    	RecruiterApp.core.vent.trigger('app:modal:show',view);
    },
    openFullScreenSearch: function() {
        this.trigger('openFullScreenSearch');
    }
});