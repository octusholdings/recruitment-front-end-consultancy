var Backbone                = require('backbone'),
    BaseCompositeView       = require('../../common/views/BaseCompositeView'),
    faker                   = require('faker'),
    _                       = require('underscore'),
    Marionette              = require('backbone.marionette'),
    Bloodhound              = require('bloodhound'),
    Typeahead               = require('corejs-typeahead'),
    Session                 = require('../../session/models/Session'),
    queryController;

var LocationItemView = {
    template: require('../templates/locationRangeItemView.hbs'),
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
        var selVal = this.model.get('selectedLocation');
        this.model.set('selectedLocation', selVal.replace(/[{\"*}]/g, '')); // remove * and "
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
            selectedLocation: '',
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
            selectedLocation: '',
            selectedCondition: this.selectedCondition
        })
    },
    onRender: function () {
        if (this.model.get('group') != true) {
            var selLoc = this.model.get('selectedLocation');

            window.Octus.locationList.each((loc) => {
                if (selLoc == loc.get('key') || selLoc == loc.get('value')) {
                    this.$el.find('input.select-location').val(loc.get('value'));
                } else {
                    this.$el.find('input.select-location').val(selLoc);
                }
            });

            // if (selLoc == '') {
            //     this.$el.find('select.select-location').append('<option selected="selected" disabled>' + RecruiterApp.polyglot.t('chooseOne') + '</option>')
            // } else {
            //     this.$el.find('select.select-location').append('<option disabled>' + RecruiterApp.polyglot.t('chooseOne') + '</option>')
            // }

            // window.Octus.locationList.each((loc) => {
            //     if (selLoc == loc.get('key') || selLoc == loc.get('value')) {
            //         this.$el.find('select.select-location').append('<option value="' + loc.get('key') + '" selected="selected">' + loc.get('value') + '</option>')
            //     } else {
            //         this.$el.find('select.select-location').append('<option value="' + loc.get('key') + '">' + loc.get('value') + '</option>')
            //     }
            // })

            // if (selLoc != '' && this.$el.find('select.select-location :selected').val() != selLoc) {
            //     this.$el.find('select.select-location option:nth-child(1)').after('<option value="' + this.camelize(selLoc) + '" selected="selected">' + selLoc + '</option>');
            // }
        }
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
            var queryInput = self.$el.find('.select-location');

            switch (self.options.model.get('locationType')) {
                case 'seekingLocations':
                    queryController = new Bloodhound({
                        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        limit: 10,
                        remote: {
                            url: function() { 
                                return RecruiterApp.config.API_ROOT + '/filterChoice/list/candidate/seekingLocations.name/10/adding/reference/data/seekingLocations?criteria=%QUERY'
                            } (),
                            wildcard: '%QUERY',
                            ajax: {
                                beforeSend: function (jqXhr, settings) {
                                    settings.data = $.param({criteria: queryInput.val()});
                                    jqXhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
                                }
                            },
                            filter: function (searchResponse) {
                                return $.map(searchResponse, function (searchResult) {
                                    return { value: searchResult.value, id: searchResult.key }
                                });
                            }
                        }
                    });

                    break;

                case 'locations':
                case 'country':
                    var countries = _.map(window.Octus.locationList.toJSON(), function (item) {
                        return { value: item.value }
                    });

                    queryController = new Bloodhound({
                        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        local: countries
                    });

                    break;
            }

            queryController.initialize();

            self.typeahead(queryInput, queryController, function (obj, selection) {

                self.model.set('selectedLocation', selection.value);
                self.model.set('typeaheadselected', true);
                self.model.unset('plainText');

                self.$el.find('.select-location').blur();
                
            }, function (e) {
                if (!self.model.get('typeaheadselected') && !self.model.get('group')) {
                    self.model.set('selectedLocation', e.currentTarget.value); // Partials
                    self.model.set('plainText', true);
                }
            });

            if (self.model.get('selectedLocation'))
                queryInput.val(this.model.get('selectedLocation'));

            // self.$el.find('.select-location').select2({
            //     dropdownParent: $("#defaultModal"),
            //     tags:true,
            //     createTag: function (params) {
            //         return {
            //           id: params.term,
            //           text: params.term,
            //           newOption: true
            //         }
            //     }
            // }).on('select2:select', function (e) {
            //     if (e.params.data.newOption) {
            //         self.model.set({
            //             selectedLocation: e.params.data.text,
            //             plainText: e.params.data.newOption
            //         })
            //     } else {
            //         self.model.set("selectedLocation", e.params.data.text);
            //         self.model.unset('plainText');
            //     }
            // });
        }

        var isStandardValue = window.Octus.locationList.models.find(function(item) { return item.get('key') == self.model.get('selectedLocation'); });
        if (!isStandardValue && self.model.get('selectedLocation')) {
            var unStandardOption = new Option(self.model.get('selectedLocation'), self.model.get('selectedLocation'), true, true);
            self.$('.select-location').append(unStandardOption).trigger('change');
        }

        if (!_.isUndefined(self.model.get('rules'))) {
            self.collection.on('change reset add remove', function () {
                self.model.set('rules', self.collection.toJSON())
            })
        }

        if (this.model.get('group') != true) {
            self.$el.find('.select2-selection').focus();
        } else {
            self.$el.find('.add-subrule-btn').focus();
        }
    },
    typeahead: function(queryInput, queryController, f, g) {
        var self = this;

        queryInput.typeahead({
            hint: false,
            highlight: true,
            minLength: 1
        },
        {
            name: 'queryController',
            display: function(item){
                return item.value;
            },
            source: queryController.ttAdapter(),
            templates: {
                empty: [
                    '<div class="marginLeft10">No Matches Found</div>'].join('\n')
            }
        }).on('typeahead:selected', f)
          .on('change', g)
          .on('keyup', function (e) {
                if (self.model.get('typeaheadselected') == true) {
                    self.model.unset('typeaheadselected');
                }
          })
          .on('typeahead:open', self.scrollTop)
          .on('typeahead:render', self.scrollTop)
          .on('typeahead:asyncrequest', function() {
            $(this).parents('.tt-wrapper').find('.tt-spinner').show();
            self.scrollTop;
        }).on('typeahead:asynccancel typeahead:asyncreceive', function() {
            $(this).parents('.tt-wrapper').find('.tt-spinner').hide();
        });
    },
    scrollTop: function(obj) {
        var ruleList = $(obj.target).parents('.rules-wrapper').get(0);
        ruleList.scrollTop = ruleList.scrollHeight + 10;
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

module.exports = LocationRangeSubItemView = BaseCompositeView.extend(LocationItemView);

module.exports = LocationRangeItemView = BaseCompositeView.extend(_.extend({
    itemView: LocationRangeSubItemView
}, LocationItemView))

module.exports = LocationRangeView = Marionette.CompositeView.extend({
    template: require('../templates/locationRange.hbs'),
    itemView: LocationRangeItemView,
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

        self.collection.on('change reset add remove', self.checkRules, self);

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
            selectedLocation: '',
            selectedCondition: this.selectedCondition,
        });
    },
    onAddGroup: function () {
        this.collection.add({
            group: true,
            rules: [],
            uniqueClass: faker.random.alphaNumeric(7),
            selectedLocation: '',
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
        var emptyInput      = _.filter(this.$el.find('.select-location.form-control'), (ip) => {
            if (ip.value == '') {
                $(ip).parents('.input-group').addClass('has-error');
            } else {
                $(ip).parents('.input-group').removeClass('has-error');
            }
            return ip.value == '';
        });

        var isNotValidQuery = emptyInput.length > 0 || (rulesTextOnly.length == 0) || rulesTextOnly.replace(/\s+/g, '').includes('()');

        rulesObj.rules.value = rulesTextOnly;

        if (isNotValidQuery) {
            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("incompleteQuery"));
        } else {
            this.trigger('locationQueryConfirmed', rulesObj);
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

            if (!_.isEmpty(rule.selectedLocation)) {
                var extra = rule.plainText ? '<b>*</b>' : '<b>\"</b>';

                return subCond + extra + '<span class="arg">' +  rule.selectedLocation + '</span>' + extra;

            } else if (_.isArray(rule.rules) || !_.isEmpty(rule.rules)) {
                
                return subCond + self.getRecursiveRules(rule.rules, "(", ")").trim();
            }
        }).join(" ") + bracketsClose;

        return rulesCombine;
    },

    onGetRules: function () {
        var self = this;
        var seekingLocQuery = {};
        switch (this.locationType) {
            case 'country':
                seekingLocQuery = {
                    rules: {
                        field       : 'country', 
                        operator    : 'contains'
                    },
                    human: ''
                };
                break;
            case 'seekingLocations':
                seekingLocQuery = {
                    rules: {
                        field       : 'seekingLocations.name', 
                        operator    : 'contains'
                    },
                    human: ''
                };
                break;
            case 'locationList':
                seekingLocQuery = {
                    rules: {
                        field       : 'locationList', 
                        operator    : 'contains'
                    },
                    human: ''
                };
                break;
            default: break;
        }

        seekingLocQuery.rules.value = self.getRecursiveRules(self.collection.toJSON(), "", "").trim();

        RecruiterApp.core.vent.trigger('app:DEBUG:log', ['Kendo: PROCESS_COUNTRY_RANGE_VALUE', seekingLocQuery]);

        seekingLocQuery.rules.queryBuilder = self.collection.toJSON();

        return seekingLocQuery
    },
});