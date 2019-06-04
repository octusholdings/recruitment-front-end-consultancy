var Backbone               = require('backbone'),
    moment                 = require('moment'),
    stickit                = require('backbone.stickit'),
    HierarchyParent        = require('../models/HierarchyParent'),
    Marionette             = require('backbone.marionette'),

    independentChildFields = ['specializationList'], flag;

module.exports = RefdataHierarchyPopupView = Marionette.ItemView.extend({
    template: require('../templates/refdataHierarchyPopup.hbs'),
    events: {
        'click .confirm-data'                   : 'confirmData',
        'click .get-data'                       : 'getSelectedData',
        'change input[name="refDataSelOpt"]'    : 'changeSelectOption',
        'click .getParent'                      : 'toggleParentOption',
    },
    bindings: {
        '.selectedKey' : {
            observe: 'selectedKey',
            onGet: function (val) {
                var self = this;

                if (_.isEmpty(val)) {
                    return '<span class="label label-default">' + RecruiterApp.polyglot.t("none") + '</span>'
                } else {
                    return _.map(val, function(v) {
                        return (flag) ? 
                            '<span class="label label-primary label-primary-0">' + v.value + '</span>' :
                            '<span class="label label-primary label-primary-' + v.hie + '">' + v.value + '</span>'

                    });
                }
            },
            updateMethod: 'html'
        }
    },
    onRender: function () {
        this.stickit()  
    },
    onShow: function () {
        var self   = this;
            flag   = false,
            domain = self.model.get('domain');

        independentChildFields.forEach(function (fieldName){
            if (domain == 'candidate' || domain == 'job') {

                if (self.model.get('modalTitle') == fieldName) {
                    flag = true

                    return false;
                }
            }
        });

        var currSelectedKey = self.model.get('selectedKey');

        self.SEL_OPT = self.$el.find('input[name="refDataSelOpt"]:checked').val()
        self.GET_PAR = self.$el.find('.btn.getParent').hasClass('active')

        self.model.set('dataNotInRefData', [])

        self.$el.find('#treeView').kendoTreeList({
            height: 400,
            filterable: true,
            sortable: true,     
            columns: [{
                    template: "<input type='checkbox'/>",
                    filterable: false,
                    width: 32
                },{ 
                    title: RecruiterApp.polyglot.t("name"),
                    field: "value", 
                    template: '<span class="data-value" data-name="' + '#=value#' + '" ' + ' data-key="' + '#=key#' + '" data-id="' + '#=id#' + '">#=value#</span>',
                    expandable: true
                },{   
                    title: RecruiterApp.polyglot.t("category") ,
                    field: "category", 
                    width: "328px", 
                },
            ],
            dataBound: function(e) {
                $("button.k-button[data-command='select']").after("<a class='kendo-icon'><i class='fa fa-dot-circle-o checkem'></i><i class='fa fa-circle-o uncheckem'></i></a>");
                $("button.k-button[data-command='select']").remove()

                self.TREE = self.$el.find('#treeView').data('kendoTreeList');
                var dataNotInRefData = [];
                self.model.set('dataNotInRefData', [])

                _.each(currSelectedKey, function(sel) {
                    var selectedTd = self.$el.find('#treeView .data-value[data-key="' + sel.key + '"][data-name="' + sel.value + '"]')

                    if (selectedTd.length != 0) {
                        selectedTd.parents('tr').find('input[type="checkbox"]').prop('checked', 'checked');
                        self.TREE.expand(selectedTd.parents('tr'))
                    } else if (_.isUndefined(_.findWhere(dataNotInRefData, sel))) {
                        dataNotInRefData.push(sel);
                    }
                    self.model.set('dataNotInRefData', dataNotInRefData);
                });
                self.getSelectedData()
                
                self.$el.find(':checkbox')
                    .off('change')
                    .on('change', function (e) {
                        self.getSelectedData();
                    })
            },
            // filterMenuInit: function(e) {
            //     var firstValueDropDown = e.container.find("select:eq(0)").data("kendoDropDownList");
            //     firstValueDropDown.value("contains");
            //     firstValueDropDown.trigger("change");

            //     var logicDropDown = e.container.find("select:eq(1)").data("kendoDropDownList");
            //     logicDropDown.value("or");
            //     logicDropDown.trigger("change");

            //     var secondValueDropDown = e.container.find("select:eq(2)").data("kendoDropDownList");
            //     secondValueDropDown.value("contains");
            //     secondValueDropDown.trigger("change");
            // },
            // change: function(e) {
            //     self.getSelectedData(true)
            // }
        });

        var dataSource = new kendo.data.TreeListDataSource({
            transport: {
                read: {
                    url:  self.getRefDataByType(self.model.get('modalTitle')),
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

        self.TREE.setDataSource(dataSource);

        function toggleAll(e) {
            var view = dataSource.view();
            var checked = e.target.checked;
            
            for (var i = 0; i < view.length; i++) {
                view[i].set("checked", checked);
            }
        }

        // hack to focus on treeview filter menu
        // known kendo bug: http://www.telerik.com/forums/column-menu-filter-input-box-not-selectable
        $(document).off('focusin.modal');

        var permissionHelper = new PermissionHelper();
        permissionHelper.processView('refdataHierarchy', this);
    },

    getRefDataByType : function(type) {
        type = type.replace('List', '')
        return RecruiterApp.config.API_ROOT + '/refData/type' + (type ? '/' + type : 's');
    },

    getSelectedData: function () {

        var self = this;
        
        var selectedKey = _.map(self.$el.find('#treeView td :checkbox:checked'), function(checkbox) {
            var dat = $(checkbox).parents('tr').find('.data-value')
            return {
                value: dat.data('name'),
                key: dat.data('key'),
                id: dat.data('id'),
                hie: dat.parent().find('.k-icon').length - 1
            }
        });
        self.model.set('selectedKey', selectedKey)

        if (self.GET_PAR && !flag) {
            self.getParent()
        }

        return selectedKey
        // var selected                    = self.TREE.select()
        
        // if (selected.length == 0) return false
        
        // var selectedKey                 = _.pluck(self.model.get('selectedKey'), 'key'),
        //     selectedKeyValue            = [],
        //     selectedKeyAccordingtoKendo = []

        // _.each(selected, function(sel) {
        //     sel = self.TREE.dataItem(sel)

        //     selectedKeyValue.push({ value: sel.value, key: sel.key, id: sel.id })
        //     selectedKeyAccordingtoKendo.push(sel.key)
        // });
        
        // selectedKeyValue = _.union(selectedKeyValue, self.model.get('dataNotInRefData')); 

        // self.model.set('selectedKey', selectedKeyValue)
        
        // /** 
        //  * if selectedKey is not equal to what is according to Kendo and SEL_OPT
        //  * is 'byGrp' then process value
        //  */ 
        // if (!_.isEqual(selectedKey, selectedKeyAccordingtoKendo)) {
        //     _.each(selected, function(sel) {
        //         sel = self.TREE.dataItem(sel)
        //         if (sel.hasChildren && self.SEL_OPT == 'byGrp') self.getChild(sel);
        //         if (self.GET_PAR) self.getParent(sel);
        //     });
        // }
        // console.log(selectedKeyValue)
        // return selectedKeyValue
    },

    getChild: function(sel) {
        var self        = this;
        var selected    = self.TREE.select()
        var selectedKeyAccordingtoKendo = _.map(selected, function(sel) {
            sel = self.TREE.dataItem(sel)
            return {key: sel.key, id: sel.id}
        });
        var childNodes = self.TREE.dataSource.childNodes(sel)

        _.each(childNodes, function(cn) {
            cn = self.TREE.dataItem(cn)
            // if cn (childNode) is not is the selectedKeyAccordingtoKendo, then tell treeView to select
            if (_.isUndefined(_.findWhere(selectedKeyAccordingtoKendo, {key: cn.key, id: cn.id}))) {
                childRow = self.$el.find('#treeView tr[data-uid="' + cn.uid + '"]')
                self.TREE.select(childRow)
            }
        });
    },

    getParent: function (sel) {
        var self        = this;
        // var selected    = self.TREE.select()
        var selectedKey = self.model.get('selectedKey')

        // var selectedKeyAccordingtoKendo = _.map(selected, function(sel) {
        //     sel = self.TREE.dataItem(sel)
        //     return {key: sel.key, id: sel.id}
        // });
        // console.log(selectedKey)

        var parents = new HierarchyParent();

        _.each(selectedKey, function(key) {
            parents.refDataId = key.id
            parents.fetch({
                success: function () {
                    _.each(parents.toJSON(), function(par) {
                        if (_.isUndefined(_.findWhere(selectedKey, {key: par.key, id: par.id}))) {
                            self.$el.find('span[data-name="' + par.value + '"][data-key="' + par.key + '"]')
                                .parents('tr')
                                .find('input:checkbox')
                                .attr('checked', 'checked');

                            self.getSelectedData();
                        }
                        // self.TREE.select(parentRow)
                    });
                }
            })
        });
    },

    confirmData: function() {
        this.trigger('refdataSelected', this.getSelectedData());
    },

    changeSelectOption: function (e) {
        this.SEL_OPT = $(e.currentTarget).val()
        
        // byGrp cannot be used together with "get parent"
        if (this.SEL_OPT == 'byGrp') {
            this.$el.find('.getParent').attr('disabled', true)
            this.$el.find('.getParent').removeClass('active')
            this.GET_PAR = false;
        } else {
            this.$el.find('.getParent').removeAttr('disabled')
        }
    },

    toggleParentOption: function (e) {
        var self = this;
        _.defer(function(){ self.GET_PAR = $(e.currentTarget).hasClass('active') });
    }
});