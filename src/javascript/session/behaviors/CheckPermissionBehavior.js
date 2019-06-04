var  Marionette = require('backbone.marionette'),
    // _ = require("lodash"),
    PermissionHelper = require("../models/PermissionHelper"),
    Session = require("../models/Session");
module.exports = CheckPermissionBehavior = Marionette.Behavior.extend({

    initialize: function(options) {
        this.view = options.view;
    },

    onShow: function() {
        var session = new Session();
        if (session.getAuthToken() != undefined) {
            var permissionHelper = new PermissionHelper();
            permissionHelper.processView(this.view);
        }
    }
});