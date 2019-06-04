var Marionette                  = require('backbone.marionette'),
    Backbone                    = require('backbone'),
    _ = require('underscore'),
    NavView                     = require('./views/NavView'),
    SearchBoxView               = require('./views/SearchBoxView'),
    // ClientListView              = require('./views/ClientListView'),
    // PersonList                  = require('./models/PersonList'),
    // MailboxCandidateList        = require('./models/MailboxCandidateList'),
    PeopleSearchCriteria        = require('./models/PeopleSearchCriteria'),
    // PageControl                 = require('../pagination/PageControl'),
    // BaseEmailLayout             = require('../sendEmail/layouts/BaseEmailLayout'),
    // EmailRecordsLayout          = require('../sendEmail/layouts/EmailRecordsLayout'),
    // SendJobsLayout              = require('../sendEmail/layouts/SendJobsLayout'),
    // SendCvLayout                = require('../sendEmail/layouts/SendCvLayout'),
    // MassMailList                = require('../massMail/models/MassMailList'),
    // MassMailSelectorView        = require('../massMail/views/MassMailSelectorView'),
    // Cv                          = require('../candidate/models/Cv'),
    // DocumentsCollection         = require('../candidate/models/DocumentsCollection'),
    // Candidate                   = require('../candidate/models/Candidate'),
    // Client                      = require('../client/models/Client'),
    ReferenceDataList           = require('../common/models/ReferenceDataList'),
    // ImportCandidate             = require('../mailboxCandidateDashboard/models/ImportCandidate'),
    // CandidateCvView             = require('./views/CandidateCvView'),
    // OtherAttachmentsView        = require('./views/OtherAttachmentsView'),
    // NoCvFoundView               = require('./views/NoCvFoundView'),
    CandidateGridView           = require('./views/CandidateGridView'),
    ClientGridView              = require('./views/ClientGridView'),
    // SendJobsLayout              = require('../jobOverviewDashboard/views/SendJobsLayout'),
    // EmailTemplateList           = require('../admin/emailTemplate/models/EmailTemplateList'),
    ConfirmDeleteView           = require('../common/views/ConfirmDeleteView'),
    JobToCandidateView          = require('./views/JobToCandidateView'),
    // CandidateDetailsView        = require('../candidateDashboard/views/DetailsView'),
    // SpecCvLayout                = require('../specCv/views/SpecCvLayout'),
    // MassMailingLayout           = require('../massMailing/views/MassMailingLayout'),
    // CandidateGridTestView       = require('./views/CandidateGridTestView'),
    RecentItem                  = require ('../recentItems/models/RecentItem'),
    UserEmail                   = require('../userProfile/models/UserEmail'),
    RecentItemCollection        = require ('../recentItems/models/RecentItemCollection');

var fastClickTimeout;

// private
var Layout = Marionette.Layout.extend({
    template: require('./templates/peopleDashboardLayout.hbs'),
    regions: {
        title:                  "#page-title",
        nav:                    "#nav-tabs",
        searchBox:              "#searchBox",
        searchResultList:       "#searchResultList",
        candidateDetail:        "#candidateDetail",
        candidateCv:            "#candidate-cv",
        filterSelect:           "#filter-select",
        createCandidateWizard:  "#createCandidateWizard",
        massMailSelector:       ".mass-mail-list",
        debugKendo:             "#debugKendo"
    }
});


var effect                  = 'slide';
var options                 = { direction: 'right' };
var duration                = 700;

//var _peopleList = new PersonList();
var _searchCriteria;

var candidateSearchList = new RecentItemCollection({}, { type: RecentItem.TYPE.CANDIDATE });
var clientSearchList = new RecentItemCollection({}, { type: RecentItem.TYPE.CLIENT });
var mailboxCandidateSearchList = new RecentItemCollection({}, { type: RecentItem.TYPE.MAILBOX });


