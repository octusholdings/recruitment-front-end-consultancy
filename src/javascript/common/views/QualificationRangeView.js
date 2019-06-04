var Backbone                = require('backbone'),
    BaseCompositeView       = require('../../common/views/BaseCompositeView'),
    faker                   = require('faker'),
    _                       = require('underscore'),
    Marionette              = require('backbone.marionette');

var EducationItemView = {
    template: require('../templates/qualificationRangeItemView.hbs'),
    itemViewOptions: function () {
        return {
            parentView: this
        }
    },
    
    tagName: 'li',
    
    initialize: function () {
        this.selectedCondition = "AND";
    },
    
    events: {
        'click .btn-remove' : 'onRemoveBtn',
    },

    onShow () {

        switch (this.model.get('rangeType')) {
            case 'education' :

                this.initSelect2({
                    queryInputEl:   this.$el.find('select.select-degreeCourse'), 
                    placeholder:    RecruiterApp.polyglot.t("selectDegreeCourse"),
                    field:          'educationList.degreeCourse', 
                    refDataType:    'degreeCourse'
                });

                this.initSelect2({
                    queryInputEl:   this.$el.find('select.select-institution'), 
                    placeholder:    RecruiterApp.polyglot.t("selectInstitution"),
                    field:          'educationList.institution', 
                    refDataType:    'institution'
                });

                this.initSelect2({
                    queryInputEl:   this.$el.find('select.select-major'), 
                    placeholder:    RecruiterApp.polyglot.t("selectMajor"),
                    field:          'educationList.fieldOfStudy', 
                    refDataType:    'fieldOfStudy'
                });

                this.initSelect2({
                    queryInputEl:   this.$el.find('select.select-minor'), 
                    placeholder:    RecruiterApp.polyglot.t("selectMinor"),
                    field:          'educationList.minor', 
                    refDataType:    'minor'
                });

                this.initSelect2({
                    queryInputEl:   this.$el.find('select.select-grade'), 
                    placeholder:    RecruiterApp.polyglot.t("selectGrade"),
                    field:          'educationList.grade', 
                    refDataType:    'grade'
                });

                break;
            case 'qualification' :

                this.initSelect2({
                    queryInputEl:   this.$el.find('select.select-courseName'), 
                    placeholder:    RecruiterApp.polyglot.t("selectCourseName"),
                    field:          'qualificationList.degreeCourse', 
                    refDataType:    'degreeCourse'
                });

                this.initSelect2({
                    queryInputEl:   this.$el.find('select.select-grade'), 
                    placeholder:    RecruiterApp.polyglot.t("selectGrade"),
                    field:          'qualificationList.grade', 
                    refDataType:    'grade'
                });

                break;
            default :
                console.error('RangeType is undefined');
                break;
        }
        
    },

    initSelect2 (opt) {

        var queryInputEl    = opt.queryInputEl,
            indexDomain     = this.model.get('domain'),
            field           = opt.field,
            placeholderVal  = opt.placeholder,
            refDataType     = opt.refDataType,
            query           = {},
            fieldVal = this.model.get(field);

        if (fieldVal) {
            queryInputEl.append('<option value="' + fieldVal + '" selected="selected">' + fieldVal + '</option>');
        }

        queryInputEl.select2({
            dataType: 'json',
            placeholder: placeholderVal,
            delay: 150,
            tags: true,
            allowClear: true,
            closeOnSelect: true,
            ajax: {
                url: RecruiterApp.config.API_ROOT + '/filterChoice/list/' + indexDomain + '/' + field + '/10/adding/reference/data/' + refDataType,
                data: function (params) { 
                    return { 
                        criteria: params.term,
                        page: params.page || 1
                    };
                },
                processResults: function (data, params) {
                    params.page = params.page || 1;

                    data = _.map(data, function (dat) {
                        return { id: dat.id || dat.key, text: dat.value, types: dat.types }
                    });

                    var res = {
                        results: data,
                        pagination: {
                            more: false // disable pagination
                        }
                    };

                    return res;
                }
            },
            dropdownParent: $("#defaultModal"),
            escapeMarkup: function (markup) { return markup; },
            minimumInputLength: 1,
            templateResult: this.formatReturn,
            templateSelection: this.formatReturnSelection
        }).on('select2:select select2:unselecting', (e) => {
            if (e.params.data && e.params.data.text) {
                query[field] = e.params.data.text;
                this.model.set(query);
            } else if (e.params.args.data.text) {
                this.model.unset(field);
            }
        });
    },

    formatReturn (dat) {
        var text = (dat.types) ? "<div class='select2-result-repository clearfix'>" +
            "<div class='select2-result-repository__meta'>" +
            "<div class='select2-result-repository__title'>" + dat.text + " [" + RecruiterApp.polyglot.t(dat.types[0].toLowerCase()) + "]</div></div>" :
            "<div class='select2-result-repository clearfix'>" +
            "<div class='select2-result-repository__meta'>" +
            "<div class='select2-result-repository__title'>" + dat.text + "</div></div>"

        return markup = text;
    },
    formatReturnSelection (dat) {
        return (dat.types ? dat.text + ' [' + RecruiterApp.polyglot.t(dat.types[0].toLowerCase()) + ']' : dat.text);
    },
    enableRemove () {
        this.$('.btn-remove').removeAttr('disabled');
    },
    disableRemove () {
        this.$('.btn-remove').attr('disabled','disabled');        
    },
    onRemoveBtn () {
        this.model.destroy();
    },
};

