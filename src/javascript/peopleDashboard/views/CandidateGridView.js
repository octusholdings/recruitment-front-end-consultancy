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
    _dataSource, _kendoMenu, _skillList, _employmentTypeList , _languageList, _nationalityList, _saved, _consultantList;

module.exports = CandidateGridView = BaseGridView.extend({

    template: _.template(
        `<ul id="context-menu"></ul>
        <div id="menu"></div>
        <div id="grid" class="KENDO-GRID"></div>`
    ),

    initialize : function (options){
        var session = new Session()

        this.currentPage = options.currentPage;
        this.pageSize    = options.pageSize;
        this.filterArray = options.filterArray;
        this.columnArray = [];
        this.permissionConfig = {};
        this.TYPE = 'candidate';
        this.VIEW = 'candidateGridView';
        this.PERMISSIONS_FOR_VIEW = session.getPermissionsForView(this.VIEW);

        // Setting up the helper functions
        this.userHotListHelpers = new UserHotListHelpers()
        this.userHotListHelpers.SELF = this
        this.userHotListHelpers.KENDO = true
        this.userHotListHelpers.TYPE = this.TYPE

        // grid config
        this.menuConfig = options.menuConfig
        this.actionConfig = options.actionConfig
        window.Octus.BaseKendoGrid = this;
    },

    onShow: function () {

        _employmentTypeList = window.Octus.employmentTypeList;

        if (localStorage[this.TYPE + 'Filter'] == '[]') {
            localStorage.removeItem(this.TYPE + 'Filter')
            localStorage.removeItem(this.TYPE + 'FilterId')
            localStorage.removeItem(this.TYPE + 'Sort')
            localStorage.removeItem(this.TYPE + 'SearchCriteria') 
            localStorage.removeItem(this.TYPE + 'CurrentSavedSearch')
        }

        if (!_.isNull(this.PERMISSIONS_FOR_VIEW)) {
            this.buildKendoGrid();

            if (this.menuConfig) {

                if (this.menuConfig.savedSearch == false) {

                } else {
                    this.LOAD_SAVED_SEARCHES();
                }

                if (this.menuConfig.addToHotList == false) {
                    
                } else {
                    this.userHotListHelpers.LOAD_SAVED_HOTLIST();                 
                }

            } else {
                this.userHotListHelpers.LOAD_SAVED_HOTLIST();
            }


        } else {
            RecruiterApp.core.vent.trigger('unBlockUI');
            console.log("Permission do not exist for " + this.VIEW);
            
        }
    },

    loadKendoGrid: function (saved) {
        if (!_kendoMenu) return false;

        var self            = this, optionsObj;

        var grid            = $("#grid").getKendoGrid();
        var options         = localStorage[self.TYPE + "GridOpt"];

        // Deprecated 2.14 moving kendo to checkbox select
        // var _selectable     = !self.baseFn.REDUCE_FUNCTION().touch ? 'multiple, row' : false //$('html').hasClass('no-touch') ? 'multiple, row' : false
        // var _selectable     = !self.baseFn.REDUCE_FUNCTION().touch ? 'multiple, row' : 'row';
        var _menuData       = _kendoMenu.data('kendoMenu');

        if (!_menuData) return false;

        var _menuItems      = _menuData.element.find('.k-menu-group .k-item');

        var _format          = {
            filter: function (read) {
                optionsObj.dataSource.filter = self.FORMAT_LOAD_KENDO_FILTER();

                var createdColumn               =   _.findWhere(optionsObj.columns, {field: "created"}),
                    updatedColumn               =   _.findWhere(optionsObj.columns, {field: "updated"}),
                    dobColumn                   =   _.findWhere(optionsObj.columns, {field: "dob"}),
                    availabilityColumn          =   _.findWhere(optionsObj.columns, {field: "availability"}),
                    ageColumn                   =   _.findWhere(optionsObj.columns, {field: "age"}),
                    nationalityListColumn       =   _.findWhere(optionsObj.columns, {field: "nationalityList"}),
                    seekingLocationsColumn      =   _.findWhere(optionsObj.columns, {field: "seekingLocations"}),
                    yearsOfExperienceColumn     =   _.findWhere(optionsObj.columns, {field: "yearsOfExperience"}),
                    languageListColumn          =   _.findWhere(optionsObj.columns, {field: "languageList"}),
                    // minimumSalaryBaseColumn     =   _.findWhere(optionsObj.columns, {field: "minimumSalaryBase"}),
                    // currentSalaryBaseColumn     =   _.findWhere(optionsObj.columns, {field: "currentSalaryBase"}),
                    // minimumSalaryBonusColumn    =   _.findWhere(optionsObj.columns, {field: "minimumSalaryBonus"}),
                    // currentSalaryBonusColumn    =   _.findWhere(optionsObj.columns, {field: "currentSalaryBonus"}),
                    specializationListColumn    =   _.findWhere(optionsObj.columns, {field: "specializationList"}),
                    industryListColumn          =   _.findWhere(optionsObj.columns, {field: "industryList"}),
                    skillListColumn             =   _.findWhere(optionsObj.columns, {field: "skillList"}),
                    jobFunctionListColumn       =   _.findWhere(optionsObj.columns, {field: "jobFunctionList"}),
                    referredByColumn            =   _.findWhere(optionsObj.columns, {field: "referredBy"}),
                    consultantColumn            =   _.findWhere(optionsObj.columns, {field: "consultantList"}),
                    contractTypeColumn          =   _.findWhere(optionsObj.columns, {field: "contractType"}),
                    contractAmountColumn        =   _.findWhere(optionsObj.columns, {field: "contractAmount"}),
                    statusColumn                =   _.findWhere(optionsObj.columns, {field: "status"}),
                    religionColumn              =   _.findWhere(optionsObj.columns, {field: "religion"}),
                    candidateCodeColumn         =   _.findWhere(optionsObj.columns, {field: "candidateCode"}),
                    ownVehicleColumn            =   _.findWhere(optionsObj.columns, {field: "ownVehicle"}),
                    countryColumn               =   _.findWhere(optionsObj.columns, {field: "country"}),
                    locationListColumn          =   _.findWhere(optionsObj.columns, {field: "locationList"}),
                    cvContent                   =   _.findWhere(optionsObj.columns, {field: "cv"}),
                    educationListColumn         =   _.findWhere(optionsObj.columns, {field: "educationList"});
                    qualificationistColumn      =   _.findWhere(optionsObj.columns, {field: "qualificationList"});
                    documentSearchColumn        =   _.findWhere(optionsObj.columns, {field: "otherAttachmentList"});
                    employmentHistoryListColumn =   _.findWhere(optionsObj.columns, {field: "employmentHistoryList"});
                    minimumSalaryColumn         =   _.findWhere(optionsObj.columns, {field: "minimumSalary"});
                    currentSalaryColumn         =   _.findWhere(optionsObj.columns, {field: "currentSalary"});

                if (createdColumn)               createdColumn.filterable.cell.template               = self.DEFINE_TEMPLATE;
                if (updatedColumn)               updatedColumn.filterable.cell.template               = self.DEFINE_TEMPLATE;
                if (dobColumn)                   dobColumn.filterable.cell.template                   = self.DEFINE_TEMPLATE;
                if (availabilityColumn)          availabilityColumn.filterable.cell.template          = self.DEFINE_TEMPLATE;
                if (ageColumn)                   ageColumn.filterable.cell.template                   = self.DEFINE_TEMPLATE;
                if (nationalityListColumn)       nationalityListColumn.filterable.cell.template       = self.DEFINE_TEMPLATE;
                if (seekingLocationsColumn)      seekingLocationsColumn.filterable.cell.template      = self.DEFINE_TEMPLATE;
                if (yearsOfExperienceColumn)     yearsOfExperienceColumn.filterable.cell.template     = self.DEFINE_TEMPLATE;
                if (languageListColumn)          languageListColumn.filterable.cell.template          = self.DEFINE_TEMPLATE;
                if (specializationListColumn)    specializationListColumn.filterable.cell.template    = self.DEFINE_TEMPLATE;
                if (industryListColumn)          industryListColumn.filterable.cell.template          = self.DEFINE_TEMPLATE;
                if (skillListColumn)             skillListColumn.filterable.cell.template             = self.DEFINE_TEMPLATE;
                if (jobFunctionListColumn)       jobFunctionListColumn.filterable.cell.template       = self.DEFINE_TEMPLATE;
                if (referredByColumn)            referredByColumn.filterable.cell.template            = self.DEFINE_TEMPLATE;
                if (consultantColumn)            consultantColumn.filterable.cell.template            = self.DEFINE_TEMPLATE;
                if (contractTypeColumn)          contractTypeColumn.filterable.cell.template          = self.DEFINE_TEMPLATE;
                if (contractAmountColumn)        contractAmountColumn.filterable.cell.template        = self.DEFINE_TEMPLATE;
                if (statusColumn)                statusColumn.filterable.cell.template                = self.DEFINE_TEMPLATE;
                if (religionColumn)              religionColumn.filterable.cell.template              = self.DEFINE_TEMPLATE;
                if (candidateCodeColumn)         candidateCodeColumn.filterable.cell.template         = self.DEFINE_TEMPLATE;
                if (ownVehicleColumn)            ownVehicleColumn.filterable.cell.template            = self.DEFINE_TEMPLATE;
                if (countryColumn)               countryColumn.filterable.cell.template               = self.DEFINE_TEMPLATE;
                if (locationListColumn)          locationListColumn.filterable.cell.template          = self.DEFINE_TEMPLATE;
                if (educationListColumn)         educationListColumn.filterable.cell.template         = self.DEFINE_TEMPLATE;
                if (qualificationistColumn)      qualificationistColumn.filterable.cell.template      = self.DEFINE_TEMPLATE;
                if (employmentHistoryListColumn) employmentHistoryListColumn.filterable.cell.template = self.DEFINE_TEMPLATE;
                if (minimumSalaryColumn)         minimumSalaryColumn.filterable.cell.template         = self.DEFINE_TEMPLATE;
                if (currentSalaryColumn)         currentSalaryColumn.filterable.cell.template         = self.DEFINE_TEMPLATE;
                // if (documentSearchColumn)        documentSearchColumn.filterable.cell.template        = function(e){ e.element.addClass("k-textbox non-filterable")};
                // if (cvContent)                   cvContent.filterable.cell.template                   = function(e){ e.element.addClass("k-textbox non-filterable")};


                // Deprecated 2.14 moving kendo to checkbox select
                // optionsObj.selectable = _selectable;
 
                optionsObj.dataSource.page = self.currentPage; // This value was changed from localStorage value, hence it is being reassigned here. There may be more values that require similar treatment.
                grid.setOptions(optionsObj);

                if (read) grid.dataSource.read();
                return this;
            },
            menuItem: function () {
                _.each(optionsObj.columns, (val, key) => {
                    if (val.hidden) {
                        _menuItems.find('input[data-field="' + val.field + '"]').prop('checked', false)
                    } else {
                        _menuItems.find('input[data-field="' + val.field + '"]').prop('checked', true)
                    }
                });
                return this;
            }
        }
        
        if ((_.isUndefined(options) && _.isUndefined(saved)) || (self.options.filterBehConfig && self.options.filterBehConfig.persist == false)) {
            RecruiterApp.core.vent.trigger('app:DEBUG:warn', ['Kendo','no previous state'])

            // Deprecated 2.14 moving kendo to checkbox select
            // grid.setOptions({ selectable: _selectable })

            if (!_.isUndefined(saved)) {
                localStorage[self.TYPE + 'QueryBuilder'] = saved.queryBuilder ? JSON.stringify(saved.queryBuilder) : '';
                grid.dataSource.filter(saved.criteria);
            } else {
                grid.dataSource.read();
            }
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

                        saved.options.dataSource.transport.read.url = transportReadURL.replace(/^https?:\/\//, location.protocol + '//');

                        optionsObj = saved.options;
                        _format.filter(false)

                        grid.dataSource.filter(saved.criteria);
                        _saved = saved.options;

                        saved.criteria.filters = _.uniq(saved.criteria.filters, 'field');

                        localStorage[self.TYPE + 'QueryBuilder']        = saved.queryBuilder     ? JSON.stringify(saved.queryBuilder) : '';
                        localStorage[self.TYPE + 'Filter']              = saved.criteria         ? JSON.stringify(saved.criteria.filters) : '';
                        localStorage[self.TYPE + 'Sort']                = optionsObj.dataSource  ? JSON.stringify(optionsObj.dataSource.sort) : '';
                        localStorage[self.TYPE + 'CurrentSavedSearch']  = saved.name;
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

        var refDataEmploymentTypeList = _.map(_employmentTypeList.toJSON(), e => ({'value': e.value }));

        var formatQualification = (qua, i, list) => {

            var institution     = !_.isEmpty(qua.institution) && !_.isNull(qua.institution) ? qua.institution : self.titlelize(qua.degreeCourse);
            var fos             = !_.isEmpty(qua.fieldOfStudy) && !_.isNull(qua.fieldOfStudy) ? self.titlelize(qua.fieldOfStudy) : institution;
            var minor           = !_.isEmpty(qua.minor) && !_.isNull(qua.minor) ? self.titlelize(qua.minor) : '';
            var grade           = !_.isEmpty(qua.grade) && !_.isNull(qua.grade) ? RecruiterApp.polyglot.t('grade') + ': ' + self.titlelize(qua.grade) : '';
            var degree          = !_.isEmpty(qua.degreeCourse) && !_.isNull(qua.degreeCourse) ? self.titlelize(qua.degreeCourse) : fos;
            var from            = !_.isEmpty(qua.from) ? qua.from : '';
            var to              = !_.isEmpty(qua.to) ? qua.to : '';

            var cleanQua        = _.uniq(_.compact([degree, institution, fos, minor, grade, from, to]));
            
            if (!_.isEmpty(cleanQua)) {
                if (list.length > 1) cleanQua[0] = '<strong>' + cleanQua[0] + '</strong>';               

                if (!_.isEmpty(qua.from)) {
                    if (qua.from.length > 4) {
                        from = '<i>' + RecruiterApp.polyglot.t('from') + ' ' + moment(qua.from).format('MM/YYYY') + '</i>';
                    } else {
                        from = '<i>' + RecruiterApp.polyglot.t('from') + ' ' + qua.from + '</i>';
                    }
                }

                if (!_.isEmpty(qua.from) && !_.isEmpty(qua.to)) {
                    if (qua.to.length > 4) {
                        to = ' <i>' + RecruiterApp.polyglot.t('to') + ' ' + moment(qua.to).format('MM/YYYY') + '</i>';
                    } else {
                        to = ' <i>' + RecruiterApp.polyglot.t('to') + ' ' + qua.to + '</i>';
                    }
                }
                
                cleanQua.push(from + to);

                if (cleanQua.length > 1 && cleanQua[0].indexOf('<strong>') == -1) {
                    cleanQua[0] = '<strong>' + cleanQua[0] + '</strong>';
                }

                cleanQua[0] = '<span class="qua-detail">' + cleanQua[0];

                cleanQua[cleanQua.length - 1] = cleanQua[cleanQua.length - 1] + '</span>';
                return cleanQua.join('<br>');
            }
        }

        var formatEmploymentHistory = (emp) => {
            emp.companyName = emp.companyName ? `<strong>${emp.companyName}</strong><br>` : '';
            emp.title       = emp.title ? `${emp.title}<br>` : '';
            emp.from        = (emp.companyName || emp.title) && emp.from != null ? (`<i>${RecruiterApp.polyglot.t('from')} ${moment(emp.from).format('MM/YYYY')}</i> `) : '';
            emp.to          = (emp.companyName || emp.title) && emp.to != null   ? (`<i>${RecruiterApp.polyglot.t('to')} ${moment(emp.to).format('MM/YYYY')}</i>`) : '';
                                    
            let empHtml     = `<div class="emp-history">${emp.companyName}${emp.title}${emp.from}${emp.to}</div>`;
            return !_.isEmpty($(empHtml).text()) ? empHtml : '';
        }


        _dataSource = new kendo.data.DataSource({
            schema: {
                data: function(data) {
                    var currencyList = _.clone(window.Octus.currencyList.toJSON());
                        currencyList = _.map(currencyList, c => ({ key: c.key.toLowerCase(), value: c.value }));

                    _.each(data.results, res => {
                        res.referenceId             = _.isNull(res.referenceId)             ?   '' : res.referenceId;
                        res.dob                     = !_.isNull(res.dob)                    ?   res.dob.join('/') : '';
                        res.created                 = !_.isNull(res.created)                ?   res.created.join('/') : '';
                        res.updated                 = !_.isNull(res.updated)                ?   res.updated.join('/') : '';
                        res.jobFunctionList         = _.isArray(res.jobFunctionList)        ?   res.jobFunctionList.join(', ') : '';
                        res.country                 = _.isArray(res.addressList)            ?   _.compact(_.pluck(res.addressList, 'country')).join(', ') : '';
                        res.city                    = _.isArray(res.addressList)            ?   _.compact(_.pluck(res.addressList, 'city')).join(', ') : '';
                        res.postalCode              = _.isArray(res.addressList)            ?   _.compact(_.pluck(res.addressList, 'postalCode')).join(', ') : '';
                        res.addressList             = _.isArray(res.addressList)            ?   _.map(res.addressList,          add => { return _.values(_.pick(add, 'name_allLines')).join(); }).join('; ') : '';
                        res.telephoneList           = _.isArray(res.telephoneList)          ?   _.map(res.telephoneList,        tel => { return tel.replace(/^\+0 /g, '') }).join(', ') : '';
                        res.employmentType          = _.isArray(res.employmentType)         ?   _.map(res.employmentType,       emp => { return emp.value }).join(', ') : '';
                        res.interestList            = _.isArray(res.interestList)           ?   _.map(res.interestList,         int => { return RecruiterApp.polyglot.t(int) }).join(', ') : '';
                        res.locationList            = _.isArray(res.locationList)           ?   _.map(res.locationList,         loc => { return RecruiterApp.polyglot.t(loc) }).join(', ') : '';
                        res.referredBy              = _.isArray(res.referredBy)             ?   _.map(res.referredBy,           ref => { if (ref && ref.value) return ref.value + ' [' + RecruiterApp.polyglot.t(ref.types[0].toLowerCase()) + ']';}).join('<br>') : '';
                        res.specializationList      = _.isArray(res.specializationList)     ?   _.map(res.specializationList,   spe => { if (spe && spe.value) return RecruiterApp.polyglot.t(spe.value) }).join(', ') : '';
                        res.nationalityList         = _.isArray(res.nationalityList)        ?   _.map(res.nationalityList,      nat => { if (nat && nat.value) return RecruiterApp.polyglot.t(nat.value) }).join(', ') : '';
                        res.seekingLocations        = _.isArray(res.seekingLocations)       ?   _.map(res.seekingLocations,     loc => { if (loc && loc.name) return RecruiterApp.polyglot.t(loc.name) }).join(', ') : '';
                        res.languageList            = _.isArray(res.languageList)           ?   _.map(res.languageList,         lan => {
                            return _.compact(_.map(_.values(_.pick(lan, 'language', 'level')), la => {
                                return !_.isNull(la) ? RecruiterApp.polyglot.t(la) : ''
                            })).join(' - ');
                        }).join(',<br>') : '';

                        res.consultantList = !_.isEmpty(res.consultantList) ? _.map(res.consultantList, con => {
                            return `${con.allNames} <span class="small email-address">&lt;${con.username}&gt;</span>`
                        }).join('<br/>') : '';
                        
                        res.availability            = !_.isEmpty(res.contractAvailableFrom) ?   res.contractAvailableFrom.reverse().join('/') : '';
                        res.contractAmount          = !_.isNull(res.contractAmount)         ?   RecruiterApp.polyglot.t(res.contractCurrency) + ' ' + self.FORMAT_MONEY(res.contractAmount) : '';
                        
                        res.contractCurrency        = !_.isEmpty(res.contractCurrency)      ?   RecruiterApp.polyglot.t(res.contractCurrency) : '';
                        res.contractRateType        = !_.isNull(res.contractRateType)       ?   res.contractRateType.value : '';
                        res.salutation              = !_.isNull(res.salutation)             ?   RecruiterApp.polyglot.t(res.salutation) : '';
                        res.consentStatus           = res.consentStatus && res.consentStatus.key ? RecruiterApp.polyglot.t(res.consentStatus.key) : '';
                        res.gender                  = !_.isNull(res.gender)                 ?   RecruiterApp.polyglot.t(res.gender) : '';
                        res.source                  = !_.isNull(res.source)                 ?   RecruiterApp.polyglot.t(res.source) : '';
                        res.status                  = !_.isNull(res.status)                 ?   res.status.value : '';
                        res.religion                = res.religion && res.religion.key      ?   RecruiterApp.polyglot.t(res.religion.key) : '';
                        res.candidateCode           = res.candidateCode && res.candidateCode.key ? RecruiterApp.polyglot.t(res.candidateCode.key) : '';
                        res.ownVehicle              = res.ownVehicle && res.ownVehicle.key  ?   RecruiterApp.polyglot.t(res.ownVehicle.key) : '';
                        res.visa                    = !_.isNull(res.visa)                   ?   res.visa.value : '';
                        res.willingToRelocate       = !_.isNull(res.willingToRelocate)      ?   RecruiterApp.polyglot.t(res.willingToRelocate) : '';
                        res.willingnessToTravel     = !_.isNull(res.willingnessToTravel)    ?   RecruiterApp.polyglot.t(res.willingnessToTravel) : '';
                        res.daxtraCaptureCreated    = !_.isNull(res.daxtraCaptureCreated)   ?   (res.daxtraCaptureCreated == 'true' ? RecruiterApp.polyglot.t('no') : RecruiterApp.polyglot.t('yes')) : '';
                        res.otherNames              = res.otherNames                        ?   res.otherNames                    : '';
                        res.middleName              = !_.isNull(res.middleName)             ?   res.middleName : '';
                        res.about                   = !_.isNull(res.about)                  ?   res.about : '';
                        res.sourceDetail            = !_.isNull(res.sourceDetail)           ?   function () {
                            var srcDet = window.Octus.sourceDetailList.findWhere({key: res.sourceDetail});
                            if (srcDet) return srcDet.get('value');
                        }() : '';
                        
                        res.skillList               = self.TRUNCATE_LIST(res.skillList, 5, ', '); 
                        res.industryList            = self.TRUNCATE_LIST(res.industryList, 5, ', '); 
                        // if (self.menuConfig.addToThisJob.perm && self.menuConfig.addToThisJob.shortList) {
                        res.addedToJob              = self.menuConfig.addToThisJob.perm && self.menuConfig.addToThisJob.shortList ? !_.isUndefined(self.menuConfig.addToThisJob.shortList.findWhere({candidateId: res.id})) ? true : '' : '';
                        // }
                        var educationsArr           = !_.isNull(res.educationList) ? _.sortBy(_.compact(_.where(res.educationList, {type: "ACADEMIC"})), 'from').reverse() : [];
                        res.educationList           = self.TRUNCATE_LIST(_.uniq(_.map(educationsArr, formatQualification)).sort());

                        var qualificationsArr       = !_.isNull(res.qualificationList) ? _.sortBy(_.compact(_.where(res.qualificationList, {type: "PROFESSIONAL"})), 'from').reverse() : [];
                        res.qualificationList       = self.TRUNCATE_LIST(_.uniq(_.map(qualificationsArr, formatQualification)).sort());

                        res.employmentHistoryList   = !_.isEmpty(res.employmentHistoryList) ? _.compact(_.uniq(res.employmentHistoryList)) : res.employmentHistoryList;
                        res.employmentHistoryList   = !_.isEmpty(res.employmentHistoryList) ? _.compact(_.map(res.employmentHistoryList, formatEmploymentHistory)).reverse() : []; 
                        res.employmentHistoryList   = self.TRUNCATE_LIST(res.employmentHistoryList, 1, '');

                        res.minimumSalary           = self.FORMAT_SALARY(res, 'minimumSalary');
                        res.currentSalary           = self.FORMAT_SALARY(res, 'currentSalary');

                        res.overviewNumberList      = self.FORMAT_OVERVIEW_NUMBERS(res.overviewNumberList, 'candidate')
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
                        dob: {type: 'date'},
                        updated: {type: 'date'},
                        created: {type: 'date'},
                        firstName: {editable: true, nullable: true},
                        lastName: {validation: {required: true}},
                        email: {validation: {required: true}},
                        website: {validation: {required: true}},
                        telephoneList: {validation: {required: true}},
                        source: {validation: {required: true}}
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

                    if (!data.filter) {
                        data.filter = {
                            filters: [{ }]
                        }
                    } else {
                        _.each(data.filter.filters, fl => {
                            
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

                        var all             = _.findWhere(data.filter.filters, {field: 'all'}) 
                        var addressData     = _.findWhere(data.filter.filters, {field: 'addressList'}) 
                        var languageData    = _.findWhere(data.filter.filters, {field: 'languageList'}) 
                        var nationalityData = _.findWhere(data.filter.filters, {field: 'nationalityList'}) 
                        var statusData      = _.findWhere(data.filter.filters, {field: 'status'}) 
                        var religionData    = _.findWhere(data.filter.filters, {field: 'religion'})
                        var candidateCodeData = _.findWhere(data.filter.filters, {field: 'candidateCode'})
                        var ownVehicleData  = _.findWhere(data.filter.filters, {field: 'ownVehicle'})
                        var cvData          = _.findWhere(data.filter.filters, {field: 'cv'})
                        var specialization  = _.findWhere(data.filter.filters, {field: 'specializationList'}) 
                        var employmentType  = _.findWhere(data.filter.filters, {field: 'employmentType'});
                        var email           = _.findWhere(data.filter.filters, {field: 'email'});
                        var salutation      = _.findWhere(data.filter.filters, {field: 'salutation'});
                        var consentStatus   = _.findWhere(data.filter.filters, {field: 'consentStatus'});
                        var city            = _.findWhere(data.filter.filters, {field: 'city'});
                        var country         = _.findWhere(data.filter.filters, {field: 'country'}) 
                        var postalCode      = _.findWhere(data.filter.filters, {field: 'postalCode'}) 
                        var consultant      = _.findWhere(data.filter.filters, {field: "consultantList"});
                        var rateType        = _.findWhere(data.filter.filters, {field: "contractRateType"});
                        var availability    = _.findWhere(data.filter.filters, {field: "availability"});
                        var daxtraCaptureCreated = _.findWhere(data.filter.filters, {field: "daxtraCaptureCreated"});
                        var referredBy      = _.findWhere(data.filter.filters, {field: "referredBy"});
                        var documentFilter  = _.findWhere(data.filter.filters, {field: "otherAttachmentList"});
                        var visa            = _.findWhere(data.filter.filters, {field: "visa"});    
                        var sortData        = data.sort;


                         
                        if (addressData)        addressData.field       = 'addressList.name_allLines'
                        if (city)               city.field              = 'addressList.city'
                        if (country)            country.field           = 'addressList.country'
                        if (postalCode)         postalCode.field        = 'addressList.postalCode'
                        if (languageData)       languageData.field      = 'languageList.fullDescription'
                        if (nationalityData)    nationalityData.field   = 'nationalityList.value'
                        if (statusData)         statusData.field        = 'status.value'
                        if (religionData)       religionData.field      = 'religion.value'
                        if (candidateCodeData)  candidateCodeData.field = 'candidateCode.value'
                        if (ownVehicleData)     ownVehicleData.field    = 'ownVehicle.value'
                        if (cvData)             cvData                  = self.PROCESS_CV_FILTER_VALUE(cvData);
                        if (specialization)     specialization.field    = 'specializationList.value'
                        if (employmentType)     employmentType.field    = 'employmentType.value';
                        if (email)              email.field             = 'email';
                        if (consultant)         consultant.field        = "consultant.allNames";
                        if (rateType)           rateType.field          = "contractRateType.value";
                        if (availability)       availability.field      = "contractAvailableFrom";
                        if (referredBy)         referredBy.field        = "referredBy.value";
                        if (consultant)         consultant.field        = "consultantList.allNames";
                        if (consentStatus)      consentStatus.field     = "consentStatus.value";
                        if (visa)               visa.field              = "visa.value";
                        if (documentFilter)     documentFilter          = self.PROCESS_DOCUMENT_FILTER_VALUE(documentFilter);

                        // set to highlight attached cv
                        if (cvData) cvData.highlighted      = true;
                        if (all)    all.highlighted         = true;

                        // merge all field criteria with cvData
                        if (all && all.value) {
                            if (cvData) {
                                cvData.value = "(" + cvData.value + ") OR (" + all.value + ")";
                            } else {
                                data.filter.filters.push({field: "cvAttachmentList.content", operator: "contains", value: all.value, highlighted: true, logic: "OR" });
                            }
                        }

                        if (daxtraCaptureCreated) 
                            daxtraCaptureCreated.value = daxtraCaptureCreated.value.toLowerCase() == (RecruiterApp.polyglot.t('yes')).toLowerCase() ? "false" : "true";

                        self.REMOVE_SPECIAL_CHARACTERS(data, 'currentPosition');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'currentEmployerName');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'locationList');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'addressList.allLines');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'consultant');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'addressList.name_allLines');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'addressList.city');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'interestList');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'salutation');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'consentStatus');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'telephoneList');
                        self.REMOVE_SPECIAL_CHARACTERS(data, 'currentEmployerName');
                    }   

                    /*
                     * The default sort behavior is "Created" desc date 
                     * if there is no criteria within the searching field or filters.
                     */
                     self.SET_DEFAULT_SORT(data);

                    _.each(sortData, sd => {

                        if (sd.field == 'addressList')          sd.field = 'addressList.name_allLines'
                        if (sd.field == 'languageList')         sd.field = 'languageList.fullDescription'
                        if (sd.field == 'nationalityList')      sd.field = 'nationalityList.value'
                        if (sd.field == 'cv')                   sd.field = 'cvAttachmentList.content'
                        if (sd.field == 'specializationList')   sd.field = 'specializationList.value'
                        if (sd.field == 'consultant')           sd.field = 'consultant.allNames'
                        if (sd.field == 'employmentType')       sd.field = 'employmentType.value'
                        if (sd.field == 'language')             sd.field = 'language.fullDescription'
                        if (sd.field == 'seekingLocations')     sd.field = 'seekingLocations.name'
                        if (sd.field == 'referredBy')           sd.field = 'referredBy.value'
                        if (sd.field == 'city')                 sd.field = 'addressList.city'
                        if (sd.field == 'country')              sd.field = 'addressList.country'
                        if (sd.field == 'postalCode')           sd.field = 'addressList.postalCode'
                        if (sd.field == 'contractRateType')     sd.field = 'contractRateType.value'
                        if (sd.field == 'availability')         sd.field = 'contractAvailableFrom'
                        if (sd.field == 'educationList')        sd.field = 'educationList.degreeCourse';
                        if (sd.field == 'qualificationList')    sd.field = 'qualificationList.degreeCourse';
                        if (sd.field == 'currentSalary')        sd.field = 'currentSalary.base';
                        if (sd.field == 'minimumSalary')        sd.field = 'minimumSalary.base';
                        if (sd.field == 'consultantList')       sd.field = 'consultantList.allNames';
                        if (sd.field == 'status')             { sd.field = 'status.value'; }

                        if (sd.field == 'dob') {
                            sd.field = 'dob'
                            sd.mode = 'max'
                        }
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
                RecruiterApp.core.vent.trigger('grid:requestEnd', this);
            },
            filter: self.filterArray,
            serverSorting: true,
            serverFiltering: true,
            serverPaging: true,
            page: self.currentPage,
            pageSize: this.pageSize
        });
        
        self.DESTROY_EXISTING_KENDO()

        grid = $("#grid").kendoGrid(_.extend({
            dataSource: _dataSource,
            sort            : function () { self.PERSIST_KENDO_GRID(); },
            columnResize    : function () { self.PERSIST_KENDO_GRID(); },
            columnReorder   : function () { self.PERSIST_KENDO_GRID(); },
            excelExport     : function (e) {
                e.workbook.fileName = "CandidateGrid.xlsx";
                self.CLEANUP_EXCEL_EXPORT(e, this);
            },
            change: function(e) {
                e.preventDefault();
                var gview = $("#grid").data("kendoGrid");
                var selectedItem = gview.dataItem(gview.select());

                if (!selectedItem) {
                    self.SHOW_MORE_ACTIONS(false);
                } else {
                    self.SHOW_MORE_ACTIONS(true);
                }

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
                // var parentCvBtn = eventTarget.parents('.showCV').length > 0 ? true : false;
                // var parentsFreeze = eventTarget.parents('.k-grid-content-locked').length > 0 ? true : false;

                // if ( className.indexOf("deleteAction") > -1) {
                //     $('.tooltip').remove();
                //     RecruiterApp.core.vent.trigger(self.TYPE + 'List:delete', id, 'CANDIDATE');
                // } else if( className.indexOf("editAction") > -1) {
                //     $('.tooltip').remove();
                //     window.location.href =  "#/" + self.TYPE + "/" + id + "/edit";
                // } else if( className.indexOf("noteAction") > -1) {
                //     $('.tooltip').remove();
                //     window.location.href =  "#/" + self.TYPE + "/" + id + "/notes/add";
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
                // } else if ( parentCvBtn ) {
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
                        <a class="kendo-icon edit-ccd ${self.actionConfig.edit == false ? 'hidden' : 'wb'}" href="\\#/${self.TYPE}/#=id#/edit" title="${RecruiterApp.polyglot.t('edit')}">
                            <i class="kendo-icon fa fa-pencil fa-lg text-success"></i>
                        </a>
                        <span class="kendo-icon delete-ccd deleteAction ${self.actionConfig.delete == false ? 'hidden' : 'wb'}" data-recordId="#=id#" title="${RecruiterApp.polyglot.t('delete')}">
                            <i class="kendo-icon fa fa-trash-o fa-lg text-danger" ></i>
                        </span>
                        <a class="kendo-icon note-ccd ${self.actionConfig.note == false ? 'hidden' : 'wb'}" href="\\#/${self.TYPE}/#=id#/notes/add" title="${RecruiterApp.polyglot.t('note')}">
                            <i class="kendo-icon fa fa-sticky-note-o fa-lg text-primary"></i>
                        </a>
                        #if (linkedIn) {#
                            <a class="kendo-icon linkedin ${self.actionConfig.linkedIn == false ? 'hidden' : 'wb'}" href="#=linkedIn#" target="_blank" title="${RecruiterApp.polyglot.t('linkedIn')}">
                                <i class="kendo-icon fa fa-linkedin-square fa-lg"></i>
                            </a>
                        #}#
                        #if (addedToJob) {#
                            <span class="kendo-icon ccdAddedToJob label label-success ${(self.actionConfig.addedToJob == false || !window.location.href.includes('job')) ? 'hidden' : ''}">
                                <i class="fa fa-check"></i> ${RecruiterApp.polyglot.t('added')}
                            </span>
                        #}#
                        `
                        
                    ,
                    // command:
                    // [
                    //     {
                    //         name: "Linkedin",
                    //         template:  `<a class="kendo-icon linkedin ${self.actionConfig.linkedIn == false ? 'hidden' : 'wb'}" data-container="body" data-toggle="tooltip" title="${RecruiterApp.polyglot.t('linkedIn')}">
                    //                         <i class="fa fa-linkedin-square fa-lg linkedInAction"></i>
                    //                     </a>`
                    //     },
                    //     {
                    //         name: "Note",
                    //         template:  `<a class="kendo-icon note-ccd ${self.actionConfig.note == false ? 'hidden' : 'wb'}" data-container="body" data-toggle="tooltip" title="${RecruiterApp.polyglot.t('note')}">
                    //                         <i class="fa fa-sticky-note-o fa-lg noteAction"></i>
                    //                     </a>`
                    //     },
                    //     {
                    //         name: "Edit",
                    //         template:  `<a class="kendo-icon edit-ccd ${self.actionConfig.edit == false ? 'hidden' : 'wb'}" data-container="body" data-toggle="tooltip" title="${RecruiterApp.polyglot.t('edit')}"><i class="fa fa-pencil fa-lg editAction text-success"></i></a>`
                    //     },
                    //     {
                    //         name: "Delete",
                    //         template:  `<a class="kendo-icon delete-ccd ${self.actionConfig.delete == false ? 'hidden' : 'wb'}" data-container="body" data-toggle="tooltip" title="${RecruiterApp.polyglot.t('delete')}">
                    //                         <i class="fa fa-trash-o fa-lg deleteAction text-danger"></i>
                    //                     </a>`
                    //     },

                    //     // Deprecated 2.14 moving kendo to checkbox select
                    //     // {
                    //     //     name: "CheckEm",
                    //     //     template:  `<a class="kendo-icon radioCheck">
                    //     //                     <i class="fa fa-lg fa-dot-circle-o checkem"></i><i class="fa fa-lg fa-circle-o uncheckem"></i>
                    //     //                 </a>`
                    //     // },
                    //     {
                    //         name: "AddedToJob",
                    //         template: `<span class="kendo-icon ccdAddedToJob label label-success ${(self.actionConfig.addedToJob == false || !window.location.href.includes('job')) ? 'hidden' : ''}"><i class="fa fa-check"></i> ${RecruiterApp.polyglot.t('added')}</span>`,
                    //         visible: function (dataItem) {
                    //             return dataItem.addedToJob === true && window.location.href.includes('job');
                    //         }
                    //     },
                    // ]
                },
                { 
                    selectable: true, 
                    width: "35px"
                },
                {
                    field: "referenceId",
                    title: RecruiterApp.polyglot.t("referenceId"),
                    template: '<a class="showPreview" href="\\#/candidate/#=id#/dashboard" data-candidate-id="#=id#" >#=referenceId#</a>',
                    hidden: true,
                    headerAttributes: {'class': 'wb ReferenceId'},
                    width: '170px',
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
                    width: '170px',
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
                    width: '170px',
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
                    width: '170px',
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
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "allNames",
                    title: RecruiterApp.polyglot.t("allNames"),
                    template: '<a class="showPreview" href="\\#/candidate/#=id#/dashboard" data-candidate-id="#=id#" >#=allNames#</a>',
                    hidden: true,
                    headerAttributes: {'class': 'wb AllNames'},
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "firstName",
                    title: RecruiterApp.polyglot.t("firstName"),
                    template: '<a class="showPreview" href="\\#/candidate/#=id#/dashboard" data-candidate-id="#=id#">#=firstName#</a>',
                    hidden: true,
                    headerAttributes: {'class': 'wb FirstName'},
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "lastName",
                    title: RecruiterApp.polyglot.t("lastName"),
                    template: '<a class="showPreview" href="\\#/candidate/#=id#/dashboard" data-candidate-id="#=id#">#=lastName#</a>',
                    hidden: true,
                    headerAttributes: {'class': 'wb LastName'},
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "middleName",
                    title: RecruiterApp.polyglot.t("middleName"),
                    template: '<a class="showPreview" href="\\#/candidate/#=id#/dashboard" data-candidate-id="#=id#">#=middleName#</a>',
                    hidden: true,
                    headerAttributes: {'class': 'wb MiddleName'},
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "otherNames",
                    title: RecruiterApp.polyglot.t("otherNames"),
                    template: '<a class="showPreview" href="\\#/candidate/#=id#/dashboard" data-candidate-id="#=id#">#=otherNames#</a>',
                    hidden: true,
                    headerAttributes: {'class': 'wb OtherNames'},
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "salutation",
                    title: RecruiterApp.polyglot.t("salutation"),
                    headerAttributes: {'class': 'wb Salutation'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "consentStatus",
                    title: RecruiterApp.polyglot.t("consentStatus"),
                    headerAttributes: {'class': 'wb ConsentStatus'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "gender",
                    title: RecruiterApp.polyglot.t("gender"),
                    headerAttributes: {'class': 'wb Gender'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "eq"
                        }
                    }
                }, {
                    field: "source",
                    title: RecruiterApp.polyglot.t("source"),
                    headerAttributes: {'class': 'wb Source'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "status",
                    title: RecruiterApp.polyglot.t("status"),
                    headerAttributes: {'class': 'wb Status'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false,
                            operator: "contains"
                        }
                    }
                }, {
                    field: "religion",
                    title: RecruiterApp.polyglot.t("religion"),
                    headerAttributes: {'class': 'wb Religion'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false,
                            operator: "contains"
                        }
                    }
                }, {
                    field: "candidateCode",
                    title: RecruiterApp.polyglot.t("candidateCode"),
                    headerAttributes: {'class': 'wb CandidateCode'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false,
                            operator: "contains"
                        }
                    }
                }, {
                    field: "ownVehicle",
                    title: RecruiterApp.polyglot.t("ownVehicle"),
                    headerAttributes: {'class': 'wb OwnVehicle'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false,
                            operator: "contains"
                        }
                    }
                }, {
                    field: "visa",
                    title: RecruiterApp.polyglot.t("visa"),
                    headerAttributes: {'class': 'wb Visa'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "employmentType",
                    title: RecruiterApp.polyglot.t("employmentType"),
                    // template: '# if (employmentType != undefined && employmentType[0]) { ##var employmentTypeArray = employmentType.split(",") # #for(var i=0;i<employmentTypeArray.length;i++) { # #=employmentTypeArray[i]# # if (i<employmentTypeArray.length-1) { # <span>,</span> #}}}#',
                    headerAttributes: {'class': 'wb EmploymentType'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            dataSource: refDataEmploymentTypeList,
                            dataTextField: 'value',
                            operator: "contains"
                        }
                    }
                }, {
                    field: "about",
                    title: RecruiterApp.polyglot.t("about"),
                    headerAttributes: {'class': 'wb GeneralComments'},
                    template: "<div class='truncated' title='#= about #'>#= about # </div>",
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "email",
                    title: RecruiterApp.polyglot.t("email"),
                    template: '#if(email){#<a href="mailto:#=email#">#=email#</a>#}#',
                    hidden: true,
                    headerAttributes: {'class': 'wb EmailAddressList'},
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "telephoneList",
                    title: RecruiterApp.polyglot.t("telephone"),
                    template: '#if(telephoneList != undefined && telephoneList[0] && telephoneList != "") { # #var telephoneListArray = telephoneList.split(",")# #for(var i=0;i < telephoneListArray.length;i++) { # <a href="tel:#=telephoneListArray[i].replace(/[()\\- ]/g, "") #"> #=telephoneListArray[i]# </a> # if (i < telephoneListArray.length-1) { #<span>,</span> #}}}#',
                    headerAttributes: {'class': 'wb TelephoneList'},
                    hidden: true,
                    width: '240px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, 
                {
                    field: "overviewNumberList",
                    title: RecruiterApp.polyglot.t("overviewNumbers"),
                    headerAttributes: {'class': 'wb OverviewNumberList'},
                    hidden: false,
                    encoded: false,
                    width: '200px',
                    filterable: false    
                },
                {
                    field: "educationList",
                    title: RecruiterApp.polyglot.t("education"),
                    headerAttributes: {'class': 'wb EducationList'},
                    hidden: true,
                    encoded: false,
                    width: '320px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "qualificationList",
                    title: RecruiterApp.polyglot.t("qualification"),
                    headerAttributes: {'class': 'wb QualificationList'},
                    hidden: true,
                    encoded: false,
                    width: '320px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "employmentHistoryList",
                    title: RecruiterApp.polyglot.t("employmentHistory"),
                    headerAttributes: {'class': 'wb EmploymentHistoryList'},
                    hidden: true,
                    width: '320px',
                    encoded: false,
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "currentEmployerName",
                    title: RecruiterApp.polyglot.t("currentCompany"),
                    headerAttributes: {'class': 'wb CurrentEmployerName'},
                    hidden: true,
                    width: '320px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "currentPosition",
                    title: RecruiterApp.polyglot.t("currentPosition"),
                    headerAttributes: {'class': 'wb CurrentPosition'},
                    hidden: true,
                    width: '320px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                },  {
                    field: "noticePeriodEarliest",
                    title: RecruiterApp.polyglot.t("noticePeriod"),
                    hidden: true,
                    headerAttributes: {'class': 'wb NoticePeriod'},
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "industryList",
                    title: RecruiterApp.polyglot.t("industryList"),
                    headerAttributes: {'class': 'wb IndustryList'},
                    hidden: true,
                    encoded: false,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "jobFunctionList",
                    title: RecruiterApp.polyglot.t("jobFunctions"),
                    headerAttributes: {'class': 'wb JobFunctionList'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "skillList",
                    title: RecruiterApp.polyglot.t("skillList"),
                    headerAttributes: {'class': 'wb SkillList'},
                    encoded: false,
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "languageList",
                    title: RecruiterApp.polyglot.t("languages"),
                    headerAttributes: {'class': 'wb LanguageList'},
                    template: '#=languageList#',
                    hidden: true,
                    width: '170px',
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
                    headerAttributes: {'class': 'wb InterestList'},
                    hidden: true,
                    width: '170px',
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
                    field: "locationList",
                    title: RecruiterApp.polyglot.t("locations_candidate"),
                    //template: '#if(locationList != undefined && locationList[0]) { ##var locationListArray = locationList.split(",") ##for(var i=0;i<locationListArray.length;i++) { ##=locationListArray[i]## if (i<locationListArray.length-1) { #<span>,</span>#}}}#',
                    headerAttributes: {'class': 'wb LocationList'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "seekingLocations",
                    title: RecruiterApp.polyglot.t("seekingLocations"),
                    headerAttributes: {'class': 'wb SeekingLocationList'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
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
                    template: '<span>#=city#</span>',
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
                    template: '<span>#=postalCode#</span>',
                    headerAttributes: {'class': 'wb postalCode'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
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
                    field: "referredBy",
                    title: RecruiterApp.polyglot.t("referredBy"),
                    headerAttributes: {'class': 'wb ReferredBy'},
                    hidden: true,
                    encoded: false,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "minimumSalary",
                    title: RecruiterApp.polyglot.t("minimumSalary"),
                    headerAttributes: {'class': 'wb MinimumSalary'},
                    hidden: true,
                    encoded: false,
                    width: '320px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                },{
                    field: "currentSalary",
                    title: RecruiterApp.polyglot.t("currentSalary"),
                    headerAttributes: {'class': 'wb CurrentSalary'},
                    hidden: true,
                    encoded: false,
                    width: '320px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, 
                {
                    field: "contractRateType",
                    title: RecruiterApp.polyglot.t("contractType"),
                    headerAttributes: {'class': 'wb contractType'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                            // Prep for DORC-677
                            // template: self.DEFINE_TEMPLATE,
                            // showOperators: false
                        }
                    }
                }, {
                    field: "contractAmount",
                    title: RecruiterApp.polyglot.t("contractAmount"),
                    headerAttributes: {'class': 'wb contractAmount'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            // operator: "contains"
                            // Prep for DORC-677
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "availability",
                    title: RecruiterApp.polyglot.t("availability"),
                    headerAttributes: {'class': 'wb availability'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "nationalityList",
                    title: RecruiterApp.polyglot.t("nationality"),
                    headerAttributes: {'class': 'wb Nationality'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "willingnessToTravel",
                    title: RecruiterApp.polyglot.t("willingnessToTravel"),
                    headerAttributes: {'class': 'wb WillingnessToTravel'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "willingToRelocate",
                    title: RecruiterApp.polyglot.t("willingToRelocate"),
                    headerAttributes: {'class': 'wb WillingToRelocate'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "age",
                    title: RecruiterApp.polyglot.t("candidateAge"),
                    headerAttributes: {'class': 'wb Age'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "dob",
                    title: RecruiterApp.polyglot.t("dob"),
                    headerAttributes: {'class': 'wb Dob'},
                    hidden: true,
                    format: "{0:dd/MM/yyyy}",
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "yearsOfExperience",
                    title: RecruiterApp.polyglot.t("yearsOfExperience"),
                    headerAttributes: {'class': 'wb YearsOfExperience'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            template: self.DEFINE_TEMPLATE,
                            showOperators: false
                        }
                    }
                }, {
                    field: "sourceDetail",
                    title: RecruiterApp.polyglot.t("sourceDetail"),
                    headerAttributes: {'class': 'wb SourceDetail'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                }, {
                    field: "cv",
                    title: RecruiterApp.polyglot.t("cv"),
                    headerAttributes: {'class': 'wb CV'},
                    hidden: true,
                    width: "170px",
                    template: "#if(hasCv){#<button type='button' class='btn btn-info btn-xs showCV' id='#=id#'><i class='fa fa-eye fa-lg'></i> " + RecruiterApp.polyglot.t('showCv') + "</button><input type='hidden' id='cvList_#=id#'><input type='hidden' id='first_#=id#' value='#=firstName#'><input type='hidden' id='last_#=id#' value='#=lastName#'> #}else{# <button type='button' class='btn btn-xs disabled disbledBtn'><i class='fa fa-eye fa-lg'></i> " + RecruiterApp.polyglot.t('showCv') + "</button> #}#",
                    sortable: false,
                    filterable: {
                        cell: {
                            minLength: 100,
                            operator: "contains"
                        }
                    }
                }, {
                    field: "otherAttachmentList",
                    title: RecruiterApp.polyglot.t("documents"),
                    headerAttributes: {'class': 'wb Documents'},
                    hidden: true,
                    width: "170px",
                    template:   `#if ((otherAttachmentList && otherAttachmentList.length>0)||(cvList && cvList.length>0)) {
                                    #<button type='button' class='btn btn-info btn-xs showDocuments' id='#=id#'><i class='fa fa-eye fa-lg'></i> ` + RecruiterApp.polyglot.t('showDocuments') + `</button> 
                                #}else{
                                    # <button type='button' class='btn btn-xs disabled disbledBtn'><i class='fa fa-eye fa-lg'></i> ` + RecruiterApp.polyglot.t('showDocuments') + `</button> 
                                #}#`,
                    sortable: false,
                    filterable: {
                        cell: {
                            minLength: 100,
                            operator: "contains"
                        }
                    }
                }, {
                    field: "daxtraCaptureCreated",
                    title: RecruiterApp.polyglot.t("validatedByConsultant"),
                    headerAttributes: {'class': 'wb DaxtraCaptureCreated'},
                    hidden: true,
                    width: '170px',
                    filterable: {
                        cell: {
                            operator: "contains",
                            dataSource: { 
                                data: [{value: RecruiterApp.polyglot.t('yes')}, {value: RecruiterApp.polyglot.t('no')}] 
                            },
                            dataTextField: "value"
                        }
                    }
                }
            ],
            dataBound: function (e) {

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
                    var criteria = _.findWhere(_grid.dataSource.filter().filters, {field: "all"}).value;
                    localStorage.setItem(self.TYPE + "SearchCriteria", criteria);
                }

                RecruiterApp.core.vent.trigger(self.TYPE + 'List:searchBox:update', curSavedSearch, curSavedSearchId, filterSortDetail);

                if (self.options.filterBehConfig && self.options.filterBehConfig.persist == false) {
                    
                } else {
                    localStorage.setItem(self.TYPE + "Filter", filterDetail);
                }

                self.trigger('grid:loaded', _grid);

                self.ACTION_LINKEDIN(_dataSource)
                self.ACTION_SHOWCV()
                self.ACTION_SHOW_DETAILS_ANCHOR()
                self.ACTION_SHOWDOCUMENTS()
                self.ACTION_FN()
                self.CANCEL_FN()

                self.ACTION_DBLCLICK_KENDO('candidate')  ;
                self.ACTION_DELETE_RECORD('candidate');         
                self.ACTION_FORMAT_RANGE_INPUT()

                self.ACTION_SHOWMORE();

                self.APPLY_PERMISSIONS();

                if (!_.isUndefined(_saved) && !_.isNull(_saved) && !_.isEmpty(_saved)) {

                    _.each($('#grid').getKendoGrid().columns, col => {
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

                // self.CONFIGURE_CONTEXT_MENU();
                
                if (self.KENDO_GRID_BUILT) {
                    self.PERSIST_KENDO_GRID()
                } else {
                    self.KENDO_GRID_BUILT = true;
                    self.CHECK_EMAIL_CONFIG();
                    self.RESIZE_KENDO_LISTENER()
                    clearTimeout(self.ERROR_TIMER)
                    $('#grid').data('kendoGrid').refresh();
                }

                // Refresh Kendo menu - Select Columns
                self.REFRESH_SELECTED_COLUMNS();
                self.ACTION_FIELD_CONFIG();
                self.RESIZE_KENDO();

                self.UPDATE_TOTAL_ITEMS_MESSAGE();
                self.HIDE_ADDED_TO_JOB_OUTSIDE_JOB();

                RecruiterApp.core.vent.trigger('unBlockUI');
                
                RecruiterApp.core.vent.trigger('app:DEBUG:warn', ['Kendo','built ' + moment().format('h:mm:ss.SSS a')]);    
            }
        }, self.KENDO_GRID_DEFAULTS))

        grid = $('#grid').getKendoGrid();

        var candidateMenu =  localStorage.getItem(self.TYPE + "Menu");
        if ( candidateMenu == null ){

            //default menu
            var columnConfig = {};
            columnConfig["referenceId"]         = { group: RecruiterApp.polyglot.t('others'), enabled: false };
            columnConfig["firstName"]           = { group: RecruiterApp.polyglot.t('basic'), enabled: true };
            columnConfig['lastName']            = { group: RecruiterApp.polyglot.t('basic'), enabled: true };
            columnConfig['middleName']          = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['otherNames']          = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['allNames']            = { group: RecruiterApp.polyglot.t('basic'), enabled: true };
            columnConfig['salutation']          = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['consentStatus']       = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['gender']              = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['about']               = { group: RecruiterApp.polyglot.t('contact'), enabled: false };
            columnConfig['email']               = { group: RecruiterApp.polyglot.t('contact'), enabled: true };
            columnConfig['cv']                  = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            columnConfig['otherAttachmentList'] = { group: RecruiterApp.polyglot.t('others'), enabled: true };
            columnConfig['visa']                = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            columnConfig['source']              = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['sourceDetail']        = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['status']              = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['religion']            = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['candidateCode']       = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['ownVehicle']          = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['consultantList']      = { group: RecruiterApp.polyglot.t('others'), enabled: true };
            columnConfig['referredBy']          = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['currentEmployerName'] = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            columnConfig['currentPosition']     = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            columnConfig['telephoneList']       = { group: RecruiterApp.polyglot.t('contact'), enabled: true };
            columnConfig['skillList']           = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            columnConfig['interestList']        = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            columnConfig['locationList']        = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            columnConfig['industryList']        = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            columnConfig['jobFunctionList']     = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            columnConfig['addressList']         = { group: RecruiterApp.polyglot.t('contact'), enabled: false };
            columnConfig['specializationList']  = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            columnConfig['seekingLocations']    = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            columnConfig['nationality']         = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['nationalityList']     = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['city']                = { group: RecruiterApp.polyglot.t('contact'), enabled: false };
            columnConfig['country']             = { group: RecruiterApp.polyglot.t('contact'), enabled: false };
            columnConfig['postalCode']          = { group: RecruiterApp.polyglot.t('contact'), enabled: false };
            columnConfig['languageList']        = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            columnConfig['employmentType']      = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            // columnConfig['minimumSalaryBase']   = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            // columnConfig['minimumSalaryBonus']  = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            // columnConfig['currentSalaryBase']   = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            // columnConfig['currentSalaryBonus']  = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            
            // Show these columns only for JAC. Hide for the rest of the world.
            if (RecruiterApp.configuration.getConfiguration('viewFinanceRecord_HidePayRate') == 'true') {
                columnConfig['contractRateType']    = { group: RecruiterApp.polyglot.t('contract'), enabled: false };
                columnConfig['contractAmount']      = { group: RecruiterApp.polyglot.t('contract'), enabled: false };
                columnConfig['availability']        = { group: RecruiterApp.polyglot.t('contract'), enabled: false };
            }

            columnConfig['willingnessToTravel'] = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            columnConfig['willingToRelocate']   = { group: RecruiterApp.polyglot.t('employment'), enabled: false };
            columnConfig['age']                 = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['candidateAge']        = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['dob']                 = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig['yearsOfExperience']   = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            columnConfig['created']             = { group: RecruiterApp.polyglot.t('others'), enabled: false };
            columnConfig['createdBy']           = { group: RecruiterApp.polyglot.t('others'), enabled: false };
            columnConfig['updated']             = { group: RecruiterApp.polyglot.t('others'), enabled: false };
            columnConfig['updatedBy']           = { group: RecruiterApp.polyglot.t('others'), enabled: false };
            columnConfig['daxtraCaptureCreated']= { group: RecruiterApp.polyglot.t('others'), enabled: false };
            columnConfig['educationList']       = { group: RecruiterApp.polyglot.t('others'), enabled: false };
            columnConfig['qualificationList']   = { group: RecruiterApp.polyglot.t('others'), enabled: false };
            columnConfig['employmentHistoryList'] = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            columnConfig['minimumSalary']       = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            columnConfig['currentSalary']       = { group: RecruiterApp.polyglot.t('employment'), enabled: true };
            columnConfig['overviewNumberList']  = { group: RecruiterApp.polyglot.t('basic'), enabled: false };
            columnConfig["noticePeriodEarliest"]= { group: RecruiterApp.polyglot.t('employment'), enabled: true };

            localStorage.setItem(self.TYPE + "Menu", JSON.stringify(columnConfig));
            // Cache grid menu as user preference
            UserPreference.setUserPreference(self.TYPE + "Menu", JSON.stringify(columnConfig));

        } else{
            var columnConfig = JSON.parse(candidateMenu);
        }

        self.columnArray = [{
                text: RecruiterApp.polyglot.t('basic'),
                cssClass: 'menu-group'
            },{
                text: RecruiterApp.polyglot.t('contact'),
                cssClass: 'menu-group'
            },{
                text: RecruiterApp.polyglot.t('employment'),
                cssClass: 'menu-group'
            },{
                text: RecruiterApp.polyglot.t('others'),
                cssClass: 'menu-group'
            }];

        // Show this section only for JAC. Hide for the rest of the world.
        if (RecruiterApp.configuration.getConfiguration('viewFinanceRecord_HidePayRate') == 'true') {
            self.columnArray.splice(3, 0, { 
                text: RecruiterApp.polyglot.t('contract'), 
                cssClass: 'menu-group'
            });
        }

        for (var i = grid.columns.length - 1, min = 0; i >= min; i--) {
            var column = grid.columns[i];
            if (column.field != undefined) {

                var dropDownText;
                var cConfig = columnConfig[column.field];

                if (!_.isUndefined(cConfig)) {
                    var dropDownGrp = _.isUndefined(cConfig.group) ? '' : cConfig.group;

                    if (cConfig != undefined && cConfig.enabled) {
                        dropDownText = "<label><input type='checkbox' " + 
                        (cConfig.enabled == true ? "checked='checked'" : "") + "' " +
                        " class='check' data-field='" + column.field +
                        "'/><span>" + column.title + "</span></label>";
                    } else {
                        dropDownText = "<label><input type='checkbox' " +
                        " class='check' data-field='" + column.field +
                        "'/><span>" + column.title + "</span></label>";
                        grid.element.find('[data-field="' + column.field + '"]').attr('data-hide', true);
                    }

                    var ex = _.findIndex(self.columnArray, {text: dropDownGrp}) + 1

                    self.columnArray.splice(ex, 0, {
                        encoded: false,
                        cssClass: 'wb',
                        text: dropDownText
                    });
                }
            }
        }

        function updateLocalStorage (type, value) {
            if (!_.isUndefined(columnConfig[value])) {
                var grp = columnConfig[value].group
                delete columnConfig[value];
                columnConfig[value] = {group: grp, "enabled":type};

                UserPreference.setUserPreference(self.TYPE + "Menu", JSON.stringify(columnConfig));

                self.PERSIST_KENDO_GRID();
            }
        };

        var session = new Session()

        _kendoMenu = $("#menu").kendoMenu({
            dataSource: [{
                    text: "<span class='glyphicon glyphicon-plus'></span> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("addToThisJob") + "</span>",
                    encoded: false,
                    cssClass: `${self.menuConfig.addToThisJob && self.menuConfig.addToThisJob.perm == false ? 'wb' : ''} addToThisJob`,
                },
                {
                    text: "<i class='fa fa-id-card' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("generateCv") + "</span>",
                    encoded: false,
                    cssClass: `${this.options.menuConfig.generateCv == false ? 'hidden' : ''} generateCv`,
                },
                {
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
                    cssClass: `wb ${self.menuConfig.savedSearch == false ? 'hidden' : ''} savedSearches`,
                    items: [{
                        text: "<i class='fa fa-plus' aria-hidden='true'></i> <i class='fa fa-search' aria-hidden='true'></i><span class='hidden-xs'>" + RecruiterApp.polyglot.t("saveAs...") + "</span>",
                        encoded: false,
                        cssClass: 'saveSearchAs'
                    }]
                },
                {
                    text: "<span class='glyphicon glyphicon-fire'></span> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("addToHotList") + "</span> <span id='saved-hotLists' class='badge badge-notify'></span>",
                    encoded: false,
                    cssClass: `wb ${self.menuConfig.addToHotList == false ? 'hidden' : ''} addToHotList`,
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
                    cssClass: `wb ${self.menuConfig.specCv == false ? 'hidden' : ''} SpecCv`
                },
                {
                    text: "<i class='fa fa-briefcase'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("sendJobs") + "</span>",
                    encoded: false,
                    cssClass: 'wb SendJobs'
                },
                {
                    text: "<i class='fa fa-envelope' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("massMailing") + "</span>",
                    encoded: false,
                    cssClass: 'wb massMailing'
                },
                {
                    text: "<span class='glyphicon glyphicon-plus'></span> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("addToJob") + "</span>",
                    encoded: false,
                    cssClass: `${self.menuConfig.addToJob == false ? 'hidden' : ''} addJob`
                },
                {
                    text: "<i class='fa fa-eye' aria-hidden='true'></i> <span class='hidden-xs'>Show All Fields</span>",
                    encoded: false,
                    cssClass: !!session.hasPermission('DEBUG') ? 'showAllFields' : 'hidden showAllFields'
                },
                {
                    text: "<i class='fa fa-trash text-danger' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("deleteMultiple") + "</span>",
                    encoded: false,
                    cssClass: 'wb massDelete',
                },
                {
                    text: "<i class='fa fa-download' aria-hidden='true'></i> <span class='hidden-xs'>" + RecruiterApp.polyglot.t("export") + "</span>",
                    encoded: false,
                    cssClass: `wb ${self.menuConfig.exportTo == false ? 'hidden' : ''} export`,
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

        self.SHOW_MORE_ACTIONS(false);
        self.BIND_TO_ERROR();

        setTimeout(() => self.loadKendoGrid(), 50)

        var pageSizeDropDownList = grid.wrapper.children(".k-grid-pager").find("select").data("kendoDropDownList");
        pageSizeDropDownList.bind("change", function(e) {
            var pageSize = e.sender.value();
            localStorage.setItem(self.TYPE + "PageSize", pageSize);
        });
    },

    FORMAT_SALARY(result, salaryType) {
        const period    = result[`${salaryType}Period`] ? RecruiterApp.polyglot.t(result[`${salaryType}Period`]) : '';
        const currency  = result[`${salaryType}Currency`] ? RecruiterApp.polyglot.t(result[`${salaryType}Currency`]) : '';
        const numberOfIntervals = result[`${salaryType}NumberOfIntervals`];
        const base      = result[`${salaryType}Base`];        
        const bonus     = result[`${salaryType}Bonus`];
        const benefit   = result[`${salaryType}Benefit`] ? result[`${salaryType}Benefit`] : '';
        const total     = result[`${salaryType}Total`];

        let salaryOutput = `
            ${period    ? `Period: ${period}<br/>`          : ``}
            ${numberOfIntervals ? `${RecruiterApp.polyglot.t('numberOfIntervals')}: ${numberOfIntervals}<br/>`  : ``}
            ${base      ? `Base: ${this.FORMAT_MONEY(base)} ${currency}<br/>`  : ``}
            ${bonus     ? `Bonus: ${this.FORMAT_MONEY(bonus)} ${currency}<br/>`: ``}
            ${benefit   ? `Benefit: ${benefit}<br/>`        : ``}
            ${total     ? `Total: ${this.FORMAT_MONEY(total)} ${currency}<br/>`: ``}
        `.trim();

        /**
         * We add "showMore/Less" only if there are more than 2 lines.
         * So we search for the first <br/>, then from there we find the second one.
         * And we add the extra code only if there is more text after the second <br/>.
         */
        const breakLineLength = 5;
        const firstLineBreak = salaryOutput.indexOf('<br/>');
        if (firstLineBreak > 0) {
            const secondLineBreak = salaryOutput.indexOf('<br/>', firstLineBreak+1);
            
            if (secondLineBreak > 0 && salaryOutput.length > secondLineBreak+breakLineLength) {
                salaryOutput = `${salaryOutput.slice(0, secondLineBreak+breakLineLength) } 
                            <a class="more">${RecruiterApp.polyglot.t('more')}...</a>
                            <span class="more-content hidden">${salaryOutput.slice(secondLineBreak+breakLineLength+1, salaryOutput.length) }
                                <a class="less">${RecruiterApp.polyglot.t('showLess')}...</a>
                            </span>`;
            }
        }

        return salaryOutput;
    },

    

    /**
     * Created this function as in the case of many older saved searches, the added to job button will still come up 
     * despite the visibility and hidden definition in the columns area.
     */
    HIDE_ADDED_TO_JOB_OUTSIDE_JOB () {
        if (!window.location.href.includes('job')) {
            this.$('.ccdAddedToJob').addClass('hidden');
        }
    }
});