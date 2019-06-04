var _                           = require('underscore'),
    Backbone                    = require('backbone'),
    PermissionHelper            = require("../../session/models/PermissionHelper"),
    ReferenceDataList           = require('../../common/models/ReferenceDataList'),
    Session                     = require("../../session/models/Session"),
    moment                      = require('moment'),
    BaseGridView                = require('../../common/views/BaseGridView'),
    UserHotListHelpers          = require('../../userHotList/UserHotListHelpers'),
    CheckPermissionBehavior     = require('../../session/behaviors/CheckPermissionBehavior'),  
    UserPreference              = require('../../admin/user/models/UserPreference'),          
    grid,
    self, _dataSource, _kendoMenu, _saved, _departmentList;
    
module.exports = ClientGridView = BaseGridView.extend({

    template: _.template(
        `<div id="menu"></div>
        <div id="grid" class="KENDO-GRID"></div>`
    ),

    initialize : function (options){
        self = this;
        var session = new Session()

        self.currentPage = options.currentPage;
        self.pageSize    = options.pageSize;
        self.filterArray = options.filterArray;
        self.columnArray = [];
        self.permissionConfig = {};
        self.TYPE = 'client';
        self.VIEW = 'clientGridView';
        self.PERMISSIONS_FOR_VIEW = session.getPermissionsForView(self.VIEW);

        // Setting up the helper functions
        self.userHotListHelpers = new UserHotListHelpers()
        self.userHotListHelpers.SELF = self
        self.userHotListHelpers.KENDO = true
        self.userHotListHelpers.TYPE = self.TYPE

        window.Octus.BaseKendoGrid = this;
    },

    onShow: function () {
        _departmentList = {data: window.Octus.departmentList.toJSON().map(dat => { return { value: dat.value } })};

        if (localStorage[self.TYPE + 'Filter'] == '[]') {
            localStorage.removeItem(self.TYPE + 'Filter')
            localStorage.removeItem(self.TYPE + 'FilterId')
            localStorage.removeItem(self.TYPE + 'Sort')
            localStorage.removeItem(self.TYPE + 'SearchCriteria') 
            localStorage.removeItem(self.TYPE + 'CurrentSavedSearch')
        }
        
        if (!_.isNull(self.PERMISSIONS_FOR_VIEW)) {
            self.buildKendoGrid();
            self.LOAD_SAVED_SEARCHES()
            self.userHotListHelpers.LOAD_SAVED_HOTLIST()    

        } else {
            RecruiterApp.core.vent.trigger('unBlockUI');
            console.log("Permission do not exist for " + self.VIEW);
        }
    },

    loadKendoGrid: function (saved) {
        if (!_kendoMenu) return false;

        var self            = this, optionsObj;
        var grid            = $("#grid").getKendoGrid();

        var options         = localStorage[self.TYPE + "GridOpt"];
        
        // Deprecated 2.14 moving kendo to checkbox select
        // var _selectable     = !self.baseFn.REDUCE_FUNCTION().touch ? 'multiple, row' : false // $('html').hasClass('no-touch') ? 'multiple, row' : false
        var _menuData       = _kendoMenu.data('kendoMenu');

        if (!_menuData) return false;

        var _menuItems      = _menuData.element.find('.k-menu-group .k-item');

        var _format         = {
            filter: function (read) {
                optionsObj.dataSource.filter = self.FORMAT_LOAD_KENDO_FILTER();

                var createdColumn               = _.findWhere(optionsObj.columns, {field: "created"}),
                    updateColumn                = _.findWhere(optionsObj.columns, {field: "updated"}),
                    industryLisColumn           = _.findWhere(optionsObj.columns, {field: "industryList"}),
                    skillLisColumn              = _.findWhere(optionsObj.columns, {field: "skillList"}),
                    // documentSearchColumn        = _.findWhere(optionsObj.columns, {field: "attachmentList"}),
                    consultantLisColumn         = _.findWhere(optionsObj.columns, {field: "consultantList"}),
                    specializationListColumn    = _.findWhere(optionsObj.columns, {field: "specializationList"}),
                    countryColumn               = _.findWhere(optionsObj.columns, {field: "country"}),
                    statusColumn                = _.findWhere(optionsObj.columns, {field: "status"});

                if (createdColumn)              createdColumn.filterable.cell.template              = self.DEFINE_TEMPLATE;
                if (updateColumn)               updateColumn.filterable.cell.template               = self.DEFINE_TEMPLATE;
                if (industryLisColumn)          industryLisColumn.filterable.cell.template          = self.DEFINE_TEMPLATE;
                if (skillLisColumn)             skillLisColumn.filterable.cell.template             = self.DEFINE_TEMPLATE;
                if (consultantLisColumn)        consultantLisColumn.filterable.cell.template        = self.DEFINE_TEMPLATE;
                // if (documentSearchColumn)       documentSearchColumn.filterable.cell.template       = self.DEFINE_TEMPLATE;
                if (specializationListColumn)   specializationListColumn.filterable.cell.template   = self.DEFINE_TEMPLATE;
                if (statusColumn)               statusColumn.filterable.cell.template               = self.DEFINE_TEMPLATE;
                if (countryColumn)              countryColumn.filterable.cell.template              = self.DEFINE_TEMPLATE;

                // Deprecated 2.14 moving kendo to checkbox select
                // optionsObj.selectable = _selectable

                optionsObj.dataSource.page = self.currentPage; // This value was changed from localStorage value, hence it is being reassigned here. There may be more values that require similar treatment.
                grid.setOptions(optionsObj);
                if (read) grid.dataSource.read();
                return this;
            },
            menuItem: function () {
                _.each(optionsObj.columns, function(val, key){
                    if (val.hidden) {
                        _menuItems.find('input[data-field="' + val.field + '"]')
                            .prop('checked', false)
                    } else {
                        _menuItems.find('input[data-field="' + val.field + '"]')
                            .prop('checked', true)
                    }
                });
                return this;
            },
        }

        if (_.isUndefined(options) && _.isUndefined(saved)) {
            RecruiterApp.core.vent.trigger('app:DEBUG:warn', ['Kendo','no previous state'])

            // Deprecated 2.14 moving kendo to checkbox select
            // grid.setOptions({ selectable: _selectable });
            grid.dataSource.read();
        } else {
            if (_.isUndefined(saved)) {
                RecruiterApp.core.vent.trigger('app:DEBUG:warn', ['Kendo','loading ' + moment().format('h:mm:ss.SSS a')]);

                if (!_.isUndefined(options) && !_.isNull(options)) {
                    optionsObj = JSON.parse(options);
                    _format.filter(true).menuItem()
                }
            } else {
                RecruiterApp.core.vent.trigger('blockUI', RecruiterApp.polyglot.t('loading') + ' ' + saved.name);
                RecruiterApp.core.vent.trigger('app:DEBUG:warn', ['Kendo','loading:' + saved.name + ', ' + moment().format('h:mm:ss.SSS a')]);

                // clean up the URL
                var transportRead       = saved.options.dataSource.transport.read;
                var transportReadURL    = transportRead.url;
                var rootDomain          = self.EXTRACT_ROOT_DOMAIN(transportReadURL);
                var currDomain          = self.EXTRACT_ROOT_DOMAIN(RecruiterApp.config.API_ROOT);

                if (rootDomain != currDomain) {
                    const _ui_root_noport = (typeof UI_ROOT_noport != "undefined") ? UI_ROOT_noport : RecruiterApp.polyglot.t('undefined');
                    RecruiterApp.core.vent.trigger('app:message:error', '<b>' + RecruiterApp.polyglot.t('sorry') + ':</b> ' + RecruiterApp.polyglot.t('theEndpoint') + ' <b>' + rootDomain + '</b> ' + RecruiterApp.polyglot.t('isDifferentFromYourRootDomain') + ' <b>' + _ui_root_noport + '</b>.<br><br>' + RecruiterApp.polyglot.t('CORsNotAllowed') + '.');
                    RecruiterApp.core.vent.trigger('unBlockUI');
                } else {
                    
                    if (!_.isUndefined(saved.options) && !_.isNull(saved.options)) {

                        saved.options.dataSource.transport.read.url = transportReadURL.replace(/^https?:\/\//, location.protocol + '//')
                        
                        optionsObj = saved.options;
                        _format.filter(false)

                        grid.dataSource.filter(saved.criteria);
                        _saved = saved.options

                        localStorage[self.TYPE + 'QueryBuilder']            = saved.queryBuilder     ? JSON.stringify(saved.queryBuilder) : '';
                        localStorage[self.TYPE + 'Filter']                  = saved.criteria         ? JSON.stringify(saved.criteria.filters) : '';
                        localStorage[self.TYPE + 'Sort']                    = optionsObj.dataSource  ? JSON.stringify(optionsObj.dataSource.sort) : '';
                        localStorage[self.TYPE + 'CurrentSavedSearch']      = saved.name;
                        $("#menu").data("kendoMenu").close('.savedSearches')
                    }
                }
            }
        }
    },

    buildKendoGrid: function() {
        RecruiterApp.core.vent.trigger('app:DEBUG:warn', ['Kendo','building ' + moment().format('h:mm:ss.SSS a')]);

        var self = this;
        var session = new Session();
        var permissionApplied = false;
        
        self.KENDO_GRID_BUILT = false;

        
        
        _dataSource = new kendo.data.DataSource({
            schema: {
                data: function(data) {
                    _.each(data.results, function(res){
                        res.skillList               = self.TRUNCATE_LIST(res.skillList, 5, ', ');
                        res.industryList            = self.TRUNCATE_LIST(res.industryList, 5, ', ');
                        res.referenceId             = !_.isNull(res.referenceId)            ?   res.referenceId : '' ;  
                        res.created                 = !_.isNull(res.created)                ?   res.created.join('/') : '';
                        res.updated                 = !_.isNull(res.updated)                ?   res.updated.join('/') : '';
                        res.company                 = !_.isNull(res.company)                ?   res.company : '';
                        res.telephoneList           = _.isArray(res.telephoneList)          ?   _.map(res.telephoneList,        function (tel) { return tel.replace(/^\+0 /g, '') }).join(', ') : '';
                        res.locationList            = _.isArray(res.locationList)           ?   _.map(res.locationList,         function (loc) { return RecruiterApp.polyglot.t(loc) }).join(', ') : '';
                        res.interestList            = _.isArray(res.interestList)           ?   _.map(res.interestList,         function (int) { return RecruiterApp.polyglot.t(int) }).join(', ') : '';
                        res.departmentList          = _.isArray(res.departmentList)         ?   _.map(res.departmentList,       function (dep) { if (dep.value) return dep.value }).join(', ') : '';
                        res.specializationList      = _.isArray(res.specializationList)     ?   _.map(res.specializationList,   function (spe) { if (spe && spe.value) return RecruiterApp.polyglot.t(spe.value) }).join(', ') : '';
                        res.emailAddressList        = _.isArray(res.emailAddressList)       ?   _.pluck(res.emailAddressList, 'address').join(', ') : '';
                        res.country                 = _.isArray(res.addressList)            ?   _.compact(_.pluck(res.addressList, 'country')).join(', ') : '';
                        res.city                    = _.isArray(res.addressList)            ?   _.compact(_.pluck(res.addressList, 'city')).join(', ') : '';
                        res.postalCode              = _.isArray(res.addressList)            ?   _.compact(_.pluck(res.addressList, 'postalCode')).join(', ') : '';
                        res.addressList             = _.isArray(res.addressList)            ?   _.map(res.addressList,          function (add) { return _.values(_.pick(add, 'name_allLines')).join(); }).join('; ') : '';
                        res.keyContact              = res.keyContact == true || res.keyContact == 'true' ? 'true' : '';

                        res.consultantList          = _.isArray(res.consultantList) && !_.isEmpty(res.consultantList)   ?   _.map(res.consultantList, va => {
                            return `${va.allNames} <span class="small email-address">&lt${va.username}&gt;</span>`;
                        }).join('<br>') : '';
                        
                        res.about                   = !_.isNull(res.about)                  ? res.about : '';
                        res.gender                  = !_.isNull(res.gender)                 ? RecruiterApp.polyglot.t(res.gender) : '';
                        res.jobTitle                = !_.isNull(res.jobTitle)               ? RecruiterApp.polyglot.t(res.jobTitle) : '';
                        res.status                  = res.status                            ? res.status.value : '';
                        res.overviewNumberList      = self.FORMAT_OVERVIEW_NUMBERS(res.overviewNumberList, 'client');
                    });

                    self.SAVE_RESULTS_NUMBERS(data);
                    
                    _dataSource = data.results;
                    return data.results;
                },
                total: "totalResults",
                model: { // define the model of the data source. Required for validation and property types.
                    id: "id",
                    fields: {
                        id: {editable: false, nullable: true},
                        updated: {type: 'date'},
                        created: {type: 'date'},
                        firstName: {editable: true, nullable: true},
                        lastName: {validation: {required: true}},
                        emailAddressList: {validation: {required: true}},
                        jobTitle: {validation: {required: true}},
                        telephoneList: {validation: {required: true}},
                        company: {validation: {required: true}}
                    }
                }
            },
            transport: {
                read: {
                    type: 'POST',
                    contentType: 'application/json',
                    url: RecruiterApp.config.API_ROOT + '/search/global/kendo/' + self.TYPE,
                    dataType: 'json'
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
                },
                parameterMap: function(data, type) {

                    if (_.isUndefined(data.filter)) {
                        data.filter = {
                            filters: [{ field:"all", operator:"contains", value:"" }]
                        }
                    } else {

                        _.each(data.filter.filters, function(fl) {

                            if (_.isUndefined(fl)) return false;

                            var fl_val = '';

                            if (fl.operator == 'nested') {
                                fl_val = JSON.stringify(fl.filters);
                            } else {
                                fl_val = (!_.isUndefined(fl.value) && !_.isNull(fl.value)) ? fl.value.toString() : '';
                            }

                            if (_.isUndefined(fl.operator)) fl.operator = "contains";

                            // remove the last quotation mark
                            if (!_.isUndefined(fl_val) && (fl_val.match(/"/g) || []).length % 2 == 1) {
                                var pos = fl_val.lastIndexOf('"')
                                fl.value = fl_val.substring(0, pos) + '' + fl_val.substring(pos + 1)
                            }

                            // catch the unclosed brackets
                            if (!_.isUndefined(fl_val) && !self.CHECK_BRACKETS(fl_val)) {
                                // remove all brackets
                                fl.value = fl.value.replace(/[\])}[{(]/g, '');
                            };

                            // google analytics
                            if (fl.field != "_all" && fl.field != "all" && fl.field != "All" && fl.field != "dataQuality" && !_.isUndefined(fl_val)) {
                                RecruiterApp.core.vent.trigger('ga:send', { 
                                    hitType: 'event', 
                                    eventCategory: self.TYPE + 'Grid',
                                    eventAction: 'Filter',
                                    eventLabel: fl.field,
                                });
                            }

                            self.CHECK_NON_VALUE_FILTER(fl);
                        });
                        
                        var addressList         = _.findWhere(data.filter.filters, {field: 'addressList'});
                        var emailAddressList    = _.findWhere(data.filter.filters, {field: "emailAddressList"});
                        var consultantList      = _.findWhere(data.filter.filters, {field: "consultantList"});
                        var departmentList      = _.findWhere(data.filter.filters, {field: "departmentList"});
                        var keyContactFilter    = _.findWhere(data.filter.filters, {field: "keyContact"});
                        var specialization      = _.findWhere(data.filter.filters, {field: 'specializationList'});
                        var documentFilter      = _.findWhere(data.filter.filters, {field: "attachmentList"});
                        var status              = _.findWhere(data.filter.filters, {field: "status"});
                        var city                = _.findWhere(data.filter.filters, {field: 'city'});
                        var country             = _.findWhere(data.filter.filters, {field: 'country'}); 
                        var postalCode          = _.findWhere(data.filter.filters, {field: 'postalCode'}); 
                        var sortData            = data.sort;

                        if (emailAddressList)   { 
                            emailAddressList.field = "emailAddressList.address"; 
                            emailAddressList.value = emailAddressList.value.replace(/,/g, ''); 
                        }
                        if (keyContactFilter)   {
                            if (keyContactFilter.value == 'true' || keyContactFilter.value == true) {
                                keyContactFilter.value = true;
                            } else {
                                keyContactFilter.value = '';
                            }
                        }

                        if (addressList)        addressList.field       = 'addressList.name_allLines'
                        if (city)               city.field              = 'addressList.city'
                        if (country)            country.field           = 'addressList.country'
                        if (postalCode)         postalCode.field        = 'addressList.postalCode'
                        if (consultantList)     consultantList.field    = "consultantList.allNames";
                        if (departmentList)     departmentList.field    = "departmentList.value";
                        if (specialization)     specialization.field    = 'specializationList.value';
                        if (status)             status.field            = 'status.value';
                        if (documentFilter)     documentFilter          = self.PROCESS_DOCUMENT_FILTER_VALUE(documentFilter);

                        self.REMOVE_SPECIAL_CHARACTERS(data, 'locationList');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'interestList');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'telephoneList');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'addressList.allLines');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'addressList.name_allLines');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'addressList.city');
                        
                    }

                    /*
                     * The default sort behavior is "Created" desc date 
                     * if there is no criteria within the searching field or filters.
                     */
                     self.SET_DEFAULT_SORT(data);

                    _.each(sortData, function(sd){
                        if (sd.field == 'addressList')        { sd.field = 'addressList.name_allLines' }
                        if (sd.field == 'city')               { sd.field = 'addressList.city' }
                        if (sd.field == 'country')            { sd.field = 'addressList.country' }
                        if (sd.field == 'postalCode')         { sd.field = 'addressList.postalCode' }
                        if (sd.field == "emailAddressList")   { sd.field = "emailAddressList.address" }
                        if (sd.field == "departmentList")     { sd.field = "departmentList.value" }
                        if (sd.field == "consultantList")     { sd.field = "consultantList.allNames" }
                        if (sd.field == 'specializationList') { sd.field = 'specializationList.value'; }
                        if (sd.field == 'status')             { sd.field = 'status.value'; }
                    });
                    
                    data.filter.filters = self.REMOVE_DUPLICATE_FILTER(data.filter.filters);
                    data.filter.filters = self.REMOVE_EMPTY_CONTAINS_FILTER(data.filter.filters);

                    return kendo.stringify(data);
                }
            },
            error: function(e) {
                RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('domainGridErrorMessage'));

                /**
                 * Deprecated since 2.14
                 * Most grid config was moved to the server => this has no effect.
                 */
                // localStorage.removeItem(self.TYPE + 'CurrentPage')
                // localStorage.removeItem(self.TYPE + 'GridOpt')
                // localStorage.removeItem(self.TYPE + 'Filter')
                // localStorage.removeItem(self.TYPE + 'Menu')
                // localStorage.removeItem(self.TYPE + 'SearchCriteria')
                // localStorage.removeItem(self.TYPE + 'CurrentSavedSearch')
                // localStorage.removeItem(self.TYPE + 'FilterId')
                // localStorage.removeItem(self.TYPE + 'QueryBuilder')
                
                // if ($("#grid").length > 0) {
                //     alert('There seems to be an issue. Click here to fix it.')
                //     location.reload();
                // }
            },
            requestStart: function () {
                RecruiterApp.core.vent.trigger('app:DEBUG:info', ['datasource', 'request start at ' + moment().format('h:mm:ss.SSS a')]);
            },
            requestEnd: function () {
                RecruiterApp.core.vent.trigger('app:DEBUG:info', ['datasource', 'request end at ' + moment().format('h:mm:ss.SSS a')]);
            },
            filter: self.filterArray,
            serverSorting: true,
            serverFiltering: true,
            serverPaging: true,
            page: self.currentPage,
            pageSize: self.pageSize
        });

        self.DESTROY_EXISTING_KENDO()

        grid = $("#grid").kendoGrid(_.extend({
            dataSource: _dataSource,
            sort            : function () { self.PERSIST_KENDO_GRID(); },
            columnResize    : function () { self.PERSIST_KENDO_GRID(); },
            columnReorder   : function () { self.PERSIST_KENDO_GRID(); },
            excelExport     : function(e) {
                e.workbook.fileName = "ClientGrid.xlsx";
                self.CLEANUP_EXCEL_EXPORT(e, this);
            },
            change: function (e) {
                e.preventDefault();
                var gview = $("#grid").data("kendoGrid");
                var selectedItem = gview.dataItem(gview.select());
                if (!selectedItem) {
                    self.SHOW_MORE_ACTIONS(false);
                } else {
                    self.SHOW_MORE_ACTIONS(true);
                }

                // Deprecated 2.14 moving kendo to checkbox select
                // if (gview.select().length == 0) {
                //     $("#menu .unselectAll").addClass('hidden');
                //     $("#menu .selectAll").removeClass('hidden');
                // } else if (gview.select().length < (self.pageSize * 2) && gview.select().length > 0) {
                //     $("#menu .unselectAll").removeClass('hidden');
                //     $("#menu .selectAll").removeClass('hidden');
                // } else {
                //     $("#menu .unselectAll").removeClass('hidden');
                //     $("#menu .selectAll").addClass('hidden');
                // }


                // var id = selectedItem.id;
                // var eventTarget = (event.target) ? $(event.target) : $(event.srcElement);
                // var className = eventTarget.parent().context.className;

                // // check parents
                // var parentRow = eventTarget.parent();
                // var parentsFreeze = eventTarget.parents('.k-grid-content-locked').length > 0 ? true : false;

                // if ( className.indexOf("deleteAction") > -1) {
                //     $('.tooltip').remove();
                //     RecruiterApp.core.vent.trigger(self.TYPE + 'List:delete', id);
                // } else if( className.indexOf("editAction") > -1) {
                //     $('.tooltip').remove();
                //     window.location.href =  "#/" + self.TYPE + "/" + id + "/edit";
                // } else if( ( className.indexOf("linkedInAction") > -1)  && (className.indexOf("disabledKendoBtn") == -1)  ) {
                //     $('.tooltip').remove();
                //     var link = selectedItem.linkedIn;

                //     //this is for hyperlink which doesnt work in template
                //     if (link.indexOf(RecruiterApp.config.UI_ROOT) > -1) {
                //         link = link.replace(RecruiterApp.config.UI_ROOT + '/', '');
                //     }

                //     if (link.indexOf('http://') == -1 && link.indexOf('https://') == -1) {
                //         link = 'http://' + link;
                //     }

                //     window.open(link);
                    
                // } else if ( parentsFreeze ) {
                //     self.SHOW_MORE_ACTIONS(true);
                // } else if ( !parentsFreeze ) {
                //     self.SHOW_MORE_ACTIONS(true);
                // }
            },
            columns: [ 
                {
                    field: "actionField",
                    title: RecruiterApp.polyglot.t("action"),
                    headerAttributes: {'class': 'actionField'},
                    width: "130px",
                    // Deprecated 2.14 moving kendo to checkbox select
                    // locked: true,
                    filterable: false,
                    template: `
                        <a class="kendo-icon edit-cli wb" href="\\#/${self.TYPE}/#=id#/edit" title="${RecruiterApp.polyglot.t('edit')}">
                            <i class="kendo-icon fa fa-pencil fa-lg text-success"></i>
                        </a>
                        <span class="kendo-icon delete-cli deleteAction wb" data-recordId="#=id#" title="${RecruiterApp.polyglot.t('delete')}">
                            <i class="kendo-icon fa fa-trash-o fa-lg text-danger" ></i>
                        </span>
                        <a class="kendo-icon note-record wb" href="\\#/${self.TYPE}/#=id#/notes/add" title="${RecruiterApp.polyglot.t('note')}">
                            <i class="kendo-icon fa fa-sticky-note-o fa-lg text-primary"></i>
                        </a>
                        #if (linkedIn) {#
                            <a class="kendo-icon linkedin wb" href="#=linkedIn#" target="_blank" title="${RecruiterApp.polyglot.t('linkedIn')}">
                            <i class="kendo-icon fa fa-linkedin-square fa-lg"></i>
                            </a>
                        #}#`
                    ,

                    // Deprecated 2.14 moving kendo to checkbox select
                    //   }
                    // command:
                    //     [
                    //         {
                    //             name: "Linkedin",
                    //             // template: '<a class="kendo-icon linkedin wb" href="/#=linkedIn#/" data-toggle="tooltip" data-container="body" title="' + RecruiterApp.polyglot.t('linkedIn') + '"><i class="kendo-icon fa fa-linkedin-square fa-lg linkedInAction"></i></a>'
                    //             template: (dataItem) => {
                    //                 if (dataItem.linkedIn) {
                    //                     return `<a class="kendo-icon linkedin wb" href="${dataItem.linkedIn}" data-toggle="tooltip" data-container="body" title="'${RecruiterApp.polyglot.t('linkedIn')}">
                    //                         <i class="kendo-icon fa fa-linkedin-square fa-lg"></i>
                    //                     </a>`;
                    //                 } else {
                    //                     return `<span class="kendo-icon linkedin wb" data-toggle="tooltip" data-container="body" title="'${RecruiterApp.polyglot.t('linkedIn')}">
                    //                         <i class="kendo-icon fa fa-linkedin-square fa-lg"></i>
                    //                     </span>`;
                    //                 }
                    //                 // return "<strong>" + kendo.htmlEncode(dataItem.name) + "</strong>";
                    //               }
                    //         },
                    //         {
                    //             name: "Edit",
                    //             // template: '<a class="kendo-icon edit-cli wb" href="'+'\\#/' + self.TYPE + '/#=id#/edit" data-toggle="tooltip" data-container="body" title="' + RecruiterApp.polyglot.t('edit') + '"><i class="kendo-icon fa fa-pencil fa-lg editAction text-success"></i></a>'
                    //         },
                    //         {
                    //             name: "Delete",
                    //             template: '<a class="kendo-icon delete-cli wb" data-toggle="tooltip" data-container="body" title="' + RecruiterApp.polyglot.t('delete') + '"><i class="kendo-icon fa fa-trash-o fa-lg deleteAction text-danger" ></i></a>'
                    //         }
                    //         // Deprecated 2.14 moving kendo to checkbox select
                    //         // {
                    //         //     name: "CheckEm",
                    //         //     template: '<a class="kendo-icon radioCheck"><i class="fa fa-lg fa-dot-circle-o checkem"></i><i class="fa fa-lg fa-circle-o uncheckem"></i></a>'
                    //         // }
                    //     ]
                },
                { 
                    selectable: true, 
                    width: "35px"
                },
                {
                    field: "referenceId",
                    title: RecruiterApp.polyglot.t("referenceId"),
                    template: '#if (referenceId) {#<a class="viewRecord" href='+'\\#/' + self.TYPE + '/#=id#/dashboard>#=referenceId#</a>#}#',
                    hidden: true,
                    headerAttributes: {'class': 'wb ReferenceId' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "created",
                    title: RecruiterApp.polyglot.t("created"),
                    hidden: true,
                    headerAttributes: {'class': 'wb Created' },
                    format: "{0:dd/MM/yyyy}",
                    width: '240px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "createdBy",
                    title: RecruiterApp.polyglot.t("createdBy"),
                    hidden: true,
                    headerAttributes: {'class': 'wb CreatedBy' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "updated",
                    title: RecruiterApp.polyglot.t("updated"),
                    hidden: true,
                    headerAttributes: {'class': 'wb Updated' },
                    format: "{0:dd/MM/yyyy}",
                    width: '240px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "updatedBy",
                    title: RecruiterApp.polyglot.t("updatedBy"),
                    hidden: true,
                    headerAttributes: {'class': 'wb UpdatedBy' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {field: "firstName",
                    title: RecruiterApp.polyglot.t("firstName"),
                    template: '<a class="viewRecord" href='+'\\#/' + self.TYPE + '/#=id#/dashboard>#=firstName#</a>',
                    hidden: true,
                    headerAttributes: {'class': 'wb FirstName' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "lastName",
                    title: RecruiterApp.polyglot.t("lastName"),
                    template: '<a class="viewRecord" href='+'\\#/' + self.TYPE + '/#=id#/dashboard>#=lastName#</a>',
                    hidden: true,
                    headerAttributes: {'class': 'wb LastName' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "gender",
                    title: RecruiterApp.polyglot.t("gender"),
                    hidden: true,
                    headerAttributes: {'class': 'wb Gender' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "eq"
                        }
                    }
                }, {
                    field: "emailAddressList",
                    title: RecruiterApp.polyglot.t("email"),
                    template: '# if (emailAddressList != undefined && emailAddressList != "") { # #var emailAddressListArray = emailAddressList.split(",")# #for(var i=0;i<emailAddressListArray.length;i++) { # <a href="mailto:#=emailAddressListArray[i] #"> #=emailAddressListArray[i]# </a> # if (i<emailAddressListArray.length-1) { # <span>,</span> #}}}#',
                    hidden: true,
                    headerAttributes: {'class': 'wb EmailAddressList'},
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "telephoneList",
                    title: RecruiterApp.polyglot.t("telephone"),
                    type: "string",
                    template: '# if (telephoneList  != undefined && telephoneList[0] && telephoneList != "") { ##var telephoneListArray = telephoneList.split(",")# #for(var i=0;i < telephoneListArray.length;i++) { # <a href="tel:#=telephoneListArray[i].replace(/[()\\- ]/g, "") #"> #=telephoneListArray[i]# </a> # if (i < telephoneListArray.length-1) { # <span>,</span> #}}}#',
                    hidden: true,
                    headerAttributes: {'class': 'wb TelephoneList' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "addressList",
                    title: RecruiterApp.polyglot.t("address"),
                    headerAttributes: {'class': 'wb AddressList'},
                    hidden: true,
                    // sortable: false,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "city",
                    title: RecruiterApp.polyglot.t("city"),
                    headerAttributes: {'class': 'wb city'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "country",
                    title: RecruiterApp.polyglot.t("country"),
                    headerAttributes: {'class': 'wb country'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "postalCode",
                    title: RecruiterApp.polyglot.t("zIP/postalCode"),
                    headerAttributes: {'class': 'wb postalCode'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "company",
                    title: RecruiterApp.polyglot.t("company"),
                    template: '<a class="viewRecord" href='+'\\#/company/#=companyId#/dashboard>#=company#</a>',
                    hidden: true,
                    headerAttributes: {'class': 'wb Company' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "jobTitle",
                    title: RecruiterApp.polyglot.t("title"),
                    hidden: true,
                    headerAttributes: {'class': 'wb JobTitle' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "overviewNumberList",
                    title: RecruiterApp.polyglot.t("overviewNumbers"),
                    headerAttributes: {'class': 'wb OverviewNumberList'},
                    hidden: false,
                    encoded: false,
                    width: '130px',
                    filterable: false
                },{
                    field: "locationList",
                    title: RecruiterApp.polyglot.t("locations"),
                    template: '#if(locationList != undefined && locationList[0]) { ##var locationListArray = locationList.split(",") ##for(var i=0;i<locationListArray.length;i++) { ##=locationListArray[i]## if (i<locationListArray.length-1) { #<span>,</span>#}}}#',
                    hidden: true,
                    headerAttributes: {'class': 'wb LocationList' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "skillList",
                    title: RecruiterApp.polyglot.t("skill"),
                    hidden: true,
                    encoded: false,
                    headerAttributes: {'class': 'wb SkillList'},
                    width: '240px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "interestList",
                    title: RecruiterApp.polyglot.t("interest"),
                    template: '#if (interestList != undefined && interestList[0]) { # #var interestListArray = interestList.split(",")# #for(var i=0;i<interestListArray.length;i++) { # #=interestListArray[i]# # if (i<interestListArray.length-1) { # <span>,</span> #}}}#',
                    hidden: true,
                    headerAttributes: {'class': 'wb InterestList' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "specializationList",
                    title: RecruiterApp.polyglot.t("specializations"),
                    headerAttributes: {'class': 'wb SpecializationList'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "industryList",
                    title: RecruiterApp.polyglot.t("industry"),
                    hidden: true,
                    encoded: false,
                    headerAttributes: {'class': 'wb IndustryList' },
                    width: '240px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "consultantList",
                    title: RecruiterApp.polyglot.t("consultant"),
                    hidden: true,
                    encoded: false,
                    headerAttributes: {'class': 'wb Consultant' },
                    width: '320px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "keyContact",
                    title: RecruiterApp.polyglot.t("keyContact"),
                    attributes: {
                        "class": "text-align-center"
                    },
                    hidden: true,
                    headerAttributes: {'class': 'wb KeyContact' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "eq"
                        }
                    }
                }, {
                    field: "about",
                    title: RecruiterApp.polyglot.t("about"),
                    hidden: true,
                    headerAttributes: {'class': 'wb GeneralComments' },
                    template: "<div class='truncated' title='#= about #'>#= about # </div>",
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "departmentList",
                    title: RecruiterApp.polyglot.t("department"),
                    hidden: true,
                    headerAttributes: {'class': 'wb DepartmentList' },
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains",
                            dataSource: _departmentList,
                            dataTextField: "value"
                        }
                    }
                }, {
                    field: "status",
                    title: RecruiterApp.polyglot.t("clientContactStatus"),
                    hidden: true,
                    encoded: false,
                    headerAttributes: {'class': 'wb Status' },
                    width: '320px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "attachmentList",
                    title: RecruiterApp.polyglot.t("documents"),
                    headerAttributes: {'class': 'wb Documents'},
                    hidden: true,
                    width: "170px",
                    template: "#if(attachmentList && attachmentList.length>0){#<button type='button' class='btn btn-info btn-xs showDocuments' id='#=id#'><i class='fa fa-eye fa-lg'></i> " + RecruiterApp.polyglot.t('showDocuments') + "</button> #}else{# <button type='button' class='btn btn-xs disabled disbledBtn'><i class='fa fa-eye fa-lg'></i> " + RecruiterApp.polyglot.t('showDocuments') + "</button> #}#",
                    sortable: false,
                    filterable: {
                        cell: {
                            minLength: 100,
                            operator: "contains"
                        }
                    }
                }
            ],
            dataBound: function(e) {

                if ($('#grid').length == 0) return false;

                var _grid               = $("#grid").data("kendoGrid");
                var currentPage         = $("#grid").data("kendoGrid").dataSource.page();
                var curSavedSearch      = localStorage.getItem(self.TYPE + 'CurrentSavedSearch');
                var curSavedSearchId    = localStorage.getItem(self.TYPE + 'FilterId');

                localStorage.setItem(self.TYPE + "CurrentPage", currentPage);
                _grid.dataSource.filter().filters = _.compact(_grid.dataSource.filter().filters);

                self.CONFIGURE_FILTERS_FOR_EMPTY(_grid);

                var filterDetail        = JSON.stringify(_grid.dataSource.filter().filters);
                var filterSortDetail    = _.isUndefined(_grid.dataSource.filter()) ? '' : JSON.stringify(_grid.dataSource.filter().filters) + ' | ' + JSON.stringify(_grid.dataSource.sort());
                var allFilter           = _.isUndefined(_grid.dataSource.filter()) ? '' : _.findWhere(_grid.dataSource.filter().filters, {field: "all"});

                if (!_.isUndefined(allFilter)) {
                    var criteria = _.findWhere(grid.dataSource.filter().filters, {field: "all"}).value;
                    localStorage.setItem(self.TYPE + "SearchCriteria", criteria);
                }
                
                RecruiterApp.core.vent.trigger(self.TYPE + 'List:searchBox:update', curSavedSearch, curSavedSearchId, filterSortDetail);

                localStorage.setItem(self.TYPE + "Filter", filterDetail);

                self.trigger('grid:loaded', _grid);

                self.ACTION_LINKEDIN(_dataSource)
                self.ACTION_SHOWDOCUMENTS();
                self.ACTION_FN();
                self.CANCEL_FN();
                
                self.ACTION_DBLCLICK_KENDO('client');
                self.ACTION_DELETE_RECORD('client');
                self.ACTION_FORMAT_RANGE_INPUT();

                self.ACTION_SHOWMORE();
                
                self.APPLY_PERMISSIONS();

                if (!_.isUndefined(_saved) && !_.isNull(_saved) && !_.isEmpty(_saved)) {

                    _.each($('#grid').getKendoGrid().columns, function(col) {
                        var _col = _.findWhere(_saved.columns, {field: col.field})
                        if (!_.isUndefined(_col)) {
                            if (_col.hidden == true) {
                                $('#grid').getKendoGrid().hideColumn(col.field)
                            } else {
                                $('#grid').getKendoGrid().showColumn(col.field)
                            }
                            updateLocalStorage(!_col.hidden, _col.field)
                        };
                    });

                    _saved = ''
                }

                if (self.KENDO_GRID_BUILT) {
                    self.PERSIST_KENDO_GRID()
                } else {
                    self.KENDO_GRID_BUILT = true;        
                    self.CHECK_EMAIL_CONFIG();
                    self.RESIZE_KENDO_LISTENER()
                    clearTimeout(self.ERROR_TIMER)
                    $('#grid').data('kendoGrid').refresh()
                }

                // Refresh Kendo menu - Select Columns
                self.REFRESH_SELECTED_COLUMNS();
                self.ACTION_FIELD_CONFIG();
                
                self.UPDATE_TOTAL_ITEMS_MESSAGE();

                RecruiterApp.core.vent.trigger('unBlockUI');

                RecruiterApp.core.vent.trigger('app:DEBUG:warn', ['Kendo','built ' + moment().format('h:mm:ss.SSS a')]);
            }
        }, self.KENDO_GRID_DEFAULTS))

        grid = $('#grid').getKendoGrid();

        var clientMenu =  localStorage.getItem(self.TYPE + "Menu");
        if ( clientMenu == null ){
            //default menu
            var columnConfig = {};
            columnConfig["referenceId"]         = { enabled: true };
            columnConfig["created"]             = { enabled: true };
            columnConfig["createdBy"]           = { enabled: false };
            columnConfig["updated"]             = { enabled: false };
            columnConfig["updatedBy"]           = { enabled: false };
            columnConfig["firstName"]           = { enabled: true };
            columnConfig["lastName"]            = { enabled: true };
            columnConfig["gender"]              = { enabled: false };
            columnConfig["emailAddressList"]    = { enabled: false };
            columnConfig["telephoneList"]       = { enabled: true };
            columnConfig["company"]             = { enabled: true };
            columnConfig["jobTitle"]            = { enabled: true };
            columnConfig["status"]              = { enabled: true };
            columnConfig["locationList"]        = { enabled: true };
            columnConfig["skillList"]           = { enabled: true };
            columnConfig["interestList"]        = { enabled: true };
            columnConfig['specializationList']  = { enabled: false };
            columnConfig["industryList"]        = { enabled: true };
            columnConfig["consultantName"]      = { enabled: true };
            columnConfig["keyContact"]          = { enabled: true };
            columnConfig["departmentList"]      = { enabled: false };
            columnConfig['addressList']         = { enabled: false };
            columnConfig['city']                = { enabled: false };
            columnConfig['country']             = { enabled: false };
            columnConfig['postalCode']          = { enabled: false };
            columnConfig['overviewNumberList']  = { enabled: false };

            // Cache grid menu as user preference
            UserPreference.setUserPreference(self.TYPE + "Menu", JSON.stringify(columnConfig));

        }else{
            var columnConfig = JSON.parse(clientMenu);
        }

        for (var i = 0, max = grid.columns.length; i < max; i++) {
            var column = grid.columns[i];
            if (column.field != undefined) {
                var dropDownText;
                var cConfig = columnConfig[column.field];
                if (cConfig != undefined && cConfig.enabled) {
                    dropDownText = "<label><input type='checkbox' checked='checked' " +
                    " class='check' data-field='" + column.field +
                    "'/><span>" + column.title + "</span></label>";
                } else {
                    dropDownText = "<label><input type='checkbox' " +
                    " class='check' data-field='" + column.field +
                    "'/><span>" + column.title + "</span></label>";
                    grid.element.find('[data-field="' + column.field + '"]').attr('data-hide', true);
                }

                self.columnArray.push({
                    encoded: false,
                    cssClass: 'wb',
                    text:dropDownText
                });
            }
        }

        function updateLocalStorage (type,value) {
            delete columnConfig[value];
            columnConfig[value] = {"enabled":type};

            // Cache grid menu as user preference
            UserPreference.setUserPreference(self.TYPE + "Menu", JSON.stringify(columnConfig));

            self.PERSIST_KENDO_GRID();
        };

        _kendoMenu = $("#menu").kendoMenu({
            dataSource: [{
                    text: "<i class='fa fa-check-square-o' aria-hidden='true'></i><span class='hidden-xs'> " + RecruiterApp.polyglot.t("selectColumns") + "</span>",
                    encoded: false,
                    items: self.columnArray,
                    cssClass: "checkbox"
                },
                // Deprecated 2.14 moving kendo to checkbox select
                // {
                //     text: "<i class='fa fa-dot-circle-o' aria-hidden='true'></i><span class='hidden-xs'> " + RecruiterApp.polyglot.t("selectAll") + "</span>",
                //     encoded: false,
                //     cssClass: "selectAll"
                // },
                // {
                //     text: "<i class='fa fa-circle-o' aria-hidden='true'></i><span class='hidden-xs'> " + RecruiterApp.polyglot.t("unselectAll") + "</span>",
                //     encoded: false,
                //     cssClass: "unselectAll hidden"
                // },
                {
                    text: "<span class='fa-stack fa-sm'><i class='fa fa-ban fa-stack-2x text-grey'></i><i class='fa fa-filter fa-stack-1x'></i></span> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("clearFilters") + "</span>",
                    encoded: false,
                    cssClass: 'clearFilter'
                },
                {
                    text: "<i class='fa fa-search' aria-hidden='true'></i> <span class='hidden-xs'> " + RecruiterApp.polyglot.t("savedSearch") + "</span> <span id='saved-searches' class='badge badge-notify'></span>",
                    encoded: false,
                    cssClass: 'wb savedSearches',
                    items: [{
                        text: "<i class='fa fa-plus' aria-hidden='true'></i> <i class='fa fa-search' aria-hidden='true'></i><span class='hidden-xs'>" + RecruiterApp.polyglot.t("saveAs...") + "</span>",
                        encoded: false,
                        cssClass: 'saveSearchAs'
                    }]
                },
                {
                    text: "<span class='glyphicon glyphicon-fire'></span> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("addToHotList") + "</span> <span id='saved-hotLists' class='badge badge-notify'></span>",
                    encoded: false,
                    cssClass: 'wb addToHotList',
                    items: [{
                        text: "<i class='fa fa-plus' aria-hidden='true'></i> <span class='glyphicon glyphicon-fire'></span> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("createAHotList") + "</span>",
                        encoded: false,
                        cssClass: 'createHotList'
                    }]
                },
                // {
                //     text: "<i class='fa fa-envelope' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("emailRecords") + "</span>",
                //     encoded: false,
                //     cssClass: `emailRecords`
                // },
                {
                    text: "<i class='fa fa-users' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("specCv") + "</span>",
                    encoded: false,
                    cssClass: 'wb SpecCv'
                },
                {
                    text: "<i class='fa fa-envelope' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("massMailing") + "</span>",
                    encoded: false,
                    cssClass: 'wb massMailing'
                },
                {
                    text: "<i class='fa fa-trash' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("deleteMultiple") + "</span>",
                    encoded: false,
                    cssClass: 'wb massDelete',
                },
                {
                    text: "<i class='fa fa-eye' aria-hidden='true'></i> <span class='hidden-xs'>Show All Fields</span>",
                    encoded: false,
                    cssClass: !!session.hasPermission('DEBUG') ? 'showAllFields' : 'hidden showAllFields'
                },
                {
                    text: "<i class='fa fa-download' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("export") + "</span>",
                    encoded: false,
                    cssClass: 'wb export',
                    items: [{
                        text: "<i class='fa fa-file-excel-o' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("exportAsExcel") + "</span>",
                        encoded: false,
                        cssClass: 'exportToExcel'
                    },{
                        text: "<i class='fa fa-file-pdf-o' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("exportAsPdf") + "</span>",
                        encoded: false,
                        cssClass: 'exportToPdf hidden'
                    }]
                },
            ],
            openOnClick: true,
            closeOnClick: false,
            animation: false,
            select: function (e) {
                var input           = $(e.item).find("input.check:visible");
                var mainCheckbox    = $(e.item).hasClass('checkbox');
                var field           = $(input).data("field");

                if (input != undefined && field != undefined && !mainCheckbox) {   
                    if ($(input).is(":checked")) {
                        grid.showColumn(field);
                        updateLocalStorage(true,field);
                    } else {
                        grid.hideColumn(field);
                        updateLocalStorage(false,field);
                    }
                    self.PERSIST_KENDO_GRID()
                }
                self.ACTION_KENDO_MENU(e)
            }
        });

        self.SHOW_MORE_ACTIONS(false)
        self.BIND_TO_ERROR()

        setTimeout(function () {self.loadKendoGrid()}, 50)

        var pageSizeDropDownList = grid.wrapper.children(".k-grid-pager").find("select").data("kendoDropDownList");
        pageSizeDropDownList.bind("change", function(e) {
            var pageSize = e.sender.value();
            localStorage.setItem(self.TYPE + "PageSize", pageSize);
        });
    },
});