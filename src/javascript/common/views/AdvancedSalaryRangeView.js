var Backbone                = require('backbone'),
    BaseCompositeView       = require('../../common/views/BaseCompositeView'),
    faker                   = require('faker'),
    _                       = require('underscore'),
    Marionette              = require('backbone.marionette'),
    stickit                 = require('backbone.stickit');

var AdvancedSalaryItemView = {
    template: require('../templates/advancedSalaryRangeItemView.hbs'),
    
    tagName: 'li',
    
    events: {
        'click .btn-remove' : 'onRemoveBtn',
    },

    bindings: {
        '.select-currency': {
            observe: 'currency',
            selectOptions: {
                collection: 'window.Octus.currencyList',
                defaultOption: {label: function () {return RecruiterApp.polyglot.t('chooseOne');}, value: null},
                labelPath: 'value',
                valuePath: 'key'
            }
        },

        '.select-period': {
            observe: 'period',
            selectOptions: {
                collection: 'window.Octus.salaryPeriod',
                defaultOption: {label: function () {return RecruiterApp.polyglot.t('chooseOne');}, value: null},
                labelPath: 'value',
                valuePath: 'key'
            }
        },
        '.base-salary-from' : 'base.from',
        '.base-salary-to'   : 'base.to',
        '.bonus-salary-from': 'bonus.from',
        '.bonus-salary-to'  : 'bonus.to',
        '.allowance-salary' : 'benefit',
        '.total-salary-from': 'total.from',
        '.total-salary-to'  : 'total.to',
        '.number-of-intervals-from' : 'numberOfIntervals.from',
        '.number-of-intervals-to' : 'numberOfIntervals.to',        
    },
    
    initialize() {
        this.selectedCondition = "AND";
    },

    onShow() {
        this.stickit();

        this.$('.select-period').select2({
            placeholder: RecruiterApp.polyglot.t('period'),
            dropdownParent: $("#defaultModal"),
            allowClear: true,
            closeOnSelect: true
        });

        this.$('.select-currency').select2({
            placeholder: RecruiterApp.polyglot.t('currency'),
            dropdownParent: $("#defaultModal"),
            allowClear: true,
            closeOnSelect: true
        });
    },

    enableRemove() {
        this.$('.btn-remove').removeAttr('disabled');
    },
    disableRemove () {
        this.$('.btn-remove').attr('disabled','disabled');        
    },
    onRemoveBtn () {
        this.model.destroy();
    },
};

module.exports = AdvancedSalaryRangeSubItemView = BaseCompositeView.extend(AdvancedSalaryItemView);

module.exports = AdvancedSalaryRangeItemView = BaseCompositeView.extend(_.extend({
    itemView: AdvancedSalaryRangeSubItemView
}, AdvancedSalaryItemView));

