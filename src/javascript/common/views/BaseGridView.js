var Backbone                    = require('backbone'),
    _ = require('underscore'),
    detectZoom                  = require('detect-zoom'),
    moment                      = require('moment'),
    faker                       = require('faker'),
    numeral         = require('numeral'),
    BaseItemView                = require('../../common/views/BaseItemView'),
    KendoSaveFilter             = require('../../common/views/KendoSaveFilter'),
    KendoShareFilter            = require('../../common/views/KendoShareFilter'),
    Share                       = require('../models/Share.js'),
    UserSearch                  = require('../../userSearch/models/UserSearch'),
    EmailConfig                 = require('../../userProfile/models/EmailConfig'),
    // KendoDocumentsView          = require('./KendoDocumentsView'),
    CalendarRangeView           = require('./CalendarRangeView'),
    AgeRangeView                = require('./AgeRangeView'),
    NatlRangeView               = require('./NatlRangeView'),
    StatusRangeView             = require('./StatusRangeView'),
    LocationRangeView           = require('./LocationRangeView'),
    YearRangeView               = require('./YearRangeView'),
    SalaryRangeView             = require('./SalaryRangeView'),
    QualificationRangeView      = require('./QualificationRangeView'),
    LanguageQueryBuilderView    = require('./LanguageQueryBuilderView'),
    SpecializationRangeView     = require('./SpecializationRangeView'),
    StakeholdersQueryLayout     = require('./StakeholdersQueryLayout'),
    SkillRangeView              = require('./SkillRangeView'),
    CompanyRangeView            = require('./CompanyRangeView'),
    TypeRangeView               = require('./TypeRangeView'),
    JobFnRangeView              = require('./JobFnRangeView'),
    IndustryRangeView           = require('./IndustryRangeView'),
    TeamRangeView               = require('./TeamRangeView');
    ConsultantRangeView         = require('./ConsultantRangeView'),
    JobSourceDetailRangeView    = require('./JobSourceDetailRangeView'),
    ConfirmDeleteView           = require('./ConfirmDeleteView'),
    ReferredRangeView           = require('./ReferredRangeView'),
    AdvancedSalaryRangeView     = require('./AdvancedSalaryRangeView'),
    EmploymentHistoryRangeView  = require('./EmploymentHistoryRangeView'),
    WorkingHoursRangeView       = require('./WorkingHoursRangeView');
    UserPreference              = require('../../admin/user/models/UserPreference');

let _saveTimer,
    stakeholderMap  = {},
    resultsCounters = {},
    setMessageTimeout;

const nonValueFilterOperators   = ['isnull', 'isnotnull', 'isempty', 'isnotempty'];
const menusToBeEnabled          = ['.SpecCv', '.SendJobs', '.sendEmail', '.createHotList', '.massDelete', '.matchCandidates', '.addJob', '.addToThisJob', '.generateCv', '.massMailing'];

const actionBtns                = ['.btn-languageList','.range-languageList','.btn-nationalityList','.range-nationalityList','.btn-seekingLocations','.range-seekingLocations','.btn-specializationList','.range-specializationList','.btn-salary','.range-salary','.btn-calendar','.range-calendar','.btn-consultantList','.range-consultantList','.btn-consultant','.range-consultant','.btn-subsidiaryList','.range-subsidiaryList','.btn-type','.range-type','.btn-industryList','.range-industryList','.btn-skillList','.range-skillList','.btn-referredBy','.range-referredBy','.btn-jobFunctionList','.range-jobFunctionList','.btn-stakeholdersList','.range-stakeholdersList','.btn-organizationUnitList','.range-organizationUnitList','.btn-contractAmount','.range-contractAmount','.btn-country','.range-country','.btn-locationList','.range-locationList','.btn-status','.range-status','.btn-religion','.range-religion','.btn-commission','.range-commission','.btn-candidateCode','.range-candidateCode','.btn-ownVehicle','.range-ownVehicle', '.btn-workflowStatus','.range-workflowStatus','.btn-shortlistStatus','.range-shortlistStatus', '.btn-candidateStatus','.range-candidateStatus', '.btn-qualificationList','.range-qualificationList','.btn-educationList','.range-educationList','.btn-employmentHistoryList','.range-employmentHistoryList','.btn-advanced-salary','.advanced-salary-range-picker','.btn-yearsOfExperience','.range-yearsOfExperience','.btn-age','.range-age', '.btn-fee', '.range-fee', 'btn-lastMessageDate', 'range-lastMessageDate', '.btn-job-source-details', '.range-job-source-details', '.btn-working-hours', '.range-working-hours'];
const cancelBtns                = ['.btn-languageList','.btn-nationalityList', '.btn-seekingLocations', '.btn-specializationList', '.btn-salary', '.btn-calendar', '.btn-consultantList','.btn-consultant', '.btn-subsidiaryList', '.btn-type', '.btn-industryList', '.btn-skillList', '.btn-referredBy', '.btn-jobFunctionList', '.btn-stakeholdersList', '.btn-organizationUnitList', '.btn-contractAmount', '.btn-country', '.btn-locationList', '.btn-status', '.btn-religion', '.btn-commission', '.btn-candidateCode', '.btn-ownVehicle', '.btn-workflowStatus', '.btn-shortlistStatus', '.btn-candidateStatus', '.btn-qualificationList','.btn-educationList','.btn-employmentHistoryList', '.btn-advanced-salary', '.btn-age', '.btn-fee', '.btn-job-source-details', '.btn-working-hours'];

