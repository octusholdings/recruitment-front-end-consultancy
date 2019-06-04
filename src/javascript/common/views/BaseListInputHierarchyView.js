/**
 * BaseListInputHierarchyView. Used by the refdata input listView that has
 * support for hierarchy view. Extends CompositeView
 * @type {exports}
 */
var Marionette                  = require('backbone.marionette'),
    Backbone                    = require('backbone'),
    _                           = require('underscore'),
    CompositeView               = require('./CompositeView'),
    RefdataHierarchyPopupView   = require('../../refdataHierarchy/views/RefdataHierarchyPopupView');

module.exports = BaseListInputHierarchyView = CompositeView.extend({
	updateSelectHtml: function () {
        var self = this;

        self.$el.find(self.SELECT2_SELECTOR).html('');

        var dat = _.isArray(self.model.get(self.MODEL_ATTR)) ? self.model.get(self.MODEL_ATTR) : self.model.get(self.MODEL_ATTR).toJSON()

        _.each(dat, function(selInd) {
            self.$el.find(self.SELECT2_SELECTOR).append('<option value="' + selInd.key + '" selected="selected">' + selInd.value + '</option>');
        });          
    },
    initSelect2: function () {
        var self = this;
		        
        self.$el.find(self.SELECT2_SELECTOR).select2({
            placeholder: self.SELECT2_PLACEHOLDER,
            ajax: {
                url:    function (param) { return self.SELECT2_URL; },
                delay:  500,
                data: function (param) {
                    return query = { criteria: param.term }
                },
                processResults: function (data, params) {
                    params.page = params.page || 1;

        			var modelData = _.isArray(self.model.get(self.MODEL_ATTR)) ? self.model.get(self.MODEL_ATTR) : self.model.get(self.MODEL_ATTR).toJSON()

                    var _data = _.filter(data, function(dat) {
                        if (_.map(modelData, 'key').indexOf(dat.key) == -1) {
                            return dat;
                        }
                    });
                    
                    return {
                        results: _data,
                        pagination: {
                            more: (params.page * 30) < data.total_count
                        }
                    }
                },
                cache: true
            },
            escapeMarkup: function (markup) { return markup; },
            minimumInputLength: 1,
            closeOnSelect: true,
            templateResult: self.formatReturn,
            templateSelection: self.formatReturnSelection
        });
    },
    initKendoTreeListView: function () {
        var self = this;

        var dat = _.isArray(self.model.get(self.MODEL_ATTR)) ? self.model.get(self.MODEL_ATTR) : self.model.get(self.MODEL_ATTR).toJSON()

        var selIndFilters = _.map(dat, function(selInd) {
            // return { field: "value", value: selInd.value, operator: "contains" };
            return { field: "value", value: selInd.value, operator: "eq" };
        });

        self.$el.find(self.KENDO_SELECTOR).kendoTreeList({
            height: 200,
            columns: [{ 
                title: RecruiterApp.polyglot.t("name"),
                field: "value", 
                template: '<span class="data-value" data-name="' + '#=value#' + '" ' + ' data-key="' + '#=key#' + '" data-id="' + '#=id#' + '">#=value#</span>',
                expandable: true,
                headerAttributes: { style: "display:none;" }
            }],
            dataBound: function(e) {
                self.TREE = self.$el.find(self.KENDO_SELECTOR).data('kendoTreeList');
                setTimeout(function () { 
                    _.each(self.$el.find(self.KENDO_SELECTOR + ' tbody tr'), function(row) {
                        self.TREE.expand(row);
                    });
                },1000);
            }
        })
        
        if (selIndFilters.length > 0) {
            self.TREE_DS = new kendo.data.TreeListDataSource({
                transport: {
                    read: {
                        url: self.KENDO_URL,
                        dataType: "json"
                    },
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
                    },
                    parameterMap: function (data, type) {
                        if (Object.keys(data) && Object.keys(data).length) {
                            return JSON.stringify(data);
                        } else {
                            return ''
                        }
                    }                   
                },
                schema: {
                    model : {
                        id : "id",
                        fields : {
                            id : { type : "string", editable: false, nullable: false, defaultValue : null },
                            parentId : { field : "parent", nullable: true },
                            value : { type : "string", validation: { required: true } }
                        }
                    }
                },
            })

            self.TREE_DS.filter({
                logic: "or",
                filters: selIndFilters
            });

            self.TREE.setDataSource(self.TREE_DS);
        }
    },
    formatReturn: function (repo) {
        var cat = _.isNull(repo.category) || _.isUndefined(repo.category) ? "" : "<strong>" + repo.category + "</strong> ";

        return markup = "<div class='select2-result-repository clearfix'>" +
            "<div class='select2-result-repository__meta'>" +
            "<div class='select2-result-repository__title'>" + cat + repo.value + "</div></div>";
    },
    formatReturnSelection: function(repo) {
        var t = repo.text || repo.value, l = '';
        var id = _.map(self.CURR_DATA, 'value').indexOf(t);

        if (id > -1 &&
            !_.isUndefined(self.CURR_DATA[id]) && 
            !_.isNull(self.CURR_DATA[id].level) && 
            !_.isUndefined(self.CURR_DATA[id].level) &&
            self.CURR_DATA[id].level > 0) {
            l  = "<code>" + self.CURR_DATA[id].level + "</code>"
        }
        
        return t + l;
    },
    updateSelectList: function (e) {
        var self = this;

        RecruiterApp.core.vent.trigger('app:DEBUG:log', 'updateSelectList: ' + e.type);

        if (e.type == 'select2:unselect') {

        	if (!_.isArray(self.model.get(self.MODEL_ATTR))) {
        		var dat = self.model.get(self.MODEL_ATTR).toJSON()
	            var removeObject = {
	                key: e.params.data.key || e.params.data.id,
	                value: e.params.data.value || e.params.data.text
	            };
	            var removeModel = _.findWhere(dat, removeObject);
	            dat = _.without(dat, _.findWhere(dat, removeModel))
	            self.model.set(self.MODEL_ATTR, new Backbone.Collection(dat))
            } else {
	            var removeObject = self.model.get(self.MODEL_ATTR);
	            var withoutObject = _.without(removeObject, _.findWhere(removeObject, {
	                key: e.params.data.key || e.params.data.id,
	                value: e.params.data.value || e.params.data.text
	            }));
	            self.model.set(self.MODEL_ATTR, withoutObject)
        	}

        } else if (e.type == 'select2:select') {
        	if (!_.isArray(self.model.get(self.MODEL_ATTR))) {
        		var dat = self.model.get(self.MODEL_ATTR).toJSON()
        		dat.push({
	                key: e.params.data.key,
	                value: e.params.data.value
	            });
	            self.model.set(self.MODEL_ATTR, new Backbone.Collection(dat))
        	} else {
        		self.model.get(self.MODEL_ATTR).push({
	                key: e.params.data.key,
	                value: e.params.data.value
	            });	
        	}
        }
        self.trigger(self.EVENT_ADD, self.model.get(self.MODEL_ATTR));
    },
    openSelectList: function (e) {
        var self = this;

        if (self.$el.find(self.INPUT_ACTION_SELECTOR).hasClass('wb')) {
            self.$el.find(self.SELECT2_SELECTOR).select2('close');
            self.viewHierachyPanel();
        }
    },
    viewKendoTreeListView: function () {
        var self = this;

        self.$el.find('.btn-hierachy-view').toggleClass('active');

        if (self.$el.find(self.KENDO_SELECTOR).hasClass('hidden')) {
            self.initKendoTreeListView();
            self.$el.find('.select2.select2-container').addClass('hidden');
            self.$el.find(self.KENDO_SELECTOR).removeClass('hidden');
        } else {
            if (self.TREE) self.TREE.destroy();
            self.$el.find('.select2.select2-container').removeClass('hidden');
            self.$el.find(self.KENDO_SELECTOR).html('');
            self.$el.find(self.KENDO_SELECTOR).attr('class', 'hidden');
        }
    },
    viewHierachyPanel: function (e) {
        var self = this;

        if (self.$el.find('.btn-hierachy-view').hasClass('active')) self.viewKendoTreeListView();

        var dat = _.isArray(self.model.get(self.MODEL_ATTR)) ? self.model.get(self.MODEL_ATTR) : self.model.get(self.MODEL_ATTR).toJSON()

        var refdataHierarchyPopupView = new RefdataHierarchyPopupView({
            model: new Backbone.Model({
                modalTitle: self.REF_MODAL_TITLE,
                selectedKey: dat
            })
        })

        RecruiterApp.core.vent.trigger('app:modal:show', refdataHierarchyPopupView, "big");

        refdataHierarchyPopupView.on('refdataSelected', function (val) {
            val = _.map(val, function (v) { return {key: v.key, value: v.value} });

            var indCol = self.model.get(self.MODEL_ATTR);
            if (indCol.length == 0) {
                indCol = new Backbone.Collection(val);

            } else {
                _.each(val, function(item) {
                    var itemToBeAdded = indCol.find(function(ch) {
                        var key   = _.isUndefined(ch.key)   ? ch.get('key')   : ch.key;
                        var value = _.isUndefined(ch.value) ? ch.get('value') : ch.value;

                        return key === item.key || value === item.value
                    });

                    if (!itemToBeAdded) {
                        indCol.push(item);
                    }
                });
            }

            self.model.set(self.MODEL_ATTR, indCol)

            RecruiterApp.core.vent.trigger('app:modal:close');
            
            self.trigger(self.EVENT_ADD, indCol)
            self.updateSelectHtml()
            self.$el.find(self.SELECT2_SELECTOR).select2('destroy')
            self.initSelect2()
        })
    }
})