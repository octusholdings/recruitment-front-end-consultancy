var Backbone        = require('backbone'),
    moment          = require('moment'),
    Marionette      = require('backbone.marionette');

var start_cal, end_cal;

module.exports = CalendarRangeView = Marionette.ItemView.extend({
    template: require('../templates/calendarRange.hbs'),
    events: {
        'click .confirm-range'     : 'confirmRange',
        'change #dateDefaultRange' : 'setDefaultRange'
    },
    onBeforeRender: function () {
        var self = this;

        if (!self.model) {
            self.model = new Backbone.Model({
                startDate: moment().format(window.Octus.DATE_FORMAT),
                endDate: moment().format(window.Octus.DATE_FORMAT)
            })  
        }
    },
    onShow: function () {
        var self = this;

        start_cal = self.$el.find("#start").kendoDatePicker({
            format: "{0:dd/MM/yyyy}",
            change: self.startChange,
            close: function (e) {
                var el = $(this.element);
                setTimeout(function () { el.blur() }, 200);
            }
        }).data("kendoDatePicker");

        end_cal = self.$el.find("#end").kendoDatePicker({
            format: "{0:dd/MM/yyyy}",
            change: self.endChange,
            close: function (e) {
                var el = $(this.element);
                setTimeout(function () { el.blur() }, 200);
            }
        }).data("kendoDatePicker");

        // start_cal.max(end_cal.value());
        // end_cal.min(start_cal.value());

        self.$el.find('input[data-role="datepicker"]')
            .off('focus')
            .on('focus',function (e) {
                var obj = $(this).data('kendoDatePicker');
                if (!_.isNull(obj) && !_.isUndefined(obj)) $(this).prop('readonly', true);
                if (typeof(obj.options.opened) == 'undefined' || !obj.options.opened) obj.open()
            })

        if (self.options.rangeType) {
            var rangeType = self.options.rangeType;

            switch (rangeType) {
                case 'created':
                case 'updated':
                case 'jobCreateddate':
                    self.$el.find('.select-default-range').removeClass('hidden');
                    self.$el.find('.text-default-range').removeClass('hidden');
                    break;

                default:
                    self.$el.find('.select-default-range').addClass('hidden');
                    self.$el.find('.text-default-range').addClass('hidden');
                    break;
            }
        }
    },

    confirmRange: function() {
        var range = {
            startRange: start_cal.value(),
            endRange: end_cal.value()
        };
        this.trigger('calRangeConfirmed', range);
    },

    startChange: function () {
        var startDate = start_cal.value(),
            endDate = end_cal.value();

        if (startDate) {
            startDate = new Date(startDate);
            startDate.setDate(startDate.getDate());
            
            if (startDate > endDate) {
                end_cal.value(startDate);
            }

            $('#dateDefaultRange').val('').change();

        } else if (endDate) {
            start_cal.max(new Date(endDate));
            $('#dateDefaultRange').val('').change();

        } else {
            endDate = new Date();
            start_cal.max(endDate);
            end_cal.min(endDate);
        }

    },

    endChange: function () {
        var endDate = end_cal.value(),
            startDate = start_cal.value();

        if (endDate) {
            endDate = new Date(endDate);
            endDate.setDate(endDate.getDate());
            
            if (startDate > endDate) {
                start_cal.value(endDate);
            }

            $('#dateDefaultRange').val('').change();

        } else if (startDate) {
            end_cal.min(new Date(startDate));
            $('#dateDefaultRange').val('');

        } else {
            endDate = new Date();
            start_cal.max(endDate);
            end_cal.min(endDate);
        }
    },
    setDefaultRange: function (e) {
        var oldEndDate = end_cal.value(),
            oldStartDdate = start_cal.value(),
            newEndDate   = moment().format(window.Octus.DATE_FORMAT),
            newStartDate,
            range     = e.currentTarget.value;

        switch (range) {
            case 'last24Hours': 
                newStartDate = moment().subtract(1, 'd').format(window.Octus.DATE_FORMAT);
                break;

            case 'last7Days': 
                newStartDate = moment().subtract(7, 'd').format(window.Octus.DATE_FORMAT);
                break;

            case 'last30Days': 
                newStartDate = moment().subtract(30, 'd').format(window.Octus.DATE_FORMAT);
                break; 

            default:
                newStartDate = oldStartDdate;
                newEndDate = oldEndDate;
        }
                
        start_cal.value(newStartDate);
        end_cal.value(newEndDate);
    }
});