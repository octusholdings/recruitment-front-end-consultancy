var Backbone                = require('backbone'),
    BaseCompositeView       = require('../../common/views/BaseCompositeView'),
    faker                   = require('faker'),
    _                       = require('underscore'),
    Marionette              = require('backbone.marionette');

var natlItem = {
    template: require('../templates/natlRangeItemView.hbs'),
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
        var selVal = this.model.get('selectedNationality');
        this.model.set('selectedNationality', selVal.replace(/[{\"*}]/g, '')); // remove * and "
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
            selectedNationality: '',
            selectedCondition: this.selectedCondition
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
            selectedNationality: '',
            selectedCondition: this.selectedCondition
        })
    },
    onRender: function () {
        if (this.model.get('group') != true) {
            var selNatl = this.model.get('selectedNationality');

            if (selNatl == '') {
                this.$el.find('select.select-nationality').append('<option selected="selected" disabled>' + RecruiterApp.polyglot.t('chooseOne') + '</option>')
            } else {
                this.$el.find('select.select-nationality').append('<option disabled>' + RecruiterApp.polyglot.t('chooseOne') + '</option>')
            }

            window.Octus.nationalityList.each((natl) => {
                if (selNatl == natl.get('key') || selNatl == natl.get('value')) {
                    this.$el.find('select.select-nationality').append('<option value="' + natl.get('key') + '" selected="selected">' + natl.get('value') + '</option>')
                } else {
                    this.$el.find('select.select-nationality').append('<option value="' + natl.get('key') + '">' + natl.get('value') + '</option>')
                }
            });

            if (selNatl != '' && this.$el.find('select.select-nationality :selected').val() != selNatl) {
                this.$el.find('select.select-nationality option:nth-child(1)').after('<option value="' + this.camelize(selNatl) + '" selected="selected">' + selNatl + '</option>');
            }
        }
    },
    enableRemove: function () {
        this.$el.find('.btn-remove').removeAttr('disabled');
    },
    disableRemove: function () {
        this.$el.find('.btn-remove').attr('disabled','disabled');        
    },
    onShow: function () {
        var self = this;
        var uniqueClass = '.' + self.model.get('uniqueClass') + ' ';

        self.$el.find(uniqueClass + '.add-subrule-btn').click(() =>    { self.onAddSubRule();          })
        self.$el.find(uniqueClass + '.add-subgroup-btn').click(() =>   { self.onAddSubGroup();         })
        self.$el.find(uniqueClass + '.btn-remove').click(() =>         { self.onRemoveBtn();           })
        self.$el.find(uniqueClass + '.btn-remove-group').click((e) =>  { self.onRemoveGrpBtn(e);       })

        if (!_.isUndefined(self.collection)) {

            self.selectedCondition = self.collection.pluck("selectedCondition")[0] || 'AND';
            self.$el.find(uniqueClass + '.radioGrpCond').removeProp('checked');
            self.$el.find(uniqueClass + '.radioGrpCond').parent().removeClass('active');
            self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').prop('checked');
            self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').parent().addClass('active');
            self.$el.find(uniqueClass + '.radioGrpCond').change((e) =>     { self.onChangeCondition(e);    })
        } else {
            self.$el.find('.select-nationality').select2({
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
                if (e.params.data.newOption) {
                    self.model.set({
                        selectedNationality: e.params.data.text,
                        plainText: e.params.data.newOption
                    })
                } else {
                    self.model.set("selectedNationality", e.params.data.text);
                    self.model.unset('plainText');
                }
            });
        }

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
    },
    onChangeCondition: function (e) {
        this.selectedCondition = e.currentTarget.value;

        if (!_.isUndefined(this.model.get('rules'))) {

            this.collection.each(function(model, i) {
                model.set("selectedCondition", e.currentTarget.value);
            });

            this.model.set('rules', this.collection.toJSON())
        }
    },
    onRemoveBtn: function () {
        this.model.destroy()
    },
    onRemoveGrpBtn: function () {
        this.model.destroy()
    },
}

module.exports = NatlRangeSubItemView = BaseCompositeView.extend(natlItem)

module.exports = NatlRangeItemView = BaseCompositeView.extend(_.extend({
    itemView: NatlRangeSubItemView,
}, natlItem));

module.exports = NatlRangeView = Marionette.CompositeView.extend({
    template: require('../templates/natlRange.hbs'),
    itemView: NatlRangeItemView,
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

        this.collection.on('change reset add remove', this.checkRules, this)

        self.selectedCondition = self.collection.pluck("selectedCondition")[0] || 'AND';

        self.$el.find(uniqueClass + '.radioGrpCond').removeProp('checked');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().removeClass('active');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').prop('checked');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').parent().addClass('active');
        self.$el.find(uniqueClass + '.radioGrpCond').change((e) =>        { self.onChangeCondition(e);    })

        self.$el.find(uniqueClass + '.addrule-btn').click(() =>           { self.onAddRule();             })
        self.$el.find(uniqueClass + '.addgroup-btn').click(() =>          { self.onAddGroup();            })

        self.$el.find('.btn-expand').click((e) =>           { self.expandModal(e);          })
        self.$el.find('.btn-compress').click((e) =>         { self.contractModal(e);        })
        self.$el.find('.confirm-range').click(() =>         { self.confirmQuery();          })
        self.$el.find('.get-rules').click(() =>             { self.onGetRules();            })

        this.checkRules();
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
            selectedNationality: '',
            selectedCondition: this.selectedCondition,
        });
    },
    onAddGroup: function () {
        this.collection.add({
            group: true,
            rules: [],
            uniqueClass: faker.random.alphaNumeric(7),
            selectedNationality: '',
            selectedCondition: this.selectedCondition,
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
    confirmQuery: function() {
        var rulesObj        = this.onGetRules();
        var rulesTextOnly   = $(rulesObj.rules.value).text();
        // If a query or part of it is empty the whole app would crash under current design. As such we make sure it is not empty.
        var emptyInput      = _.filter(this.$el.find('select.select-nationality.form-control'), (ip) => {
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
            this.trigger('nationalityQueryConfirmed', rulesObj);
        }
    },

    checkRules: function () {
        this.$el.find('.console .read-only.code').html(this.onGetRules().rules.value);
    },

    getRecursiveRules: function (collection, bracketsOpen, bracketsClose) {
        var self = this;

        bracketsOpen    = bracketsOpen == '' ? '' : '<span class="o-bracket">' + bracketsOpen + '</span>';
        bracketsClose   = bracketsClose == '' ? '' : '<span class="c-bracket">' + bracketsClose + '</span>';

        var rulesCombine = bracketsOpen + _.map(collection, (rule, i) => {
        
            var subCond = i == 0 ? "" : '<i>' + rule.selectedCondition + '</i>' + " ";

            if (!_.isEmpty(rule.selectedNationality)) {        
                var extra = rule.plainText ? '<b>*</b>' : '<b>\"</b>';  

                return subCond + extra + '<span class="arg">' + RecruiterApp.polyglot.t(rule.selectedNationality) + '</span>' + extra

            } else if (_.isArray(rule.rules) || !_.isEmpty(rule.rules)) {
                
                return subCond + self.getRecursiveRules(rule.rules, "(", ")").trim();
            }
        }).join(" ") + bracketsClose;

        return rulesCombine;
    },

    onGetRules: function () {
        var self = this;
        var natlQuery = {
            rules: {
                field       : 'nationalityList.fullDescription', 
                operator    : 'contains'
            },
            human: ''
        }

        natlQuery.rules.value = self.getRecursiveRules(self.collection.toJSON(), "", "").trim();
        
        RecruiterApp.core.vent.trigger('app:DEBUG:log', ['Kendo: PROCESS_AGE_RANGE_VALUE', natlQuery]);

        natlQuery.rules.queryBuilder = self.collection.toJSON();

        return natlQuery
    },
});