module.exports = AdvancedSalaryRangeView = BaseCompositeView.extend({
    template: require('../templates/advancedSalaryRange.hbs'),
    itemView: AdvancedSalaryRangeItemView,
    itemViewContainer: ".rules-list",

    events: {
        'click .addrule-btn': 'onAddRule',
        'click .get-rules': 'onGetRules',
        'click .confirm-range': 'confirmQuery',
        'change .radioGrpCond': 'onChangeCondition'
    },
    
    itemViewOptions() {
        return {
            parentView: this
        }
    },
    
    initialize() {
        this.selectedCondition = "AND";
    },

    onShow() {
        this.collection.on('change reset add remove', this.checkRules, this)
        this.checkRules();

        var cond = this.collection.findWhere({selectedCondition: "OR"}) || this.collection.findWhere({selectedCondition: "AND"});
            cond = cond ? cond.get('selectedCondition') : "";

        if (!_.isEmpty(cond)) {
            this.$('input[name="grpCond"]').parent().removeClass('active');

            var inp = this.$('input[name="grpCond"][value="' + cond + '"]');
                inp.attr('checked', 'checked').parent().addClass('active');

            this.selectedCondition = cond;
        }
    },

    checkRules() {
        if (this.collection.length > 1) {
            this.collection.each(model => {
                var selView = this.children.findByModel(model);
                selView.enableRemove();
            });
        } else {
            var selView = this.children.findByModel(this.collection.at(0));
            selView.disableRemove();
        }
    },

    onChangeCondition (e) {
        this.selectedCondition = e.currentTarget.value;

        this.collection.each(model => {
            model.set("selectedCondition", e.currentTarget.value);
        });
    },

    onGetRules() {
        var logicVal = this.selectedCondition || this.collection.first().get('selectedCondition');
        var salaryType = this.model.get('rangeType');

        let salaryQuery = {
                rules: {
                    field       : salaryType, 
                    operator    : 'nested',
                    filters     : [],
                    queryBuilder: this.collection.toJSON()
                },
            };

        salaryQuery.rules.filters = this.collection.toJSON().map(rules => {
            const fields = Object.keys(rules).filter(item => !['selectedCondition', 'domain', 'uniqueClass'].includes(item));
            let filters = [
                {
                    operator: 'contains',
                    value: null,
                    field: `${salaryType}.period`
                },
                {
                    operator: 'contains',
                    value: null,
                    field: `${salaryType}.currency.symbol`
                },
                {
                    rangeValue: {
                      to: null,
                      from: null
                    },
                    operator: 'range',
                    field: `${salaryType}.base`
                },
                {
                    operator: 'contains',
                    value: null,
                    field: `${salaryType}.benefit`
                },
                {
                    rangeValue: {
                      to: null,
                      from: null
                    },
                    operator: 'range',
                    field: `${salaryType}.numberOfIntervals`
                },
                {
                    rangeValue: {
                        to: null,
                        from: null
                    },
                    operator: 'range',
                    field: `${salaryType}.bonus`
                },
                {
                    rangeValue: {
                        to: null,
                        from: null
                    },
                    operator: 'range',
                    field: `${salaryType}.total`
                }
            ]


            fields.forEach(field => {
                switch(field) {
                    case 'period': 
                        filters.find(item => item.field.includes('period')).value = rules[field];
                        break;

                    case 'currency': 
                        filters.find(item => item.field.includes('currency.symbol')).value = rules[field];
                        break;

                    case 'base.from':
                        filters.find(item => item.field.includes('base')).rangeValue.from = rules[field];
                        break;
                    case 'base.to':
                        filters.find(item => item.field.includes('base')).rangeValue.to = rules[field];
                        break;

                    case 'numberOfIntervals.from':
                        filters.find(item => item.field.includes('numberOfIntervals')).rangeValue.from = rules[field];
                        break;
                    case 'numberOfIntervals.to':
                        filters.find(item => item.field.includes('numberOfIntervals')).rangeValue.to = rules[field];
                        break;

                    case 'benefit': 
                        filters.find(item => item.field.includes('benefit')).value = rules[field];
                        break;

                    case 'bonus.from':
                        filters.find(item => item.field.includes('bonus')).rangeValue.from = rules[field];
                        break;
                    case 'bonus.to':
                        filters.find(item => item.field.includes('bonus')).rangeValue.to = rules[field];
                        break;

                    case 'total.from':
                        filters.find(item => item.field.includes('total')).rangeValue.from = rules[field];
                        break;
                    case 'total.to':
                        filters.find(item => item.field.includes('total')).rangeValue.to = rules[field];
                        break;

                    default: break;
                }
            });

            /**
             * Clean-up the filters array of null ones. 
             * And if there is no value at all kicks it out for good
             */
            filters = filters.filter(item => {
                if (item.operator == 'range') {
                    if (!item.rangeValue.from)  { delete item.rangeValue.from; }
                    if (!item.rangeValue.to)    { delete item.rangeValue.to; }
                }
                if (item.operator == 'contains') {
                    if (!item.value)            { delete item.value; }
                }
                if ((item.operator == 'range' && !item.rangeValue.from && !item.rangeValue.to) 
                    || (item.operator == 'contains' && !item.value)) { 
                    return false; 
                }
                return true;
            });


            return {
                logic: logicVal,
                operator: 'nested',
                filters: filters
            };
        });

        RecruiterApp.core.vent.trigger('app:DEBUG:log', ['Kendo: PROCESS_RANGE_VALUE', salaryQuery]);
        console.log(salaryQuery);
        return salaryQuery;
    },
    onAddRule() {
        this.collection.add({
            selectedCondition: 'AND',
            domain: this.collection.first().get('domain')
        })  
    },
    confirmQuery() {
        var rulesObj        = this.onGetRules();

        var emptyQueries   = rulesObj.rules.filters.filter(fil => fil.filters.length == 0);

        if (emptyQueries.length > 0) {
            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("youHaveEmptyQueries"));
        } else {
            this.trigger('advancedSalaryQueryConfirmed', rulesObj);
        }
    }
});