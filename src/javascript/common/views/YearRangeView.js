var Backbone        = require('backbone'),
    moment          = require('moment'),
    Marionette      = require('backbone.marionette');

var year_slider;

module.exports = YearRangeView = Marionette.ItemView.extend({
    template: require('../templates/yearRange.hbs'),
    events: {
        'click .confirm-range' : 'confirmRange',
        'keyup #start' : 'startKey',
        'blur #start' : 'startKey',
        'keyup #end' : 'endKey',
        'blur #end' : 'endKey'
    },
    onBeforeRender: function () {
        if (!this.model) {
            this.model = new Backbone.Model({
                startYear: 0,
                endYear: 100
            })  
        }
    },
    onShow: function () {
        var self = this;
        var templateString = "#= selectionStart # - #= selectionEnd #";
        this.startInput = this.$('#start');
        this.endInput = this.$('#end');

        self.$el.find("#yearRangeSlider").kendoRangeSlider({
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

        year_slider = self.$el.find("#yearRangeSlider").getKendoRangeSlider();
        year_slider.wrapper.css('width', '268px')
        setTimeout(function () {
            year_slider.resize()
        }, 400)

        year_slider.values(self.model.get('startYear'), self.model.get('endYear'))
    },

    confirmRange: function() {
        var range = {
            startRange: year_slider.value()[0],
            endRange: year_slider.value()[1]
        }        
        this.trigger('yearsRangeConfirmed', range);
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
        year_slider.value([startValue, this.endInput.val()]);
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
        year_slider.value([this.startInput.val(), endValue]);
    }
});