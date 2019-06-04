var BaseCompositeView           = require('../../common/views/BaseCompositeView'),
    faker                       = require('faker'),
    Bloodhound                  = require('bloodhound'),
    RefdataHierarchyPopupView   = require('../../refdataHierarchy/views/RefdataHierarchyPopupView');;

module.exports = RangeItemView = BaseCompositeView.extend({
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
    onBeforeRender: function (argumen) {
        var selVal = this.model.get('selectedVal');
        
        if (selVal.indexOf('*') > -1) { // has * asterisk
            this.model.set('plainText', true);
        } else if (selVal.indexOf('"') > -1) { // has " double quotation marks
            this.model.unset('plainText');
        } 

        this.model.set('selectedVal', selVal.replace(/[{\"*}]/g, '')); // remove * and "
    },
    initialize: function () {
        if (!_.isUndefined(this.model.get('rules'))) {
            this.collection = new Backbone.Collection(this.model.get('rules'));
        }

        this.selectedCondition = "AND";
    },
    onAddSubRule: function () {
        var newSubRule = {
            domain: this.model.get('domain'),
            selectedVal: '',
            selectedKey: '',
            uniqueClass: faker.random.alphaNumeric(7),
            selectedCondition: this.selectedCondition,
            notClause: false
        };

        var rules = this.model.get('rules');
            rules.push(newSubRule);

        this.model.set('rules', rules);

        this.collection.add(newSubRule)
    },
    onAddSubGroup: function () {
        this.collection.add({
            group: true,
            domain: this.model.get('domain'),
            rules: [],
            uniqueClass: faker.random.alphaNumeric(7),
            selectedVal: '',
            selectedKey: '',
            selectedCondition: this.selectedCondition,
            notClause: false
        })
    },
    onShow: function () {
        var self = this;
        var uniqueClass = '.' + self.model.get('uniqueClass') + ' ';

        self.$el.find(uniqueClass + '.add-subrule-btn').click(() =>    { self.onAddSubRule();          })
        self.$el.find(uniqueClass + '.add-subgroup-btn').click(() =>   { self.onAddSubGroup();         })
        self.$el.find('.btn-equals').click(() =>         { self.onEquals();              })
        self.$el.find('.btn-not-equals').click(() =>     { self.onNotEquals();           })
        self.$el.find(uniqueClass + '.viewHierarchy-btn').click((e) => { 
            self.viewHierachyPanel(e);    
        })
        self.$el.find(uniqueClass + '.btn-remove-group').click((e) =>  { self.onRemoveGrpBtn(e);       })
        self.$el.find(uniqueClass + '.btn-remove').click(() =>         { self.onRemoveBtn();           })

        if (self.model.get('notClause')) {
            self.$el.find('.btn-not-equals').addClass('active');
            self.$el.find('.btn-equals').removeClass('active');
        }

        if (!_.isUndefined(self.collection)) {
            self.selectedCondition = self.collection.pluck("selectedCondition")[0] || 'AND';
            
            self.$el.find(uniqueClass + '.radioGrpCond').removeProp('checked');
            self.$el.find(uniqueClass + '.radioGrpCond').parent().removeClass('active');
            self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').prop('checked');
            self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').parent().addClass('active');
            self.$el.find(uniqueClass + '.radioGrpCond').change((e) =>     { self.onChangeCondition(e);    })
        }

        /**
         * Initialising typeahead on inputs must only happen in individual rules.
         * If it happens in groups, it will be double initialisation and it will break
         * the selection in a number of cases.
         * To be redone in a separate function
         */
        if (!this.model.get('group')) {
            var queryController
            var queryInput = self.$el.find(self.select);

            // if getReferenceDataList is not provided, use a remote RefDataUrl()
            if (!self.getReferenceDataList) {
                var session = new Session();
                queryController = new Bloodhound({
                    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    remote: {
                        // url: RecruiterApp.config.API_ROOT + '/filterChoice/list/' + domain + self.getReferenceDataUrl('%QUERY'),
                        url: self.getReferenceDataUrl('%QUERY'),
                        wildcard: '%QUERY',
                        cache: false,
                        ajax: {
                            beforeSend: function (jqXhr, settings) {
                                settings.data = $.param({criteria: queryInput.val()});
                                jqXhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
                            }
                        },
                        filter: function (searchResponse) {

                            return _.uniq(searchResponse.map(searchResult => {

                                if (self instanceof ConsultantRangeItemView || self instanceof ConsultantRangeSubItemView) {
                                    return {
                                        key: searchResult.id,
                                        username: searchResult.username,
                                        value: searchResult.allNames
                                    };
                                } else if ((self instanceof ReferredRangeItemView || self instanceof ReferredRangeSubItemView) && searchResult.types) {
                                    return {
                                        key: searchResult.id,
                                        value: searchResult.value,
                                        types: searchResult.types
                                    };
                                } else {
                                    return {
                                        key: searchResult.key,
                                        value: searchResult.value
                                    };
                                }
                            }), "key");
                        }
                    }
                });
            // if getReferenceDataList is provided < This is a local list. No remote query
            } else if (self.getReferenceDataList()) {
                queryController = new Bloodhound({
                    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    local: self.getReferenceDataList()
                })
            } else {
                console.error('No URL or List provided for Typeahead');
                return false;
            }

            queryController.initialize();

            this.typeahead(queryInput, queryController, function (obj, model) {

                var modelKey = model.key || self.camelize(model.value);

                self.model.set({
                    selectedKey: modelKey,
                    selectedVal: model.value,
                    typeaheadselected: true
                });

                self.model.unset('plainText');
                self.$el.find(self.select).html(model.value).blur();
                
            }, function (e) {
                if (!self.model.get('typeaheadselected') && !self.model.get('group')) {
                    self.model.set('selectedKey', self.camelize(e.currentTarget.value));
                    self.model.set('selectedVal', '*' + e.currentTarget.value + '*'); // Partials
                    self.model.set('plainText', true);
                }
            });

            self.$el.find('input.tt-input').focus(); 
        } else {
            self.$el.find('.add-subrule-btn').focus();
        }

        if (!_.isUndefined(self.model.get('rules'))) {
            self.collection.on('change reset add remove', function () {
                self.model.set('rules', self.collection.toJSON())
            })
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
    onEquals: function() {
        this.setEquals(true);
    },
    onNotEquals: function() {
        this.setEquals(false);
    },
    setEquals: function(value) {
        this.$el.find(value ? '.btn-equals' : '.btn-not-equals').addClass('active');
        this.$el.find(!value ? '.btn-equals' : '.btn-not-equals').removeClass('active');
        this.model.set('notClause', !value);
    },
    enableRemove: function () {
        // this.$el.find('.btn-remove').removeAttr('disabled');
    },
    disableRemove: function () {
        // this.$el.find('.btn-remove').attr('disabled','disabled');        
    },
    enableCondition: function () {
        // this.$el.find('.btn-remove').removeAttr('disabled');
    },
    disableCondition: function () {
        this.$el.find('input.radioGrpCond').attr('disabled','disabled');
        this.$el.find('input.radioGrpCond').parent().addClass('disabled');
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
                empty: ['<div class="marginLeft10">No Matches Found</div>'].join('\n'),
                suggestion: function (data) {
                    if (self instanceof ReferredRangeItemView && data.types) {
                        return `<div><strong>${data.value}</strong> [${RecruiterApp.polyglot.t(data.types[0].toLowerCase())}]</div>`;
                    } else if (self instanceof ConsultantRangeItemView || self instanceof ConsultantRangeSubItemView) {
                        return `<div>${data.value} [${data.username}]</div>`;
                    } else {
                        return `<div>${data.value}</div>`;
                    }
                }
            },
            limit: 10
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
    viewHierachyPanel: function(e) {
        var self = this;

        var refdataHierarchyPopupView = new RefdataHierarchyPopupView({
            model: new Backbone.Model({
                modalTitle: self.list,
            })
        })

        RecruiterApp.core.vent.trigger('app:modal:show', refdataHierarchyPopupView, "big");

        refdataHierarchyPopupView.on('refdataSelected', function (val) {

            var empty = self.collection.where({selectedVal: ""});
            
            _.each(empty, (emptyModel) => {                
                if (_.isUndefined(emptyModel.get('group')) && emptyModel.get('group') != true) {
                    emptyModel.destroy();
                }
            });

            _.each(val, function (v, i) { 

                var childData = {
                    selectedVal: v.value, 
                    selectedKey: v.key, 
                    domain: self.model.get("domain"),
                    uniqueClass: faker.random.alphaNumeric(7)
                }

                if (self.collection.length > 0) {
                    childData.selectedCondition = "AND";
                }

                self.collection.add(childData);
            });
        })
    }
});