module.exports = PeopleDashboardController = Marionette.Controller.extend({

    initializeLayout: function () {
        RecruiterApp.core.vent.trigger('app:log', ['PeopleDashboardController', 'initializeLayout...'])

        this.CheckRequiredRefDataLoaded();

        PeopleDashboardController.layout = new Layout();
        PeopleDashboardController.layout.on("show", function () {
            RecruiterApp.core.vent.trigger("layout:rendered");
        });
        RecruiterApp.core.vent.trigger('app:show', PeopleDashboardController.layout);
        $('#main-sidebar').removeClass('in')
    },

    CheckRequiredRefDataLoaded: function () {
        if (_.isUndefined(window.Octus.visaList)
            && _.isUndefined(window.Octus.sourceDetailList)) 
        {            
            this.LoadRequiredRefData();
        }
    },

    LoadRequiredRefData: function () {
        window.Octus.visaList = new ReferenceDataList({ type: "visa" });
        window.Octus.sourceDetailList = new ReferenceDataList({ type: "sourceDetail" });


        $.when(
            window.Octus.visaList.fetch(),
            window.Octus.sourceDetailList.fetch()
        ).then(function () {
            window.Octus.dictionary = window.Octus.dictionary.concat(window.Octus.visaList.toJSON());
            window.Octus.dictionary = window.Octus.dictionary.concat(window.Octus.sourceDetailList.toJSON());
        });
    },

    initialize: function () {
        var self = this;

        //Past searches (Breadcrumbs)
        clientSearchList.type = 'CLIENT_SEARCH';
        clientSearchList.fetch();
        candidateSearchList.type = 'CANDIDATE_SEARCH';
        candidateSearchList.fetch();
        mailboxCandidateSearchList.type = 'MAILBOXCANDIDATE_SEARCH';
        mailboxCandidateSearchList.fetch();

        RecruiterApp.core.vent.on("peopleDashboardController:show:clients", function () {
            self.ShowClients();
        });
        RecruiterApp.core.vent.on("peopleDashboardController:show:mailboxCandidates", function () {
            self.ShowMailboxCandidates()
        });
        RecruiterApp.core.vent.on("peopleDashboardController:show:candidates", function () {
            self.ShowCandidates();
        });

        RecruiterApp.core.vent.on('addJobToCandidates', function(_model, scope) {
            var addNew = new JobToCandidateView(_model);

            if (scope) addNew.scope = scope;

            RecruiterApp.core.vent.trigger('app:modal:show',addNew);
        });

        RecruiterApp.core.vent.on('peopleDashboardController:search', function(criteria) {
            console.log("Sending search criteria '" + criteria + "' to the server");

            //Breadcrumb add
            var searchCrumb = new Backbone.Model();
            searchCrumb.set('id','');
            searchCrumb.set('subject',criteria);

            if (_searchCriteria.get('type') == 'client') {
                localStorage.setItem("clientSearchCriteria", criteria);
                // clientSearchList.type = 'CLIENT_SEARCH';
                // RecruiterApp.core.vent.trigger('breadcrumb:add', searchCrumb, 'CLIENT_SEARCH', 'SEARCH', clientSearchList);
                self.ShowClients(true);
            } else if (_searchCriteria.get('type') == 'candidate') {
                localStorage.setItem("candidateSearchCriteria", criteria);
                // candidateSearchList.type = 'CANDIDATE_SEARCH';
                // RecruiterApp.core.vent.trigger('breadcrumb:add', searchCrumb, 'CANDIDATE_SEARCH', 'SEARCH', candidateSearchList);
                self.ShowCandidates(true);
            } else if (_searchCriteria.get('type') == 'mailboxCandidate') {
                localStorage.setItem("mailboxCandidateSearchCriteria", criteria);
                // candidateSearchList.type = 'MAILBOXCANDIDATE_SEARCH';
                //RecruiterApp.core.vent.trigger('breadcrumb:add', searchCrumb, 'MAILBOXCANDIDATE_SEARCH', 'SEARCH', mailboxCandidateSearchList);
                self.ShowMailboxCandidates(true);
            }
        });

        RecruiterApp.core.vent.on('peopleSearch:search:clear', function() {

            // Clear "all" filter into xxxFilter
            self.clearSearchCriteriaFilter(_searchCriteria.get('type'));

            if (_searchCriteria.get('type') == 'client') {
                localStorage.removeItem('clientSearchCriteria')
                self.ShowClients();
            } else if (_searchCriteria.get('type') == 'candidate') {
                localStorage.removeItem('candidateSearchCriteria')
                self.ShowCandidates();
            } else if (_searchCriteria.get('type') == 'mailboxCandidate') {
                localStorage.removeItem('mailboxCandidateSearchCriteria')
                self.ShowMailboxCandidates();
            }
        });

        RecruiterApp.core.vent.on('candidateList:delete', function(candidateId, type) {
            alert('Delete Candidate Placeholder');
            // var deleteCandidate = new Candidate({ id: candidateId});
            // deleteCandidate.id  = candidateId;

            // $.when(
            //     deleteCandidate.fetch()
            // ).done(function () {
            //     let message;

            //     if (deleteCandidate.has('type') && deleteCandidate.get('type').indexOf('CLIENT') != -1) {
            //         message = 'confirmDeleteWithClient'
            //     }


            //     var confirmDeleteView = new ConfirmDeleteView({
            //         model: new Backbone.Model({
            //             toDelete: deleteCandidate.get('firstName') + ' ' + deleteCandidate.get('lastName')
            //         }),
            //         message
            //     });           

            //     RecruiterApp.core.vent.trigger('app:modal:show',confirmDeleteView);

            //     confirmDeleteView.on('deleteConfirmed', function() {
            //         console.log("Delete candidate confirmed...");
                    
            //         deleteCandidate.destroy({ success: function() {
            //             RecruiterApp.core.vent.trigger('app:modal:close');

            //             if ( type == 'MAILBOX' ) {
            //                 self.ShowMailboxCandidates();
            //             } else {
            //                 window.location.hash = "/people/candidates";
            //             }

            //             self.ShowCandidates();
            //             RecruiterApp.core.vent.trigger('app:message:info', RecruiterApp.polyglot.t("candidateDeleted") );
            //             RecruiterApp.core.vent.trigger('app:recentitems:candidate:refresh');
            //         }, error: function() {
            //             RecruiterApp.core.vent.trigger('app:modal:close');

            //             if ( type == 'MAILBOX' ) {
            //                 self.ShowMailboxCandidates();
            //             } else {
            //                 window.location.hash = "/people/candidates";
            //             }
            //             RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("cannotDeleteCandidateLinkedOtherRecords"));
            //         }});

            //     });

            //     confirmDeleteView.on('deleteCancelled', function() {

            //     });
            // });

        });

        RecruiterApp.core.vent.on('candidateList:massDelete', function (ids, scope) {
            console.log('candidateId', ids);

            var currCcd = 0;

            var confirmDeleteView = new ConfirmDeleteView({
                model: new Backbone.Model({ toDelete: ids.length + ' candidate(s)' })
            });

            RecruiterApp.core.vent.trigger('app:modal:show',confirmDeleteView);

            confirmDeleteView.on('deleteConfirmed', function() {
                console.log("Delete candidate confirmed...");
                // deleteCandidateRecursively(ids, currCcd);
            });

            // function deleteCandidateRecursively(ids, currCcd) {
            //     var idToDelete = ids[currCcd];
            //     var deleteCandidate = new Candidate({id: idToDelete.id});

            //     $.when(
            //         deleteCandidate.fetch()
            //     ).done(function () {
            //         var allNames = deleteCandidate.get('allNames');
            //         console.error('deleting:', allNames);

            //         deleteCandidate.destroy({
            //             success: function () {
            //                 RecruiterApp.core.vent.trigger('app:message:info', RecruiterApp.polyglot.t("candidateDeleted") + " " + allNames);
            //                 RecruiterApp.core.vent.trigger('app:recentitems:candidate:refresh');

            //                 if (currCcd == ids.length - 1) {
            //                     RecruiterApp.core.vent.trigger('app:modal:close');
            //                     self.ShowCandidates();
            //                 } else {
            //                     currCcd++;
            //                     deleteCandidateRecursively(ids, currCcd);
            //                 }

            //                 if (scope) {
            //                     RecruiterApp.core.vent.trigger('ga:send', { 
            //                         hitType: 'event', 
            //                         eventCategory: scope,
            //                         eventAction: 'MassDelete',
            //                         eventLabel: 'Success'
            //                     });
            //                 }
            //             },
            //             error: function () {
            //                 RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("cannotDeleteCandidateLinkedOtherRecords") + " " + allNames); 

            //                 if (currCcd == ids.length - 1) {
            //                     RecruiterApp.core.vent.trigger('app:modal:close');
            //                     self.ShowCandidates();
            //                 } else {
            //                     currCcd++;
            //                     deleteCandidateRecursively(ids, currCcd);
            //                 }

            //                 if (scope) {
            //                     RecruiterApp.core.vent.trigger('ga:send', { 
            //                         hitType: 'event', 
            //                         eventCategory: scope,
            //                         eventAction: 'MassDelete',
            //                         eventLabel: 'Fail'
            //                     });
            //                 }
            //             }
            //         }) 
            //     });
            // }
        });
        
        RecruiterApp.core.vent.on('shortList:sendCv', function (sendObject, scope) {
            alert('Send CVs');
            // RecruiterApp.core.vent.trigger('blockUI', RecruiterApp.polyglot.t("loading"));

            // let userEmail       = new UserEmail();
            // userEmail.fetch().then(() => {

            //     RecruiterApp.core.vent.trigger('unBlockUI');

            //     sendObject.userEmail   = userEmail;
            //     sendObject.type = 'sendCv';

            //     let sendCvLayout = new BaseEmailLayout(sendObject);
            //     if (scope) sendCvLayout.scope = scope;

            //     RecruiterApp.core.vent.trigger('app:modal:show', sendCvLayout, "xl"); 
            // });
        })

        RecruiterApp.core.vent.on('clientList:specCv candidateList:specCv', function (sendObject, scope) {
            alert('Spec CVs')
            // RecruiterApp.core.vent.trigger('blockUI', RecruiterApp.polyglot.t("loading"));

            // let userEmail       = new UserEmail();
            // userEmail.fetch().then(() => {

            //     RecruiterApp.core.vent.trigger('unBlockUI');

            //     sendObject.userEmail   = userEmail;
            //     sendObject.type = 'specCv';

            //     let sendCvLayout = new BaseEmailLayout(sendObject);
            //     if (scope) sendCvLayout.scope = scope;

            //     RecruiterApp.core.vent.trigger('app:modal:show', sendCvLayout, "xl"); 
            // })
        })

        RecruiterApp.core.vent.on('candidateList:massMailing clientList:massMailing shortList:massMailing', (sendObject, scope, type) => {
            alert('Mass Mailing');
            // RecruiterApp.core.vent.trigger('blockUI', RecruiterApp.polyglot.t("loading"));

            // let userEmail       = new UserEmail();
            // userEmail.fetch().then(() => {

            //     RecruiterApp.core.vent.trigger('unBlockUI');

            //     sendObject.userEmail   = userEmail;
            //     sendObject.type = 'massMail';

            //     let emailRecordsLayout = new BaseEmailLayout(sendObject);
            //     if (scope) emailRecordsLayout.scope = scope;

            //     RecruiterApp.core.vent.trigger('app:modal:show', emailRecordsLayout, "xl"); 
            // })
        }) 

        RecruiterApp.core.vent.on('candidateOverviewDashboard:sendJobs', function (sendObject, scope) {
            alert('Send Jobs')
            // RecruiterApp.core.vent.trigger('blockUI', RecruiterApp.polyglot.t("loading"));

            // let userEmail       = new UserEmail();
            // userEmail.fetch().then(() => {

            //     RecruiterApp.core.vent.trigger('unBlockUI');

            //     sendObject.userEmail   = userEmail;
            //     sendObject.type = 'sendJob';

            //     let sendJobsLayout = new BaseEmailLayout(sendObject);
            //     if (scope) sendJobsLayout.scope = scope;

            //     RecruiterApp.core.vent.trigger('app:modal:show', sendJobsLayout, "xl"); 
            // })
        })

        RecruiterApp.core.vent.on('candidateList:searchBox:update', function (param, searchId, details) {
            self.UpdateSearchBox(param, searchId, details)
        })  

        RecruiterApp.core.vent.on('clientList:searchBox:update', function (param, searchId, details) {
            self.UpdateSearchBox(param, searchId, details)
        })  

        RecruiterApp.core.vent.on('candidateGrid:reload', function () {
            window.location.hash = '/people/candidate'
            _.defer(function() {window.location.hash = '/people/candidates' });
        })

        RecruiterApp.core.vent.on('clientGrid:reload', function () {
            window.location.hash = '/people/client'
            _.defer(function() {window.location.hash = '/people/clients' });
        })

        RecruiterApp.core.vent.on('clientList:delete', function(clientId) {
            alert('Delete Client placeholder');
            // var deleteClient = new Client({ id: clientId });
            // deleteClient.id  = clientId;
                
            // $.when(
            //     deleteClient.fetch()
            // ).done(function () {
            //     let message;

            //     if (deleteClient.has('type') && deleteClient.get('type').indexOf('CANDIDATE') != -1) {
            //         message = 'confirmDeleteWithCandidate'
            //     }

            //     var confirmDeleteView = new ConfirmDeleteView({
            //         model: new Backbone.Model({
            //             toDelete: deleteClient.get('firstName') + ' ' + deleteClient.get('lastName')
            //         }),
            //         message
            //     });

            //     RecruiterApp.core.vent.trigger('app:modal:show',confirmDeleteView);

            //     confirmDeleteView.on('deleteConfirmed', function() {
            //         console.log("Delete client confirmed...");
                    
            //         deleteClient.destroy({ success: function() {
            //             RecruiterApp.core.vent.trigger('app:modal:close');
            //             window.location.hash = "/people/clients";
            //             self.ShowClients();
            //             RecruiterApp.core.vent.trigger('app:message:info', RecruiterApp.polyglot.t("clientDeleted"));
            //             RecruiterApp.core.vent.trigger('app:recentitems:client:refresh');
            //         }, error: function() {
            //             RecruiterApp.core.vent.trigger('app:modal:close');
            //             window.location.hash = "/people/clients";
            //             self.ShowClients();
            //             RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("cannotDeleteClientLinkedOtherRecords"));
            //         }});
            //     });

            //     confirmDeleteView.on('deleteCancelled', function() {

            //     });
            // });

        });

        RecruiterApp.core.vent.on('clientList:massDelete', function (ids) {
            console.log('clientId', ids)

            var confirmDeleteView = new ConfirmDeleteView({
                model: new Backbone.Model({ toDelete: ids.length + " " + RecruiterApp.polyglot.t("clients") })
            });

            RecruiterApp.core.vent.trigger('app:modal:show',confirmDeleteView);

            confirmDeleteView.on('deleteConfirmed', function() {
                console.log("Delete client confirmed...");

                // _.each(ids, function(obj, i) {
                //     var deleteClient = new Client({ id: obj.id })
                //     deleteClient.id = obj.id

                //     $.when(
                //         deleteClient.fetch()
                //     ).done(function() {
                //         var clientName = deleteClient.get('firstName') + ' ' + deleteClient.get('lastName');

                //         deleteClient.destroy({ 
                //             success: function() {
                //                 if (i == ids.length - 1) {
                //                     RecruiterApp.core.vent.trigger('app:modal:close');
                //                     self.ShowClients();
                //                 }                                
                //                 RecruiterApp.core.vent.trigger('app:message:info', RecruiterApp.polyglot.t("clientDeleted") + " " + clientName);
                //                 RecruiterApp.core.vent.trigger('app:recentitems:client:refresh');
                //             }, 
                //             error: function () {
                //                 if (i == ids.length - 1) {
                //                     RecruiterApp.core.vent.trigger('app:modal:close');
                //                     self.ShowClients();
                //                 }
                //                 RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("cannotDeleteClientLinkedOtherRecords") + " " + clientName); 
                //             }
                //         }); 
                //     });
                    
                // });
            })
        })

        RecruiterApp.core.vent.on('candidateList:show:cv', function( fullCandidate ) {
            alert('Show CV Dialog');
            // if (fullCandidate.cvList != undefined) {
            //     //console.log('fullCandidate',fullCandidate);
            //     var cv = new Cv();
            //     var name = fullCandidate.firstName+" "+fullCandidate.lastName;
            //     cv.set('content', fullCandidate.cvList);
            //     cv.set('name', name );
            //     var candidateCvView = new CandidateCvView({ model: cv });
            //     RecruiterApp.core.vent.trigger('app:modal:show', candidateCvView, 'big');
            // }else {
            //     //var NoCvFoundView
            //     RecruiterApp.core.vent.trigger('app:message:warning', RecruiterApp.polyglot.t("noCVFound"));
            // }

        });

        RecruiterApp.core.vent.on('mailboxCandidateList:show:attachments', function( fullCandidate ) {
            // if (fullCandidate.otherAttachmentList != undefined) {
            //     var cv = new Cv();
            //     var name = fullCandidate.firstName+" "+fullCandidate.lastName;
            //     cv.set('content', fullCandidate.otherAttachmentList);
            //     cv.set('name', name );
            //     cv.set('candidateId', fullCandidate.candidateId );
            //     var otherAttachmentsView = new OtherAttachmentsView({ model: cv });
            //     RecruiterApp.core.vent.trigger('app:modal:show', otherAttachmentsView, 'big');

            //     otherAttachmentsView.on('candidate:import', function(candidateId, documentId) {
            //         if( !documentId ) {
            //             RecruiterApp.core.vent.trigger('app:message:error', 'Please select one document to import');
            //         }
            //         else{
            //             RecruiterApp.core.vent.trigger('app:modal:close');
            //             RecruiterApp.core.vent.trigger('blockUI', 'Importing Candidate ...');

            //             var importCandidate = new ImportCandidate();
            //             importCandidate.id = candidateId;
            //             importCandidate.source = 'mailbox';
            //             importCandidate.documentId = documentId;
            //             // console.log(documentId, importCandidate.url())
            //             importCandidate.fetch({
            //                 success: function () {
            //                     RecruiterApp.core.vent.trigger('candidateForm:mailboxCandidate:import',importCandidate);
            //                     // importCandidate.documentId = documentId;
            //                     // importCandidate.save(null, {
            //                     //     success: function () {
            //                     //         console.log('importCandidate',importCandidate);
            //                     //         RecruiterApp.core.vent.trigger('candidateForm:mailboxCandidate:import',importCandidate);       
            //                     //     }
            //                     // })
            //                 }
            //             })
                        
            //             // var importCandidate = new ImportCandidate();
            //             // importCandidate.id = candidateId;
            //             // importCandidate.documentId = documentId;
            //             // importCandidate.save({ success: function() {
            //             //     console.log('importCandidate',importCandidate);
            //             //     RecruiterApp.core.vent.trigger('candidateForm:mailboxCandidate:import',importCandidate);
            //             // }});
            //         }
            //     });

            // }else {
                //var NoCvFoundView
                RecruiterApp.core.vent.trigger('app:message:warning', RecruiterApp.polyglot.t("noCVFound"));
            // }

        });
    },

    ShowClients: function (isNewSearch) {
        RecruiterApp.core.vent.trigger('blockUI', RecruiterApp.polyglot.t("loading"));

        var filterArray   = (localStorage.getItem("clientFilter")) ? JSON.parse(localStorage.getItem("clientFilter")) : [] ;
        var searchKeyword = (localStorage.clientSearchCriteria) ? localStorage.clientSearchCriteria : '';

        var searchObj     = { field: "all", operator: "contains", value: searchKeyword };

        if (!_.isUndefined(_.findWhere(filterArray, {field: "all"}))) {
            _.findWhere(filterArray, {field: "all"}).value = searchKeyword
        } else {
            filterArray.push(searchObj);
        }

        var currentPage = (localStorage.getItem("clientCurrentPage") && !isNewSearch)? localStorage.getItem("clientCurrentPage") : 1;
        var pageSize = (localStorage.getItem("clientPageSize"))? localStorage.getItem("clientPageSize") : 10;

        this.initializeLayout();
        this.SetupSearchBox("client");
        PeopleDashboardController.layout.$el.find('.row.page-head').hide()

        var navView = new NavView();
        // PeopleDashboardController.layout.nav.show(navView);
        $("button#create-candidate").hide();
        $("button#create-client").show();
        $("button.clients").addClass("disabled");
        $("button.candidates").removeClass("disabled");
        $("#clients-tab").addClass("active");
        $("#mailboxCandidates-tab").removeClass("active");
        $("#candidates-tab").removeClass("active");
        $('#searchCriteria').val(searchKeyword);

        window.scrollTo(0, 0)

        var clientGridView = new ClientGridView({
            currentPage:currentPage, 
            pageSize: pageSize, 
            filterArray:filterArray
        })

        PeopleDashboardController.layout.searchResultList.show(clientGridView);
        
        clientGridView.on('grid:loaded', function (grid) {
            RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('clientPerson') + ' (' + grid.dataSource.total() + ')');
            RecruiterApp.core.vent.trigger('menu:blur');
        });

        RecruiterApp.core.vent.trigger('menu:highlight','clientPerson');
        RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('clientPerson'));
        RecruiterApp.core.vent.trigger('ga:send', { hitType: 'pageview', page: 'ClientGrid'});

        this.ShowBreadcrumbs('client');
    },

    ShowCandidates: function (isNewSearch) {

        RecruiterApp.core.vent.trigger('blockUI', RecruiterApp.polyglot.t("loading"));

        var filterArray   = (localStorage.getItem("candidateFilter")) ? JSON.parse(localStorage.getItem("candidateFilter")) : [] ;
        var searchKeyword = (localStorage.candidateSearchCriteria) ? localStorage.candidateSearchCriteria : '';

        var notMailboxObj = { field: "dataQuality", operator:"neq", value:"AUTOMATIC_IMPORTED_MAILBOX"};
        var searchObj     = { field: "all", operator: "contains", value: searchKeyword };

        if (!_.isUndefined(_.findWhere(filterArray, {field: "dataQuality"}))) {
            _.findWhere(filterArray, {field: "dataQuality"}).value = "AUTOMATIC_IMPORTED_MAILBOX"
        } else {
            filterArray.push(notMailboxObj);
        }

        if (!_.isUndefined(_.findWhere(filterArray, {field: "all"}))) {
            _.findWhere(filterArray, {field: "all"}).value = searchKeyword
        } else {
            filterArray.push(searchObj);
        }

        var currentPage = (localStorage.getItem("candidateCurrentPage") && !isNewSearch) ? localStorage.getItem("candidateCurrentPage") : 1;
        var pageSize = (localStorage.getItem("candidatePageSize"))? localStorage.getItem("candidatePageSize") : 10;

        this.initializeLayout();
        this.SetupSearchBox("candidate");
        PeopleDashboardController.layout.$el.find('.row.page-head').hide();

        var navView = new NavView();
        // PeopleDashboardController.layout.nav.show(navView);
        $("button#create-candidate").show();
        $("button#create-client").hide();
        $("button.candidates").addClass("disabled");
        $("button.clients").removeClass("disabled");
        $("#clients-tab").removeClass("active");
        $("#mailboxCandidates-tab").removeClass("active");
        $("#candidates-tab").addClass("active");
        $('#searchCriteria').val(searchKeyword);

        window.scrollTo(0, 0);
        
        var candidateSidebar = $('#candidateDetailSlide');
            candidateSidebar.removeClass("is-active");
        
        var candidateGridView = new CandidateGridView({
            currentPage:currentPage, pageSize: pageSize, filterArray:filterArray,
            menuConfig: {
                addToThisJob: {
                    perm: false
                },
                generateCv: false
            },
            actionConfig: {
                addedToJob: false,
            },
        })

        // var candidateGridTestview = new CandidateGridTestView({
        //     gridToTest: candidateGridView
        // })
        // PeopleDashboardController.layout.debugKendo.show(candidateGridTestview);
        PeopleDashboardController.layout.searchResultList.show(candidateGridView);
        RecruiterApp.core.vent.trigger('ga:send', { hitType: 'pageview', page: 'CandidateGrid' });

        candidateGridView.on('grid:loaded', function (grid) {
            RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('candidate') + ' (' + grid.dataSource.total() + ')');
            RecruiterApp.core.vent.trigger('menu:blur');
        });

        RecruiterApp.core.vent.on('candidateViewRecord', candidateId => {
            var link = '#/candidate/' + candidateId + '/dashboard';
            if (fastClickTimeout) {
                clearTimeout(fastClickTimeout);
            };

            if (candidateGridView.baseFn.REDUCE_FUNCTION().touch || candidateGridView.baseFn.REDUCE_FUNCTION().mobileScreen) {
                window.location.href = link;
            } 
        });

        candidateGridView.on('select:candidate:viewrecord', function (candidateId) { 
            RecruiterApp.core.vent.trigger('candidateViewRecord', candidateId);
        })

        $("#main-content").click( function(e){
            if ($(e.target).closest("#candidateDetailSlide").length) {
                return;
            }
            if (candidateSidebar.hasClass("is-active")){
                candidateSidebar.removeClass("is-active");
            }
        });
        
        RecruiterApp.core.vent.trigger('menu:highlight','candidate');
        RecruiterApp.core.vent.trigger('domchange:title', RecruiterApp.polyglot.t('candidate'));

        this.ShowBreadcrumbs('candidate');
    },


    SetupSearchBox: function(type) {
        _searchCriteria = new PeopleSearchCriteria({ 
            type: type,
            criteria: !_.isUndefined(localStorage[type + 'SearchCriteria']) && !_.isNull(localStorage[type + 'SearchCriteria']) ? localStorage[type + 'SearchCriteria'] : ''
        });

        var searchBoxView; 
        if (type == 'client') {
            searchBoxView = new SearchBoxView({model: _searchCriteria, collection: clientSearchList, type: type});
        } else if (type == 'candidate'){
            searchBoxView = new SearchBoxView({model: _searchCriteria, collection: candidateSearchList, type: type});
        } else if (type == 'mailboxCandidate'){
            searchBoxView = new SearchBoxView({model: _searchCriteria, collection: mailboxCandidateSearchList, type: type});
        }

        searchBoxView.on('discardChanges', function (saveSearchId) {
            PeopleDashboardController.layout.searchResultList.currentView.DISCARD_CHANGES(saveSearchId)
        })

        searchBoxView.on('saveAs', function () {
            PeopleDashboardController.layout.searchResultList.currentView.SAVE_SEARCH_AS(true)
        })

        searchBoxView.on('save', function () {
            PeopleDashboardController.layout.searchResultList.currentView.SAVE_SEARCH()
        })

        PeopleDashboardController.layout.searchBox.show(searchBoxView);
    },

    UpdateSearchBox: function (savedSearch, savedSearchId, detail) {
        RecruiterApp.core.vent.trigger('app:DEBUG:log', ['UpdateSearchBox', [savedSearch, savedSearchId, detail]]);        
        var cri = _.isUndefined(detail) || _.isNull(detail) || _.isEmpty(detail) || _.isUndefined(_.findWhere(JSON.parse(detail.split(' | ')[0]), {field: 'all'})) ? 
                "" : _.findWhere(JSON.parse(detail.split(' | ')[0]), {field: 'all'}).value;

        if (savedSearch && PeopleDashboardController.layout && PeopleDashboardController.layout.searchBox) {
            var searchBox       = PeopleDashboardController.layout.searchBox.currentView;
            var searchBoxModel  = searchBox.model;
            var title           = _.isObject(savedSearch) ? savedSearch.name : savedSearch;
            var text            = savedSearchId ? 'save' : 'saveAs';

            searchBoxModel.set({
                searchTitle:            title,
                searchTitleSearchText:  text,
                filterDetail:           detail,
                savedSearchId:          savedSearchId,
                criteria:               cri
            })

            searchBox.checkEditted();
            searchBox.render();
        }
    },

    clearSearchCriteriaFilter: function(type) {
        var filter = localStorage[type + 'Filter'];
        if (filter) {
            var filterParsed = JSON.parse(filter);
            if ((f = _.findWhere(filterParsed, { "field" : "all" }))) {
                f.value = "";
                localStorage.setItem(type + 'Filter', JSON.stringify(filterParsed));
                localStorage.setItem(type + 'CurrentSavedSearchEdit', true);
            }
        }
    },

    ShowBreadcrumbs: function (tabName) {
        var breadcrumbsList = new Array();

        switch (tabName) {
            case 'candidate': 
                breadcrumbsList.push(RecruiterApp.polyglot.t('CANDIDATE')); 
                break;

            case 'client':
                breadcrumbsList.push(RecruiterApp.polyglot.t('clientPerson')); 
                break;

            case 'mailboxCandidate':
                breadcrumbsList.push(RecruiterApp.polyglot.t('mailboxCandidates')); 
                break;
        }

        RecruiterApp.core.vent.trigger('app:breadcrumbs:update', breadcrumbsList);
    }

});