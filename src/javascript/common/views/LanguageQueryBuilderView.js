var Backbone                = require('backbone'),
    BaseCompositeView       = require('../../common/views/BaseCompositeView'),
    faker                   = require('faker'),
    _                       = require('underscore'),
    Marionette              = require('backbone.marionette');

var LanguageItemView = {
    template: require('../templates/languageQueryBuilderRule.hbs'),
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
        var selVal = this.model.get('selectedLanguage');
        this.model.set('selectedLanguage', selVal.replace(/[{\"*}]/g, '')); // remove * and "
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
            languageProficiency : window.Octus.languageProficiencyList.length - 1,
            proficiencyOn       : false,
            selectedCondition   : this.selectedCondition,
            selectedLanguage    : ''
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
            selectedLanguage: '',
            languageProficiency : '',
            proficiencyOn       : false,
            selectedCondition   : this.selectedCondition
        })
    },
    onRender: function () {
        if (this.model.get('group') != true) {
            var selLang = this.model.get('selectedLanguage');
        
            if (selLang == '') {
                this.$el.find('select.select-language').append('<option disabled selected="selected">' + RecruiterApp.polyglot.t('chooseOne') + '</option>')
            } else {
                this.$el.find('select.select-language').append('<option disabled>' + RecruiterApp.polyglot.t('chooseOne') + '</option>')
            }

            window.Octus.languageList.each((loc) => {
                if (selLang == loc.get('key') || selLang == loc.get('value')) {
                    this.$el.find('select.select-language').append('<option value="' + loc.get('key') + '" selected="selected">' + loc.get('value') + '</option>')
                } else {
                    this.$el.find('select.select-language').append('<option value="' + loc.get('key') + '">' + loc.get('value') + '</option>')
                }
            });

            if (selLang != '' && this.$el.find('select.select-language :selected').val() != selLang) {
                this.$el.find('select.select-language option:nth-child(1)').after('<option value="' + this.camelize(selLang) + '" selected="selected">' + selLang + '</option>');
            }
        }
    },
    onShow: function () {
        var self = this;
        var uniqueClass = '.' + self.model.get('uniqueClass') + ' ';

        self.languageProficiency = _.pluck(window.Octus.languageProficiencyList.toJSON(), 'value');

        if (!self.model.get('group')) {

            self.kendoSlider = self.$el.find('.fluency-range').kendoSlider({
                min: 0, max: _.pluck(window.Octus.languageProficiencyList.toJSON(), 'value').length - 1,
                tickPlacement: 'none',
                showButtons: false,
                slide: function (e) {
                    e.sender.options.tooltip.format = e.value != 0 ? self.languageProficiency[e.value] + ' to ' + self.languageProficiency[0] : self.languageProficiency[e.value];
                    self.onSetProficiency(e.value)
                },
                change: function (e) {
                    e.sender.options.tooltip.format = e.value != 0 ? self.languageProficiency[e.value] + ' to ' + self.languageProficiency[0] : self.languageProficiency[e.value];
                    self.onSetProficiency(e.value)
                }
            }).data("kendoSlider");
            
            if (self.model.has('languageProficiency') && _.isNumber(self.model.get('languageProficiency'))) {
                self.kendoSlider.value(self.model.get('languageProficiency'));
            }

            self.$el.find('.select-language').select2({
                dropdownParent: $("#defaultModal"),
                tags:true,
                createTag: function (params) {
                    return {
                      id: params.term,
                      text: params.term,
                      newOption: true
                    }
                },
                closeOnSelect: true
            }).on('select2:select', function (e) {
                self.model.set("selectedLanguage", e.params.data.text);
            });
        } else {
            self.selectedCondition = self.collection.pluck("selectedCondition")[0] || 'AND';
        }

        self.$el.find(uniqueClass + '.radioGrpCond').removeProp('checked');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().removeClass('active');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').prop('checked');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').parent().addClass('active');

        self.$el.find(uniqueClass + '.add-subrule-btn').click(() =>                  { self.onAddSubRule();          })
        self.$el.find(uniqueClass + '.add-subgroup-btn').click(() =>                 { self.onAddSubGroup();         })
        self.$el.find(uniqueClass + '.btn-remove').click(() =>         { self.onRemoveBtn();           })
        self.$el.find(uniqueClass + '.btn-remove-group').click((e) =>  { self.onRemoveGrpBtn(e);       })
        self.$el.find('.fluency-enable').change((e) =>                 { self.onToggleFluency(e);      })
        self.$el.find(uniqueClass + '.radioGrpCond').change((e) =>     { self.onChangeCondition(e);    })
        self.$el.find(uniqueClass + '.select-language').change((e) =>  { self.onChangeLanguage(e);     })

        if (!_.isUndefined(self.model.get('rules'))) {
            self.collection.on('change reset add remove', function () {
                self.model.set('rules', self.collection.toJSON())
            })
        }

        if (self.model.get('group') != true) {
            self.$el.find('.select2-selection').focus();
        } else {
            self.$el.find('.add-subrule-btn').focus();
        }

        self.onToggleFluency()
    },
    onChangeCondition: function (e) {
        // this.model.set('selectedCondition', this.$el.find('input[name="grpCond"]:checked').val())
        this.selectedCondition = e.currentTarget.value;

        if (!_.isUndefined(this.model.get('rules'))) {

            this.collection.each(function(model, i) {
                model.set("selectedCondition", e.currentTarget.value);
            });

            this.model.set('rules', this.collection.toJSON())
        }
    },
    onChangeLanguage: function () {
        this.model.set('selectedLanguage', this.$el.find('.select-language').val());
    },
    onRemoveBtn: function () {
        this.model.destroy();
    },
    onRemoveGrpBtn: function () {
        this.model.destroy()
    },
    onSetProficiency: function () {
        this.model.set('languageProficiency', this.kendoSlider.value())
    },
    onToggleFluency: function (e) {
        var self = this;
        
        if (!self.model.get('group')) {
            self.kendoSlider.enable(self.$el.find('.fluency-enable').is(":checked"))
            self.model.set('proficiencyOn', self.$el.find('.fluency-enable').is(":checked"))
        }
    }
};

