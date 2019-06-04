var Backbone                = require('backbone'),
    BaseCompositeView       = require('../../common/views/BaseCompositeView'),
    faker                   = require('faker'),
    _                       = require('underscore'),
    Marionette              = require('backbone.marionette');

var EmploymentHistoryItemView = {
    template: require('../templates/employmentHistoryRangeItemView.hbs'),
    itemViewContainer () {
        return ".input-group"
    },
    itemViewOptions () {
        return { parentView: this }
    },
    tagName: 'li',
    events: {
        'select2:select   .select-company' : 'updateRules',
        'select2:select   .select-title'   : 'updateRules',
        'select2:unselect .select-company' : 'updateRules',
        'select2:unselect .select-title'   : 'updateRules'
    },
    onBeforeRender () {
        var selComp  = this.model.get('selectedCompany'),
            selTitle = this.model.get('selectedTitle');

        if (selComp)   this.model.set('selectedCompany', selComp.replace(/[{\"*}]/g, '')); // remove * and "
        if (selTitle)  this.model.set('selectedTitle', selTitle.replace(/[{\"*}]/g, '')); // remove * and "
    },
    onShow () {
        var self   = this,
            domain = this.options.parentView.options.domain;

        this.$('.btn-remove').click(() => { self.onRemoveBtn(); })

        self.initSelect2({
            selector: self.$('.select-company'),
            placeholder: RecruiterApp.polyglot.t('selectEmployer'),
            domain: domain,
            criteria: 'companyName',
            field: 'selectedCompany'
        });

        self.initSelect2({
            selector: self.$('.select-title'),
            placeholder: RecruiterApp.polyglot.t('selectTitle'),
            domain: domain,
            criteria: 'title',
            field: 'selectedTitle'
        });

        self.$('.select2-selection').focus();
        self.updateRules();

    },
    initSelect2 (opt) {
        var self = this; 

        opt.selector.select2({
            dropdownParent: $("#defaultModal"), // This line is very important. The field will not show correctly without this.
            ajax: {
                //http://localhost:8080/server/filterChoice/list/candidate/jobHistoryList.companyName/10?criteria=
                url: `${RecruiterApp.config.API_ROOT}/filterChoice/list/${opt.domain}/jobHistoryList.${opt.criteria}/10`,
                dataType: 'json',
                delay: 150,
                data: function (params) {
                    return { criteria: _.escape(params.term) }
                },
                processResults: function (data, params) {
                    // parse the results into the format expected by Select2
                    // since we are using custom formatting functions we do not need to
                    // alter the remote JSON data, except to indicate that infinite
                    // scrolling can be used
                    params.page = params.page || 1;

                    // ID IS SUPER IMPORTANT FOR SELECT2
                    // This is so that user can be able to select an option
                    // No ID means user can only see the options but cannot select
                    data = _.map(data, function(item) { return { id: item.value, text: item.value } });

                    return { results: data, pagination: {more: false}};
                },
                cache: true
            },
            placeholder: opt.placeholder,
            tags: true,
            allowClear: true,
            escapeMarkup: function (markup) { return markup; },
            minimumInputLength: 1,
            templateResult: self.formatReturn,
            templateSelection: self.formatReturnSelection,
            closeOnSelect: true

        });

        // Workaround to fix intermittent issue with custom tagging
        // BUG FIXED - Select2 component not selecting custom tags. Happens very randomly but often.
        opt.selector.on('select2:close', function(e) {
            var $me = $(this);
            var $tag = $me.find('option[data-select2-tag]');

            //We only want to select this tag if its the only tag there
            if ($tag && $tag.length && $me.find('option').length === 1) {
                $me.val($tag.attr('value'));
                $me.trigger('change');
            }
        });

        if (!_.isEmpty(this.model.get(opt.field))) {
            opt.selector.append(`<option value="${this.model.get(opt.field)}" selected="selected">${this.model.get(opt.field)}</option>`);
            opt.selector.val(this.model.get(opt.field)).trigger('change');
        }

    },
    formatReturn (dat) {
        if (dat.loading) { return dat.text; }

        var text = `<div class='select2-result-repository clearfix'>
            <div class='select2-result-repository__meta'>
            <div class='select2-result-repository__title'>${dat.text}</div></div>`

        return markup = text;
    },
    formatReturnSelection (dat) {
        return dat.text;
    },
    updateRules (e) {
        var self    = this;

        setTimeout(() => {
            companyName = self.$('.select-company').val(),
            title       = self.$('.select-title').val();

            self.model.set('selectedCompany', companyName);
            self.model.set('selectedTitle', title);     
        }, 200)
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

module.exports = EmploymentHistoryRangeSubItemView = BaseCompositeView.extend(EmploymentHistoryItemView);

module.exports = EmploymentHistoryRangeItemView = BaseCompositeView.extend(_.extend({
    itemView: EmploymentHistoryRangeSubItemView
}, EmploymentHistoryItemView))

module.exports = EmploymentHistoryRangeView = Marionette.CompositeView.extend({
    template: require('../templates/employmentHistoryRange.hbs'),
    itemView: EmploymentHistoryRangeItemView,
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

        this.collection.on('change reset add remove', this.checkRules, this)
        self.checkRules();
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

        this.$('.employment-history-wrapper').removeClass('has-error');

        var emptyQueries   = _.filter(rulesObj.rules.filters, (fil) => {
            return fil.filters.length == 0;
        })

        if (emptyQueries.length > 0) {
            var emptyGroup = _.filter(this.$('.employment-history-wrapper'), (ipg) => {
                var filledInputs = _.filter($(ipg).find('select'), (ip) => { return !!ip.value; })
                return (filledInputs.length == 0);
            })

            this.$el.find(emptyGroup).addClass('has-error');

            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('youHaveEmptyQueries'));
        } else {
            this.trigger('employmentHistoryRangeConfirmed', rulesObj);
        }
    },
    getValue (val) {
        var self = this,
            selectedCondition;

        var value = _.map(val, (filter) => {
            if (!selectedCondition) selectedCondition = filter.logic;

            var companyName = _.findWhere(filter.filters, {field: 'jobHistoryList.companyName'}),
                title       = _.findWhere(filter.filters, {field: 'jobHistoryList.title'});

                companyName = companyName || filter.selectedCompany;
                title       = title       || filter.selectedTitle;
                query       = [];

            if (!_.isUndefined(companyName)) query.push(`${RecruiterApp.polyglot.t('employer')}: ${companyName.value}`)
            if (!_.isUndefined(title))       query.push(`${RecruiterApp.polyglot.t('title')}: ${title.value.replace(/\*/g, '')}`)

            return `(${query.join(' AND ')})`;

        }).join(` ${selectedCondition} `);

        return value;
    },
    onGetRules () {
        var self = this;
        var empHisQuery = {};
        
        empHisQuery = {
            rules: {
                field       : 'jobHistoryList',
                operator    : 'nested',
                filters     : [],
                queryBuilder: self.collection.toJSON()
            }
        };

        var filters = self.collection.toJSON();
        
        filters = _.map(filters, function(query) {
            var subQuery = [];

            // Build query for Company field
            if (query.selectedCompany) {
                selectedCompany = !_.isUndefined(query.selectedCompany) ? query.selectedCompany.trim() : ''
                subQuery.push({
                    operator    : 'contains',
                    value       : selectedCompany,
                    field       : 'jobHistoryList.companyName'
                })
            }

            // Build query for Title field
            if (query.selectedTitle) {
                selectedTitle = !_.isUndefined(query.selectedTitle) ? query.selectedTitle.trim() : ''
                subQuery.push({
                    operator    : 'contains',
                    value       : !_.isEmpty(selectedTitle) ? '*' + selectedTitle + '*' : '' ,
                    field       : 'jobHistoryList.title',
                })
            }

            // Return finalised Elasticsearch query 
            return { 
                operator    : 'nested',
                logic       : self.selectedCondition,
                filters     : subQuery
            }
        });

        empHisQuery.rules.filters = filters;
        console.log(JSON.stringify(empHisQuery));

        RecruiterApp.core.vent.trigger('app:DEBUG:log', ['Kendo: PROCESS_EMPLOYMENT_HISTORY_RANGE_VALUE', empHisQuery]);

        return empHisQuery;
    }
});