module.exports = BaseGridView = BaseItemView.extend({

    /**   
     * Default Kendo Grid settings
     * ------------------------------------------------------------------------
     * READ THE DOCS! https://docs.telerik.com/kendo-ui/api/javascript/ui/grid
     * ------------------------------------------------------------------------
     */
    KENDO_GRID_DEFAULTS: {
        autoBind        : false,
        resizable       : true,
        allowCopy       : true,
        sortable        : true,
        reorderable     : true,
        selectable      : false,
        groupable       : false,
        columnMenu      : false,
        filterable      : { 
            operators: {
                string: {
                    eq: 'Equal to',
                    neq: 'Not equal to',
                    startswith: 'Starts with',
                    endswith: 'Ends with',
                    contains: 'Contains',
                    doesnotcontain: 'Doesn\'t contain',
                    isempty: 'Empty',
                    isnotempty: 'Not empty'
                },
                number: {
                    eq: 'Equal to',
                    neq: 'Not equal to',
                    isnull: 'Empty',
                    isnotnull: 'Not empty'
                }
            },
            mode: 'row' 
        },
        pageable        : {
            refresh: true,
            pageSize: 10,
            pageSizes: [10, 50, 100],
            buttonCount: 5,
            messages: {
                display: 'Loading'
            }
        },
    },

    events: [],

    /**
     * The default sort behavior is "Created" desc date 
     * if there is no criteria within the searching field or filters.
     */
    SET_DEFAULT_SORT (data) {
        var fieldFilters = _.filter(data.filter.filters, (entry) => {
            if (!_.isUndefined(entry)) {
                if (!_.isUndefined(entry.value)) !((entry.field == 'all' && _.isEmpty(entry.value)) || entry.field == 'dataQuality');
                else !(entry.field == 'all' || entry.field == 'dataQuality');
            } 
        });
        
        if (fieldFilters.length == 0 && (!data.sort || data.sort.length == 0)) {
            data.sort = [{ 
                field: 'created',
                dir: 'desc'
            }];
        }

        var filters         = _.compact(data.filter.filters);
        data.filter.filters = filters;
    },

    SEND_GA (option) {
        RecruiterApp.core.vent.trigger('ga:send', Object.assign({ hitType: 'event', eventCategory: this.TYPE + 'Grid'}, option));
    },

    REMOVE_SPECIAL_CHARACTERS (data, key) {
        var field = _.findWhere(data.filter.filters, {field: key});
        if (field && _.isString(field.value)) {
            field.value = field.value.replace(/\.|\,|\:|\;|\\|\//g,' '); // remove .,;:\/
        }
    },

    REMOVE_DUPLICATE_FILTER (filters) { return _.uniq(filters.reverse(), 'field').reverse() },

    REMOVE_DOUBLE_QUOTES (val) { return val.replace(/[{\"*}]/g, '') },

    REMOVE_EMPTY_CONTAINS_FILTER (filters) { return filters.filter(fl => !("all" != fl.field) || "contains" !== fl.operator || "eq" !== fl.operator || "startswith" !== fl.operator) },

    EXPOSE_ALL_KENDO_GRID_FIELDS () {
        let grid        = this.$el.find('#grid').getKendoGrid();
        let menuData    = this.$el.find("#menu").getKendoMenu();
        let menuDS      = menuData.options.dataSource;
        let colData     = _.findWhere(menuDS, {cssClass: "checkbox"}).items;
            colData     = _.filter(colData, col => col.encoded === false && col.text.indexOf('daxtraCaptureCreated') == -1);
            colData     = _.pluck(colData, 'text');
            colData     = _.map(colData, col => $(col).find('input').data('field'));

        _.each(colData, col => { grid.showColumn(col) });
    },

    SHOW_MORE_ACTIONS (flag) {
        if (_.isNull(flag) || _.isUndefined(flag)) flag = true;

        let _menuData = $("#menu").data('kendoMenu');
        _.each(menusToBeEnabled, menuClass => _menuData.enable(menuClass, flag));
    },

    // CONFIGURE_CONTEXT_MENU () {
    //     let contextMenuEl       = $("#context-menu");
    //     let grid                = this.$el.find(".KENDO-GRID").getKendoGrid();

    //     if (contextMenuEl && grid) {
    //         contextMenuEl.kendoContextMenu({
    //             target: ".viewRecord",
    //             open (e) {
    //                 let item = grid.dataItem($(e.target).parents('tr'));
    //                 let items = [{
    //                     text: `<a class='inNewWindow' href='#/candidate/${item.id}/dashboard' target='_blank'> ${RecruiterApp.polyglot.t("inNewWindow")} </a>`,
    //                     encoded: false,
    //                 }];
    //                 this.setOptions({
    //                     dataSource: items
    //                 })
    //             }
    //         });
    //     }
    // },

    CHECK_EMAIL_CONFIG () {
        this.EMAIL_CONFIG = new EmailConfig();
        this.EMAIL_CONFIG.fetch();
    },

    /** 
     * Used by filterable.cell.template to set the textfield (located in
     * arg.element) with the correct classes and elements
     */
    DEFINE_TEMPLATE (arg) {
        var field       = $(arg.element).parents('[data-field]').data('field');
        // Default fields settings
        var rangeClass  = `range-${field}`, 
            btnClass    = `btn-${field}`,
            ddClass     = `dd-${field}`,
            btnContent  = '<i class="fa fa-bars" aria-hidden="true"></i>';

        switch(field) {
            case 'languageList':        // Language fields
                btnContent  = '<i class="fa fa-language" aria-hidden="true"></i>';
                break;
            case 'consultant':
            case 'consultantList':
                btnContent  = '<i class="fa fa-users" aria-hidden="true"></i>';
                break;
            case 'contractAmount':      // Contract fields
                btnContent  = '<i class="fa fa-usd" aria-hidden="true"></i>';
                break;
            case 'age':                 // Age fields
                btnContent  = '<i class="fa fa-birthday-cake" aria-hidden="true"></i>';
                break;
            case 'seekingLocations':    // Location fields
            case 'locationList':
            case 'nationalityList':
            case 'country':
                btnContent  = '<i class="fa fa-flag-checkered" aria-hidden="true"></i>';
                break;
            case 'yearsOfExperience':   // Date related fields
            case 'updated':
            case 'targetDate':
            case 'availability':
            case 'placementDate':
            case 'endDate':
            case 'invoiceDate':
            case 'paymentDueDate':
            case 'probationEndDate':
            case 'guaranteeEndDate':
            case 'startDate':
            case 'lastMessageDate':
            case 'dob':
            case 'jobCreateddate':
            case 'created':
                rangeClass  = 'range-calendar';
                btnClass    = 'btn-calendar';
                btnContent  = '<span class="k-icon k-i-calendar"></span>';
                break;
            case 'fee':                 // Fee related fields
            case 'salary':
                btnContent  = '<i class="fa fa-usd" aria-hidden="true"></i>';
                break
            case 'currentSalary':       // Salary fields
            case 'minimumSalary':
                rangeClass  = 'advanced-salary-range-picker';
                btnClass    = 'btn-advanced-salary';
                btnContent  = '<i class="fa fa-usd" aria-hidden="true"></i>';
                break;
            case 'attachmentList':      // Documents field
            case 'otherAttachmentList':
                rangeClass  = 'document-search';
                btnClass    = 'btn-document-search';
                btnContent  = '<i class="fa fa-search" aria-hidden="true"></i>';
                break;
            case 'jobSourceDetails':
                rangeClass  = 'range-job-source-details';
                btnClass    = 'btn-job-source-details';
                btnContent  = '<i class="fa fa-briefcase" aria-hidden="true"></i>';
                break;
            case 'workingHours':
                rangeClass  = 'range-working-hours';
                btnClass    = 'btn-working-hours';
                btnContent  = '<i class="fa fa-clock-o" aria-hidden="true"></i>';
                break;
        }

        // Putting it all together
        $(arg.element).addClass('form-control ' + rangeClass).after(`<span class="btn ${btnClass} btn-default" role="button" > ${btnContent} </span><span class="btn btn-default ${ddClass} custom-kendo-dropdown" role="button"></span>`);

        $(arg.element).parents('[data-field] > span').addClass('query-builder-wrap');

        $('.custom-kendo-dropdown.' + ddClass).kendoDropDownList({
            autoWidth: true,
            dataSource: [ "Query Builder", "Empty", "Not Empty" ],
            value: "Query Builder",
            change: function(e) {
                var dataField = $(this.wrapper).parents('[data-field]').data('field');
                window.Octus.BaseKendoGrid.EMPTY_NOT_EMPTY_QUERY_BUILDER(dataField, this.value());
            }
        })
    },

    /**  
     * Set query builder localstorage
     */
    SET_QUERY_BUILDER_LOCALSTORAGE (key, json) {
        var queryBuilderLS = JSON.parse(localStorage.getItem(this.TYPE + 'QueryBuilder')) || {};
            queryBuilderLS[key] = json;

        localStorage.setItem(this.TYPE + 'QueryBuilder', JSON.stringify(queryBuilderLS));
    },

    /**  
     * Unset query builder localstorage
     */
    UNSET_QUERY_BUILDER_LOCALSTORAGE (key) {
        var queryBuilderLS = JSON.parse(localStorage.getItem(this.TYPE + 'QueryBuilder')) || {};

        if (queryBuilderLS[key]) {
            delete queryBuilderLS[key];
            localStorage.setItem(this.TYPE + 'QueryBuilder', JSON.stringify(queryBuilderLS));
        } else {
            return false;
        }
    },

    /**  
     * Get query builder localstorage
     */
    GET_QUERY_BUILDER_LOCALSTORAGE (key) {
        var queryBuilderLS = JSON.parse(localStorage.getItem(this.TYPE + 'QueryBuilder')) || {};

        if (queryBuilderLS[key]) {
            return queryBuilderLS[key];
        } else {
            return false;
        }
    },

    /**  
     * format the value into money format
     */
    FORMAT_MONEY (value) { return numeral(value).format('0,0'); },

    /**
     * test the dateData if its valid, and if there is a value then it will
     * format dateData.value to localised date time and ISO_TS_FORMAT or if its
     * a rangeValue, iterate in the rangeValue and format to localised date time
     * and ISO_TS_FORMAT
     */
    FORMAT_DATE (dateData) {
        if (dateData && dateData.value) {            
            var v = moment(dateData.value).format('l')
            // var n = new Date(moment(v).format(window.Octus.ISO_TS_FORMAT))
            var n = moment(v).format(window.Octus.ISO_TS_FORMAT).toString();
                n = n.replace(/UTC\s/,"");
                n = n.replace(/GMT.+/,"");
                n = n + 'Z';

            dateData.value = n;
            return dateData
        } else if (dateData && dateData.rangeValue && _.isObject(dateData.rangeValue)) {
            _.each(dateData.rangeValue, (val, key) => {
                var n = null;

                if (dateData.dateOnly) {
                    n = moment(val).format(window.Octus.ISO_DATE_FORMAT).toString();

                } else {
                    n = moment(val).format(window.Octus.ISO_TS_FORMAT).toString();
                    n = n.replace(/UTC\s/,"");
                    n = n.replace(/GMT.+/,"");
                    n = n + 'Z';
                }

                dateData.rangeValue[key] = n;
            });
            return dateData
        } else {
            return false
        }
    },

    /**
     * test localStorage if it contains a certain searchCriteria if it does
     * contain a searchCriteria, return the filterArray else, test localStorage
     * for a certain Filter if it does contain a Filter, parse it and return
     * else, return a basic default object: [{field, contains}]
     * @return {object} either certain this.filterArray or localStorage Filter
     * or basic default object
     */
    FORMAT_LOAD_KENDO_FILTER () {        
        var filter = [{ field: "all", operator: "contains", value: '' }];

        if (localStorage[this.TYPE + 'SearchCriteria']) {
            filter = this.filterArray.concat(filter);
        } else if (localStorage[this.TYPE + 'Filter']) {
            filter = JSON.parse(localStorage[this.TYPE + 'Filter']).concat(filter);
        }

        return _.uniq(filter, 'field');
    },

    /**
     * used when a event languageQueryConfirmed is triggered by
     * LanguageQueryBuilderView() query argument will contain the following:
     * @param {Array} grp html element group
     * @param {String} type default 'languageList.fullDescription'
     * @param {Object} query
     * @param {String} human
     * @param {String} raw query raw in strings
     * @param {Array} filter range filter
     * @param {Array} filters full filters
     * @param {Boolean} exist true / false
     * @description Pluck out the query.query.value and fill it into the
     * lang_query, to be sent to grid.dataSource.filter(). And pluck out the
     * query.human, to be used to populate query.grp input
     */
    STANDARD_PROCESS_RANGE_VALUE (query) {
        var self                = query.self;
        var grid                = self.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        var queryBuilder        = query.query.queryBuilder;
        var queryBuilderField   = query.grp.attr('data-field') || query.type;
        var emptyQuery          = { operator: 'contains', value: '', field: queryBuilderField };

        switch (queryBuilderField) {
            case 'seekingLocations':
                emptyQuery.field = queryBuilderField + '.name';
                break;
            case 'referredBy':
            case 'organizationUnitList':
            case 'jobSourceDetails':
                emptyQuery.field = queryBuilderField + '.value';
                break;
            case 'languageList':
                emptyQuery.field = queryBuilderField + '.fullDescription';                
                break;
            case 'workingHours':
                emptyQuery.field = 'workingTime';
                emptyQuery.operator = 'nested';
                break;
        }

        var fieldQuery          = query.exist && !_.isUndefined(query.filter) ? query.filter : emptyQuery;
            fieldQuery.value    = query.query.value;

        switch (queryBuilderField) {
            case 'workingHours':
                fieldQuery.filters = query.query.filters;
                break;
        }

        query.filters.push(fieldQuery);
        query.filters = self.REMOVE_DUPLICATE_FILTER(query.filters);

        grid.dataSource.filter(query.filters);
        
        setTimeout(() => { 
            if (!_.isEmpty(queryBuilder)) self.SET_QUERY_BUILDER_LOCALSTORAGE(queryBuilderField, queryBuilder);

            query.grp.find('[title="Clear"]').removeAttr('style data-bind').show();

            switch (queryBuilderField) {
                case 'seekingLocations':
                case 'country':
                case 'locationList':
                case 'nationalityList':
                    query.grp.find('input').val(query.human);          
                    break;
            }

            var customKendoDropdown = query.grp.find('.k-widget > .custom-kendo-dropdown').data('kendoDropDownList');
            if (customKendoDropdown) customKendoDropdown.value('Query Builder'); 
        }, 200);

        RecruiterApp.core.vent.trigger('app:modal:close'); 
    },

    PROCESS_QUALIFICATION_RANGE_VALUE (query) {
        var self                = query.self;
        var grid                = self.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        var queryBuilder        = query.query.queryBuilder;
        var queryBuilderField   = query.grp.attr('data-field') || query.type;
        var emptyQuery          = {field: query.type, filters: [], operator: 'nested'}
        var fieldQuery          = query.exist && !_.isUndefined(query.filter) ? query.filter : emptyQuery;
            fieldQuery.filters  = query.query.filters;

        query.filters.push(fieldQuery);
        query.filters = self.REMOVE_DUPLICATE_FILTER(query.filters);

        grid.dataSource.filter(query.filters)
        
        setTimeout(() => { 
            if (!_.isEmpty(queryBuilder)) self.SET_QUERY_BUILDER_LOCALSTORAGE(queryBuilderField, queryBuilder);

            query.grp.find('input').val(query.human);

            var customKendoDropdown = query.grp.find('.k-widget > .custom-kendo-dropdown').data('kendoDropDownList');
            if (customKendoDropdown) customKendoDropdown.value('Query Builder'); 

        }, 200);

        RecruiterApp.core.vent.trigger('app:modal:close');
    },

    PROCESS_STATUS_RANGE_VALUE (query) {
        var self                = query.self;
        var grid                = self.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        var emptyQuery          = {field: query.type, value: "", operator: 'contains'}
        var fieldQuery          = query.exist && !_.isUndefined(query.filter) ? query.filter : emptyQuery;
            fieldQuery.value    = query.query.value

        query.filters.push(fieldQuery);
        query.filters = self.REMOVE_DUPLICATE_FILTER(query.filters);

        grid.dataSource.filter(query.filters)
        
        setTimeout(() => { 
            query.grp.find('input').val(query.human)

            var customKendoDropdown = query.grp.find('.k-widget > .custom-kendo-dropdown').data('kendoDropDownList');
            if (customKendoDropdown) customKendoDropdown.value('Query Builder'); 
        }, 200);

        RecruiterApp.core.vent.trigger('app:modal:close');
    },

    PROCESS_ADVANCED_SALARY_RANGE_VALUE (query) {
        var self                = query.self;
        var grid                = self.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        var queryBuilder        = query.query.queryBuilder;
        var queryBuilderField   = query.grp.attr('data-field') || query.type;
        var emptyQuery          = {field: query.type, filters: [], operator: 'nested'}
        var fieldQuery          = query.exist && !_.isUndefined(query.filter) ? query.filter : emptyQuery;
            fieldQuery.filters  = query.query.filters;

        query.filters.push(fieldQuery);
        query.filters = self.REMOVE_DUPLICATE_FILTER(query.filters);

        grid.dataSource.filter(query.filters)
        
        setTimeout(() => { 
            if (!_.isEmpty(queryBuilder)) self.SET_QUERY_BUILDER_LOCALSTORAGE(queryBuilderField, queryBuilder);

            query.grp.find('input').val(query.human)
        }, 200);

        RecruiterApp.core.vent.trigger('app:modal:close');
    },

    PROCESS_SALARY_RANGE_VALUE (query) {
        var self                    = query.self;
        var grid                    = self.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        var emptySalaryQuery        = {field: query.type + '.' + query.typeTwo, rangeValue: {}, operator: 'range'}
        var currencyQuery           = {field: query.type + '.currency.symbol',  value: '',  operator: "contains"}
        var currencyExist           = !_.isUndefined(_.findWhere(query.filters, {field: query.type + '.currency.symbol'}))
        var salary_created_range    = query.exist && !_.isUndefined(query.filter) ? query.filter : emptySalaryQuery;
        var currency_created        = !currencyExist ? currencyQuery : _.findWhere(query.filters, {field: query.type + '.currency.symbol'});

        currency_created.value                  = query.currency ? '(' + query.currency + ')' : '';
        salary_created_range.rangeValue.to      = query.range.to
        salary_created_range.rangeValue.from    = query.range.from
        human_salary_created_range              = RecruiterApp.polyglot.t(query.currency) + ' ' + numeral(query.range.from).format('0,0') + ' - ' + RecruiterApp.polyglot.t(query.currency) + ' ' + numeral(query.range.to).format('0,0');

        query.filters.push(fieldQuery);
        query.filters = self.REMOVE_DUPLICATE_FILTER(query.filters);
        
        if (query.currency != '' && !currencyExist) {
            query.filters.push(currency_created)
        } else {
            query.filters = _.filter(query.filters, fil => {
                if (fil.field !== query.type + '.currency.symbol') {
                    return fil
                } else {
                    fil.value = currency_created.value
                    return fil
                }
            });
        }

        grid.dataSource.filter(query.filters)

        setTimeout(() => { 
            query.grp.find('input').val(human_salary_created_range)
            query.grp.find('[title="Clear"]').removeAttr('style data-bind').show()
        }, 200);

        RecruiterApp.core.vent.trigger('app:modal:close');
    },

    PROCESS_CONTRACT_RANGE_VALUE (query) {
        var self                    = query.self;
        var grid                    = self.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        var emptyContractQuery      = {field: query.type + 'Amount', rangeValue: {}, operator: 'range'};
        var currencyQuery           = {field: query.type + 'Currency',  value: '',  operator: "contains"};
        var currencyExist           = !_.isUndefined(_.findWhere(query.filters, {field: query.type + 'Currency'}));
        var contractExist           = !_.isUndefined(_.findWhere(query.filters, {field: query.type + 'Amount', operator: 'range'}));
        var salary_created_range    = !contractExist ? emptyContractQuery : _.findWhere(query.filters, {field: query.type + 'Amount'});
        var currency_created        = !currencyExist ? currencyQuery : _.findWhere(query.filters, {field: query.type + 'Currency'});

        currency_created.value                  = query.currency ? '(' + query.currency + ')' : '';
        salary_created_range.rangeValue.to      = query.range.to;
        salary_created_range.rangeValue.from    = query.range.from;
        human_salary_created_range              = RecruiterApp.polyglot.t(query.currency) + ' ' + numeral(query.range.from).format('0,0') + ' - ' + RecruiterApp.polyglot.t(query.currency) + ' ' + numeral(query.range.to).format('0,0');

        query.filters.push(salary_created_range);
        query.filters = self.REMOVE_DUPLICATE_FILTER(query.filters);
        
        if (query.currency != '' && !currencyExist) {
            query.filters.push(currency_created)
        } else {
            query.filters = _.filter(query.filters, fil => {
                if (fil.field !== query.type + '.currency.symbol') {
                    return fil
                } else {
                    fil.value = currency_created.value
                    return fil
                }
            });
        }

        grid.dataSource.filter(query.filters)

        setTimeout(() => { 
            query.grp.find('input').val(human_salary_created_range)
            query.grp.find('[title="Clear"]').removeAttr('style data-bind').show()

            var customKendoDropdown = query.grp.find('.k-widget > .custom-kendo-dropdown').data('kendoDropDownList');
            if (customKendoDropdown) customKendoDropdown.value('Query Builder'); 
        }, 200);

        RecruiterApp.core.vent.trigger('app:modal:close');
    },

    PROCESS_CAL_RANGE_VALUE (query) {
        var self                = query.self;
        var grid                = self.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        var emptyRange                    = {field: query.type, rangeValue: {}, operator: 'range'};
        var fieldQuery                    = query.exist && !_.isUndefined(query.filter) ? query.filter : emptyRange;
            fieldQuery.rangeValue.from    = query.range.from;
            fieldQuery.rangeValue.to      = query.range.to;

        switch (query.type) {
            case 'dob' :
            case 'availability' :
            case 'targetDate' :
            case 'placementDate' :
            case 'endDate':
            case 'invoiceDate':
            case 'paymentDueDate':
            case 'probationEndDate':
            case 'guaranteeEndDate':
            case 'startDate' :
                fieldQuery.dateOnly = true;
                break;
            default:
                fieldQuery.dateOnly = false;
                fieldQuery.rangeValue.from.setHours(0,0,0,0);
                fieldQuery.rangeValue.to.setHours(23,59,59,999);
                break;
        }

        fieldQuery                  = self.FORMAT_DATE(fieldQuery)
        human_fieldQuery            = moment(query.range.from).format(window.Octus.DATE_FORMAT) + ' - ' + moment(query.range.to).format(window.Octus.DATE_FORMAT)
        
        query.filters.push(fieldQuery);
        query.filters = self.REMOVE_DUPLICATE_FILTER(query.filters);
        
        grid.dataSource.filter(query.filters)

        setTimeout(() => { 
            query.grp.find('input').val(human_fieldQuery)
            query.grp.find('[title="Clear"]').removeAttr('style data-bind').show()

            var customKendoDropdown = query.grp.find('.k-widget > .custom-kendo-dropdown').data('kendoDropDownList');
            if (customKendoDropdown) customKendoDropdown.value('Query Builder'); 
        }, 200);

        RecruiterApp.core.vent.trigger('app:modal:close');
    },

    PROCESS_AGE_RANGE_VALUE (query) {
        var self                = query.self;
        var grid                = self.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        var emptyRange          = {field: query.type, rangeValue: {}, operator: 'range'}
        var fieldQuery          = query.exist && !_.isUndefined(query.filter) ? query.filter : emptyRange;
            fieldQuery.rangeValue.to    = query.range.to
            fieldQuery.rangeValue.from  = query.range.from

        human_age_created_range            = query.range.from + ' - ' + query.range.to
        
        query.filters.push(fieldQuery);
        query.filters = self.REMOVE_DUPLICATE_FILTER(query.filters);
        
        grid.dataSource.filter(query.filters)
        
        setTimeout(() => { 
            query.grp.find('input').val(human_age_created_range)
            query.grp.find('[title="Clear"]').removeAttr('style data-bind').show()

            var customKendoDropdown = query.grp.find('.k-widget > .custom-kendo-dropdown').data('kendoDropDownList');
            if (customKendoDropdown) customKendoDropdown.value('Query Builder'); 
        }, 200);

        RecruiterApp.core.vent.trigger('app:modal:close');
    },

    PROCESS_STAKEHOLDER_RANGE_VALUE (query) {
        var self                = query.self;
        var grid                = self.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        query.filters.push(...query.query);
        query.filters = self.REMOVE_DUPLICATE_FILTER(query.filters);

        var customKendoDropdown = query.grp.find('.k-widget > .custom-kendo-dropdown').data('kendoDropDownList');

        if (customKendoDropdown) customKendoDropdown.value('Query Builder'); 

        grid.dataSource.filter(query.filters)

        RecruiterApp.core.vent.trigger('app:modal:close');
    },

    PROCESS_EMPLOYMENT_HISTORY_RANGE_VALUE (query) {
        var self                = query.self;
        var grid                = self.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        var queryBuilder        = query.query.queryBuilder;        
        var emptyQuery          = {field: 'jobHistoryList', filters: [], operator: 'nested'};
        var fieldQuery          = query.exist && !_.isUndefined(query.filter) ? query.filter : emptyQuery;
            fieldQuery.value    = query.query.value;
            fieldQuery.filters  = query.query.filters;

        query.filters.push(fieldQuery);
        query.filters = self.REMOVE_DUPLICATE_FILTER(query.filters);

        grid.dataSource.filter(query.filters)
        
        setTimeout(() => { 
            if (!_.isEmpty(queryBuilder)) self.SET_QUERY_BUILDER_LOCALSTORAGE('jobHistoryList', queryBuilder);

            self.$el.find('input.range-employmentHistoryList').val(self.EMPLOYMENT_HISTORY_HELPER.CONVERT_ES_TO_HUMAN(query.query.value, self));

            var customKendoDropdown = query.grp.find('.k-widget > .custom-kendo-dropdown').data('kendoDropDownList');
            if (customKendoDropdown) customKendoDropdown.value('Query Builder'); 
        }, 200);

        RecruiterApp.core.vent.trigger('app:modal:close'); 
    },

    PROCESS_DOCUMENT_FILTER_VALUE (query) {

        let cvFieldName  = 'cvAttachmentList.content';
        let docFieldName = 'otherAttachmentContentList.content';
        let attFieldName = 'attachmentList.content';

        query.logic = "AND";
        query.highlighted = true;

        switch (query.operator) {
            case "isempty":
                if (this.TYPE == "candidate") {
                    query.filters = [{
                        operator: query.operator,
                        logic: "AND",
                        value: "",
                        field: cvFieldName
                    }, {
                        operator: query.operator,
                        logic: "AND",
                        value: "",
                        field: docFieldName
                    }];
                    query.operator = 'nested';
                } else {
                    query.field = attFieldName;
                    query.value = "";
                    query.operator = query.operator;
                }
                break;
            case "isnotempty":
                if (this.TYPE == "candidate") {
                    query.filters = [{
                        operator: query.operator,
                        logic: "OR",
                        value: "",
                        field: cvFieldName
                    }, {
                        operator: query.operator,
                        logic: "OR",
                        value: "",
                        field: docFieldName
                    }];
                    query.operator = 'nested';
                } else {
                    query.field = attFieldName;
                    query.value = "";
                    query.operator = query.operator;
                }
                break;
            default:
                if (this.TYPE == "candidate") {
                    query.operator = 'nested';
                    query.filters = [{
                        operator: "contains",
                        logic: "OR",
                        highlighted: true,
                        value: query.value,
                        field: cvFieldName
                    }, {
                        operator: "contains",
                        logic: "OR",
                        value: query.value,
                        highlighted: true,
                        field: docFieldName
                    }];
                } else {
                    query.field = attFieldName;
                    query.value = query.value;
                    query.operator = "contains";
                }
                break;
        }

        return query;
    },

    PROCESS_CV_FILTER_VALUE (query) {

        let cvFieldName = 'cvAttachmentList.content';
        let cvTagList   = 'cvAttachmentList.tagList';

        query.field         = cvFieldName;
        query.highlighted   = true;
        query.logic         = "AND";

        switch (query.operator) {
            case "isempty":
                query.filters = [{
                    operator: query.operator,
                    logic: "AND",
                    value: query.value,
                    field: cvFieldName
                }];
                break;
            case "isnotempty":
                query.filters = [
                    {
                        operator: query.operator,
                        logic: "AND",
                        value: query.value,
                        field: cvFieldName
                    }
                    // , {
                    //     operator: "contains",
                    //     value: "ACTIVE",
                    //     highlighted: true,
                    //     field: cvTagList
                    // }
                ];
                break;
            default:
                query.filters = [
                    {
                        operator: "contains",
                        highlighted: true,
                        value: query.value,
                        field: cvFieldName
                    }
                    // , {
                    //     operator: "contains",
                    //     value: "ACTIVE",
                    //     highlighted: true,
                    //     field: cvTagList
                    // }
                ];

                delete query.value;
                break;
        }
        query.operator = 'nested';

        return query;
    },

    /**
     * Clear filter value from localStorage Update the searchBox values Reload
     * KendoGrid
     */
    CLEAR_FILTER () {
        RecruiterApp.core.vent.trigger('blockUI', ' Loading...');
        var grid = this.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        _.defer(() => {
            localStorage.removeItem(this.TYPE + 'Filter')
            localStorage.removeItem(this.TYPE + 'FilterId')
            localStorage.removeItem(this.TYPE + 'Sort')
            localStorage.removeItem(this.TYPE + 'SearchCriteria') 
            localStorage.removeItem(this.TYPE + 'CurrentSavedSearch')
            localStorage.removeItem(this.TYPE + 'QueryBuilder');
            localStorage.setItem('liveJob', 'false');
            
            var uihash = window.location.href.split('#')[1];

            window.location.hash = uihash + '/clear';

            _.delay(() => {
                window.location.hash = uihash;
            }, 500);
        });
    },

    /**   
     * Destroy existing Kendo
     */
    DESTROY_EXISTING_KENDO () {
        if (!_.isUndefined($("#grid").getKendoGrid())) {
            var _g = $("#grid").getKendoGrid()
            _g.destroy();
        }
    },

    /** 
     * apply permission using the this.permissionConfig to kendoGrid and
     * kendoMenu
     */
    APPLY_PERMISSIONS () {
        var grid        = this.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;

        var session     = new Session();
        var _menuData   = $("#menu").data('kendoMenu');
        var _menuLSData = _menuData ? JSON.parse(localStorage.getItem(this.TYPE + "Menu")) : false;
        var permForView = this.PERMISSIONS_FOR_VIEW;
        var permApplied = [];
        
        if (!_.isNull(permForView)) {

            _.each(permForView, perm => {
                var isGrid = this.$el.find(perm.selector).hasClass('k-header')
                var isActi = this.$el.find(perm.selector).hasClass('kendo-icon')
                var gridEl = grid.element.find(perm.selector)

                if (!gridEl) return false;
                if (perm.read && _.isUndefined(_.findWhere(permApplied, {fieldName: perm.fieldName}))) {

                    permApplied.push(perm)

                    // For Grid Item and Menu Item
                    this.$el.find(perm.selector).removeClass('wb')

                    if (isGrid && _menuLSData) {
                        // show the grid item
                        if (_menuLSData[gridEl.attr('data-field')] && _menuLSData[gridEl.attr('data-field')].enabled) {
                            grid.showColumn(gridEl.attr('data-field'))
                        }
                        // show the menu item
                        this.$el.find('#menu input[type="checkbox"][data-field="' + gridEl.attr('data-field') + '"]').closest('li.k-item').removeClass('wb')
                    } else if (isGrid) {
                        grid.showColumn(gridEl.attr('data-field'));
                    }

                    if (isActi) {
                        setTimeout(() => this.$el.find(perm.selector).removeClass('wb'), 1000);
                    }
                } else {
                    if (isGrid && _.isUndefined(_.findWhere(permApplied, {fieldName: perm.fieldName}))) {
                        grid.hideColumn(gridEl.attr('data-field'))
                    }
                }
            });
        } else {
            RecruiterApp.core.vent.trigger('app:DEBUG:error', ['No permissions available for this view', this.VIEW]);
        }
    },

    /** 
     * persist kendoGrid state Used by kendo's events sort, columnResize,
     * columnReorder
     */
    PERSIST_KENDO_GRID () {
        var grid        = this.$el.find('.KENDO-GRID').getKendoGrid();

        if (!grid) return false;
        if (this.options.filterBehConfig && this.options.filterBehConfig.persist == false) return false;

        var gridOpt     = grid.getOptions();

        clearTimeout(_saveTimer);
        //_saveTimer = setTimeout(() => localStorage[this.TYPE + "GridOpt"] = kendo.stringify(grid.getOptions()), 500);
        _saveTimer = setTimeout(() => UserPreference.setUserPreference(this.TYPE + "GridOpt", kendo.stringify(grid.getOptions())), 500);

    },

    /**
     * Refresh Kendo Menu > Select Columns checkboxes
     * after loading Saved Search
     */
    REFRESH_SELECTED_COLUMNS () {
        var grid = $('#grid').data('kendoGrid');

        if (!grid) return false;

        _.defer(() => {
            for (var i = 0; i < grid.columns.length; i++) {
                var column  = grid.columns[i];

                if (!_.isUndefined(column.field) && !_.isUndefined(column.hidden)) {
                    var isEnabled = (column.hidden) == false ? true : false;
                    var input = $('#menu :checkbox[data-field=' + column.field + ']');
                        input.prop('checked', isEnabled).trigger('change');
                }
            }
        });
    },

    // KENDO ACTIONS
    
    /**
     * Action for LinkedIn
     * @param {dataSource}
     */
    ACTION_LINKEDIN (ds) {
        this.$el.find("#grid tbody tr .linkedInAction").each((index, el) => {
            if (ds[index] && !ds[index].linkedIn) $(el).addClass('disabledKendoBtn');
        });
    },

    /**
     * Action to ShowCv
     * @param {dataSource}
     */
    ACTION_SHOWCV () {
        this.$el.find('.showCV')
            .off('click')
            .on('click', (e) => {
                e.preventDefault();
                var ds     = this.$el.find('#grid').data('kendoGrid').dataSource;
                var dat    = _.findWhere(ds.data(), { id: e.currentTarget.id }).toJSON();

                if (_.isUndefined(dat.cvList) ||  _.isEmpty(dat.cvList)) {
                    RecruiterApp.core.vent.trigger('app:message:warning', RecruiterApp.polyglot.t("noCvFound"));
                    RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("checkCvList"));
                    return false;
                };

                RecruiterApp.core.vent.trigger(this.TYPE + 'List:show:cv', dat);
            });
    },

    /**
     * When clicking on a candidate name, trigger the candidate preview side-panel
     */
    ACTION_SHOW_DETAILS_ANCHOR () {
        this.$el.find('a.showPreview')
            .off('click')
            .on('click', (e) => {
                e.preventDefault();
                const selectedItemId = e.currentTarget.dataset.candidateId;
                RecruiterApp.core.vent.trigger('candidateViewRecord', selectedItemId);
            });
    },

    /**
     * Action to ShowDocuments
     * @param {}
     */
    ACTION_SHOWDOCUMENTS () {
        console.log('Document preview intialised.')
        // this.$el.find('.showDocuments')
        //     .off('click')
        //     .on('click', e => {
        //         e.preventDefault();
        //         var ds                      = this.$el.find('#grid').data('kendoGrid').dataSource;
        //         var dat                     = _.findWhere(ds.data(), { id: e.currentTarget.id }).toJSON();
        //         var documentsList           = this.TYPE == 'candidate' ? _.union(dat.otherAttachmentList, dat.cvList) : dat.attachmentList;
        //         var recordName              = dat.title || dat.name || dat.firstName + ' ' + dat.lastName || '';

        //         if (_.isUndefined(documentsList) ||  _.isEmpty(documentsList) || _.isUndefined(recordName) || _.isNull(recordName) || _.isEmpty(recordName) || recordName.indexOf('undefined') != -1) {
        //             RecruiterApp.core.vent.trigger('app:message:warning', RecruiterApp.polyglot.t("noDocumentsFound"));
        //             RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("checkDocumentListAndRecordName"));
        //             return false;
        //         }

        //         var documentFilter          = this.TYPE == 'candidate' ? _.findWhere(ds.filter().filters, {field: "otherAttachmentList"}) : _.findWhere(ds.filter().filters, {field: "attachmentList"});
        //         var searchQuery             = documentFilter && documentFilter.value ? documentFilter.value : '';
        //         var kendoDocumentsView      = new KendoDocumentsView({ 
        //             collection  : new Backbone.Collection(documentsList),
        //             model       : new Backbone.Model({
        //                 name: recordName,
        //                 searchQuery: searchQuery
        //             })
        //         });

        //         RecruiterApp.core.vent.trigger('app:modal:show', kendoDocumentsView, 'big');
        //     });
    }, 

    /**
     * Bind dataSource to listen to error and reset kendo. Start a 20sec timer
     * to clear localStorage and restart kendo if its taking too long
     */
    BIND_TO_ERROR () {
        var grid = $('#grid').data('kendoGrid');

        if (!grid) return false;

        let errorMsg = () => {
            localStorage.removeItem(this.TYPE + 'CurrentPage')
            localStorage.removeItem(this.TYPE + 'GridOpt')
            localStorage.removeItem(this.TYPE + 'Filter')
            localStorage.removeItem(this.TYPE + 'Menu')
            localStorage.removeItem(this.TYPE + 'SearchCriteria')            
            localStorage.removeItem(this.TYPE + 'QueryBuilder')            

            if ($("#grid").length > 0) {
                alert('There seems to be an issue. Click here to fix it.')
                location.reload();
            }
        }

        // Bind with datasource error if there is an error clear localStorage for kendoCandidateGrid
        grid.dataSource.bind("error", e => errorMsg());
    },

    RESIZE_KENDO_LISTENER () {
        let resizeTimer,
            zoom                = detectZoom.zoom(),
            device              = detectZoom.device();

        let grid                = $('#grid').data('kendoGrid');

        let resetZoom = () => {
            var _zoom = detectZoom.zoom()
            var _device = detectZoom.device()
            
            if (_zoom != zoom || _device != device) {
                zoom = _zoom
                device = _device
                grid.refresh()     
            }
        }
        $(window).on('resize', e => {
            clearTimeout(resizeTimer)

            resizeTimer = setTimeout(() => {
                if ($('#grid').length == 0) {
                    $(window).off('resize');
                } else {
                    this.RESIZE_KENDO();
                    resetZoom();
                }
            }, 250)
        });
        setTimeout(() => this.RESIZE_KENDO(), 250);
    },

    RESIZE_KENDO() {
        let grid_el             = $('#grid');
        if ($('.k-grid-header .k-grid-header-wrap table').length > 0) {
            var offset = $('.k-grid-header .k-grid-header-wrap table').offset().top + $('.k-grid-header .k-grid-header-wrap table').height() + 115;
            $('.k-grid-content').css('max-height', $(window).height() - offset);
            $('.k-grid-content-locked').css('height', $('.k-grid-content').height() - 12);
        }
    },

    STANDARD_CONVERSION_HUMAN_TO_JS (val) {
        var rules           = val.split(/(?= OR | AND )/g),
            rulesJS         = [];

        _.each(rules, (rule) => {
            var ruleValue = $.trim(rule.replace(/ OR | AND /, '')),
                r = {};

            if (!_.isNull(rule.match(/ OR | AND /gi)))
                r.selectedCondition = rule.match(/ OR | AND /gi).toString().replace(/ /g, '');

            if (!_.isNull(ruleValue) && ruleValue.match(/^NOT /gi)) {
                ruleValue = ruleValue.replace("NOT ", "");
                r.notClause = true;
            }

            r.selectedVal = ruleValue

            rulesJS.push(r);
        });

        return rulesJS
    },

    STANDARD_HELPER: {
        CONVERT_HUMAN_TO_JS (val) {     return STANDARD_CONVERSION_HUMAN_TO_JS(val); }
    },

    AGE_HELPER: {
        CONVERT_HUMAN_TO_JS (val) {     return {startAge: val.split(' - ')[0], endAge: val.split(' - ')[1]} }
    },

    YEAR_HELPER: {
        CONVERT_HUMAN_TO_JS (val) {     return {startYear: val.split(' - ')[0], endYear: val.split(' - ')[1]} }
    },

    CAL_HELPER: {
        CONVERT_HUMAN_TO_JS (val) {     return {startDate: val.split(' - ')[0], endDate: val.split(' - ')[1]} }
    },

    SALARY_HELPER: {
        CONVERT_HUMAN_TO_JS (val) {
            var rules           = val.split(' - '),
                currencyRefData = window.Octus.currencyList.toJSON(),
                rulesJS         = {};

            var cur = rules[0].split(' ')[0];

            if (!_.isEmpty(cur)) {
                cur = _.findWhere(currencyRefData, {
                    value: cur 
                }).key;

                rulesJS.currency = cur
            }

            rulesJS.endSalary = rules[1].split(' ')[1]
            rulesJS.startSalary = rules[0].split(' ')[1]

            return rulesJS
        },

        CONVERT_ES_TO_HUMAN (currency, val) {
            if (_.isEmpty(val)) return '';
            
            var currencyRefData = window.Octus.currencyList.toJSON();

            if (!_.isEmpty(currency)) {
                currency = currency.replace(/"/g, "").replace(/'/g, "").replace(/\(|\)/g, "");
                currency = _.findWhere(currencyRefData, {
                    key: currency
                }).value;
            } else {
                currency = ''
            }

            return `${currency} ${numeral(val.from).format('0,0')} - ${currency} ${numeral(val.to).format('0,0')}`;
        }
    },

    ADVANCED_SALARY_HELPER: {
        CONVERT_HUMAN_TO_JS (val) { return val; },

        CONVERT_ES_TO_HUMAN (val) {
            var emptyFilters    = val.filter(item => item.filters.filter(fl => nonValueFilterOperators.includes(fl.operator)));
            var nonEmptyFilters = val.filter(item => item.filters.filter(fl => !nonValueFilterOperators.includes(fl.operator)));

            const value = nonEmptyFilters.map((item, index) => {
                // If it is the first filter, we don't put the logic before it
                const logic = index == 0 ? '' : item.logic;

                // Build the filters from each brackets ()
                const filters = item.filters.map(filter => {
                    let result = `${filter.field}:`.replace(/minimumSalary\.|currentSalary\./, '').replace(/\.symbol/g, '');
                        result = result.replace(result[0], result[0].toUpperCase());

                    if (filter.operator == "range") {
                        if (filter.rangeValue.from)   result += ` from ${filter.rangeValue.from}`;
                        if (filter.rangeValue.to)     result += ` to ${filter.rangeValue.to}`;
                    }
                    if (filter.operator == "contains") {
                        if (filter.value) result += ` ${RecruiterApp.polyglot.t(filter.value)}`;
                    }
                  return result
                }).join(' AND ');

                if (!_.isEmpty(filters)) return `${logic} (${filters})`; 
                else return '';

            }).join(' ').trim();

            return value;
        }
    },

    STATUS_HELPER: {
        CONVERT_HUMAN_TO_JS (val) {
            var rules           = val.split(/(?= OR | AND )/g),
                statusRefData   = window.Octus.statusRefData,
                rulesJS         = [];

            _.each(rules, (rule) => {
                var ruleValue = $.trim(rule.replace(/ OR | AND /, '')).replace(/\(|\)/g, "").replace(/"/g, "");
                var statusRef = _.findWhere(statusRefData, { value: ruleValue }) ||
                                _.findWhere(statusRefData, { key: ruleValue }) || 
                                _.findWhere(statusRefData, { label: ruleValue });

                if (!statusRef) console.error('Reference data not found: ', val);        

                var status = ruleValue || statusRef.key,
                    r = {};

                if (!_.isNull(rule.match(/ OR | AND /gi)))
                    r.selectedCondition = rule.match(/ OR | AND /gi).toString().replace(/ /g, '');

                r.selectedStatus = status;

                rulesJS.push(r);
            });

            return rulesJS
        },

        CONVERT_ES_TO_HUMAN (val, refData) {
            var rules           = val.split(/(?=\ AND \(|\ OR \()/g);

            if (_.isEmpty(val)) { return ""; }

            var statusRefData   = _.map(refData, dat => {
                    dat.key     = dat.key.toUpperCase();
                    dat.value   = dat.value.toUpperCase();
                    return dat;
                }),
                rulesHuman      = "";

            _.each(rules, (rule) => {
                var cond = '';

                if (!_.isNull(rule.match(/ OR \(| AND \(/gi)))
                    cond = rule.match(/ OR \(| AND \(/gi).toString().replace(/ |\(/g, '');

                var status = rule.replace(/"/g, "").replace(/ OR \(| AND \(|\)|\(/g, '').split(' OR ')[0];
                    status = status.trim().toUpperCase();

                var statusRef = _.findWhere(statusRefData, { value: status }) ||
                                _.findWhere(statusRefData, { key: status }) || 
                                _.findWhere(statusRefData, { label: status });

                if (!statusRef) console.warn('Reference data not found: ', val);

                var Status = statusRef && statusRef.label ? statusRef.label : status;

                rulesHuman += cond
                rulesHuman += ' ' + Status + ' '

            });
            
            return rulesHuman
        }
    },

    QUALIFICATION_HELPER: {
        CONVERT_HUMAN_TO_JS (val) { return val; },

        CONVERT_ES_TO_HUMAN (val, type) {
            var value = _.map(val, (va, i) => {
                            var logicVal    = i == 0 ? '' : va.logic;
                            var vaFilters   = _.filter(va.filters, v => v.field.indexOf('type') == -1);

                            return logicVal + ' (' + _.map(vaFilters, quaEdu => {
                                var field   = quaEdu.field.replace(/qualificationList\.|educationList\./, '');
                                return `${RecruiterApp.polyglot.t(field)}: ${quaEdu.value}`;
                            }).join(' AND ') + ')';
                        }).join(' ');

            return value;
        },

    },

    LOCATION_HELPER: {
        CONVERT_HUMAN_TO_JS (val) {
            var rules           = val.replace(/[()]/g, '').split(/(?= OR | AND )/g),
                locRefData      = window.Octus.locationList.toJSON();

            return _.map(rules, rule => {
                var ruleValue       = $.trim(rule.replace(/ OR | AND /, ''));
                var ruleValueObj    = { value: ruleValue }, 
                    ruleObj         = {};

                var loc = _.where(locRefData, ruleValueObj).length > 0 ? _.findWhere(locRefData, ruleValueObj).key : ruleValue;

                if (!_.isNull(rule.match(/ OR | AND /gi))) {
                    ruleObj.selectedCondition = rule.match(/ OR | AND /gi).toString().replace(/ /g, '');
                }

                ruleObj.selectedLocation = loc;

                return ruleObj;
            })
        }
    },

    LANGUAGE_HELPER: {
        CONVERT_HUMAN_TO_JS (val) {
            var rules           = val.split(/(?= OR | AND )/g),
                profRefData     = _.pluck(window.Octus.languageProficiencyList.toJSON(), 'value'),
                langRefData     = window.Octus.languageList.toJSON();

            return _.map(rules, rule => {
                var ruleValue       = $.trim(rule.replace(/ OR | AND /, '').split(', ')[0])
                var ruleValueObj    = { value: ruleValue },
                    ruleObj         = {};

                var lang = _.findWhere(langRefData, ruleValueObj).value,
                    prof = rule.split(', ')[1];

                if (!_.isNull(rule.match(/ OR | AND /gi)))
                    ruleObj.selectedCondition = rule.match(/ OR | AND /gi).toString().replace(/ /g, '');

                var profRange = prof.indexOf('to') ? prof.split(' to ') : prof;

                ruleObj.selectedLanguage = lang
                
                if (_.isEmpty($.trim(profRange[0]))) {
                    ruleObj.proficiencyOn = false
                    ruleObj.languageProficiency = profRefData.length - 1
                } else {
                    ruleObj.proficiencyOn = true
                    ruleObj.languageProficiency = profRefData.indexOf($.trim(profRange[0]))
                }

                return ruleObj;
            });
        }
    },

    STAKEHOLDERS_HELPER: {
        CONVERT_HUMAN_TO_JS (stakeholdersVal, curr) { 
            var grid = $('#grid').data('kendoGrid');

            if (!grid) return false;

            var ls_stakeholderFilter = JSON.parse(localStorage.getItem("persistentStakeholdersFilter")),
                response;

            // when no filter is added in stakeholder map. Usually in activity grid view
            if (_.isEmpty(_.compact(stakeholdersVal))) {
                response = { candidateList: [], clientList: [], companyList: [], jobList: []}

            // when viewing in detail view page
            } else if (!_.isUndefined(curr.currentView)) {

                response = {
                    candidateList: [], clientList: [], companyList: [], jobList: [],
                    disabled: curr.currentView + "List", // set the disabled
                }

                // First, set the default value
                var defaultFilter = {
                    id:     curr.defaultValue.id,
                    name:   curr.defaultValue.value.replace(/ +/g, ' ')
                }

                if (curr.currentView == 'candidate')    response.candidateList.push(defaultFilter)
                else if (curr.currentView == 'client')  response.clientList.push(defaultFilter)
                else if (curr.currentView == 'company') response.companyList.push(defaultFilter)
                else if (curr.currentView == 'job')     response.jobList.push(defaultFilter)

                // Next, get the other value that is not part of the default, but is in stakeholdersVal
                stakeholdersVal = stakeholdersVal.split(',');
                
                _.each(stakeholdersVal, stakeholder => {
                    _.each(ls_stakeholderFilter, (stakeholderFilter, type) => {
                        if (defaultFilter.name.trim() != stakeholder.trim()) {
                            var filterInLocalStorage = _.findWhere(stakeholderFilter, {value: stakeholder.trim()});

                            if (filterInLocalStorage) {
                                response[type + 'List'].push({
                                    id:     filterInLocalStorage.id,
                                    name:   filterInLocalStorage.value
                                })
                            }
                        };                    
                    });
                });

            // when viewing in activity grid view
            } else if (_.isUndefined(curr.currentView)) {
                response = {};

                _.each(ls_stakeholderFilter, (stakeholder, type) => {
                    key = type + 'List';
                    response[key] = _.map(stakeholder, sh => ({ id: sh.id, name: sh.value }));
                });
            }

            return response;
        },

        CONVERT_ES_TO_HUMAN (stakeholdersIds) {
            var grid = $('#grid').data('kendoGrid');

            if (!grid) return false;

            var gridDataSource = grid.dataSource.data();
            var localstorageData = JSON.parse(localStorage.getItem("persistentStakeholdersFilter"));
            var res = [];
            var originalStakeholdersIds = stakeholdersIds;

            _.each(originalStakeholdersIds, stakeholder => {
                if (stakeholder.value.indexOf(" OR ") > 0) {
                    splitIds = stakeholder.value.split(" OR ");
                    stakeholder.value = splitIds[0];
                    for (var i=1; i < splitIds.length; i++) {
                        stakeholdersIds.push({
                            field: stakeholder.field,
                            operator: stakeholder.operator,
                            value: splitIds[i]
                        });
                    }
                }
            });
            
            if (gridDataSource.length > 0) {
                var data = gridDataSource[0];

                _.each(stakeholdersIds, stakeholder => { 

                    if (stakeholder.field == 'candidateList.id' && 
                        data.candidateList.length > 0 && 
                        data.candidateList[0].id == stakeholder.value) 
                    {
                        res.push(data.candidateList[0].fullName)
                    } else if (stakeholder.field == 'clientList.id' && 
                        data.clientList.length > 0 && 
                        data.clientList[0].id == stakeholder.value) 
                    {
                        res.push(data.clientList[0].fullName)
                    } else if (stakeholder.field == 'companyList.id' && 
                        data.companyList.length > 0 && 
                        data.companyList[0].id == stakeholder.value) 
                    {
                        res.push(data.companyList[0].name)
                    } else if (stakeholder.field == 'jobList.id' && 
                        data.jobList.length > 0 && 
                        data.jobList[0].id == stakeholder.value) 
                    {
                        res.push(data.jobList[0].title) 
                    } else if (localstorageData) {
                        _.each(localstorageData, stakeholderDataList => {
                            result = _.findWhere(stakeholderDataList, {id: stakeholder.value});
                            if (result) {
                                res.push(result.value);
                            }
                        });
                    } else {
                        console.warn("Stakeholder convert es to human warning")
                        console.log(stakeholder)
                    }
                });
            } else if (localstorageData) {
                var result;
                _.each(stakeholdersIds, stakeholder => { 
                    _.each(localstorageData, stakeholderDataList => {
                        result = _.findWhere(stakeholderDataList, {id: stakeholder.value});
                        if (result) {
                            res.push(result.value);
                        }
                    })
                });
            } 

            // AX-018 - Activity doesn't get the candidate/client stakeholder by default in some instances. The record was imported via BATCH_IMPORT therefore it does not have any activity. So in this case will need to assign a default response.
            // if (_.isEmpty(res)) {
            //     var defaultToName = $('h3.page-title').attr('title').trim();
            //     console.warn("Records have no activity");
            //     console.log("Default:", defaultToName);
            //     res = [defaultToName];
            // }

            return res;
        }
    },

    EMPLOYMENT_HISTORY_HELPER: {
        CONVERT_HUMAN_TO_JS (val) { return val; },

        CONVERT_ES_TO_HUMAN (val, self) {
            var queryBuilderLS  = self.GET_QUERY_BUILDER_LOCALSTORAGE('jobHistoryList'),
                selectedCondition;

            if (queryBuilderLS) {
                return _.map(queryBuilderLS, filter => {
                    if (!selectedCondition) selectedCondition = filter.selectedCondition;

                    var companyName = filter.selectedCompany,
                        title       = filter.selectedTitle,
                        query       = [];
                        
                    if (companyName && !_.isUndefined(companyName)) 
                        query.push(`${RecruiterApp.polyglot.t('employer')}: ${companyName}`)

                    if (title &&!_.isUndefined(title))
                        query.push(`${RecruiterApp.polyglot.t('title')}: ${title.replace(/\*/g, '')}`)

                    return `(${query.join(' AND ')})`;

                }).join(` ${selectedCondition} `);
            }
        }
    },

    EMPTY_NOT_EMPTY_QUERY_BUILDER (field, val) {
        var grid            = this.$el.find('.KENDO-GRID').data('kendoGrid');

        if (!grid) return false;

        if (val === "Query Builder") {
            var el = this.$el.find('.k-filtercell[data-field="' + field + '"]');

            if (el) el.find('button[title="Clear"]').trigger('click');
            else throw "clear button cant be found";

            return false;
        }

        var operator        = '';
        var currGridFilter  = grid.dataSource.filter().filters;
        var nestedFilter    = [];
        var nullOpFunc      = v => { return v === "Empty" ? "isnull" : "isnotnull"; }
        var emptyOpFunc     = v => { return v === "Empty" ? "isempty" : "isnotempty"; }
        var pushToFilter    = true;

        this.UNSET_QUERY_BUILDER_LOCALSTORAGE(field);

        switch (field) {
            case "updated":
            case "created":
            case "targetDate":
            case "availability":
            case "startDate":
            case "emailDate":
            case "age":
            case "dob":
            case "jobCreateddate":
            case "yearsOfExperience":
            case "placementDate":
            case 'endDate':
            case 'invoiceDate':
            case 'paymentDueDate':
            case 'probationEndDate':
            case 'guaranteeEndDate':
            case "consultantList":          
            case "locationList":            
            case "nationalityList":         
            case "country":                 
            case "educationList":
            case "qualificationList":
            case "specializationList":
            case "skillList":
            case "jobFunctionList":
            case "subsidiaryList":
            case "type":
            case "industryList":
            case "contractAmount":
            case "attachmentList":          
            case "otherAttachmentList":     
                operator = nullOpFunc(val);
                break;
            case "status":
            case "candidateStatus":
            case "workflowStatus":
            case "shortlistStatus":
            case "consultant":
                operator = emptyOpFunc(val);
                break;
            case "salary":
                field   += "Amount";
                operator = nullOpFunc(val);
                break;
            case "fee":
                field    = "feeAmount";
                operator = nullOpFunc(val);
                break;
            case "seekingLocations":
                field   += ".name";
                operator = nullOpFunc(val);
                break;
            case "languageList":        
                field   += ".fullDescription";
                operator = nullOpFunc(val);
                break;
            case "employmentHistoryList":
                field    = "jobHistoryList";
                operator = nullOpFunc(val);
                break;
            case "referredBy":
                field   += ".value";
                operator = nullOpFunc(val);
                break;
            case "organizationUnitList":
                field   += ".value";
                operator = emptyOpFunc(val);
                break;
            case "status":
            case "religion":
            case "commission":
            case "candidateCode":
            case "ownVehicle":
            case "candidateStatus":
            case "workflowStatus":
            case "shortlistStatus":
            case "consultant":
            case "contractAmount":
                operator = emptyOpFunc(val);
                break;
            case "currentSalary":
            case "minimumSalary":
                operator = "nested";
                var log = "AND";
                
                if (val == 'Not Empty') log = "OR";

                nestedFilter = [{
                    logic: log,
                    operator: "nested",
                    filters: [{
                        field: field + ".period",
                        logic: log,
                        value: "",
                        operator: emptyOpFunc(val)
                    },{
                        field: field + ".currency.symbol",
                        logic: log,
                        value: "",
                        operator: emptyOpFunc(val)
                    },{
                        field: field + ".base",
                        logic: log,
                        value: "",
                        operator: nullOpFunc(val)
                    },{
                        field: field + ".benefit",
                        logic: log,
                        value: "",
                        operator: emptyOpFunc(val)
                    },{
                        field: field + ".bonus",
                        logic: log,
                        value: "",
                        operator: nullOpFunc(val)
                    },{
                        field: field + ".total",
                        logic: log,
                        value: "",
                        operator: nullOpFunc(val)
                    }]
                }]
                break;

        case "workingHours":
            field = "workingTime"
            operator = "nested";
            var log = "AND";
            
            if (val == 'Not Empty') {
                log = "OR"
            }
            nestedFilter = [{
                operator: "nested",
                field: "workingTime",
                filters: [
                    {
                        field: "workingTime.weekdaysFrom",
                        logic: log,
                        operator: emptyOpFunc(val),
                        value: ""
                    },
                    {
                        field: "workingTime.weekdaysTo",
                        logic: log,
                        operator: emptyOpFunc(val),
                        value: ""
                    },
                
                    {
                        field: "workingTime.saturdayFrom",
                        logic: log,
                        operator: emptyOpFunc(val),
                        value: ""
                    },
                    {
                        field: "workingTime.saturdayTo",
                        logic: log,
                        operator: emptyOpFunc(val),
                        value: ""
                    },
                    {
                        field: "workingTime.saturdayWork.value",
                        logic: log,
                        operator: emptyOpFunc(val),
                        value: ""
                    }
                ]
            }]
            break;
            case "jobSourceDetails":
                field += ".value";
                operator = emptyOpFunc(val);
                break;
            default:
                throw "error: Field not mapped for 'isnull or 'isnotnull': " + field;
                return;
                break;
        }

        this.UNSET_QUERY_BUILDER_LOCALSTORAGE(field);
        
        var emptyQuery = {
            field: field,
            operator: operator,
            value:""
        }

        if (nestedFilter.length > 0) emptyQuery.filters = nestedFilter;

        if (pushToFilter) currGridFilter.push(emptyQuery);

        currGridFilter = this.REMOVE_DUPLICATE_FILTER(currGridFilter);

        grid.dataSource.filter(currGridFilter);
    },

    /**
     * ACTION_FN related function handlers
     */
    ACTION_FN () {
        this.$el.find(actionBtns.join(', '))
            .off('click focus')
            .on('click focus', {self: this}, this.ACTION_HANDLER);

        this.$el.find('.k-filtercell .k-widget.k-dropdown.k-header.k-dropdown-operator')
            .on('click focus', {self: this}, this.ENABLE_INPUT)
            .on('blur',        {self: this}, this.DISABLE_INPUT_AFTER_BLUR);
    },

    /**
     * ACTION_HANDLER generic action handler to handle all the ACTION_* related
     * functions
     * @param {event} ev ev.data.self will point to THIS object
     */
    ACTION_HANDLER (ev) {
        var self            = ev.data.self;
        var grid            = self.$el.find('.KENDO-GRID').data('kendoGrid');
        
        if (!grid) return false;
        
        var inputGrp        = $(ev.currentTarget).parents('[data-field]');
        var inputDatField   = inputGrp.attr('data-field');
        var filters         = _.isUndefined(grid.dataSource.filter()) ? [] : grid.dataSource.filter().filters;
        var inputVal        = _.findWhere(filters, {field: inputDatField}) ? 
                                _.findWhere(filters, {field: inputDatField}).value : 
                                _.find(filters, item => item.field.includes(inputDatField)) ? 
                                    _.find(filters, item => item.field.includes(inputDatField)).value : '';

        // different range type will be handled differently
        var rangeType       = $(this).parents('.k-filtercell').attr('data-field'),
            rangeType2      = '',           // ──┐
            rangeCcy        = '',           // ──── only used for salary
            rangeFn,                        // ──┘
            rangeOperator   = 'contains',   // ── default range operator
            rangeViSize     = 'medium',     // ── default size for rangeView
            rangeMode       = 'collection', // ── default view takes in Backbone.Collection
            RANGE_HELPER, RANGE_PROCESS, rangeDefault, rangeDefaultObj, rangeView;
        
        var queryBuilderLS  = self.GET_QUERY_BUILDER_LOCALSTORAGE(rangeType);

        // Bug check
        _.each(filters, filter => {
            if (_.isUndefined(filter.operator)) filter.operator = 'contains';
        });

        // Defaults --------------------------------------------------
        RANGE_HELPER    = self.STANDARD_HELPER;
        RANGE_PROCESS   = self.STANDARD_PROCESS_RANGE_VALUE;
        rangeDefault    = [{
            uniqueClass: faker.random.alphaNumeric(7),
            domain: self.TYPE,
            notClause: false,
            selectedCondition: 'AND',
            selectedVal: '',
            selectedKey: ''
        }];
        rangeDefaultObj = rangeDefault[0];
        // ----------------------------------------------------------

        switch (rangeType) {
            case 'specializationList':
                rangeView       = new SpecializationRangeView({domain: self.TYPE});
                rangeEvent      = 'specializationQueryConfirmed';
                break;
            case 'industryList':
                rangeView       = new IndustryRangeView({domain: self.TYPE});
                rangeEvent      = 'industryQueryConfirmed';
                break;
            case 'skillList':
                rangeView       = new SkillRangeView({domain: self.TYPE});
                rangeEvent      = 'skillQueryConfirmed';
                break;
            case 'jobFunctionList':
                rangeView       = new JobFnRangeView({domain: self.TYPE});
                rangeEvent      = 'jobFnQueryConfirmed';
                break;
            case 'type':
                rangeView       = new TypeRangeView({domain: self.TYPE});
                rangeEvent      = 'typeRangeQueryConfirmed';
                break;
            case 'subsidiaryList':
                rangeView       = new CompanyRangeView({domain: self.TYPE});
                rangeEvent      = 'companyRangeQueryConfirmed';
                break;
            case 'consultant':
            case 'consultantList':
                rangeView       = new ConsultantRangeView({domain: self.TYPE});
                rangeEvent      = 'consultantConfirmed';
                break;
            case 'organizationUnitList':
                rangeView       = new TeamRangeView({domain: self.TYPE});
                rangeEvent      = 'teamQueryConfirmed';
                rangeType       = rangeType + '.value';
                break;
            case 'referredBy':
                rangeView       = new ReferredRangeView({domain: self.TYPE});
                rangeEvent      = 'referredQueryConfirmed';
                rangeType       = rangeType + '.value';
                break;
            case 'seekingLocations':
                RANGE_HELPER    = self.LOCATION_HELPER;
                RANGE_PROCESS   = self.STANDARD_PROCESS_RANGE_VALUE;
                rangeDefault    = [{
                    uniqueClass: faker.random.alphaNumeric(7),
                    domain: self.TYPE,
                    notClause: false,
                    selectedCondition: 'AND',
                    selectedLocation: '',
                    locationType: 'seekingLocations'
                }];
                rangeView       = new LocationRangeView();
                rangeView.locationType = rangeType;
                rangeEvent      = 'locationQueryConfirmed';
                rangeType       = rangeType + '.name';
                break;
            case 'country':
                RANGE_HELPER    = self.LOCATION_HELPER;
                RANGE_PROCESS   = self.STANDARD_PROCESS_RANGE_VALUE;
                rangeDefault    = [{
                    uniqueClass: faker.random.alphaNumeric(7),
                    domain: self.TYPE,
                    notClause: false,
                    selectedCondition: 'AND',
                    selectedLocation: '',
                    locationType: 'country'
                }];
                rangeView       = new LocationRangeView();
                rangeView.locationType = rangeType;
                rangeEvent      = 'locationQueryConfirmed';
                break;
            case 'locationList':
                RANGE_HELPER    = self.LOCATION_HELPER;
                RANGE_PROCESS   = self.STANDARD_PROCESS_RANGE_VALUE;
                rangeDefault    = [{
                    uniqueClass: faker.random.alphaNumeric(7),
                    domain: self.TYPE,
                    notClause: false,
                    selectedCondition: 'AND',
                    selectedLocation: '',
                    locationType: 'country'
                }];
                rangeView       = new LocationRangeView();
                rangeView.locationType = rangeType;
                rangeEvent      = 'locationQueryConfirmed';
                break;
            case 'nationalityList':
                RANGE_HELPER    = self.LOCATION_HELPER;
                RANGE_PROCESS   = self.STANDARD_PROCESS_RANGE_VALUE;
                rangeDefault    = [{
                    uniqueClass: faker.random.alphaNumeric(7),
                    selectedCondition: 'AND',
                    selectedNationality: 'singaporean'
                }];
                rangeView       = new NatlRangeView();
                rangeEvent      = 'nationalityQueryConfirmed';
                break;
            case 'languageList':
                RANGE_HELPER    = self.LANGUAGE_HELPER;
                RANGE_PROCESS   = self.STANDARD_PROCESS_RANGE_VALUE;

                rangeDefault    = [{
                    uniqueClass: faker.random.alphaNumeric(7),
                    selectedLanguage: 'english',
                    languageProficiency: window.Octus.languageProficiencyList.length - 1,
                    proficiencyOn: false
                }];

                rangeView       = new LanguageQueryBuilderView();
                rangeEvent      = 'languageQueryConfirmed';
                rangeViSize     = 'big';
                rangeOperator   = 'contains';
                rangeType       = rangeType + '.fullDescription';
                inputVal        = $(this).val() || $(this).prev('input').val();
                break;
            case 'currentSalaryBase':
            case 'currentSalaryBonus':
            case 'minimumSalaryBase':
            case 'minimumSalaryBonus':
                RANGE_HELPER    = self.SALARY_HELPER;
                RANGE_PROCESS   = self.PROCESS_SALARY_RANGE_VALUE;
                rangeDefault    = {startSalary: '1,000', endSalary: '9,999'};
                rangeView       = new SalaryRangeView();
                rangeEvent      = 'salaryRangeConfirmed';
                rangeOperator   = 'range';
                rangeViSize     = 'small';
                rangeFn         = rangeType.replace(/Base|Bonus/g, '') + '.' + (rangeType.indexOf('Base') != -1 ? 'base' : 'bonus');
                rangeType2      = rangeType.indexOf('Base') != -1 ? 'base' : 'bonus';
                rangeType       = rangeType.replace(/Base|Bonus/g, '');
                rangeMode       = 'model';
                inputVal        = $(this).val() || $(this).prev('input').val();
                break;
            case 'age':
                RANGE_HELPER    = self.AGE_HELPER;
                RANGE_PROCESS   = self.PROCESS_AGE_RANGE_VALUE;
                rangeDefault    = {startAge: 0, endAge: 100};
                rangeView       = new AgeRangeView();
                rangeEvent      = 'ageRangeConfirmed';
                rangeOperator   = 'range';
                rangeViSize     = 'small';
                rangeMode       = 'model';
                inputVal        = $(this).val() || $(this).prev('input').val();
                break;
            case 'yearsOfExperience':
                RANGE_HELPER    = self.YEAR_HELPER;
                RANGE_PROCESS   = self.PROCESS_AGE_RANGE_VALUE;
                rangeDefault    = {startYear: 0, endYear: 100};
                rangeView       = new YearRangeView();
                rangeEvent      = 'yearsRangeConfirmed';
                rangeOperator   = 'range';
                rangeViSize     = 'small';
                rangeMode       = 'model';
                inputVal        = $(this).val() || $(this).prev('input').val();
                break;
            case 'created':
            case 'updated':
            case 'dob':
            case 'targetDate':
            case 'availability':
            case 'placementDate':
            case 'endDate':
            case 'invoiceDate':
            case 'paymentDueDate':
            case 'probationEndDate':
            case 'guaranteeEndDate':
            case 'startDate':
            case 'jobCreateddate':
            case 'lastMessageDate':
                RANGE_HELPER    = self.CAL_HELPER;
                RANGE_PROCESS   = self.PROCESS_CAL_RANGE_VALUE;
                rangeDefault    = {};
                rangeView       = new CalendarRangeView({ rangeType: rangeType });
                rangeEvent      = 'calRangeConfirmed';
                rangeOperator   = 'range';
                rangeViSize     = 'small';
                rangeMode       = 'model';
                inputVal        = $(this).val() || $(this).prev('input').val();
                break;
            case 'stakeholdersList':
                RANGE_HELPER    = self.STAKEHOLDERS_HELPER;
                RANGE_PROCESS   = self.PROCESS_STAKEHOLDER_RANGE_VALUE;
                rangeDefault    = {};
                rangeView       = new StakeholdersQueryLayout({ filterData: $(this).data('stakeholder') });
                rangeEvent      = 'stakeholdersConfirmed';
                rangeViSize     = 'big';
                rangeMode       = 'model';
                inputVal        = $(this).val() || $(this).prev('input').val();
                break;
            case 'status':
            case 'candidateStatus':
            case 'shortlistStatus':
            case 'workflowStatus':
                RANGE_HELPER    = self.STATUS_HELPER;
                RANGE_PROCESS   = self.PROCESS_STATUS_RANGE_VALUE;
                rangeDefault    = [{selectedStatus: ''}];
                rangeView       = new StatusRangeView({'header': 'statusSelection'});
                rangeView.type  = self.TYPE;
                rangeView.field = rangeType;
                rangeEvent      = 'statusQueryConfirmed';
                break;
            case 'religion':
                RANGE_HELPER    = self.STATUS_HELPER;
                RANGE_PROCESS   = self.PROCESS_STATUS_RANGE_VALUE;
                rangeDefault    = [{selectedStatus: ''}];
                rangeView       = new StatusRangeView({'header': 'religionSelection'});
                rangeView.type  = self.TYPE;
                rangeView.field = rangeType;
                rangeEvent      = 'statusQueryConfirmed';
                break;
            case 'commission':
                RANGE_HELPER    = self.STATUS_HELPER;
                RANGE_PROCESS   = self.PROCESS_STATUS_RANGE_VALUE;
                rangeDefault    = [{selectedStatus: ''}];
                rangeView       = new StatusRangeView({'header': 'commissionSelection'});
                rangeView.type  = self.TYPE;
                rangeView.field = rangeType;
                rangeEvent      = 'statusQueryConfirmed';
                break;
            case 'candidateCode':
                RANGE_HELPER    = self.STATUS_HELPER;
                RANGE_PROCESS   = self.PROCESS_STATUS_RANGE_VALUE;
                rangeDefault    = [{selectedStatus: ''}];
                rangeView       = new StatusRangeView({'header': 'candidateCodeSelection'});
                rangeView.type  = self.TYPE;
                rangeView.field = rangeType;
                rangeEvent      = 'statusQueryConfirmed';
                break;
            case 'ownVehicle':
                RANGE_HELPER    = self.STATUS_HELPER;
                RANGE_PROCESS   = self.PROCESS_STATUS_RANGE_VALUE;
                rangeDefault    = [{selectedStatus: ''}];
                rangeView       = new StatusRangeView({'header': 'ownVehicleSelection'});
                rangeView.type  = self.TYPE;
                rangeView.field = rangeType;
                rangeEvent      = 'statusQueryConfirmed';
                break;
            case 'contractAmount':
                RANGE_HELPER    = self.SALARY_HELPER;
                RANGE_PROCESS   = self.PROCESS_CONTRACT_RANGE_VALUE;
                rangeDefault    = {startSalary: '1,000', endSalary: '9,999'};
                rangeView       = new SalaryRangeView();
                rangeEvent      = 'salaryRangeConfirmed';
                rangeOperator   = 'range';
                rangeViSize     = 'small';
                rangeMode       = 'model';
                rangeType       = 'contract';
                inputVal        = $(this).val() || $(this).prev('input').val();
                break;
            case 'fee':
            case 'salary':
                RANGE_HELPER    = self.SALARY_HELPER;
                RANGE_PROCESS   = self.PROCESS_CONTRACT_RANGE_VALUE;
                rangeDefault    = {startSalary: '1,000', endSalary: '9,999'};
                rangeView       = new SalaryRangeView();
                rangeEvent      = 'salaryRangeConfirmed';
                rangeOperator   = 'range';
                rangeViSize     = 'small';
                rangeMode       = 'model';
                inputVal        = $(this).val() || $(this).prev('input').val();
                break;
            case 'educationList':
            case 'qualificationList':
                RANGE_HELPER    = self.QUALIFICATION_HELPER;
                RANGE_PROCESS   = self.PROCESS_QUALIFICATION_RANGE_VALUE;
                quaOrEdu        = rangeType.replace('List', '');
                rangeDefault    = [{ 
                    domain: self.TYPE,
                    selectedCondition: 'AND',
                    rangeType: quaOrEdu
                }];
                rangeView       = new QualificationRangeView({
                    model: new Backbone.Model({
                        rangeType: quaOrEdu 
                    })
                });
                rangeEvent      = 'qualificationQueryConfirmed';
                rangeOperator   = 'nested';
                rangeViSize     = 'big';
                break;
            case 'employmentHistoryList':
                RANGE_HELPER    = self.EMPLOYMENT_HISTORY_HELPER;
                RANGE_PROCESS   = self.PROCESS_EMPLOYMENT_HISTORY_RANGE_VALUE;
                rangeDefault    = [{
                    selectedCompany: '',
                    selectedTitle: '',
                    selectedCondition: 'AND',
                    uniqueClass: ''
                }];
                rangeView       = new EmploymentHistoryRangeView({ domain: self.TYPE });
                rangeEvent      = 'employmentHistoryRangeConfirmed';
                rangeType       = 'jobHistoryList';
                rangeOperator   = 'nested';
                rangeViSize     = 'big';
                break;
            case 'currentSalary':
            case 'minimumSalary':
                RANGE_HELPER    = self.ADVANCED_SALARY_HELPER;
                RANGE_PROCESS   = self.PROCESS_ADVANCED_SALARY_RANGE_VALUE;
                rangeDefaultObj.rangeType = rangeType;
                rangeView       = new AdvancedSalaryRangeView({
                    model: new Backbone.Model({
                        rangeType: rangeType 
                    })
                });
                rangeEvent      = 'advancedSalaryQueryConfirmed';
                rangeOperator   = 'nested';
                rangeViSize     = 'big';
                break;
            case 'jobSourceDetails':
                rangeView       = new JobSourceDetailRangeView({domain: self.TYPE});
                rangeEvent      = 'jobSourceDetailsConfirmed';
                rangeOperator   = 'range';
                break;
            case 'workingHours':
                rangeView       = new WorkingHoursRangeView({domain: self.TYPE});
                rangeEvent      = 'workingHoursConfirmed';
                rangeOperator   = 'range';
                break;
            default:
                console.error(rangeType, ': action not handled');
                return false;
                break;
        }

        // defensive code to test again if the query builder is really empty
        if (!queryBuilderLS) queryBuilderLS = self.GET_QUERY_BUILDER_LOCALSTORAGE(rangeType);

        var rangeVal =  !queryBuilderLS ? (
                            !!inputVal ? 
                                RANGE_HELPER.CONVERT_HUMAN_TO_JS(inputVal, self) : rangeDefault
                            ) : queryBuilderLS;

        if (_.size(rangeVal) > 0) {
            switch (rangeMode) {
                case 'collection':
                    rangeView.collection = new Backbone.Collection(rangeVal)
                    break;
                case 'model':
                    rangeView.model      = new Backbone.Model(rangeVal)
                    break;
            }
        }

        RecruiterApp.core.vent.trigger('app:modal:show',rangeView, rangeViSize);
        
        rangeView.on(rangeEvent, rangeVal => {
            var processObject = {
                self        : self,
                type        : rangeType,
                typeTwo     : rangeType2,
                currency    : rangeVal.currency,
                human       : !_.isUndefined(rangeVal.human) ? rangeVal.human : '',
                query       : rangeVal.rules, 
                range       : !_.isUndefined(rangeVal.startRange) && !_.isUndefined(rangeVal.endRange) ? {from: rangeVal.startRange, to: rangeVal.endRange} : '',
                grp         : inputGrp,
                filter      : _.findWhere(filters, {field: (_.isEmpty(rangeFn) ? rangeType : rangeFn), operator: rangeOperator}),
                filters     : filters,
                exist       : !_.isUndefined(_.findWhere(filters, {field: (_.isEmpty(rangeFn) ? rangeType : rangeFn)}))
            }

            RANGE_PROCESS(processObject)
        });
    },

    /**
     * CANCEL_FN related cancel handlers
     */
    CANCEL_FN () {
        this.$el.find('.k-filtercell .k-button').on('click', {self: this}, 
            this.ENABLE_INPUT
        );
        this.$el.find(".k-filtercell .k-autocomplete .k-clear-value").remove(); // remove 2nd clear button
        this.$el.find(cancelBtns.join(', '))
            .parent()
            .find('.k-button')
            .off('click')
            .on('click', {self: this}, this.CANCEL_HANDLER);
    },

    /**
     * CANCEL_HANDLER reneric handler to handle all the cancel buttons
     */
    CANCEL_HANDLER (ev) {
        var self            = ev.data.self;
        var grid            = self.$el.find('.KENDO-GRID').data('kendoGrid');

        if (!grid) return false;

        var filters         = grid.dataSource.filter().filters;

        // different range type will be handled differently
        var btnEl           = $(this);
        var rangeGrp        = btnEl.parents('[data-field]');
        var rangeType       = rangeGrp.data('field'),
            rangeName,      // ──┐
            rangeField,     // ──── only used for salary
            rangeCcy,       // ──┘
            rangeExist      = false,
            rangeCcyExist   = false,
            rangeOperator   = 'contains';

        switch(rangeType) {
            case 'age':
            case 'yearsOfExperience':
            case 'updated':
            case 'dob':
            case 'targetDate':
            case 'availability':
            case 'placementDate':
            case 'endDate':
            case 'invoiceDate':
            case 'paymentDueDate':
            case 'probationEndDate':
            case 'guaranteeEndDate':
            case 'startDate':
            case 'lastMessageDate':
            case 'jobCreateddate':
            case 'created':
                rangeOperator   = 'range';
                break;
            case 'shortlistStatus':
            case 'workflowStatus':
            case 'candidateStatus':
            case 'status':
            case 'religion':
            case 'commission':
            case 'candidateCode':
            case 'ownVehicle':
                rangeOperator   = 'contains';
                break;
            case 'contractAmount':
                rangeOperator   = 'range';
                rangeCcy        = 'contractCurrency';
                break;
            case 'salary':
                rangeType       = 'salaryAmount';
                rangeCcy        = 'salaryCurrency';
                rangeOperator   = 'range';   
                break;
            case 'fee':
                rangeType       = 'feeAmount';
                rangeCcy        = 'feeCurrency';
                rangeOperator   = 'range';  
                break;
            case 'stakeholdersList':
                filters = _.without(filters, _.findWhere(filters, {field: 'candidateList.id'}));
                filters = _.without(filters, _.findWhere(filters, {field: 'clientList.id'}));
                filters = _.without(filters, _.findWhere(filters, {field: 'companyList.id'}));
                filters = _.without(filters, _.findWhere(filters, {field: 'jobList.id'}));
                break;
            case 'seekingLocations':
                self.UNSET_QUERY_BUILDER_LOCALSTORAGE(rangeType);
                rangeType       = rangeType + '.name';
                rangeOperator   = 'contains';
                break;
            case 'languageList':
                self.UNSET_QUERY_BUILDER_LOCALSTORAGE(rangeType);
                rangeType       = rangeType + '.fullDescription';
                rangeOperator   = 'contains';
                break;
            case 'employmentHistoryList':
                rangeType       = 'jobHistoryList';
                self.UNSET_QUERY_BUILDER_LOCALSTORAGE(rangeType);
                rangeOperator   = 'nested';
                break;
            case 'referredBy':
            case 'organizationUnitList':
                rangeType       = rangeType + '.value';
                self.UNSET_QUERY_BUILDER_LOCALSTORAGE(rangeType);
                rangeOperator   = 'contains';
                break;
            case 'country':
            case 'locationList':
            case 'nationalityList':
                self.UNSET_QUERY_BUILDER_LOCALSTORAGE(rangeType);
                rangeOperator   = 'contains';
                break;
            case 'minimumSalary':
            case 'currentSalary':
            case 'educationList':
            case 'qualificationList':
                self.UNSET_QUERY_BUILDER_LOCALSTORAGE(rangeType);        
                rangeOperator   = 'nested';  
                break;
            case 'skillList':
            case 'industryList':
            case 'jobFunctionList':
            case 'specializationList':
            case 'type':
            case 'subsidiaryList':
            case 'consultantList':
            case 'consultant':
                self.UNSET_QUERY_BUILDER_LOCALSTORAGE(rangeType);
                break;
            case 'currentSalaryBase':
            case 'currentSalaryBonus':
            case 'minimumSalaryBase':
            case 'minimumSalaryBonus':
                rangeOperator   = 'range';
                rangeName       = rangeType.replace(/Base|Bonus/g, '');
                rangeField      = rangeName + '.' + (rangeType.indexOf('Base') != -1 ? 'base' : 'bonus');
                rangeCcy        = rangeName + '.currency.symbol';
                rangeType       = rangeField;
                break;
            case 'jobSourceDetails':
                self.UNSET_QUERY_BUILDER_LOCALSTORAGE(rangeType);
                rangeType       = rangeType + '.value';
                rangeOperator   = 'range';
                break;
            case 'workingHours':
                self.UNSET_QUERY_BUILDER_LOCALSTORAGE(rangeType);
                rangeType       = 'workingTime';
                rangeOperator   = 'nested';
                break;
            default:
                console.error(rangeType, ': action not handled')
                return false;
                break;
        }  

        var customKendoDropdown = btnEl.parent().find('.k-widget .custom-kendo-dropdown').data("kendoDropDownList");

        if (customKendoDropdown) customKendoDropdown.value('Query Builder');

        let findWhereFieldRangeType = _.findWhere(filters, {field: rangeType});
        let findWhereFieldRangeCcy  = _.findWhere(filters, {field: rangeCcy, operator: 'contains'});

        rangeExist      = !_.isUndefined(findWhereFieldRangeType)
        rangeCcyExist   = !_.isUndefined(findWhereFieldRangeCcy)

        if (rangeExist || rangeCcyExist || rangeType == 'stakeholdersList') {
            filters = _.without(filters, findWhereFieldRangeType);
            filters = _.without(filters, findWhereFieldRangeCcy);

            grid.dataSource.filter(filters);

            rangeGrp.find('input').val('').removeAttr('disabled');
        }

        _.delay(() => $(this).hide(), 400);
    },

    /**
     * Action kendo double click
     */
    ACTION_DBLCLICK_KENDO (type) {
        var _fieldName = 'viewRecord';
        var allowReadRecords = !_.isEmpty(_.where(this.PERMISSIONS_FOR_VIEW, {fieldName: _fieldName, read: true}))
        let id;
        let recordType = type;

        if (allowReadRecords) {
            this.$el.find(".KENDO-GRID tbody>tr")
                .off('dblclick')
                .on('dblclick', (e) => {
                    var gview = this.$el.find(".KENDO-GRID").data("kendoGrid");

                    /**
                     * Deprecated first option in 2.14 with the move to checkbox select
                     */
                    // if ( gview.select().length > 0 ) {
                    //     var selectedItem = gview.dataItem(gview.select());
                    //     id = selectedItem.id;
                    //     recordType = this.TYPE;
                    // } 
                    const kendoUniqueRowId = e.currentTarget.dataset.uid;
                    const rowClicked = gview.dataSource.data().find(item => item.uid === kendoUniqueRowId);
                    if (rowClicked) {
                        id = rowClicked.id;
                    }                    

                    switch(recordType) {
                        case 'candidate':
                            RecruiterApp.core.vent.trigger('candidateDashboard:show', id);
                            break;
                        case 'client':
                            RecruiterApp.core.vent.trigger('clientDashboard:show', id);
                            break;
                        case 'company':
                            RecruiterApp.core.vent.trigger('companyDashboard:detail:show', id);
                            break;
                        case 'job':
                            RecruiterApp.core.vent.trigger('jobDetailDashboard:selected:detail', id);
                            break;
                    }
                });  
        } else {
            this.$el.find(".KENDO-GRID tbody>tr").find('.' + _fieldName).contents().unwrap()
        }
    },

    /**
     * Action delete individual record kendo
     */
    ACTION_DELETE_RECORD (recordType) {

        this.$el.find(".KENDO-GRID tbody>tr .deleteAction")
            .off('click')
            .on('click', (e) => {
                const recordId = e.currentTarget.dataset.recordid;
                switch (recordType) {
                    case 'candidate':
                    case 'client': 
                        RecruiterApp.core.vent.trigger(`${recordType}List:delete`, recordId);
                        break;
                    case 'company': 
                        RecruiterApp.core.vent.trigger(`${recordType}List:${recordType}:delete`, recordId);
                        break;
                    case 'job': 
                        RecruiterApp.core.vent.trigger(`${recordType}OverviewDashboard:delete`, recordId);
                        break;
                }
            });  
    },

    ACTION_FIELD_CONFIG () {
        var grid = this.$el.find('.KENDO-GRID').data('kendoGrid');

        if (!grid) return false;

        if (this.baseFn.REDUCE_FUNCTION().touch && this.baseFn.REDUCE_FUNCTION().mobileScreen) { 
            grid.hideColumn('actionField'); 
        } else if (this.baseFn.REDUCE_FUNCTION().mobileScreen) {
            this.$el.find('.KENDO-GRID .kendo-icon.radioCheck').hide();
        } else {
            grid.showColumn('actionField'); 
        }

        this.$el.find('[data-toggle="tooltip"]').tooltip();
    },

    /**
     * Action kendo range input
     */
    ACTION_FORMAT_RANGE_INPUT () {
        let grid = this.$el.find('.KENDO-GRID').data('kendoGrid'),
            self = this;

        if (!grid) return false;

        let gridFiltersExist            = !_.isUndefined(grid.dataSource.filter())

        let findFilterObj = (fieldName, attr) => {
            if (!gridFiltersExist) return [];

            let filObj;

            if (_.isArray(fieldName))           filObj = gridDsFilters.find(fil => fieldName.includes(fil.field))
            else if (_.isString(fieldName))     filObj = gridDsFilters.find(fil => fil.field === fieldName)
            else                                throw "fieldName is not a string or array";

            if (!filObj)        return []
            else if (!attr)     return filObj
            else                return filObj[attr];
        }

        let assessRangeFilter = obj => {
            let inp = this.$el.find(obj.inputSelector),
                inputVal = obj.inputVal && _.isFunction(obj.inputVal) ? obj.inputVal() : false;

            if (!inputVal && !_.isUndefined(obj.rangeFilter) && _.isString(obj.rangeFilter.value)) {
                inputVal = this.REMOVE_DOUBLE_QUOTES(obj.rangeFilter.value);
            }

            let clearBtn = inp.siblings('[title="Clear"]');

            if (_.size(inputVal) > 0) {
                setTimeout(() => {
                    inp.val(inputVal);
                    clearBtn.removeAttr('style data-bind');
                }, 200)
            }
        }

        let gridDsFilters               = gridFiltersExist ? grid.dataSource.filter().filters : [];
        let rangeFilters                = gridFiltersExist ? _.where(gridDsFilters, {operator:'range'}) : '';

        let calRangeFilters             = _.reject(rangeFilters, fil => fil.field === 'age' || fil.field === 'yearsOfExperience' || fil.field === 'contractAmount' );
        let ageRangeFilters             = _.filter(rangeFilters, fil => fil.field === 'age' );
        let yearRangeFilters            = _.filter(rangeFilters, fil => fil.field === 'yearsOfExperience' );
        let salaryMinBaseRangeFilters   = _.filter(rangeFilters, fil => fil.field === 'minimumSalary.base' );
        let salaryMinBonusRangeFilters  = _.filter(rangeFilters, fil => fil.field === 'minimumSalary.bonus' );
        let salaryCurBaseRangeFilters   = _.filter(rangeFilters, fil => fil.field === 'currentSalary.base' );
        let salaryCurBonusRangeFilters  = _.filter(rangeFilters, fil => fil.field === 'currentSalary.bonus' );
        let contractAmtRangeFilters     = _.filter(rangeFilters, fil => fil.field === 'contractAmount' );

        let languageQueryFilter         = findFilterObj("languageList.fullDescription");
        let natlQueryFilter             = findFilterObj("nationalityList");
        let statusQueryFilter           = findFilterObj("status");
        let religionQueryFilter         = findFilterObj("religion");
        let commissionQueryFilter       = findFilterObj("commission");
        let candidateCodeQueryFilter    = findFilterObj("candidateCode");
        let ownVehicleQueryFilter       = findFilterObj("ownVehicle");
        let seekingLocasFilter          = findFilterObj("seekingLocations.name");
        let countryFilter               = findFilterObj("country");
        let locationListFilter          = findFilterObj("locationList");
        let specListRangeFilter         = findFilterObj("specializationList");
        let indListRangeFilter          = findFilterObj("industryList");
        let skillListRangeFilter        = findFilterObj("skillList");
        let jobFnListRangeFilter        = findFilterObj("jobFunctionList");
        let teamListRangeFilter         = findFilterObj("organizationUnitList.value");
        let refListRangeFilter          = findFilterObj("referredBy.value");
        let placementSalaryFilters      = findFilterObj("salaryAmount");
        let placementCurrency           = findFilterObj("salaryCurrency", "value");
        let minimumSalaryRangeFilter    = findFilterObj("minimumSalary", "filters");
        let currentSalaryRangeFilter    = findFilterObj("currentSalary", "filters");
        let qualificationRangeFilter    = findFilterObj("qualificationList", "filters");
        let educationRangeFilter        = findFilterObj("educationList", "filters");
        let contractCurrency            = findFilterObj("contractCurrency", "value");
        let salaryCurrency              = findFilterObj(["minimumSalary.currency.symbol", "currentSalary.currency.symbol"], "value");
        let subsidiaryListRangeFilter   = findFilterObj("subsidiaryList");
        let companyTypeRangeFilter      = findFilterObj("type");
        let consultantRangeFilter       = findFilterObj(["consultantList", "consultant"]);

        let stakeholderRangeFilter      = gridFiltersExist ? _.filter(gridDsFilters, fil => fil.field === 'candidateList.id' || fil.field === 'clientList.id' || fil.field === 'companyList.id' || fil.field === 'jobList.id' ) : [];
            stakeholderRangeFilter      = _.isEmpty(stakeholderRangeFilter) ? [] : stakeholderRangeFilter; 

        let emplHistoryListRangeFilter  = gridFiltersExist ? _.filter(gridDsFilters, fil => fil.field === "employmentHistoryList" || fil.field === "jobHistoryList" ) : []
            emplHistoryListRangeFilter  = _.isEmpty(emplHistoryListRangeFilter) ? [] : emplHistoryListRangeFilter[0].filters;

        assessRangeFilter({
            rangeFilter:    stakeholderRangeFilter,
            inputSelector:  '[data-field="stakeholdersList"] input.range-stakeholdersList',
            inputVal() {
                return stakeholderRangeFilter.length > 0 ? self.STAKEHOLDERS_HELPER.CONVERT_ES_TO_HUMAN(stakeholderRangeFilter).join(', ') : '';
            }
        })
        assessRangeFilter({
            rangeFilter:    salaryMinBaseRangeFilters,
            inputSelector:  '[data-field="minimumSalaryBase"] input.range-salary',
            inputVal() {
                return salaryMinBaseRangeFilters[0] ? self.SALARY_HELPER.CONVERT_ES_TO_HUMAN(salaryCurrency, salaryMinBaseRangeFilters[0].rangeValue) : '';
            }
        })
        assessRangeFilter({
            rangeFilter:    salaryMinBonusRangeFilters,
            inputSelector:  '[data-field="minimumSalaryBonus"] input.range-salary',
            inputVal() {
                return salaryMinBonusRangeFilters[0] ? self.SALARY_HELPER.CONVERT_ES_TO_HUMAN(salaryCurrency, salaryMinBonusRangeFilters[0].rangeValue) : '';
            }
        })
        assessRangeFilter({
            rangeFilter:    salaryCurBaseRangeFilters,
            inputSelector:  '[data-field="currentSalaryBase"] input.range-salary',
            inputVal() {
                return salaryCurBaseRangeFilters[0] ? self.SALARY_HELPER.CONVERT_ES_TO_HUMAN(salaryCurrency, salaryCurBaseRangeFilters[0].rangeValue) : '';
            }
        })
        assessRangeFilter({
            rangeFilter:    salaryCurBonusRangeFilters,
            inputSelector:  '[data-field="currentSalaryBonus"] input.range-salary',
            inputVal() {
                return salaryCurBonusRangeFilters[0] ? self.SALARY_HELPER.CONVERT_ES_TO_HUMAN(salaryCurrency, salaryCurBonusRangeFilters[0].rangeValue) : '';
            }
        })
        assessRangeFilter({
            rangeFilter:    contractAmtRangeFilters,
            inputSelector:  '[data-field="contractAmount"] input.range-contractAmount',
            inputVal() {
                return contractAmtRangeFilters[0] ? self.SALARY_HELPER.CONVERT_ES_TO_HUMAN(contractCurrency, contractAmtRangeFilters[0].rangeValue) : '';
            }
        })
        assessRangeFilter({
            rangeFilter:    placementSalaryFilters,
            inputSelector:  '[data-field="organizationUnitList"] input.range-organizationUnitList',
            inputVal () {
                return placementSalaryFilters.length > 0 ? self.SALARY_HELPER.CONVERT_ES_TO_HUMAN(placementCurrency, placementSalaryFilters.rangeValue) : '';
            }
        })
        assessRangeFilter({
            rangeFilter:    languageQueryFilter,
            inputSelector:  '[data-field="languageList"] input.range-languageList'
        })
        assessRangeFilter({
            rangeFilter:    seekingLocasFilter,
            inputSelector:  '[data-field="seekingLocations"] input.range-seekingLocations'
        })
        assessRangeFilter({
            rangeFilter:    countryFilter,
            inputSelector:  '[data-field="country"] input.range-country'
        })
        assessRangeFilter({
            rangeFilter:    locationListFilter,
            inputSelector:  '[data-field="locationList"] input.range-locationList'
        })
        assessRangeFilter({
            rangeFilter:    natlQueryFilter,
            inputSelector:  '[data-field="nationalityList"] input.range-nationalityList'
        })
        assessRangeFilter({
            rangeFilter:    statusQueryFilter,
            inputSelector:  '[data-field="status"] input.range-status'
        })
        assessRangeFilter({
            rangeFilter:    religionQueryFilter,
            inputSelector:  '[data-field="status"] input.range-religion'
        })
        assessRangeFilter({
            rangeFilter:    commissionQueryFilter,
            inputSelector:  '[data-field="status"] input.range-commission'
        })
        assessRangeFilter({
            rangeFilter:    candidateCodeQueryFilter,
            inputSelector:  '[data-field="status"] input.range-candidateCode'
        })
        assessRangeFilter({
            rangeFilter:    ownVehicleQueryFilter,
            inputSelector:  '[data-field="status"] input.range-ownVehicle'
        })
        assessRangeFilter({
            rangeFilter:    specListRangeFilter,
            inputSelector:  '[data-field="specializationList"] input.range-specializationList'
        })
        assessRangeFilter({
            rangeFilter:    indListRangeFilter,
            inputSelector:  '[data-field="industryList"] input.range-industryList'
        })
        assessRangeFilter({
            rangeFilter:    skillListRangeFilter,
            inputSelector:  '[data-field="skillList"] input.range-skillList'
        })
        assessRangeFilter({
            rangeFilter:    jobFnListRangeFilter,
            inputSelector:  '[data-field="jobFunctionList"] input.range-jobFunctionList'
        })
        assessRangeFilter({
            rangeFilter:    refListRangeFilter,
            inputSelector:  '[data-field="referredBy"] input.range-referredBy'
        })
        assessRangeFilter({
            rangeFilter:    teamListRangeFilter,
            inputSelector:  '[data-field="organizationUnitList"] input.range-organizationUnitList'
        })
        assessRangeFilter({
            rangeFilter:    educationRangeFilter,
            inputSelector:  '[data-field="educationList"] input.range-educationList',
            inputVal() {
                return educationRangeFilter && educationRangeFilter.length > 0 ? self.QUALIFICATION_HELPER.CONVERT_ES_TO_HUMAN(educationRangeFilter, "ACADEMIC") : "";
            }
        })
        assessRangeFilter({
            rangeFilter:    qualificationRangeFilter,
            inputSelector:  '[data-field="qualificationList"] input.range-qualificationList',
            inputVal() {
                return qualificationRangeFilter && qualificationRangeFilter.length > 0 ? self.QUALIFICATION_HELPER.CONVERT_ES_TO_HUMAN(qualificationRangeFilter, "ACADEMIC") : "";
            }
        })
        assessRangeFilter({
            rangeFilter:    minimumSalaryRangeFilter,
            inputSelector:  '[data-field="minimumSalary"] input.advanced-salary-range-picker',
            inputVal() {
                return minimumSalaryRangeFilter && minimumSalaryRangeFilter.length > 0 ? self.ADVANCED_SALARY_HELPER.CONVERT_ES_TO_HUMAN(minimumSalaryRangeFilter) : "";
            }
        })
        assessRangeFilter({
            rangeFilter:    currentSalaryRangeFilter,
            inputSelector:  '[data-field="currentSalary"] input.advanced-salary-range-picker',
            inputVal() {
                return currentSalaryRangeFilter && currentSalaryRangeFilter.length > 0 ? self.ADVANCED_SALARY_HELPER.CONVERT_ES_TO_HUMAN(currentSalaryRangeFilter) : "";
            }
        })
        assessRangeFilter({
            rangeFilter:    emplHistoryListRangeFilter,
            inputSelector:  '[data-field="employmentHistoryList"] input.range-employmentHistoryList',
            inputVal() {
                return emplHistoryListRangeFilter && emplHistoryListRangeFilter.length > 0 ? self.EMPLOYMENT_HISTORY_HELPER.CONVERT_ES_TO_HUMAN(emplHistoryListRangeFilter, self) : "";
            }
        })        

        if (_.size(calRangeFilters) > 0) {
            _.each(calRangeFilters, rangeFilter => {
                var human_cal_created_range = moment.utc(rangeFilter.rangeValue.from).format(window.Octus.DATE_FORMAT) + ' - ' 
                                            + moment.utc(rangeFilter.rangeValue.to).format(window.Octus.DATE_FORMAT);
                var rangeGrp = this.$el.find('[data-field="' + rangeFilter.field + '"]');
                
                setTimeout(() => { 
                    rangeGrp.find('input').val(human_cal_created_range);
                    rangeGrp.find('[title="Clear"]').removeAttr('style data-bind').show();
                }, 200);    
            });
        } else {
            this.$el.find('.range-calendar').val('');
            this.$el.find('.range-calendar').siblings('.k-button-icon').hide();
        }

        if (_.size(ageRangeFilters) > 0) {
            _.each(ageRangeFilters, rangeFilter => {
                var human_cal_created_range = rangeFilter.rangeValue.from + ' - ' + rangeFilter.rangeValue.to;
                var rangeGrp = this.$el.find('[data-field="' + rangeFilter.field + '"]');
                
                setTimeout(() => { 
                    rangeGrp.find('input').val(human_cal_created_range);
                    rangeGrp.find('[title="Clear"]').removeAttr('style data-bind').show();
                }, 200);
            });
        }

        if (_.size(yearRangeFilters) > 0) {
            _.each(yearRangeFilters, rangeFilter => {
                var human_cal_created_range = rangeFilter.rangeValue.from + ' - ' + rangeFilter.rangeValue.to;
                var rangeGrp = this.$el.find('[data-field="' + rangeFilter.field + '"]');
                
                setTimeout(() => { 
                    rangeGrp.find('input').val(human_cal_created_range);
                    rangeGrp.find('[title="Clear"]').removeAttr('style data-bind').show();
                }, 200);
            });
        }

        if (_.size(companyTypeRangeFilter) > 0) {
            setTimeout(() => {
                self.$el.find('[data-field="type"] input.range-type').val(self.REMOVE_DOUBLE_QUOTES(companyTypeRangeFilter.value));
                self.$el.find('[data-field="type"] input.range-type').siblings('[title="Clear"]').removeAttr('style data-bind').show();
            }, 200);
        }

        if (_.size(subsidiaryListRangeFilter) > 0) {
            setTimeout(() => {
                self.$el.find('[data-field="subsidiaryList"] input.range-subsidiaryList').val(self.REMOVE_DOUBLE_QUOTES(subsidiaryListRangeFilter.value));
                self.$el.find('[data-field="subsidiaryList"] input.range-subsidiaryList').siblings('[title="Clear"]').removeAttr('style data-bind').show();
            }, 200);
        }

        if (_.size(consultantRangeFilter) > 0) {
            let consultantListInp   = this.$el.find('[data-field="consultantList"] input.range-consultantList');
            let consultantInp       = this.$el.find('[data-field="consultant"] input.range-consultantList');

            setTimeout(() => { 
                consultantListInp.val(this.REMOVE_DOUBLE_QUOTES(consultantRangeFilter.value));
                consultantListInp.siblings('[title="Clear"]').removeAttr('style data-bind').show();
                
                consultantInp.val(this.REMOVE_DOUBLE_QUOTES(consultantRangeFilter.value));
                consultantInp.siblings('[title="Clear"]').removeAttr('style data-bind').show();
            }, 200);    
        }

        var jobSourceDetailsRangeFilters        = gridFiltersExist ? _.filter(gridDsFilters, function(fil) { return fil.field === 'jobSourceDetails.value';})[0] : []
            jobSourceDetailsRangeFilters        = _.isEmpty(jobSourceDetailsRangeFilters) ? [] : jobSourceDetailsRangeFilters; 

        if (_.size(jobSourceDetailsRangeFilters) > 0) {
            RecruiterApp.core.vent.trigger('app:DEBUG:warn', 'jobSourceDetailsRangeFilters')
            self.$el.find('[data-field="jobSourceDetails"] input.range-job-source-details').val(jobSourceDetailsRangeFilters.value.replace(/"/g, ""));
            setTimeout(function(){ 
                self.$el.find('[data-field="jobSourceDetails"] input.range-job-source-details').siblings('[title="Clear"]').removeAttr('style data-bind').show();
            }, 200);
        } else {
            self.$el.find('[data-field="jobSourceDetails"] input.range-job-source-details').val('')
            self.$el.find('[data-field="jobSourceDetails"] input.range-job-source-details').siblings('.k-button-icon').hide()
        }

        var workingTimeRangeFilter              = gridFiltersExist ? _.filter(gridDsFilters, function(fil) { return fil.field === 'workingTime';})[0] : []
            workingTimeRangeFilter              = _.isEmpty(workingTimeRangeFilter) ? [] : workingTimeRangeFilter; 

        if (_.size(workingTimeRangeFilter) > 0) {
            RecruiterApp.core.vent.trigger('app:DEBUG:warn', 'workingTimeRangeFilter')
            
            let getRangeValFunc   = filterGrp => {
                if (!filterGrp || !filterGrp.filters) return '';
                
                let to12Hr = val => {
                    if (!val) return "";
                    let hr      = parseInt(val.slice(0, val.indexOf(':')));
                    let min     = val.slice(val.indexOf(':'));
                    let ampm    = hr >= 12 ? ' PM' : ' AM'; 
                    if (hr > 12) {
                        hr -= 12;
                    } else if (hr == 0) {
                        hr = 12;
                    }
                    hr = hr.toString();
                    return hr + min + ampm;
                };
                return filterGrp.filters.map(fil => {
                    if (fil.field.indexOf('From') > -1) {
                        return `${RecruiterApp.polyglot.t('from')}: ${to12Hr(fil.rangeValue.from)}`;
                    } else {
                        return `${RecruiterApp.polyglot.t('to')}: ${to12Hr(fil.rangeValue.to)}`;
                    }
                }).join(' ') + ' ';
            }

            let getLabel    = filterGrp => {
                if (!filterGrp || !filterGrp.filters) return '';
                return RecruiterApp.polyglot.t(filterGrp.filters[0].field.replace(/workingTime\.|From|To/g, '')) + ' ';
            }

            let getSatWorkCond = filterGrp => {
                if (!filterGrp || filterGrp.length == 0) return '';
                let satCond = filterGrp.find(fil => {
                    if (fil.field) {
                        return fil.field.indexOf('.saturdayWork.') > -1
                    }
                });
                if (satCond) {
                    return `${RecruiterApp.polyglot.t('saturdayWorkingCondition')}: ${satCond.value} `
                } else {
                    return ''
                }
            }

            let workingTimeVal = workingTimeRangeFilter.filters.map((filGrp, i) => {
                let filGrpWeekdays   = filGrp.filters[0];
                let filGrpSaturday   = filGrp.filters[1];
                let filGrpLogic      = i == 0 ? '' : filGrp.logic + ' ';

                return `${filGrpLogic}${getLabel(filGrpWeekdays)}${getRangeValFunc(filGrpWeekdays)}${getLabel(filGrpSaturday)}${getRangeValFunc(filGrpSaturday)}${getSatWorkCond(filGrp.filters)}`;
            }).join('');

            self.$el.find('[data-field="workingHours"] input.range-working-hours').val(workingTimeVal)
            
            setTimeout(function(){ 
                self.$el.find('[data-field="workingHours"] input.range-working-hours').siblings('[title="Clear"]').removeAttr('style data-bind').show();
            }, 200);
        } else {
            self.$el.find('[data-field="workingHours"] input.range-working-hours').val('')
            self.$el.find('[data-field="workingHours"] input.range-working-hours').siblings('.k-button-icon').hide()
        }
    },

    /**
     * Action Kendo to Show More - Show Less
     */
    ACTION_SHOWMORE () {
        var grid                = $('#grid').data('kendoGrid');

        if (!grid) return false;

        let hackRefresh = target => {
            let colIndex = $(this.$el.find(target).parents('[role="gridcell"]')).index() + 1;
            grid.hideColumn(colIndex);
            grid.showColumn(colIndex);
        }

        this.$el.find('#grid a.more').off().on('click', e => {
            e.preventDefault()
            this.$el.find(e.currentTarget).toggleClass('hidden');
            this.$el.find(e.currentTarget).next('.more-content').toggleClass('hidden');
            hackRefresh(e.currentTarget)
        });

        this.$el.find('#grid a.less').off().on('click', e => {
            e.preventDefault()
            this.$el.find(e.currentTarget).parent().toggleClass('hidden');
            this.$el.find(e.currentTarget).parent().prev('.more').toggleClass('hidden');
            hackRefresh(e.currentTarget)
        });
    },

    /**
     * Action Kendo menu
     * @param {event} e event
     */
    ACTION_KENDO_MENU (e) {
        var grid                = this.$el.find('.KENDO-GRID').data('kendoGrid');

        if (!grid) return false;

        var selectedItems       = (!this.baseFn.REDUCE_FUNCTION().mobileScreen) ? grid.select() : [],
            gridType            = this.TYPE + 'Grid',

            hasClearFilter      =   $(e.item).hasClass('clearFilter'),
            hasAddToThisJob     =   $(e.item).hasClass('addToThisJob'),
            hasSaveSearchAs     =   $(e.item).hasClass('saveSearchAs'),
            hasSavedFilter      =   $(e.item).hasClass('savedFilter'),
            hasDeleteSave       =   $(e.item).hasClass('deleteSave'),
            hasShareSave        =   $(e.item).hasClass('shareSave'),
            hasAddToHotList     =   $(e.item).hasClass('appendToHotList'),
            hasCreateHotList    =   $(e.item).hasClass('createHotList'),
            hasDelHotList       =   $(e.item).hasClass('deleteHotList'),
            hasManageHotList    =   $(e.item).hasClass('manageHotList'),
            hasShareHotList     =   $(e.item).hasClass('shareHotList'),
            hasOwnJobs          =   $(e.item).hasClass('ownJobs'),
            hasLiveJobs         =   $(e.item).hasClass('liveJobs'),
            hasMatchCcd         =   $(e.item).hasClass('matchCandidates'),
            hasMassDelete       =   $(e.item).hasClass('massDelete'),
            hasExpExcel         =   $(e.item).hasClass('exportToExcel'),
            hasExpPdf           =   $(e.item).hasClass('exportToPdf'),

            // Deprecated 2.14 moving kendo to checkbox select
            // hasSelectAll        =   $(e.item).hasClass('selectAll'),
            // hasUnselectAll      =   $(e.item).hasClass('unselectAll'),
            hasShowAllFields    =   $(e.item).hasClass('showAllFields'),
            hasAddJob           =   $(e.item).hasClass('addJob'),
            hasGenerateCv       =   $(e.item).hasClass('generateCv'),
            // sending email:
            hasEmailRecords     =   $(e.item).hasClass('emailRecords'),
            hasSendJobs         =   $(e.item).hasClass('SendJobs'),
            hasMassMailing      =   $(e.item).hasClass('massMailing'),
            hasSpecCvMenu       =   $(e.item).hasClass('SpecCv'),
            gridfilters         =   (grid.dataSource.filter() && grid.dataSource.filter().filters) ? 
                                        grid.dataSource.filter().filters : [];

        let cleanList = dirtyList => {
            var div = document.createElement("div");
                div.innerHTML = dirtyList;
            $(div).find('.more, .less').remove();
            return div.textContent || div.innerText || "";
        }

        let getSelItems = (item, opt) => {
            item = grid.dataItem(item);
            let obj = { id: item.id };

            if (opt && opt.name) {
                if (item.allNames)                          obj.name = item.allNames;
                else if (item.firstName && item.lastName)   obj.name = item.firstName + ' ' + item.lastName;
                else if (item.name)                         obj.name = item.name;
                else if (item.title)                        obj.name = item.title;

                obj.name = obj.name.replace(/ +(?= )/g, '');
            };

            if (opt && opt.descriptionList) {
                obj.descriptionList = _.compact(item.descriptionList.map(desp => {
                    if (desp.get('type') == 'EXTERNAL') return desp.toJSON();
                }));
            };

            if (opt && opt.cvList)             obj.cvList             = item.cvList.toJSON();
            if (opt && opt.skillList)          obj.skillList          = cleanList(item.skillList);
            if (opt && opt.industryList)       obj.industryList       = cleanList(item.industryList);
            if (opt && opt.specializationList) obj.specializationList = cleanList(item.specializationList);
            if (opt && opt.jobFunctionList)    obj.jobFunctionList    = cleanList(item.jobFunctionList);
            if (opt && opt.firstName)          obj.firstName          = item.firstName;
            if (opt && opt.lastName)           obj.lastName           = item.lastName;
            if (opt && opt.company)            obj.company            = item.company;
            if (opt && opt.companyId)          obj.companyId          = item.companyId;
            if (opt && opt.title)              obj.title              = item.title;
            if (opt && opt.email)              obj.email              = item.email;

            return obj
        }

        let simpleGetSelItems = (types) => {
            types = types.reduce((result, item) => {
                result[item] = true;
                return result;
            }, {});
            return _.uniq(_.map(selectedItems, selItem => getSelItems(selItem, types)), 'id');
        }

        let checkEmailConfig = config => {
            if (config.get('syncState') == 'error' || config.get('syncState') == 'invalid' || config.get('syncState') == 'invalid-credentials') {
                RecruiterApp.core.vent.trigger('emailConfigErrorNotification');
                return false;
            }
            return true;
        }

        if (hasClearFilter) {
            this.CLEAR_FILTER()

        } else if (hasSaveSearchAs) {
            this.SAVE_SEARCH_AS(true);

        } else if (hasShowAllFields) {
            this.EXPOSE_ALL_KENDO_GRID_FIELDS();

        } else if (hasExpExcel) {
            grid.saveAsExcel();
            this.SEND_GA({eventAction: 'SaveAsExcel'});

        } else if (hasExpPdf) {
            grid.saveAsPDF();
            this.SEND_GA({eventAction: 'SaveAsPDF'});
        
        // Deprecated 2.14 moving kendo to checkbox select
        // } else if (hasUnselectAll) {
            // grid.clearSelection();
            // this.SEND_GA({eventAction: 'ClearSelection'});

        // } else if (hasSelectAll) {
            // grid.select(grid.tbody.find('>tr'))
            // this.SEND_GA({eventAction: 'SelectAll'});

        } else if (hasSavedFilter) {
            var optId = $(e.item).find('[data-opt]').attr('data-opt');

            RecruiterApp.core.vent.trigger('blockUI', ' Loading...');

            setTimeout(() => {
                $("#menu").data('kendoMenu').enable(".clearFilter");
                this.LOAD_SEARCH(optId);
            }, 500);

        } else if (hasDeleteSave || hasShareSave) {
            var optId = $(e.item).parents('.savedFilter').find('[data-opt]').attr('data-opt');
            $("#menu").data("kendoMenu").close('.savedSearches')

            if (hasDeleteSave)  this.DELETE_SEARCH(optId);
            if (hasShareSave)   this.SHARE_SAVED_FILTER(optId);

        } else if (hasCreateHotList) {
            this.userHotListHelpers.CREATE_HOT_LIST(gridType);

        } else if (hasAddToHotList) {
            var optId = $(e.item).parents('.hotList').find('[data-opt]').attr('data-opt');
            var selItems = simpleGetSelItems();
            this.userHotListHelpers.ADD_TO_HOTLIST(optId, selItems)

        } else if (hasDelHotList) {
            var optId = $(e.item).parents('.hotList').find('[data-opt]').attr('data-opt');
            this.userHotListHelpers.DELETE_HOTLIST(optId, gridType);
            this.SEND_GA({eventAction: 'DeleteHotList', eventLabel: 'Start'});

        } else if (hasManageHotList) {
            var optId = $(e.item).parents('.hotList').find('[data-opt]').attr('data-opt');
            this.userHotListHelpers.MANAGE_HOTLIST(optId);
            this.SEND_GA({eventAction: 'ManageHotList'});

        } else if (hasShareHotList) {
            var optId = $(e.item).parents('.hotList').find('[data-opt]').attr('data-opt');
            this.userHotListHelpers.SHARE_HOTLIST(optId);
            this.SEND_GA({eventAction: 'ShareHotList', eventLabel: 'Start'});

        } else if (hasOwnJobs) {
            if (localStorage.getItem('displayJob') == 'own') {
                localStorage.setItem("displayJob", 'all');
                $(e.item).find("i#viewOwnJobs").removeClass('fa-check-square-o');
                $(e.item).find("i#viewOwnJobs").addClass('fa-square-o');

                this.SEND_GA({eventAction: 'DisplayOwnJobs', eventLabel: 'False'});
                
                var searchCriteria = $('#searchCriteria').val() || "";

                grid.dataSource.filter([{field: "all", operator: "contains", value: searchCriteria }]);
            } else {
                localStorage.setItem("displayJob", 'own');
                $(e.item).find("i#viewOwnJobs").removeClass('fa-square-o');
                $(e.item).find("i#viewOwnJobs").addClass('fa-check-square-o');
                var session = new Session();
                gridfilters.push({field: "consultantList", operator: "contains", value: session.get('fullName')});

                this.SEND_GA({eventAction: 'DisplayOwnJobs', eventLabel: 'True'});
                
                grid.dataSource.filter(gridfilters);
            }

        } else if (hasLiveJobs) {
            if (localStorage.getItem('liveJob') == 'true') {
                localStorage.setItem('liveJob', 'false');
                $(e.item).find("i#viewLiveJobs").removeClass('fa-check-square-o');
                $(e.item).find("i#viewLiveJobs").addClass('fa-square-o');

                this.SEND_GA({eventAction: 'LiveJobs', eventLabel: 'False'});

                grid.dataSource.filter(_.without(gridfilters, _.findWhere(gridfilters, {field: 'status'})));
            } else {
                localStorage.setItem('liveJob', 'true');
                $(e.item).find("i#viewLiveJobs").removeClass('fa-square-o');
                $(e.item).find("i#viewLiveJobs").addClass('fa-check-square-o');
                gridfilters.push({field: "status", operator: "contains", value: 'LIVE'});

                this.SEND_GA({eventAction: 'LiveJobs', eventLabel: 'True'});

                grid.dataSource.filter(gridfilters);
            }

        } else if (hasMassDelete) {
            var selItems = simpleGetSelItems(['name']);
            RecruiterApp.core.vent.trigger(this.TYPE + 'List:massDelete', selItems, gridType);
            this.SEND_GA({eventAction: 'MassDelete', eventLabel: 'Start'});

        } else if (hasAddJob){
            var selItems = simpleGetSelItems(['name']);
            RecruiterApp.core.vent.trigger('addJobToCandidates', selItems, gridType);
            this.SEND_GA({eventAction: 'AddJobToCandidates', eventLabel: 'Start'});

        } else if (hasMatchCcd) {
            var selItems = simpleGetSelItems(['name', 'skillList', 'industryList', 'jobFunctionList', 'specializationList']);
            RecruiterApp.core.vent.trigger('jobOverviewDashboard:matchCcd', selItems, gridType);
            this.SEND_GA({eventAction: 'MatchCandidateToJob', eventLabel: 'Start'});

        } else if (hasAddToThisJob) {
            var selItems = simpleGetSelItems(['firstName', 'lastName']);

            _.each(selItems, item => {
                var tempModel = new Backbone.Model(item);
                RecruiterApp.core.vent.trigger('jobDetailDashboard:list:add', 'short', tempModel);
                this.SEND_GA({eventAction: 'AddToJobShortList'});
            });

        } else if (hasGenerateCv) {
            var selItems = simpleGetSelItems(['name']);

            _.each(selItems, (item, i) => {
                let tempModel = new Backbone.Model(item);

                _.delay(() => {
                    RecruiterApp.core.vent.trigger('jobDetailDashboard:generate:cv', tempModel);
                    this.SEND_GA({eventAction: 'GenerateCV'});
                }, 1000 * i);
            });

        } else if (hasMassMailing) {
            if ( !checkEmailConfig(this.EMAIL_CONFIG) ) return false;

            let sendObj = { };

            switch (this.TYPE) {
                case 'candidate':
                    sendObj.toCcd  = simpleGetSelItems(['name']);
                    break;
                case 'client':
                    sendObj.toCli   = simpleGetSelItems(['name', 'company', 'companyId']);
                    break;
                default:
                    console.warn('type not supported', this.TYPE);
                    return false;
                    break;
            }
            RecruiterApp.core.vent.trigger(this.TYPE + 'List:massMailing', sendObj, gridType, this.TYPE);
            this.SEND_GA({eventAction: 'EmailRecordStart', eventLabel: 'Start'});

        } else if (hasSpecCvMenu) {
            if ( !checkEmailConfig(this.EMAIL_CONFIG) ) return false;

            let sendObj = { sendCv: [{}], toCli: [{}] };

            switch (this.TYPE) {
                case 'candidate':
                    sendObj.sendCv   = simpleGetSelItems(['name']);
                    break;
                case 'client':
                    sendObj.toCli    = simpleGetSelItems(['name', 'company', 'companyId']);
                    break;
                default:
                    console.warn('type not supported', this.TYPE);
                    return false;
                    break;
            }

            RecruiterApp.core.vent.trigger(this.TYPE + 'List:specCv', sendObj, gridType, this.TYPE);
            this.SEND_GA({eventAction: 'SpecCv', eventLabel: 'Start'});
            
        } else if (hasSendJobs) {
            if ( !checkEmailConfig(this.EMAIL_CONFIG) ) return false;

            let sendObj = { toCcd: [{}], sendJob: [{}] };

            switch (this.TYPE) {
                case 'candidate':
                    sendObj.toCcd   = simpleGetSelItems(['name']);
                    break;
                case 'job':
                    sendObj.sendJob = simpleGetSelItems(['title', 'company', 'companyId', 'descriptionList']);
                    break;
                default:
                    console.warn('type not supported', this.TYPE);
                    return false;
                    break;
            }

            RecruiterApp.core.vent.trigger(this.TYPE + 'OverviewDashboard:sendJobs', sendObj, gridType);
            this.SEND_GA({eventAction: 'SendJob', eventLabel: 'Start'});
        }
    },

    /**   
     * revert kendoGrid state to the previous filter and sort that is stored in
     * localStorage
     */
    DISCARD_CHANGES (saveSearchId) { this.LOAD_SEARCH(saveSearchId) },

    /**
     * Load all the saved searches from the backend
     */
    LOAD_SAVED_SEARCHES () {
        var _menuData = $("#menu").data('kendoMenu')
            _menuData.remove('.savedFilter')
        var userSearch = new UserSearch();
        userSearch.type = this.TYPE.toUpperCase();
        userSearch.permissions = true
        userSearch.fetch().then(() => {
            _.each(userSearch.toJSON(), li => {  
                var userPerm = new Share()
                userPerm.type = "usersearch"
                userPerm.typeId = li.id

                userPerm.fetch().then(() => {
                    _menuData.append(this.NEW_SAVED_SEARCH_TEMPLATE(li.id, li.name, userPerm.toJSON().sharedPermissions), '.savedSearches')
                })
            });

            this.UPDATE_SAVED_SEARCHES_TOTAL('add')
        })
    },

    /**
     * Update the number of saved searches
     * @param {String} state "add" or "remove"
     */
    UPDATE_SAVED_SEARCHES_TOTAL (state) {  
        var savedSearches = this.$el.find('#saved-searches');
        var userSearch = new UserSearch();
        userSearch.type = this.TYPE.toUpperCase();
        userSearch.fetch().then(() => {
            if (_.size(userSearch.toJSON()) > 0) {
                savedSearches.html(_.size(userSearch.toJSON()))

                if (state) {
                    savedSearches.addClass(state);
                    setTimeout(() => { savedSearches.removeClass(state) }, 4000)
                }
            } else {
                savedSearches.html('')
            }
        })
    },

    /**
     * Delete a saved searched using filterID
     * @param {Number} filterID corresponds with the backend
     */
    DELETE_SEARCH (filterID) {
        var self = this;
        var confirmDeleteView = new ConfirmDeleteView();
        confirmDeleteView.on('deleteConfirmed', () => {
            var _deleteSearch = new UserSearch({ id: filterID })
            _deleteSearch.destroy({
                success () {
                    RecruiterApp.core.vent.trigger('app:modal:close');
                    RecruiterApp.core.vent.trigger('app:message:warning', 'Saved Search Deleted');

                    self.LOAD_SAVED_SEARCHES()
                    self.UPDATE_SAVED_SEARCHES_TOTAL('remove')

                    if (filterID == localStorage[self.TYPE + 'FilterId']) { self.CLEAR_FILTER() }

                    self.SEND_GA({eventAction: 'DeleteSearch'});
                }
            })
        });
        RecruiterApp.core.vent.trigger('app:modal:show',confirmDeleteView);
    },

    /**
     * Load a search into Kendo Grid using a filterID
     * @param {Number} filterId corresponds with the backend
     */
    LOAD_SEARCH (filterId) {
        var _loadSearch = new UserSearch()
            _loadSearch.id = filterId;

        localStorage[this.TYPE + 'FilterId'] = _loadSearch.id
        localStorage.removeItem(this.TYPE + 'CurrentSavedSearchEdit');

        _loadSearch.fetch().then(() => {
            this.loadKendoGrid(_loadSearch.toJSON())
            this.SEND_GA({eventAction: 'LoadSearch'});
        })
    },

    /**
     * save kendoGrid settings to the backend
     */
    SAVE_SEARCH () {
        var _saveSearch = new UserSearch()
        var _grid = this.$el.find(".KENDO-GRID").getKendoGrid();

        RecruiterApp.core.vent.trigger('blockUI', ' Loading...');

        if (!_grid) return false;
        
        var _gridOpt = _grid.getOptions();
        var _criteria =_grid.dataSource._filter;
        var queryBuilderLS = localStorage.getItem(this.TYPE + 'QueryBuilder') || {};

        _saveSearch.id = localStorage[this.TYPE + 'FilterId'];
        _saveSearch.fetch().then(() => {
            _saveSearch.set({
                options: _gridOpt,
                criteria: _criteria,
                queryBuilder: queryBuilderLS
            })

            _saveSearch.save(null, {
                success () {
                    RecruiterApp.core.vent.trigger('app:message:success', 'Saved Search updated');
                    var filterDetail = (_.isUndefined(_grid.dataSource.filter()) ? '[]' : JSON.stringify(_grid.dataSource.filter().filters)) + ' | ' + JSON.stringify(_grid.dataSource.sort())

                    localStorage[this.TYPE + 'Filter']             = _.isUndefined(_grid.dataSource.filter()) ? '' : JSON.stringify(_grid.dataSource.filter().filters);
                    localStorage[this.TYPE + 'Sort']               = JSON.stringify(_grid.dataSource.sort());

                    RecruiterApp.core.vent.trigger(this.TYPE + 'List:searchBox:update', localStorage[this.TYPE + 'CurrentSavedSearch'], localStorage[this.TYPE + 'FilterId'], filterDetail)
                    RecruiterApp.core.vent.trigger('unBlockUI')
                }
            })
        })  
    },

    /** 
     * Will truncate the list provied into a max length, after which it will be truncated with showMore...
     */
    TRUNCATE_LIST (list, max, comma) {
        // Defensive Code
        if (_.isUndefined(comma) || _.isNull(comma))    { comma = ''; }
        if (_.isUndefined(max) || _.isNull(max))        { max = 1; }
        if (_.isUndefined(list) || _.isNull(list))      { RecruiterApp.core.vent.trigger('app:DEBUG:error', ['TRUNCATE_LIST: list', 'is undefined or null']); return ''; }
        
        list = _.compact(list);

        return _.isArray(list)          ?   _.map(list,        function (ski, i) { 
            if (i < max || (i > max && i != list.length - 1)) {
                return RecruiterApp.polyglot.t(ski);
            } else if (i == max) {
                var listReturn = ` <a class="more">${list.length - max} ${RecruiterApp.polyglot.t('more')}...</a><span class="more-content hidden"> ${RecruiterApp.polyglot.t(ski)}`;
                
                if (i >= list.length - 1) {
                    listReturn += ` <a class="less">${RecruiterApp.polyglot.t('showLess')}...</a></span>`;
                }
                return listReturn;
            } else if (i == list.length - 1) {
                return `${RecruiterApp.polyglot.t(ski)} <a class="less">${RecruiterApp.polyglot.t('showLess')}...</a></span>`
            }
        }).join(comma) : '';
    },

    /**
     * Will truncate a string to a max no of characters.
     */
    TRUNCATE_STRING(string, maxLength) {
        const content = string.trim();
        if (content.length <= maxLength) {
            return content;
        } else {
            return `
            ${content.slice(0, maxLength)}
            <a class="more">${RecruiterApp.polyglot.t('more')}...</a>
            <span class="more-content hidden">${content.slice(maxLength+1, content.length) }
                <a class="less">${RecruiterApp.polyglot.t('showLess')}...</a>
            </span>`
        }
    },


    /**
     * Save a kendoGrid settings as a new search
     * @param {Boolean} apply true / false if the new search needs to be applied
     * after the save is done
     */
    SAVE_SEARCH_AS (apply) {
        var saveFilterForm = new KendoSaveFilter({ model: new Backbone.Model() });
            saveFilterForm.on('onSaveFilter', filterName => this.SAVE_NEW_SEARCH(filterName, apply));

        RecruiterApp.core.vent.trigger('app:modal:show', saveFilterForm)
    },

    /**
     * Save a new search to the backend
     * @param {String} filterName name of the filter to be saved
     * @param {Boolean} apply      true / false if the new search needs to be applied
     */
    SAVE_NEW_SEARCH (filterName, apply) {
        RecruiterApp.core.vent.trigger('app:warn', ['Base Grid View','creating new Saved Search:' + filterName + ', ' + moment().format('h:mm:ss.SSS a')]);
        RecruiterApp.core.vent.trigger('blockUI', ' Loading...');

        var _grid       = this.$el.find(".KENDO-GRID").getKendoGrid();
        var _menuData   = $("#menu").data('kendoMenu');

        if (!_grid) return false;
        if (!_menuData) return false;

        var queryBuilderLS = localStorage.getItem(this.TYPE + 'QueryBuilder') || {};

        var _gridOpt = _grid.getOptions();
        var _criteria =_grid.dataSource._filter;
        var _newSearch = new UserSearch({
            name: filterName, 
            options: _gridOpt, 
            queryBuilder: queryBuilderLS,
            criteria: _criteria, 
            type: this.TYPE.toUpperCase() 
        });
        
        _newSearch.save(null, {
            success: () => {
                RecruiterApp.core.vent.trigger('app:message:success', 'New Saved Search created: ' + filterName);

                var userPerm = new Share();
                    userPerm.type = "usersearch";
                    userPerm.typeId = _newSearch.get('id');

                userPerm.fetch().then(() => {
                    _menuData.append(this.NEW_SAVED_SEARCH_TEMPLATE(_newSearch.get('id'), filterName, userPerm.toJSON().sharedPermissions), '.savedSearches')
                    _menuData.enable(".savedSearches");
                    this.UPDATE_SAVED_SEARCHES_TOTAL('add');
                })

                if (apply) _.defer(() => this.LOAD_SEARCH(_newSearch.get('id')));

                this.SEND_GA({eventAction: 'SaveSearchAs'});
            }
        })
    },

    APPEND_TO_HOTLIST (e) {
        var grid = this.$el.find(".KENDO-GRID").getKendoGrid();

        if (!grid) return false;
        
        var selectedItems = grid.select();
        var optId = $(e.currentTarget).parents('.hotList').find('[data-opt]').attr('data-opt');
        var selItems = _.map(selectedItems, item => grid.dataItem(item).id);
            selItems = _.uniq(selItems);

        this.userHotListHelpers.ADD_TO_HOTLIST(optId, selItems, this.TYPE + 'Grid');
    },

    MANAGE_HOTLIST (e) {
        var optId = $(e.currentTarget).parents('.hotList').find('[data-opt]').attr('data-opt');
        this.userHotListHelpers.MANAGE_HOTLIST(optId)
    },

    DELETE_HOTLIST (e) {
        var optId = $(e.currentTarget).parents('.hotList').find('[data-opt]').attr('data-opt');
        this.userHotListHelpers.DELETE_HOTLIST(optId, this.TYPE + 'Grid')
    },

    SHARE_HOTLIST (e) {
        var optId = $(e.currentTarget).parents('.hotList').find('[data-opt]').attr('data-opt');
        this.userHotListHelpers.SHARE_HOTLIST(optId)
    },

    /**
     * [SHARE_SAVED_FILTER description]
     * @param {[type]} opt [description]
     */
    SHARE_SAVED_FILTER (opt) {
        var shareFilter = new KendoShareFilter({
            model: new Backbone.Model({
                shareId: opt
            })
        })

        shareFilter.on('onShareFilter', shareTo => {
            var shareSavedFilter = new Share()
            shareSavedFilter.type = "usersearch"
            shareSavedFilter.typeId = opt
            shareSavedFilter.shareTo = shareTo

            shareSavedFilter.save({permissions: ['WRITE', 'READ']}, {
                success: () => {
                    RecruiterApp.core.vent.trigger('app:message:success', "Saved Search shared to " + shareTo);
                    this.SEND_GA({eventAction: 'ShareSavedFilter', eventLabel: 'Success'});
                },
                error: () => {
                    RecruiterApp.core.vent.trigger('app:message:error', "Fail to Shave Saved Search to " + shareTo);
                    this.SEND_GA({eventAction: 'ShareSavedFilter', eventLabel: 'Fail'});
                }
            })
        })

        RecruiterApp.core.vent.trigger('app:modal:show', shareFilter)
    },

    /**
     * Template of the new saved search
     * @param {Number} id    filterID corresponds with the backend
     * @param {String} name  filter name
     * @param {Object} perms object list contain permissions
     */
    NEW_SAVED_SEARCH_TEMPLATE (id, name, perms) {
        let localUserObj = _.findWhere(perms, {target: localStorage['userName']});
        return {
            text: function () { 
                if (localUserObj.permissions.indexOf('OWNER') > -1) {                
                    return "<span data-opt='" + id + "'> <i class='fa fa-fw fa-user' aria-hidden='true'></i>" + name + "</span>"
                } else {
                    return "<span data-opt='" + id + "'> <i class='fa fa-fw fa-share-alt' aria-hidden='true'></i>" + name + "</span>"
                }
            }(),
            encoded: false,
            cssClass: "savedFilter " + id,
            items: function (argument) {
                var m = []

                if (localUserObj.permissions.indexOf('DELETE') > -1) {
                    m.push({ text: RecruiterApp.polyglot.t("delete") + ' <i class="fa fa-trash-o deleteFilter"></i>', encoded: false, cssClass: 'deleteSave' })
                } else {
                    m.push({ text: `<span class="text-muted">${RecruiterApp.polyglot.t("noDeletePermission")}</span> <i class="fa fa-minus-circle deleteFilter text-muted"></i>`, encoded: false, cssClass: 'noDeleteSave' })
                }
                
                if (localUserObj.permissions.indexOf('OWNER') > -1) {
                    m.push({ text: RecruiterApp.polyglot.t("share") + ' <i class="fa fa-share-square-o"></i>', encoded: false, cssClass: 'shareSave' })
                } else {
                    m.push({ text: `<span class="text-muted">${RecruiterApp.polyglot.t("noSharePermission")}</span> <i class="fa fa-share-square-o deleteFilter text-muted"></i>`, encoded: false, cssClass: 'noShareSave' })
                }

                return m
            }()
        }
    },

    CHECK_BRACKETS (str) {
        var s;
        str = str.replace( /[^{}[\]()]/g, '' );
        while ( s != str ) { 
            s = str;
            str = str.replace( /{}|\[]|\(\)/g, '' )
        }
        return !str;
    },

    CHECK_DATA_FOR_SYNC_ERROR (data) {
        var grid                = this.$el.find(".KENDO-GRID").getKendoGrid();
        
        // defensive code
        if (!_.isUndefined(grid) || !_.isUndefined(grid.dataSouce)) {
            var dataStartsWithFl    = _.findWhere(data.filter.filters, {operator: 'startswith'});
            var dataWoStartswithFl  = _.filter(data.filter.filters, fl => fl.operator != 'startswith');
            var gridWoStartswithFl  = _.filter(grid.dataSource.filter().filters, fl => fl.operator != 'startswith');

            var dataFlStr = JSON.stringify(dataWoStartswithFl),
                gridFlStr = JSON.stringify(gridWoStartswithFl);

            if (dataFlStr != gridFlStr) { 
                console.warn('_dataSource not in synced with $(grid) dataSource');
                data.filter.filters = gridWoStartswithFl;
                data.filter.filters.push(dataStartsWithFl);
            }
        }

        return data;
    },

    EXTRACT_HOST_NAME (url) {
        var hostname;

        if (url.indexOf("://") > -1) hostname = url.split('/')[2];
        else hostname = url.split('/')[0];

        hostname = hostname.split(':')[0];
        hostname = hostname.split('?')[0];

        return hostname;
    },

    EXTRACT_ROOT_DOMAIN (url) {
        var domain = this.EXTRACT_HOST_NAME(url),
            splitArr = domain.split('.'),
            arrLen = splitArr.length;

        if (arrLen > 2) {
            domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
            if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
                domain = splitArr[arrLen - 3] + '.' + domain;
            }
        }
        return domain;
    },

    /**
     * This disable-enable the filter input field has 4 parts:
     * 1. When building the filter list in parameterMap, we are removing the value from the input and disabling/enabling it.
     * But this won't solve the persistance of the kendo filters after going back to a normal filter operator
     */
    CHECK_NON_VALUE_FILTER (filter) {
        var inputElement;
        var nestedNullFilter    = false;
        let field               = filter.field;
        let kendoOperator       = e => { return e.indexOf('isnot') > -1 ? 'Not Empty' : 'Empty' };

        switch (field) {
            case 'all':
                return;
            case 'salaryAmount':
                field = 'salary';
                break;
            case 'minimumSalary':
                field = 'minimumSalary';
                break;
            case 'feeAmount':
                field = 'fee';
                break;
            case 'candidateList.id':
            case 'clientList.id':
            case 'jobList.id':
            case 'companyList.id':
                field = 'stakeholdersList';
                break;
            case 'jobHistoryList':
                field = 'employmentHistoryList';
                break;
            case 'workingTime':
                field = 'workingHours';
                break;
            default:
                if (field.indexOf('.')) { field = field.split('.')[0]; }
                break;
        }

        if (filter.operator == 'nested') {
            var nullFilters = filter.filters[0].filters.filter(fl => fl.value === "" && nonValueFilterOperators.includes(fl.operator));
            if (nullFilters.length > 0) nestedNullFilter = true;
        }

        inputElement = this.$(`.k-filtercell[data-field="${field}"] input`);

        if (nonValueFilterOperators.includes(filter.operator) || nestedNullFilter) {
            _.delay(() => {
                inputElement.val('').attr('disabled', 'disabled');
                inputElement.parent().find('button.k-button').removeAttr('style data-bind').show();
            }, 200);

            filter.value = '';

            let kendoDropdown = $('.k-widget>.custom-kendo-dropdown.dd-' + field).data("kendoDropDownList");
            
            if (kendoDropdown) {
                if (nestedNullFilter) kendoDropdown.value(kendoOperator(filter.filters[0].filters[0].operator));
                else kendoDropdown.value(kendoOperator(filter.operator));
            }
        } else {
            inputElement.removeAttr('disabled');
        }
    },

    /**
     * 2. Whenever the user clicks on the operator dropdown button, we reenable the field because we can't catch any 
     * event when the operator is changed to one that requires a value. 
     */
    ENABLE_INPUT (e) {
        const inputElement      = $(e.currentTarget).closest('.k-filtercell').find('.k-input');
        const inputIsDisabled   = inputElement.attr('disabled');

        if (inputIsDisabled) inputElement.removeAttr('disabled');
    },

    /**
     * 3. We clean the filters again, after step 1 when the filters are saved for persistance. 
     * Without this, after coming back to a normal filter, the previous value, although cleared, would appear as a ghost. 
     */
    CONFIGURE_FILTERS_FOR_EMPTY (grid) {
        grid.dataSource.filter().filters.forEach(filter => {
            if (nonValueFilterOperators.includes(filter.operator)) filter.value = '';
        });
    },

    /**
     * 4. After we ENABLE_INPUT again (no2, see above), if the user clicks on the same option again or just clicks out, 
     * we need to re-disable the field.
     */
    DISABLE_INPUT_AFTER_BLUR (evt) {
        const grid          = evt.data.self.$el.find('#grid').getKendoGrid();
        const filters       = grid ? grid.dataSource.filter().filters : [];
        const inputParent   = $(evt.currentTarget).closest('.k-filtercell');
        const inputElement  = inputParent.find('.k-input');
        const filter        = filters.find(item => item.field == inputParent.attr('data-field'));

        if (filter && nonValueFilterOperators.includes(filter.operator)) inputElement.attr('disabled', 'disabled');
    },

    SAVE_RESULTS_NUMBERS (data) {
        resultsCounters.page        = data.page;
        resultsCounters.pageSize    = data.pageSize;
        resultsCounters.total       = data.totalRowsQuery;
        resultsCounters.from        = ((data.page-1)*data.pageSize) + 1;
        resultsCounters.to          = data.page*data.pageSize < resultsCounters.total ? data.page*data.pageSize : resultsCounters.total;
    },

    UPDATE_TOTAL_ITEMS_MESSAGE () {
        const messageDom    = this.$el.find('.k-pager-info.k-label');
        if (setMessageTimeout) {
            clearTimeout(setMessageTimeout);
        };
        setMessageTimeout = setTimeout(() => {
            if (resultsCounters.total == 0) messageDom.text(`No items to display`);
            else messageDom.text(`${resultsCounters.from} - ${resultsCounters.to} from ${resultsCounters.total}`);
        }, 500);
    },

    CLEANUP_EXCEL_EXPORT(e, kendoContext) {
        e.workbook.sheets[0].rows.forEach(row => {
            row.cells.forEach((cell, index) => {
                if (cell.value) {
                    if (typeof(cell.value) == 'string') {
                        if (cell.value.includes('mini-overview-list')) {
                            cell.value = 'Overview number cannot be exported';
                        }
                        cell.value = cell.value.replace(/<br[^>]*>/gi, '\n');
                        cell.value = $('<textarea>').html(cell.value).text();
                        cell.value = cell.value.replace(/(<([^>]+)>)|([0-9]+\smore...)|(more...)|(less...)|(show less...)|(^ +)|(^(?:[\t ]*(?:\r?\n|\r))+)/gim, '');
                        cell.value = cell.value.replace(/(^ +)|(^(?:[\t ]*(?:\r?\n|\r))+)/gim, '').trim();
                    }
                    if (typeof(cell.value) == 'object'){
                        if (cell.value.toString() == '[object Object]') {
                            cell.value = '';
                        } else {
                            cell.value = cell.value.toString();
                        }
                    }
                }
            })
        })
    },

    /**
     * Format the Overview numbers for display
     * @param {Object array with all overview numbers coming from Kendo Datasource} overviewArray 
     */
    FORMAT_OVERVIEW_NUMBERS (overviewArray, type) {

        let overviewObject = {}

        if (overviewArray && overviewArray.length) {
            overviewArray.forEach(item => {
                overviewObject[item.type] = item.count
            })
        }

        let overviewOrder = [];
        switch(type) {
            case 'candidate':
                overviewOrder = ['SEND_JOB', 'SPEC_CV', 'SHORT_LIST', 'CV_SENT', 'MEETING', 'INTERVIEW', 'OFFER', 'DECLINED_OFFER', 'REJECT_CANDIDATE', 'PLACEMENT'];
                break;
            case 'client':
                overviewOrder = ['JOB', 'SPEC_CV', 'CV_SENT', 'MEETING', 'INTERVIEW'];
                break;
            case 'company':
                overviewOrder = ['CONTACT', 'JOB', 'APPLICANT', 'SHORT_LIST', 'CV_SENT', 'MEETING', 'INTERVIEW', 'OFFER', 'DECLINED_OFFER', 'REJECT_CANDIDATE', 'PLACEMENT'];
                break;
            case 'job':
                overviewOrder = ['APPLICANT', 'SHORT_LIST', 'CV_SENT', 'MEETING', 'INTERVIEW', 'OFFER', 'DECLINED_OFFER', 'REJECT_CANDIDATE', 'PLACEMENT'];
                break;
        }
        if (overviewArray && overviewArray.length) {
            const overviewArrayHtml = overviewOrder
                .map(item => {
                    let icon;
                    switch (item) {
                        case 'SEND_JOB':
                            icon = 'fa-inbox';
                            break;
                        case 'SHORT_LIST':
                            icon = 'fa-star';
                            break;
                        case 'CV_SENT':
                            icon = 'fa-envelope-o';
                            break;
                        case 'SPEC_CV':
                            icon = 'fa-envelope-square';
                            break;
                        case 'MEETING':
                            icon = 'fa-calendar-o';
                            break;
                        case 'INTERVIEW':
                            icon = 'fa-calendar';
                            break;
                        case 'OFFER':
                            icon = 'fa-usd';
                            break;
                        case 'DECLINED_OFFER':
                            icon = 'fa-ban';
                            break;
                        case 'PLACEMENT':
                            icon = 'fa-thumbs-up';
                            break;
                        case 'REJECT_CANDIDATE':
                            icon = 'fa-thumbs-down';
                            break;
                        case 'JOB':
                            icon = 'fa-briefcase';
                            break;
                        case 'APPLICANT':
                            icon = 'fa-inbox';
                            break;
                        case 'CONTACT':
                            icon = 'fa-address-card';
                            break;
                        case 'TASK':
                            icon = 'fa-check-square-o';
                            break;
                        case 'REJECT':
                            icon = 'fa-ban';
                            break;
                    }
                    return `
                        <div class="mini-overview-item"
                            data-toggle="tooltip" 
                            data-placement="bottom" 
                            title="${overviewObject[item] || 0} ${RecruiterApp.polyglot.t(item)}"
                        >
                            <p class="mini-overview-item-count">${overviewObject[item] || 0}</p>
                            <i class="fa ${icon}"></i>
                        </div>
                    `
                }).join('');
            return `
                <div class="mini-overview-list">
                    ${overviewArrayHtml}
                </div>
            `;
        }
    }
});