module.exports = LanguageQueryBuilderSubItemView = BaseCompositeView.extend(LanguageItemView);

module.exports = LanguageQueryBuilderItemView = BaseCompositeView.extend(_.extend({
    itemView: LanguageQueryBuilderSubItemView
}, LanguageItemView))

module.exports = LanguageQueryBuilderView = Marionette.CompositeView.extend({
    template: require('../templates/languageQueryBuilder.hbs'),
    itemView: LanguageQueryBuilderItemView,
    itemViewContainer: ".rules-list",
    itemViewOptions: function () {
        return {
            parentView: this
        }
    },
    initialize: function () {
        this.selectedCondition = "AND";
        this.model = new Backbone.Model({
            uniqueClass: faker.random.alphaNumeric(7)
        });
    },
    events: {
        'change .color-coded-checkbox' : 'toggleColor'
    },
    onShow: function () {
        var self = this;
        var uniqueClass = '.' + self.model.get('uniqueClass') + ' ';  

        if (this.collection.length > 1) {
            this.$el.find('.btn-danger').removeProp('disabled');
            this.selectedCondition = this.collection.pluck("selectedCondition")[0] || 'AND';
        }

        self.collection.on('change reset add remove', self.checkRules, self);

        self.$el.find(uniqueClass + '.radioGrpCond').removeProp('checked');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().removeClass('active');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').prop('checked');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').parent().addClass('active');
        self.$el.find(uniqueClass + '.radioGrpCond').change((e) =>        { self.onChangeCondition(e);    })

        self.$el.find('.addrule-btn').click(() =>           { self.onAddRule();             })
        self.$el.find('.addgroup-btn').click(() =>          { self.onAddGroup();            })

        self.$el.find('.btn-expand').click((e) =>           { self.expandModal(e);          })
        self.$el.find('.btn-compress').click((e) =>         { self.contractModal(e);        })
        self.$el.find('.confirm-range').click(() =>         { self.confirmQuery();          })
        self.$el.find('.get-rules').click(() =>             { self.onGetRules();            })

        self.checkRules();
    },
    toggleColor: function () {
        this.$el.find('.console .code').toggleClass('no-color'); 
    },
    onChangeCondition: function (e) {
        this.selectedCondition = e.currentTarget.value;

        this.collection.each(function(model, i) {
            model.set("selectedCondition", e.currentTarget.value);
        });
    },
    onAddRule: function () {
        this.collection.add({
            uniqueClass: faker.random.alphaNumeric(7),
            selectedLanguage    : '',
            languageProficiency : window.Octus.languageProficiencyList.length - 1,
            proficiencyOn       : false,
            selectedCondition   : this.selectedCondition,
        })  
        this.$el.find('.btn-danger').removeProp('disabled');
    },
    onAddGroup: function () {
        this.collection.add({
            group: true,
            rules: [],
            uniqueClass: faker.random.alphaNumeric(7),
            selectedLanguage: '',
            languageProficiency : '',
            proficiencyOn       : false,
            selectedCondition   : this.selectedCondition
        });
    },
    expandModal: function (e) {
        e.preventDefault()
        this.$el.find('.modal-dialog').toggleClass('modal-lg');
        this.$el.find('.btn-expand').toggleClass('hidden');
        this.$el.find('.btn-compress').toggleClass('hidden');
    },
    contractModal: function (e) {
        e.preventDefault()
        this.$el.find('.modal-dialog').toggleClass('modal-lg');
        this.$el.find('.btn-expand').toggleClass('hidden');
        this.$el.find('.btn-compress').toggleClass('hidden');
    },

    getRecursiveRules: function (collection, bracketsOpen, bracketsClose) {
        var self = this;

        bracketsOpen    = bracketsOpen == '' ? '' : '<span class="o-bracket">' + bracketsOpen + '</span>';
        bracketsClose   = bracketsClose == '' ? '' : '<span class="c-bracket">' + bracketsClose + '</span>';

        var rulesCombine = bracketsOpen + _.map(collection, (rule, i) => {
            
            if (!_.isEmpty(rule.selectedLanguage) || !_.isEmpty(rule.rules)) {

                var subCond = i == 0 ? "" : '<i>' + rule.selectedCondition + '</i>' + " ";

                if (rule.proficiencyOn == true) {
                    
                    return subCond + '<span class="o-bracket">(</span>' 
                        + _.map(new Array(rule.languageProficiency + 1), (prof, i) => {
                            return '<b>"</b><span class="arg">' + RecruiterApp.polyglot.t(rule.selectedLanguage) 
                                + '-' 
                                + window.Octus.languageProficiencyList.at(i).get('value')
                                + '</span><b>"</b>';
                        }).reverse().join('<i> OR </i>') + '<span class="c-bracket">)</span>';

                } else if (_.isArray(rule.rules) && !_.isEmpty(rule.rules)) {
                    
                    return subCond + self.getRecursiveRules(rule.rules, "(", ")").trim();
                
                } else if (rule.proficiencyOn == false) {

                    return subCond + '<b>*</b><span class="arg">' + RecruiterApp.polyglot.t(rule.selectedLanguage) + '</span><b>*</b>';
                }
            }
        }).join(" ") + bracketsClose;

        return rulesCombine;
    },

    onGetRules: function () {
        var self = this;

        var languageQuery = {
            rules: {
                field       : 'languageList.fullDescription', 
                operator    : 'eq',
                queryBuilder: ""
            }
        }

        languageQuery.rules.value = self.getRecursiveRules(self.collection.toJSON(), "", "").trim();

        RecruiterApp.core.vent.trigger('app:DEBUG:log', ['Kendo: PROCESS_RANGE_VALUE', languageQuery]);

        languageQuery.rules.queryBuilder = self.collection.toJSON();

        return languageQuery
    },

    checkRules: function () {
        this.$el.find('.console .read-only.code').html(this.onGetRules().rules.value);
    },

    confirmQuery: function() {
        var rulesObj        = this.onGetRules();
        var rulesTextOnly   = $(rulesObj.rules.value).text();
        // If a query or part of it is empty the whole app would crash under current design. As such we make sure it is not empty.
        var emptyInput      = _.filter(this.$el.find('select.select-language.form-control'), (ip) => {
            if (ip.value == RecruiterApp.polyglot.t('chooseOne')) {
                $(ip).parents('.input-group').addClass('has-error');
            } else {
                $(ip).parents('.input-group').removeClass('has-error');
            }
            return ip.value == RecruiterApp.polyglot.t('chooseOne');
        });

        var isNotValidQuery = emptyInput.length > 0 || (rulesTextOnly.length == 0) || rulesTextOnly.replace(/\s+/g, '').includes('()');;

        rulesObj.rules.value = rulesTextOnly;

        if (isNotValidQuery) {
            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("incompleteQuery"));
        } else {
            this.trigger('languageQueryConfirmed', rulesObj);
        }
    }
});