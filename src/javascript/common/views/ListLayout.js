var Marionette = require('backbone.marionette');

module.exports = ListLayout = Marionette.Layout.extend({
    onRender: function() {
        this.showRequired();
    },
	showRequired: function (name) {
        var parent = this.options.parent;
        if (!parent) return;

        if (this.options.attribute) {
            name = this.options.attribute;
        }
        if (!name) return;

        var validation = _.isFunction(parent.validation) ? parent.validation() : parent.validation;
        var required = _.isFunction(validation[name]) ? validation[name]() : validation[name];

        if (required && required.required) {
            this.$el.find('h4.title').contents().first().after('<span class="requiredInput">*</span>');       
        }
    },
    validate: function (name) {
        var parent = this.options.parent;
        if (!parent) return;

        if (this.options.attribute) {
            name = this.options.attribute;
        }
        if (!name) return;

        var deferred = $.Deferred();

        var validation = _.isFunction(parent.validation) ? parent.validation() : parent.validation;
        var required = _.isFunction(validation[name]) ? validation[name] : validation[name];

        if (required && required.required && (!parent.get(name) || parent.get(name).length == 0)) {
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