module.exports = EducationRangeSubItemView = BaseCompositeView.extend(EducationItemView);

module.exports = EducationRangeItemView = BaseCompositeView.extend(_.extend({
    itemView: EducationRangeSubItemView
}, EducationItemView));

module.exports = EducationRangeView = BaseCompositeView.extend({
    template: require('../templates/qualificationRange.hbs'),
    itemView: EducationRangeItemView,
    itemViewContainer: ".rules-list",
    
    itemViewOptions: function () {
        return {
            parentView: this
        }
    },
    
    initialize: function () {
        this.selectedCondition = 'AND';
    },

    events: {
        'click .addrule-btn': 'onAddRule',
        'click .get-rules': 'onGetRules',
        'click .confirm-range': 'confirmQuery',
        'change .radioGrpCond': 'onChangeCondition'
    },

    onShow: function () {
        this.collection.on('change reset add remove', this.checkRules, this)
        this.checkRules();

        var cond = this.collection.findWhere({selectedCondition: 'OR'}) || this.collection.findWhere({selectedCondition: 'AND'});
            cond = cond ? cond.get('selectedCondition') : '';

        if (!_.isEmpty(cond)) {
            this.$('input[name="grpCond"]').parent().removeClass('active');

            var inp = this.$('input[name="grpCond"][value="' + cond + '"]');
                inp.attr('checked', 'checked').parent().addClass('active');
        }
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
            model.set('selectedCondition', e.currentTarget.value);
        });
    },

    onGetRules () {
        var logicVal    = this.selectedCondition || this.collection.first().get('selectedCondition');
        var acadOrProf  = this.model.get('rangeType') == 'education' ? 'ACADEMIC' : 'PROFESSIONAL';

        var qualificationQuery = {
                rules: {
                    field       : this.model.get('rangeType') + 'List', 
                    operator    : 'nested',
                    filters     : [],
                    queryBuilder: this.collection.toJSON()
                },
            },
            col = this.collection.toJSON();

        qualificationQuery.rules.filters = _.map(col, (rules) => {

            var fields = _.difference(_.keys(rules), ['selectedCondition', 'domain', 'rangeType', 'uniqueClass']);

            return {
                logic: logicVal,
                operator: 'nested',
                filters: _.union(_.map(fields, (fieldVal) => {
                    return { 
                        field: fieldVal, 
                        value: rules[fieldVal],
                        operator: 'contains' 
                    };
                }), [{
                    field: this.model.get('rangeType') + 'List.type',
                    value: acadOrProf,
                    operator: 'eq' 
                }])
            }
        });

        RecruiterApp.core.vent.trigger('app:DEBUG:log', ['Kendo: PROCESS_RANGE_VALUE', qualificationQuery]);

        return qualificationQuery;
    },
    onAddRule: function () {
        this.collection.add({
            selectedCondition: 'AND',
            domain: this.collection.first().get('domain'),
            rangeType: this.model.get('rangeType')
        })  
    },
    confirmQuery: function() {
        var rulesObj        = this.onGetRules();

        this.$el.find('.qualification-wrapper').removeClass('has-error');

        var emptyQueries   = _.filter(rulesObj.rules.filters, (fil) => {
            return fil.filters.length == 1;
        })

        if (emptyQueries.length > 0) {
            var emptyGroup = _.filter(this.$el.find('.qualification-wrapper'), (ipg) => {
                var filledInputs = _.filter($(ipg).find('select'), (ip) => { return !!ip.value; })
                return (filledInputs.length == 0);
            })

            this.$el.find(emptyGroup).addClass('has-error');

            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('youHaveEmptyQueries'));
        } else {
            this.trigger('qualificationQueryConfirmed', rulesObj);
        }
    }
});