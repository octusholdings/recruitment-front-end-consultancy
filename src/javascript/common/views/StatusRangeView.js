var Backbone            = require('backbone'),
    moment              = require('moment'),
    _                   = require('underscore'),
    BaseItemView        = require('../../common/views/BaseItemView'),
    BaseCompositeView   = require('../../common/views/BaseCompositeView'),
    Marionette          = require('backbone.marionette');

var StatusRangeItem = {
    template: require('../templates/statusRangeItemView.hbs'),
    itemViewContainer: function () {
        if (this.model.get('group')) {
            return ".rules-list";
        } else {
            return ".input-group"
        }
    },
    itemViewOptions: function () {
        return {
            parentView: this
        }
    },
    tagName: 'li',
    onBeforeRender: function () {
        var selVal = this.model.get('selectedStatus');
        this.model.set('selectedStatus', selVal.replace(/[{\"*}]/g, '')); // remove * and "
    },
    initialize: function () {
        if (!_.isUndefined(this.model.get('rules'))) {
            this.collection = new Backbone.Collection(this.model.get('rules'));
        }

        this.selectedCondition = "AND";
    },
    onAddSubRule: function () {
        var newSubRule = {
            uniqueClass: faker.random.alphaNumeric(7),
            proficiencyOn       : false,
            selectedCondition   : this.selectedCondition,
            selectedStatus    : ''
        };

        var rules = this.model.get('rules');
            rules.push(newSubRule);

        this.model.set('rules', rules);

        this.collection.add(newSubRule)
    },
    onAddSubGroup: function () {
        this.collection.add({
            group: true,
            rules: [],
            uniqueClass: faker.random.alphaNumeric(7),
            selectedStatus: '',
            proficiencyOn       : false,
            selectedCondition   : this.selectedCondition
        })
    },
    onRender: function () {
        if (this.model.get('group') != true) {
            var selLang = this.model.get('selectedStatus');
            var refDataList;
        
            if (selLang == '') {
                this.$el.find('select.select-status').append('<option disabled selected="selected">' + RecruiterApp.polyglot.t('chooseOne') + '</option>')
            } else {
                this.$el.find('select.select-status').append('<option disabled>' + RecruiterApp.polyglot.t('chooseOne') + '</option>')
            }

            // Test the Domain first
            switch (this.options.parentView.type) {
                case 'candidate':
                    refDataList = window.Octus.candidateStatusList;
                    switch (this.options.parentView.field) {
                        case 'religion':
                            refDataList = window.Octus.religionList;
                            break;
                        case 'ownVehicle':
                            refDataList = window.Octus.ownVehicleList;
                            break;
                        case 'candidateCode':
                            refDataList = window.Octus.candidateCodeList;
                            break;
                    }
                    break;
                case 'client':
                    refDataList = window.Octus.clientStatus;
                    break;
                case 'company':
                    refDataList = window.Octus.companyStatusList;
                    break;
                case 'job':
                    refDataList = window.Octus.jobStatus;
                    switch (this.options.parentView.field) {  
                        case 'commission':
                        refDataList = window.Octus.commission;
                        break;
                    }
                    break;

                case 'shortlist':
                    switch (this.options.parentView.field) {
                        case 'candidateStatus':
                            refDataList = window.Octus.candidateStatusList;
                            break
                        case 'workflowStatus':
                            refDataList = window.Octus.workflowStatus;
                            break
                        case 'shortlistStatus':
                            refDataList = window.Octus.jobShortlistStatus;
                            break
                    }
                    break
                default:
                    console.error('this.type is not handled:', this.options.parentView.type, this.options.parentView.field);
                    return false;
                    break;
            }

            refDataList.each((loc) => {
                if (selLang == loc.get('key') || selLang == loc.get('value')) {
                    this.$el.find('select.select-status').append('<option value="' + loc.get('key') + '" selected="selected">' + loc.get('value') + '</option>')
                } else {
                    this.$el.find('select.select-status').append('<option value="' + loc.get('key') + '">' + loc.get('value') + '</option>')
                }
            });

            if (selLang != '' && this.$el.find('select.select-status :selected').val() != selLang) {
                this.$el.find('select.select-status option:nth-child(1)').after('<option value="' + this.camelize(selLang) + '" selected="selected">' + selLang + '</option>');
            }
        }
    },
    events: {
        'click .btn-remove' : 'onRemoveBtn',
    },
    onShow: function () {
        var self = this;
        var uniqueClass = '.' + self.model.get('uniqueClass') + ' ';

        if (!self.model.get('group')) {
            self.$el.find('.select-status').select2({
                dropdownParent: $("#defaultModal"),
                tags:true,
                closeOnSelect: true,
                createTag: function (params) {
                    return {
                      id: params.term,
                      text: params.term,
                      newOption: true
                    }
                }
            }).on('select2:select', function (e) {
                switch (self.options.parentView.type) {
                    case 'shortlist':
                        self.model.set("selectedStatus", e.params.data.text);
                        break;
                    case 'candidate':
                        switch (self.options.parentView.field) {
                            case 'religion':
                            case 'commission':
                            case 'ownVehicle':
                            case 'candidateCode':
                            case 'status':
                                self.model.set("selectedStatus", e.params.data.text);
                                break;
                            default:
                                self.model.set("selectedStatus", e.params.data.id);
                                break;
                        }
                        break;
                    case 'company':
                        self.model.set("selectedStatus", e.params.data.id);
                        break;
                    default:
                        self.model.set("selectedStatus", e.params.data.text);
                        break;
                }
            });
        }

        this.$('.radioGrpCond[value="' + this.model.get('selectedCondition') + '"]').prop('checked', true);
        this.$('.radioGrpCond').parent().removeClass('active');
        this.$('.radioGrpCond[value="' + this.model.get('selectedCondition') + '"]').parent().addClass('active');
    },
    enableRemove: function () {
        this.$('.btn-remove').removeAttr('disabled');
    },
    disableRemove: function () {
        this.$('.btn-remove').attr('disabled','disabled');        
    },
    onRemoveBtn: function () {
        this.model.destroy();
    }
}

module.exports = StatusRangeSubItemView = BaseItemView.extend(StatusRangeItem);

module.exports = StatusRangeItemView = BaseItemView.extend(_.extend({
    itemView: StatusRangeSubItemView
}, StatusRangeItem));

module.exports = StatusRangeView = BaseCompositeView.extend({
    template: require('../templates/statusRange.hbs'),
    itemView: StatusRangeItemView,
    itemViewContainer: ".rules-list",
    events: {
        'click .addrule-btn': 'onAddRule',
        'click .get-rules': 'onGetRules',
        'click .confirm-range': 'confirmQuery',
    },
    itemViewOptions: function () {
        return {
            parentView: this
        }
    },
    onShow: function () {
        this.collection.on('change reset add remove', this.checkRules, this)
        this.checkRules();

        var cond = this.collection.findWhere({selectedCondition: "OR"}) || this.collection.findWhere({selectedCondition: "AND"});
            cond = cond ? cond.get('selectedCondition') : "";

        if (!_.isEmpty(cond)) {
            this.$('input[name="grpCond"]').parent().removeClass('active');

            var inp = this.$('input[name="grpCond"][value="' + cond + '"]');
                inp.attr('checked', 'checked').parent().addClass('active');
        }

        this.$el.find('.btn-expand, .btn-compress').click((e) => {
            this.expandModal(e);          
        });
    },
    checkRules: function () {
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
    onGetRules: function () {
        var self = this;
        var statusQuery = {
            rules: {
                field       : 'status.key', 
                operator    : 'contains'
            },
            human: ''
        }

        var combinedRulesES = ''
        var combinedRulesHuman = ''

        var col = this.collection,
            cond;

        _.each(col.toJSON(), function(rules, i) {

            if (i == 0) {
                cond = "";
            } else {
                cond = self.$('input[name="grpCond"]:checked').val();
            }

            if (rules.selectedStatus != "") {
                var grpRuleES = '("';
                var grpRuleHuman = _.isEmpty(cond) ? rules.selectedStatus : ' ' + cond + ' ' + rules.selectedStatus
                grpRuleES += rules.selectedStatus + '")';
    
                combinedRulesES += _.isEmpty(cond) ? grpRuleES : ' ' +  cond + ' ' + grpRuleES;
                combinedRulesHuman += grpRuleHuman
            }
        });

        statusQuery.rules.value = combinedRulesES
        statusQuery.human = combinedRulesHuman
        
        RecruiterApp.core.vent.trigger('app:DEBUG:log', ['Kendo: PROCESS_AGE_RANGE_VALUE', statusQuery]);

        return statusQuery
    },
    onAddRule: function () {
        this.collection.add({
            selectedStatus: '',
            selectedCondition: 'AND'
        })  
    },
    confirmQuery: function() {
        var rulesObj        = this.onGetRules();
        var rulesTextOnly   = rulesObj.rules.value;

        if (rulesTextOnly == '') {
            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("noStatusSelected"));
        } else {
            this.trigger('statusQueryConfirmed', rulesObj);
        }
    },
    expandModal: function (e) {
        e.preventDefault()
        this.$el.find('.modal-dialog').toggleClass('modal-lg');
        this.$el.find('.btn-expand').toggleClass('hidden');
        this.$el.find('.btn-compress').toggleClass('hidden');
    },
    serializeData: function () {
        var data = Marionette.ItemView.prototype.serializeData.apply(this, arguments);
        data.header= this.options.header;
        return data;
    }
});