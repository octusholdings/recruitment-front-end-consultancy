/**
 * CompositeView
 */
var Marionette = require('backbone.marionette'),
    Backbone = require('backbone');

module.exports = CompositeView = Marionette.CompositeView.extend({
	onRender: function() {
		this.setRequired();
	},
	setRequired: function (name) {
        var self = this;

        var parent = this.options.parent;
        if (!parent) return;

        if (!name && this.options.attribute) {
        	name = this.options.attribute;
        }

        if (!name) return;

        var validation = _.isFunction(parent.validation) ? parent.validation() : parent.validation;
        var required = _.isFunction(validation[name]) ? validation[name]() : validation[name];
        
        if (required && required.required) {

            // Show required 
            switch (name) {
                case 'locationList': 
                    this.$el.find('.locationsTitle').contents().first().after('<span class="requiredInput">*</span>');
                    break;

                case 'educationList':
                    if ($('#education-list').html().indexOf('requiredInput') == -1)
                        $('#education-list').find('h4.title').contents().first().after('<span class="requiredInput">*</span>');

                    break;

                case 'qualificationList':
                    if ($('#qualification-list').html().indexOf('requiredInput') == -1)
                        $('#qualification-list').find('h4.title').contents().first().after('<span class="requiredInput">*</span>');
                    
                    break;

                default:
                    this.$el.find('h4.title').contents().first().after('<span class="requiredInput">*</span>');
                    break;
            }

            // Setup form validation
            var validation = _.isFunction(parent.validation) ? parent.validation() : parent.validation;
            validation[name] = {
                required: true,
                fn: function() {
                    if (!parent.get(name) || parent.get(name).length == 0) {
                        self.markError();
                        var msg = RecruiterApp.polyglot.t(name) + " is required";
                        console.error(msg);                       
                        return msg; 
                    } 
                    self.cleanError();           
                }              
            };
        }
    },
    markError: function () {
        this.$el.find('h4.title span.help-block').html(RecruiterApp.polyglot.t("notEmptyList"));
		this.$el.find('h4.title').addClass('has-error');   
        this.$el.find('.form-group').first().addClass('has-error');
        this.$el.find('.form-group input, .form-group button').focus();
    },
    cleanError: function() {
        this.$el.find('h4.title span.help-block').html("");
		this.$el.find('h4.title').removeClass('has-error');
        this.$el.find('.form-group').first().removeClass('has-error');
    },
    validate: function () {
        var parent = this.options.parent;
        if (!parent) return;

        if (this.options.attribute) {
            name = this.options.attribute;
        }
        if (!name) return;

        var deferred = $.Deferred();

        var validation = _.isFunction(parent.validation) ? parent.validation() : parent.validation;
        var required = _.isFunction(validation[name]) ? validation[name] : validation[name];

        if (required.required && (!parent.get(name) || parent.get(name).length == 0)) {
            deferred.reject();
            this.$el.find('h4.title span.help-block').html(RecruiterApp.polyglot.t("notEmptyList"));
            this.$el.find('h4.title').addClass('has-error');           
        } else {
            deferred.resolve();
            this.$el.find('h4.title span.help-block').html("");
            this.$el.find('h4.title').removeClass('has-error');      
        }

        return deferred.promise();
    }
});