/*
 * CandidateFormHeaderView
 */
var Marionette = require('backbone.marionette'),
    BaseItemView = require('./BaseItemView'),
    stickit = require('backbone.stickit');

module.exports = CandidateCommunicationsView = BaseItemView.extend({
    bindings: {
        '.email'                    : 'email', 
        '.address'                  : 'address', 
        '.form-control.linkedIn'    : 'linkedIn', 
        '.form-control.googlePlus'  : 'googlePlus', 
        '.form-control.facebook'    : 'facebook', 
        '.form-control.xing'        : 'xing', 
        '.form-control.skype'       : 'skype',
        '.form-control.twitter'     : 'twitter',
        '.form-control.youtube'     : 'youtube',
        '.website'                  : 'website'
    },
    onRender: function() {
        var self = this;

        this.stickit();
        
        // Handle required fields
        $.each(['linkedIn', 'googlePlus', 'facebook', 'xing', 'skype', 'twitter', 'youtube'], function(index, item) {
            self.setRequired(item);
        });
    },
    setRequired: function(item) {
        var self = this;
        
        // In case the item is required...
        if (this.isRequired(item)) {

            // Show visual sign
            this.$el.find('input.' + item).each(function(index, input) {
                $(input).parents('.form-group').find('label').contents().first().after('<span class="requiredInput">*</span>');
            }); 

            // Setup form validation
            var validation = _.isFunction(this.model.validation) ? this.model.validation() : this.model.validation;
            validation[item] = { 
                fn: function() {
                    if (self.isEmpty(item)) {
                        self.markError(item);
                        var msg = RecruiterApp.polyglot.t(item) + " is required";
                        console.error(msg);    
                        return msg; 
                    } 
                    self.cleanError(item);           
                }
            };
        }

    },
    isRequired: function(name) {
        var model = this.model;
        if (!model) throw "Model is undefined";
        if (!name) throw "Name is undefined";

        var validation = _.isFunction(model.validation) ? model.validation() : model.validation;
        var required = _.isFunction(validation[name]) ? validation[name]() : validation[name];

        return required && required.required;
    },
    isEmpty: function(selector) {
        var val = this.$el.find('input.' + selector).val();
        return val !== undefined && val.length == 0;
    },
    markError: function (selector) {
        this.$el.find('input.' + selector).parents('.form-group').find('span.help-block').html(RecruiterApp.polyglot.t(selector) + " is required");
        this.$el.find('input.' + selector).parents('.form-group').addClass('has-error');   
    },
    focus: function(selector) {
        this.$el.find('input.' + selector).focus();
    },
    cleanError: function(selector) {
        this.$el.find('input.' + selector).parents('.form-group').find('span.help-block').html("");
        this.$el.find('input.' + selector).parents('.form-group').removeClass('has-error');
    }
});






