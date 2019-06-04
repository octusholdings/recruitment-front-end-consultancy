/**
 * ValidatedModel
 */
var Backbone = require('backbone'),
    Session  = require("../../session/models/Session");

// Global variables
var session = new Session();  

Backbone.Validation.configure({
  labelFormatter: 'label'
});

/**
 * Abstract module to validated models.
 */
module.exports = ValidatedModel = Backbone.Model.extend({
    setupValidation: function(entity) {
        var self = this;
        this.bind('validated', function(isValid, model, errors) {
            if (isValid) {
                self.trigger("model:valid", model, errors);
            } else {
                self.trigger("model:invalid", model, errors);
            }
        });
    },
    listNotEmpty: function (list) {
        if (list.size() == 0) {
            return 'invalid'
        }  
    },
    isEmpty: function(value) {
        return !value || (typeof value === 'string' && value.trim().length == 0);
    },
    getValidationSetup: function(domain) {
        var self = this;  

        // return cached setup
        if (this._validationSetup) {
            return this._validationSetup;
        }

        // Check if domain is set
        if (!domain) {
            console.log("Validate model has no domain setup properly");
            return {};
        }

        // Set up the fields validation 
        var attributes = new Object();   
        var labels = new Object();

        // Get view permissions
        var permissions = session.get('viewPermissionList');

        // validate domain permissions
        if (!permissions[domain]) {
            throw "No permission list found to " + domain;
        }

        var getPermissions = function(element) {
            return {
                "required": element.required
            };
        }

        // iterate each permissions
        $.each(permissions[domain], function(index, permission) {
            if (attributes[permission.fieldName] ) {
                if (attributes[permission.fieldName].required == false && permission.required == true) {
                    attributes[permission.fieldName] = getPermissions(permission);
                }
            } else {
                attributes[permission.fieldName] = getPermissions(permission);
            }
            labels[permission.fieldName] = RecruiterApp.polyglot.t(permission.fieldName);
        });

        // Cache validations
        // It's necessary because Backbone Validation fire multiple times
        // validation attribute
        this._validationSetup = attributes;
        this.labels = labels;
        
        // return validation setup
        return this._validationSetup;
    }

});
