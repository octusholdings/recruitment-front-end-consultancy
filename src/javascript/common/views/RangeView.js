var Marionette                  = require('backbone.marionette'),
    faker                       = require('faker'),
    Bloodhound                  = require('bloodhound'),
    RefdataHierarchyPopupView   = require('../../refdataHierarchy/views/RefdataHierarchyPopupView');

module.exports = RangeView = Marionette.CompositeView.extend({
    itemViewContainer: '.rules-list',
    itemViewOptions: function () {
        return {
            parentView: this
        }
    },
    initialize: function () {
        this.selectedCondition = 'AND';
        this.model = new Backbone.Model({
            uniqueClass: faker.random.alphaNumeric(7)
        });
    },
    events: {
        'change .color-coded-checkbox' : 'toggleColor'
    },
	onShow: function() {
        var self = this;
        var uniqueClass = '.' + self.model.get('uniqueClass') + ' ';

        self.collection.on('change reset add remove', self.checkRules, self);

        self.selectedCondition = self.collection.pluck('selectedCondition')[0] || 'AND';

        self.$el.find(uniqueClass + '.radioGrpCond').removeProp('checked');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().removeClass('active');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').prop('checked');
        self.$el.find(uniqueClass + '.radioGrpCond').parent().find('[value="' + self.selectedCondition + '"]').parent().addClass('active');
        self.$el.find(uniqueClass + '.radioGrpCond').change((e) =>        { self.onChangeCondition(e);    })
        self.$el.find(uniqueClass + '.viewHierarchy-btn').click((e) =>    { self.viewHierachyPanel(e);    })

        self.$el.find(uniqueClass + '.addrule-btn').click(() =>           { self.onAddRule();             })
        self.$el.find(uniqueClass + '.addgroup-btn').click(() =>          { self.onAddGroup();            })
        self.$el.find('.get-rules').click(() =>             { self.onGetRules();            })
        self.$el.find('.confirm-range').click(() =>         { self.confirmQuery();          })
        self.$el.find('.btn-expand').click((e) =>           { self.expandModal(e);          })
        self.$el.find('.btn-compress').click((e) =>         { self.contractModal(e);        })

        self.checkRules();
	},
    toggleColor: function () {
        this.$el.find('.console .code').toggleClass('no-color'); 
    },
    onChangeCondition: function (e) {
        this.selectedCondition = e.currentTarget.value;

        this.collection.each(function(model, i) {
            model.set('selectedCondition', e.currentTarget.value);
        });
    },
    getCondition: function (e) {
        return this.selectedCondition;  
    },
    onAddRule: function () {
        this.collection.add({
            domain: this.options.domain,
            selectedVal: '',
            selectedKey: '',
            uniqueClass: faker.random.alphaNumeric(7),
            selectedCondition: this.selectedCondition,
            notClause: false
        });
        var ruleList = $(this.$el).find('ul.rules-list').get(0);
            ruleList.scrollTop = ruleList.scrollHeight;
    },
    onAddGroup: function () {
        this.collection.add({
            group: true,
            domain: this.options.domain,
            rules: [],
            uniqueClass: faker.random.alphaNumeric(7),
            selectedVal: '',
            selectedKey: '',
            selectedCondition: this.selectedCondition,
            notClause: false
        });
        var ruleList = $(this.$el).find('ul.rules-list').get(0);
            ruleList.scrollTop = ruleList.scrollHeight;
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
        var rulesObj         = this.onGetRules();
        var rulesTextOnly    = $(rulesObj.rules.value).text();
        // If a query or part of it is empty the whole app would crash under current design. As such we make sure it is not empty.
        var emptyInput      = _.filter(this.$el.find('.form-control.tt-input'), (ip) => {
            if (ip.value == '') {
                $(ip).parents('.input-group').addClass('has-error');
            } else {
                $(ip).parents('.input-group').removeClass('has-error');
            }
            return ip.value == '';
        });

        var isNotValidQuery = emptyInput.length > 0 || (rulesTextOnly.length == 0) || rulesTextOnly.replace(/\s+/g, '').includes('()');;

        rulesObj.rules.value = rulesTextOnly;

        if (isNotValidQuery) {
            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('incompleteQuery'));
        } else {
            this.trigger(this.confirmEvent, rulesObj);
        }
    },

    checkRules: function () {
        this.$el.find('.console .read-only.code').html(this.onGetRules().rules.value);
    },

    getRecursiveRules: function (collection, bracketsOpen, bracketsClose) {
        var self = this;

        bracketsOpen    = bracketsOpen == '' ? '' : '<span class="o-bracket">' +  bracketsOpen + '</span>';
        bracketsClose   = bracketsClose == '' ? '' : '<span class="c-bracket">' +  bracketsClose + '</span>';

        var rulesCombine = bracketsOpen + _.map(collection, (rule, i) => {
        
            var subCond = i == 0 ? '' : '<i>' + rule.selectedCondition + '</i>' + ' ';

            if (_.isArray(rule.rules) || !_.isEmpty(rule.rules)) {    
                return subCond + self.getRecursiveRules(rule.rules, '(', ')').trim();
            } else if (!_.isEmpty(rule.selectedKey) && !_.isEmpty(rule.selectedVal)) {
                var notClause   = rule.notClause ? '<span class="clause">NOT</span> ' : '';
                var extra       = rule.plainText ? '<b>*</b>' : '<b>\"</b>';
                
                return subCond + notClause + extra + '<span class="arg">' + rule.selectedVal.replace(/\*/g, '') + '</span>' + extra;

            }
        }).join(' ') + bracketsClose;

        return rulesCombine;
    },

    onGetRules: function () {
    	var self            = this;
        var query           = {
            rules: {
                field       : self.list, 
                operator    : 'contains',
                queryBuilder: ''
            },
        };

        var filteredCollection = self.collection.toJSON().filter((model) => {
            /* Only models whose rules are not empty
               Or model whose selectedKey or selectedVal is not empty */
            return !_.isEmpty(model.rules) || (!_.isEmpty(model.selectedKey) && !_.isEmpty(model.selectedVal));
        });

        query.rules.value = self.getRecursiveRules(filteredCollection, '', '').trim();

        RecruiterApp.core.vent.trigger('app:DEBUG:log', ['Kendo: PROCESS_RANGE_VALUE', query]);

        query.rules.queryBuilder = self.collection.toJSON();

        return query;
    },
	viewHierachyPanel: function(e) {
        var self = this;
        var refdataHierarchyPopupView = new RefdataHierarchyPopupView({
            model: new Backbone.Model({
                modalTitle: self.list,
                domain: self.options.domain
            })
        })

        RecruiterApp.core.vent.trigger('app:modal:show', refdataHierarchyPopupView, 'big');

        refdataHierarchyPopupView.on('refdataSelected', function (val) {
            
            var empty = self.collection.where({selectedVal: ''});
            
            _.each(empty, (emptyModel) => {                
                if (_.isUndefined(emptyModel.get('group')) && emptyModel.get('group') != true) {
                    emptyModel.destroy();
                }
            });

            _.each(val, function (v, i) { 

                var childData = {
                    selectedVal: v.value, 
                    selectedKey: v.key, 
                    uniqueClass: faker.random.alphaNumeric(7)
                }

                if (self.collection.length > 0) {
                    childData.selectedCondition = 'AND';
                }

                self.collection.add(childData);
            });

            self.checkRules();
        })
    }
});
