/**
 * SearchBoxViewView
 * @type {exports}
 */
var Marionette  = require('backbone.marionette'),
_ = require('underscore'),
    stickit     = require('backbone.stickit'),
    UserSearch  = require('../../userSearch/models/UserSearch'),
    Session     = require("../../session/models/Session"),
    numeral     = require('numeral'),
    moment      = require('moment');

module.exports = SearchBoxItemView = Marionette.ItemView.extend({
    template: require('../templates/searchBoxItem.hbs'),
    tagName: 'li',
    events: {
        'click .searchItem': 'selectSearchItem'
    },
    bindings: {
        '.searchItem': 'subject'
    },
    selectSearchItem: function () {
        RecruiterApp.core.vent.trigger('peopleDashboardController:search',this.model.get('subject'));        
    },
    onRender: function () {
        this.stickit();
    }
});

module.exports = SearchBoxView = Marionette.CompositeView.extend({
    template: require('../templates/searchBox.hbs'),
    itemView: SearchBoxItemView,
    itemViewContainer: '#searchItems',
    events: {
        'click #execute-search'     : 'executeSearch',
        'click #clear-search'       : 'clearSearch',
        'click .save-search-title'  : 'saveSearchTitle',
        'click .save-as'            : 'saveAs',
        'click .discard-changes'    : 'discardChanges',
        'keyup #searchCriteria'     : 'keyPressEventHandler',
        'focus #searchCriteria'     : 'focusEventHandler',
        'blur #searchCriteria'      : 'blurEventHandler',
        'click #create-candidate'   : 'createCandidate'
    },
    bindings: {
        '#searchCriteria'           : 'criteria',
        '.search-title'             : 'searchTitle',
        '.save-search-detail'       : {
            observe: 'filterDetail',
            updateMethod: 'html',
            onGet: function (val) {
                let self = this;

                if (!_.isUndefined(val) && !_.isEmpty(val)) {

                    var v = val.split(' | ')[0];
                    var s = val.split(' | ')[1];

                    var _v = JSON.parse(v);
                    var _f = _.filter(_v, function(__f){
                            return __f.field !== 'all' && __f.field !== '_all' && __f.field !== 'dataQuality'
                        }),
                        _s = s && !_.isUndefined(s) && s !== 'undefined' ? JSON.parse(s) : '',
                        _v = '';

                    RecruiterApp.core.vent.trigger('app:DEBUG:log', ['SearchBoxView: Filter', _f])
                    RecruiterApp.core.vent.trigger('app:DEBUG:log', ['SearchBoxView: Sort', _s])

                    _.each(_f, function(param_f) {

                        if (param_f.operator == 'range') {
                            if (param_f.field == 'age' || param_f.field == 'yearsOfExperience') {
                                _v += '<li class="dropdown-header"><strong>' + RecruiterApp.polyglot.t(param_f.field) + ':</strong> <span>' + param_f.rangeValue.from + ' - ' + param_f.rangeValue.to + '</span></li>';
                            } else if (param_f.field == 'currentSalary.base' || param_f.field == 'minimumSalary.base') {
                                _v += '<li class="dropdown-header"><strong>' + RecruiterApp.polyglot.t(param_f.field) + ':</strong> <span>' + numeral(param_f.rangeValue.from).format('0,0') + ' - ' + numeral(param_f.rangeValue.to).format('0,0') + '</span></li>';
                            } else {
                                _v += '<li class="dropdown-header"><strong>' + RecruiterApp.polyglot.t(param_f.field) + ':</strong> <span>' + moment(param_f.rangeValue.from).format(window.Octus.DATE_FORMAT) + ' - ' + moment(param_f.rangeValue.to).format(window.Octus.DATE_FORMAT) + '</li>';
                            }
                        } else if (param_f.operator == 'nested') {
                            if (param_f.field == 'currentSalary' || param_f.field == 'minimumSalary') {
                                const humanQuery = param_f.filters.map((item, index) => {
                                    // If it is the first filter, we don't put the logic before it
                                    const logic = index==0 ? '' : item.logic;
                    
                                    // Build the filters from each brackets ()
                                    const filters = item.filters.map(filter => {
                                        let result = `${filter.field}:`.replace(/minimumSalary\.|currentSalary\./, '').replace(/\.symbol/g, '');
                                            result = result.replace(result[0], result[0].toUpperCase());
                    
                                        if (filter.operator=='range') {
                                          if (filter.rangeValue.from)   result += ` from ${filter.rangeValue.from}`;
                                          if (filter.rangeValue.to)     result += ` to ${filter.rangeValue.to}`;
                                        }
                                        if (filter.operator=='contains') {
                                          if (filter.value) result += ` ${filter.value}`;
                                        }
                                      return result
                                    }).join(' AND ');
                    
                                    return `${logic} (${filters})`; 
                                }).join(' ').trim();
                                _v += '<li class="dropdown-header"><strong>' + RecruiterApp.polyglot.t(param_f.field) + ':</strong> <span>' + humanQuery + '</span></li>';

                            } else if (param_f.field == 'jobHistoryList') {
                                let selectedCondition = null;
                                const humanQuery = param_f.filters.map(filter => {
                                    if (!selectedCondition) selectedCondition = filter.logic;

                                    let companyName = _.findWhere(filter.filters, {field: 'jobHistoryList.companyName'}),
                                        title       = _.findWhere(filter.filters, {field: 'jobHistoryList.title'}),
                                        query       = [];

                                    if (!_.isUndefined(companyName)) query.push(`${RecruiterApp.polyglot.t('employer')}: ${companyName.value}`)
                                    if (!_.isUndefined(title))       query.push(`${RecruiterApp.polyglot.t('title')}: ${title.value.replace(/\*/g, '')}`)

                                    return `(${query.join(' AND ')})`;

                                }).join(`<br>${selectedCondition}<br>`);
                                _v += '<li class="dropdown-header"><strong>' + self.titleize(RecruiterApp.polyglot.t('employmentHistory')) + ':</strong><br><span>' + humanQuery + '</span></li>';

                            } else if (param_f.field == 'qualificationList' || param_f.field == 'educationList') {
                                let logic = ''; 
                                const humanQuery = param_f.filters.map((va, i) => {
                                    logic = va.logic;

                                    return ' (' + _.map(_.filter(va.filters, (v) => {
                                            return v.field.indexOf('type') == -1;
                                        }), (v) => {
                                                var field = v.field.replace(/qualificationList\.|educationList\./, '');
                                                return RecruiterApp.polyglot.t(field) + ': ' + v.value;
                                            }).join(' AND ') + ')';
                                }).join(` ${logic} `);

                                _v += '<li class="dropdown-header"><strong>' + RecruiterApp.polyglot.t(param_f.field.replace('List', '')) + ':</strong><br><span>' + humanQuery + '</span></li>';
                            }

                        } else {
                            _v += '<li class="dropdown-header"><strong>' + RecruiterApp.polyglot.t(param_f.field) + ':</strong> <span>' + param_f.value + '</span></li>'
                        }

                    });

                    if (!_.isUndefined(_s) && _.size(_s) > 0) {
                        _v += _.size(_f) > 0 ? '<li role="separator" class="divider"></li>' : '';
                        _.each(_s, function(param_s) {
                            _v += '<li class="dropdown-header"><strong>' + RecruiterApp.polyglot.t(param_s.field) + ':</strong> ' + RecruiterApp.polyglot.t(param_s.dir) + ' <i class="fa fa-sort-' + param_s.dir + '" aria-hidden="true"></i></li>'
                        });
                    }
                    return _v;
                } else {
                    return ''
                }
            }
        },
        '.search-title-edited'      : {
            observe: 'editted',
            onGet: function (val) {
                if (val) {
                    return '--' + RecruiterApp.polyglot.t('edited')
                } else {
                    return ''
                }
            }
        }
    },
    onRender: function () {
        var self = this;

        this.stickit()
        var session = new Session();
        var hasPermCreateRecord;

        if (this.options.type == 'candidate') {
            hasPermCreateRecord = !_.isUndefined(_.findWhere(session.getPermissionsForView('candidateGridView'), {fieldName: 'createRecord', read: true }));

            if (hasPermCreateRecord) this.$el.find('#create-candidate').removeClass('wb');

        } else if (this.options.type == 'client') {
            hasPermCreateRecord = !_.isUndefined(_.findWhere(session.getPermissionsForView('clientGridView'), {fieldName: 'createRecord', read: true }));

            if (hasPermCreateRecord) this.$el.find('#create-client').removeClass('wb');
        }    

        this.checkEditted();  

        RecruiterApp.core.vent.on('app:recentitems:' + self.options.type + ':search:refresh', function() {
            self.loadSearchItems(self.options.type);
        });

        this.loadSearchItems(self.options.type);

    },
    loadSearchItems: function(type) {
        var self = this;

        let recentItemCollection = new RecentItemCollection({}, { type: type.toUpperCase(), actions: [ RecentItem.ACTION.SEARCH ] });
        recentItemCollection.fetch({
            success(data) {

                let $recentItems = self.$el.find('ul#searchItems');

                $recentItems.empty();

                if (data.length == 0) {

                        var $li = $('<li>');
                        $li.appendTo($recentItems);   
                        $li.append(document.createTextNode(RecruiterApp.polyglot.t('noRecords')));                 

                } else {

                    let first = true;
                    data.forEach((item) => {

                        if (!first)
                            $('<li class="divider">').appendTo($recentItems);
                        else 
                            first = false;

                        var $li = $('<li>');
                        $li.appendTo($recentItems);

                        var $a = $('<a>');
                        $a.html(item.get('subject'));
                        $a.appendTo($li);

                        $a.bind('click', function() {
                            RecruiterApp.core.vent.trigger('peopleDashboardController:search', item.get('subject'));
                        });

                    });             

                }

            }

        });

    },
    checkEditted: function () {
        if (this.model.get('filterDetail') && this.model.get('savedSearchId')) {
            var filterDetail = JSON.parse(this.model.get('filterDetail').split(' | ')[0]);
            var savedSearch = new UserSearch();
                savedSearch.id = this.model.get('savedSearchId');
            
            savedSearch.fetch({
                success: () => {
                    var savedSearchString  = JSON.stringify(_.reject(savedSearch.get('criteria').filters, {field: "all"}));
                    var filterDetailString = JSON.stringify(_.reject(filterDetail, {field: "all"}));
                    
                    if (savedSearchString !== filterDetailString && this.model.get('editted') != true) {
                        this.model.set('editted', true);
                        this.render();
                    } else if (savedSearchString === filterDetailString && this.model.get('editted') == true) {
                        this.model.set('editted', false);
                        this.render();
                    }
                }
            })
        }
    },
    createCandidate: function () {
    },
    executeSearch: function(e) {
        e.preventDefault();
        if (this.model.isValid(true)) {
            RecruiterApp.core.vent.trigger('peopleDashboardController:search', this.model.get('criteria'));
            if (this.model.get('type')) {
                console.log('app:recentitems:' + this.model.get('type') + ':search');
                RecruiterApp.core.vent.trigger('app:recentitems:' + this.model.get('type') + ':search', this.model.get('criteria'));
            }
        } else {
            // just render errors
            console.log("Search model is not valid");
        }
    },
    clearSearch: function(e) {
        e.preventDefault();
        this.model.set('criteria', null);
        RecruiterApp.core.vent.trigger('peopleSearch:search:clear');
    },
    saveSearchTitle: function (e) {
        e.preventDefault();
        if ($(e.currentTarget).hasClass('saveAs')) {
            this.trigger('saveAs')
        } else {
            this.trigger('save')
        }
    },
    saveAs: function (e) {
        e.preventDefault();
        this.trigger('saveAs');
    },
    discardChanges: function (e) {
        e.preventDefault();
        RecruiterApp.core.vent.trigger('blockUI','Loading...');
        this.model.set('editted', false);

        _.delay(() => {
            this.trigger('discardChanges', this.model.get('savedSearchId'));
        }, 200);
    },
    keyPressEventHandler:function(e) {
        if(e.keyCode == 13){
            this.$("#execute-search").click();
        }

        if ((e.keyCode == 8 || e.keyCode==46) && $("#searchCriteria").val() == '' ){
            this.model.set('criteria', null);
            RecruiterApp.core.vent.trigger('peopleSearch:search:clear');
        }
    },
    focusEventHandler: function (e) {
        $(e.currentTarget).addClass('focus')
    },
    blurEventHandler: function (e) {
        setTimeout(function () {
            $(e.currentTarget).removeClass('focus')
        }, 2000)
    },
    titleize: function (phrase) {
        if(!phrase.split) return phrase;

        var _titleizeWord = function(string) {
                return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
            },
            result = [];
        phrase.split(" ").forEach(function(w) {
            result.push(_titleizeWord(w));
        });
        return result.join(" ");
    }
});