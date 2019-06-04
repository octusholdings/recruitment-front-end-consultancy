var Backbone        = require('backbone'),
    moment          = require('moment'),
    Marionette      = require('backbone.marionette');

var age_slider;

module.exports = AgeRangeView = Marionette.ItemView.extend({
    template: require('../templates/ageRange.hbs'),
    events: {
        'click .confirm-range' : 'confirmRange',
        'blur #start' : 'startKey',
        'blur #end' : 'endKey'
    },
    onBeforeRender: function () {
        if (!this.model) {
            this.model = new Backbone.Model({
                startAge: 0,
                endAge: 100
            });
        }
    },
    onShow: function () {
        var self = this;
        var templateString = "#= selectionStart # - #= selectionEnd #";
        this.startInput = this.$('#start');
        this.endInput = this.$('#end');

        this.$("#ageRangeSlider").kendoRangeSlider({
            min: 0,
            max: 100,
            tickPlacement: "none",
            tooltip: {
                template: kendo.template(templateString)
            },
            slide: function (e) {
                self.startInput.val(e.value[0])
                self.endInput.val(e.value[1])
            }
        });

        age_slider = this.$("#ageRangeSlider").getKendoRangeSlider();
        age_slider.wrapper.css('width', '268px')
        setTimeout(function () {
            age_slider.resize()
        }, 400);

        age_slider.values(self.model.get('startAge'), self.model.get('endAge'));
    },

    confirmRange: function() {
        var range = {
            startRange: age_slider.value()[0],
            endRange: age_slider.value()[1]
        }
        this.trigger('ageRangeConfirmed', range);
    },

    startKey: function (e) {
        var startValue = Number(e.currentTarget.value);
        if (startValue < 0) {
            e.currentTarget.value = 0;
            startValue = 0;
        } else if (startValue > 100) {
            e.currentTarget.value = 100;
            startValue = 100;
        }
        if (startValue > Number(this.endInput.val())) {
            e.currentTarget.value = this.endInput.val();
            startValue = this.endInput.val();
        }
        age_slider.value([startValue, this.endInput.val()]);
    },

    endKey: function (e) {
        var endValue = Number(e.currentTarget.value);
        if (endValue < 0) {
            e.currentTarget.value = 0;
            endValue = 0;
        } else if (endValue > 100) {
            e.currentTarget.value = 100;
            endValue = 100;
        } 
        if (endValue < Number(this.startInput.val())) {
            e.currentTarget.value = this.startInput.val();
            endValue = this.startInput.val();
        }
        age_slider.value([this.startInput.val(), endValue]);
    }
});