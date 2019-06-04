var Backbone                = require('backbone'),
    BaseCompositeView       = require('../../common/views/BaseCompositeView'),
    faker                   = require('faker'),
    _                       = require('underscore'),
    stickit                 = require('backbone.stickit'),
    Marionette              = require('backbone.marionette');

var WorkingHoursRangeItemView = {
    template: require('../templates/workingHoursRangeItemView.hbs'),
    itemViewContainer () {
        return ".input-group"
    },
    itemViewOptions () {
        return { parentView: this }
    },
    tagName: 'li',
    events: {
        'focus input.timepicker'           : 'toggleTimePicker',
        'blur input.timepicker'            : 'toggleTimePicker',
        'keydown input.timepicker'         : 'inputTimePicker',
    },
    bindings: {
        '.weekdaysFrom'     : {
            observe: 'weekdaysFrom',
            onSet: 'to24Hr',
            onGet: 'to12Hr'
        },
        '.weekdaysTo'       : {
            observe: 'weekdaysTo',
            onSet: 'to24Hr',
            onGet: 'to12Hr'
        },
        '.saturdayFrom'     : {
            observe: 'saturdayFrom',
            onSet: 'to24Hr',
            onGet: 'to12Hr'
        },
        '.saturdayTo'       : {
            observe: 'saturdayTo',
            onSet: 'to24Hr',
            onGet: 'to12Hr'
        },
        'select.form-control.saturday-working-condition' : {
            observe: 'saturdayWorkingCondition',
            selectOptions: {
                collection: 'window.Octus.saturdayWork',
                labelPath: 'value',
                valuePath: 'value',
                defaultOption: { 
                    label () { return RecruiterApp.polyglot.t('chooseOne')}, 
                    value: null
                }
            }
        }
    },
    to24Hr (val) {
        if (!val) return "";
        let isPM    = val.indexOf('PM') > -1;
        let numStr  = val.replace(/ AM| PM/g, '');
        let hr      = parseInt(numStr.slice(0, numStr.indexOf(':')));
        let min     = numStr.slice(numStr.indexOf(':'));
        if (isPM && hr != 12) {
            hr += 12;
        } else if (!isPM && hr == 12) {
            hr = 0;
        }
        hr = hr.toString();
        if (hr.length == 1) hr = '0' + hr;
        return hr + min;
    },
    to12Hr (val) {
        if (!val) return "";
        let hr      = parseInt(val.slice(0, val.indexOf(':')));
        let min     = val.slice(val.indexOf(':'));
        let isPM    = hr >= 12;
        let ampm    = isPM ? ' PM' : ' AM'; 
        if (hr > 12) {
            hr -= 12;
        } else if (hr == 0) {
            hr = 12;
        }
        hr = hr.toString();
        return hr + min + ampm;
    },
    onRender () {
        this.stickit();
    },
    onShow () {
        var domain = this.options.parentView.options.domain;

        this.$('input.timepicker').kendoTimePicker();
        this.$('.btn-remove').click(() => this.onRemoveBtn());
        this.$('.select2-selection').focus();
        this.model.on('change', () => this.updateRules());

    },
    toggleTimePicker (e) {
        switch (e.type) {
            case "focusin":
                this.$(e.currentTarget).data('kendoTimePicker').open();
                break;
            case "focusout":
                this.$(e.currentTarget).data('kendoTimePicker').close();
                this.validateTimePicker(this.$(e.currentTarget));
                break;
        }
    },
    inputTimePicker (e) {
        if (e.keyCode == 8 || e.keyCode == 46) return true;
        else return false;
    },
    validateTimePicker (el) {
        if (!new RegExp('(1[0-2]|0?[1-9]):([0-5][0-9]) ([AaPp][Mm])').test(el.val())) {
            el.val("");
        }
    },
    updateRules (e) {
        console.log(this.model.toJSON());
        this.options.parentView.onGetRules();
    },
    enableRemove () {
        this.$('.btn-remove').removeAttr('disabled');
    },
    disableRemove () {
        this.$('.btn-remove').attr('disabled','disabled');        
    },
    onRemoveBtn () {
        this.model.destroy()
    }
}

module.exports = WorkingHoursRangeSubItemView = BaseCompositeView.extend(WorkingHoursRangeItemView);

module.exports = WorkingHoursRangeItemView = BaseCompositeView.extend(_.extend({
    itemView: WorkingHoursRangeSubItemView
}, WorkingHoursRangeItemView))

