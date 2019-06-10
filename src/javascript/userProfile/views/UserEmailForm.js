var Marionette = require('backbone.marionette'),
    stickit = require('backbone.stickit'),
    _signature;
module.exports = UserEmailForm = BaseItemView.extend({
    template: require('../templates/userEmailForm.hbs'),
    events: {
        'click .save-email': 'saveEmail',
        'keyup .address'   : 'addressChange'
    },
    bindings: {
        '.address': 'address',
        '.emailSignature': 'emailSignature'
    },
    onRender () {
        this.stickit();
    },
    onShow () {
        var self = this;
        self.initVal = this.model.toJSON()
        self.$el.find(".emailSignature").kendoEditor({
            resizable: {
                content: true,
                toolbar: true
            },
            tools: [
                {
                    name: "fontSize",
                    items: [
                        { text: "Small",  value: "8px"  },
                        { text: "Large",  value: "16px"  },
                        { text: "X-Large",value: "32px"  }
                    ]
                },
                "foreColor",
                "bold",
                "italic",
                "underline",
                "justifyLeft",
                "justifyCenter",
                "justifyRight",
                "createLink",
                {
                    name: "horizontalRule",
                    tooltip: "Horizontal rule",
                    exec: function(e) {
                        var editor = $(this).data("kendoEditor");
                        editor.exec("inserthtml", { value: "<hr />" });
                    }
                },
                "viewHtml",
                "insertImage",
                "cleanFormatting"
            ],
            keyup: function (e) {
                _signature = this.value();
                self.signatureChange(e);
            },
            change: function (e) {
                _signature = this.value();
                self.signatureChange(e);
            },
            // Handles selected tools from Kendo Editor (eg. horizontal rule, alignment)
            execute: function (e) {
                _signature = this.value();

                setTimeout(function() {self.signatureChange(e);}, 500);
            },
            paste: function (e) {
                _signature = e.html;
                self.signatureChange(e);
            }
        });
    },
    addressChange () {
        var addressVal = this.$el.find('.address').val();
        var emailVal   = this.$el.find('.emailSignature').data('kendoEditor').value();
        var isValid    = false;

        if (!_.isEmpty(addressVal)) {

            if (addressVal != this.initVal.address || emailVal != this.initVal.emailSignature) {

                if (this.validateEmail(addressVal)) {
                    this.showError(false);
                    isValid = true;

                } else {
                    this.showError(true, 'Enter a valid email address (eg. abc@company.com)');
                    isValid = false;
                }

            } else {
                this.showError(false);
                isValid = false;
            }

        } else {
            this.showError(true, RecruiterApp.polyglot.t('emailAddress') + ' is required');
            isValid = false;
        }

        this.enableUpdateButton(isValid);

    },
    signatureChange (e) {
        var isValid       = true,
            addressVal    = this.$el.find('.address').val(),
            initSignature = this.initVal.emailSignature,
            event, htmlText;

        if (e) {
            event = e.type ? e.type : e.name;
        }

        switch (event) {
            case 'input' :
                htmlText = $(e.currentTarget.innerHTML).text().trim();
                initSignature = $(initSignature).text().trim();
                break;

            default:
                htmlText = this.$el.find('.emailSignature').data('kendoEditor').value();
                break;
        }

        if (!_.isEmpty(htmlText)) {

            if (htmlText != initSignature) {

                if (!_.isEmpty(addressVal)) {
                    
                    if (this.validateEmail(addressVal)) {
                        this.showError(false);
                        isValid = true;

                    } else {
                        this.showError(true, 'Enter a valid email address (eg. abc@company.com)');
                        isValid = false;
                    }

                } else {
                    this.showError(true, RecruiterApp.polyglot.t('emailAddress') + ' is required');
                    isValid = false 
                }

            } else {
                this.showError(false);
                isValid = false;
            }

            this.enableUpdateButton(isValid);

        } else {
            this.addressChange();
        }

    },
    validateEmail (email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },
    enableUpdateButton (isValid) {
        if (isValid) {
            _signature = this.$el.find(".emailSignature").data('kendoEditor').value();
            this.$el.find('.save-email').removeProp('disabled');
            this.model.set('emailSignature', _signature);

        } else {
            this.$el.find('.save-email').prop('disabled', true);
        }
    },
    showError (show, errorMsg) {
        if (show) {
            this.$el.find('.EmailAddress').addClass('has-error');
            this.$el.find('.EmailAddress .help-block').text(errorMsg)

        } else {
            this.$el.find('.EmailAddress').removeClass('has-error');
            this.$el.find('.EmailAddress .help-block').text('');
        }
    },
    saveEmail (e) {
        e.preventDefault();
        var isValid = this.model.isValid(true);
        if (isValid) {
            if (this.model.get('emailSignature')) {
                this.model.set('emailSignature', this.replaceAllHtmlTags(this.model.get('emailSignature'), 'p', 'div'));
            }
            this.model.save(null, { 
                success: function() {
                    RecruiterApp.core.vent.trigger('app:message:info', 'Email settings updated');

                    Backbone.history.loadUrl();
                }, 
                error: function(xhr, message) {

                    RecruiterApp.core.vent.trigger('app:message:error', `Error updating email settings: ${message}`);
                    console.error("Error updating email settings", xhr, message);
                }
            });
        } else {
            RecruiterApp.core.vent.trigger('app:message:error', 'Email address required');
        }
    },
});