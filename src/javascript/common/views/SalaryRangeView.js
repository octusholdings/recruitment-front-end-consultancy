var Backbone        = require('backbone'),
    moment          = require('moment'),
    Marionette      = require('backbone.marionette'),
    numeral         = require('numeral');
    stickit         = require('backbone.stickit');

var age_slider,
    min = 1000,
    max = 4000;

module.exports = SalaryRangeView = Marionette.ItemView.extend({
    template: require('../templates/salaryRange.hbs'),
    events: {
        'click .confirm-range'  : 'confirmRange',
        'blur #start'           : 'startKey',
        'blur #end'             : 'endKey'
    },
    bindings: {
        'select.currencySelect': {
            observe: 'currency',
            selectOptions: {
                collection: 'window.Octus.currencyList',
                defaultOption: {label: function () {return RecruiterApp.polyglot.t('chooseOne');}, value: null},
                //labelPath: 'value',
                valuePath: 'key'
            }
        },
    },
    unformat(value) {
        return numeral._.stringToNumber(value);
    },
    onBeforeRender: function () {
        var self = this;

        if (!self.model) {
            self.model = new Backbone.Model({
                startSalary: numeral(min).format('0,0'),
                endSalary: numeral(max).format('0,0')
            })  
        } 
    },
    onRender: function () {
        this.stickit()
    },
    getSalaryRange: function () {
        var self = this;

        return {
            currency    : self.$el.find('.currencySelect').val(),
            startRange  : this.unformat($('#start').val()),
            endRange    : this.unformat($('#end').val()),
        }
    },
    confirmRange: function() {
        this.trigger('salaryRangeConfirmed', this.getSalaryRange());
    },
    formatMoney: function(value) {
        return numeral(Number(value)).format('0,0');
    },
    startKey: function (e) {
        var self        = this;
        var startVal    = this.unformat($(e.currentTarget).val())
        var endVal      = this.unformat(self.$el.find('#end').val())

        if (startVal > endVal && endVal != '') {
            $(e.currentTarget).val(self.formatMoney(endVal))
        } else {
            $(e.currentTarget).val(self.formatMoney(startVal))
        }
    },

    endKey: function (e) {
        var self        = this;
        var endVal      = this.unformat($(e.currentTarget).val())
        var startVal    = this.unformat(self.$el.find('#start').val())
        
        if (endVal < startVal && startVal != '') {
            $(e.currentTarget).val(self.formatMoney(startVal))
        } else {
            $(e.currentTarget).val(self.formatMoney(endVal))
        }
    }
});