module.exports = WorkingHoursRangeView = Marionette.CompositeView.extend({
    template: require('../templates/workingHoursRange.hbs'),
    itemView: WorkingHoursRangeItemView,
    itemViewContainer: ".rules-list",
    itemViewOptions () {
        return { parentView: this }
    },
    initialize () {
        this.selectedCondition = "AND";
        this.model = new Backbone.Model({
            uniqueClass: faker.random.alphaNumeric(7)
        });
    },
    onShow () {
        var self = this;
        var uniqueClass = `.${self.model.get('uniqueClass')} `;

        self.selectedCondition = self.collection.pluck("selectedCondition")[0] || 'AND';

        self.$el.find(uniqueClass + '.radioGrpCond').removeProp('checked');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().removeClass('active');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').prop('checked');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').parent().addClass('active');
        self.$el.find(uniqueClass + '.radioGrpCond').change((e) =>        { self.onChangeCondition(e);    })

        self.$el.find(uniqueClass + '.addrule-btn').click(() =>           { self.onAddRule();             })

        self.$el.find('.confirm-range').click(() =>                       { self.confirmQuery();          })
        self.$el.find('.get-rules').click(() =>                           { self.onGetRules();            })

        this.collection.on('change reset add remove', this.checkRules())
    },
    checkRules () {
        var self = this;
        if (this.collection.length > 1) {
            this.collection.each(function(model) {
                var selView = self.children.findByModel(model);
                    selView.enableRemove();
            });
        } else {
            var selView = this.children.findByModel(this.collection.at(0));
                selView.disableRemove();
        }
    },
    onChangeCondition (e) {
        this.selectedCondition = e.currentTarget.value;

        this.collection.each(function(model, i) {
            model.set("selectedCondition", e.currentTarget.value);
        });
    },
    onAddRule () {
        this.collection.add({
            uniqueClass: faker.random.alphaNumeric(7),
            selectedCondition: this.selectedCondition,
        });
    },
    confirmQuery () {
        var rulesObj = this.onGetRules();

        this.$('.working-hours-wrapper').removeClass('has-error');

        var emptyQueries   = _.filter(rulesObj.rules.filters, (fil) => {
            return fil.filters.length == 0;
        })

        if (emptyQueries.length > 0) {
            var emptyGroup = _.filter(this.$('.working-hours-wrapper'), (ipg) => {
                var filledInputs = _.filter($(ipg).find('select'), (ip) => { return !!ip.value; })
                return (filledInputs.length == 0);
            })

            this.$el.find(emptyGroup).addClass('has-error');

            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('youHaveEmptyQueries'));
        } else {
            this.trigger('workingHoursConfirmed', rulesObj);
        }
    },
    onGetRules () {
        var self = this;
        var workingTimeQuery = {
            rules: {
                field       : 'workingTime',
                operator    : 'nested',
                filters     : [],
                queryBuilder: self.collection.toJSON()
            }
        };

        var filters = self.collection.toJSON();
        
        filters = _.map(filters, function(query) {
            
            query = _.pick(query, 'weekdaysFrom', 'weekdaysTo', 'saturdayFrom', 'saturdayTo', 'saturdayWorkingCondition');

            var weekdaysQuery  = { logic: 'AND', operator: 'nested', filters: [] };
            var saturdayQuery  = { logic: 'AND', operator: 'nested', filters: [] };
            var wkdayRangeVal  = {};
            var satdayRangeVal = {};
            var satdayCond = {};

            if (query.weekdaysFrom) {
                wkdayRangeVal.from = query.weekdaysFrom;
            }
            if (query.weekdaysTo) {
                wkdayRangeVal.to = query.weekdaysTo;
            }

            if (query.weekdaysFrom) {
                weekdaysQuery.filters.push({
                    field       : 'workingTime.weekdaysFrom',
                    logic       : 'AND',
                    operator    : 'range',
                    rangeValue  : wkdayRangeVal,
                })
            }

            if (query.weekdaysTo) {
                weekdaysQuery.filters.push({
                    field       : 'workingTime.weekdaysTo',
                    logic       : 'AND',
                    operator    : 'range',
                    rangeValue  : wkdayRangeVal,
                })   
            }

            if (query.saturdayFrom) {
                satdayRangeVal.from = query.saturdayFrom;
            }
            if (query.saturdayTo) {
                satdayRangeVal.to = query.saturdayTo;
            }

            if (query.saturdayFrom) {
                saturdayQuery.filters.push({
                    field       : 'workingTime.saturdayFrom',
                    logic       : 'AND',
                    operator    : 'range',
                    rangeValue  : satdayRangeVal,
                })   
            }

            if (query.saturdayTo) {
                saturdayQuery.filters.push({
                    field       : 'workingTime.saturdayTo',
                    operator    : 'range',
                    logic       : 'AND',
                    rangeValue  : satdayRangeVal,
                })   
            }

            if (query.saturdayWorkingCondition) {
                satdayCond = {
                    field       : 'workingTime.saturdayWork.value',
                    operator    : 'contains',
                    value       : query.saturdayWorkingCondition,
                };
            }

            return { 
                operator    : 'nested',
                logic       : self.selectedCondition,
                filters     : _.filter([weekdaysQuery, saturdayQuery, satdayCond], query => !_.isEmpty(query.filters) || !_.isEmpty(query.value))
            }
        });

        workingTimeQuery.rules.filters = filters;

        RecruiterApp.core.vent.trigger('app:DEBUG:log', ['Kendo: PROCESS_EMPLOYMENT_HISTORY_RANGE_VALUE', workingTimeQuery]);

        return workingTimeQuery;
    }
});