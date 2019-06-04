var Marionette                  = require('backbone.marionette'),
    stickit                     = require('backbone.stickit'),
    moment                      = require('moment'),

    Session                     = require('../../../session/models/Session'),
    Document                    = require('../../models/document/Document'),
    GenerateBrandedDocument     = require('../../models/document/GenerateBrandedDocument');

module.exports = BaseDocumentListItemView = Marionette.ItemView.extend({
    template : require('../../templates/document/documentListItem.hbs'),
    tagName  : 'tr',
    className: 'docTr',
    events: {
        'click td.name'         : 'documentClicked',
        'click td.created'      : 'documentClicked',
        'click .download'       : 'download',
        'click .delete'         : 'deleteDocument',
        'click .brand-document' : 'brandDocument',
        'click .remove-tag'     : 'removeTag'
    },
    bindings: {
        '.name': {
            observe: ['displayName', 'name'],
            onGet: function(values) {
                if (values[0] == undefined) {
                    return values[1];
                } else {
                    return values[0];
                }
            }
        },
        '.created' : {
            observe: 'created',
            onGet: function(date) {
                if (date != undefined) {
                    return moment([date[0],date[1]-1,date[2]].concat(date.slice(3,6))).format(window.Octus.TS_FORMAT);
                } else {
                    return "";
                }
            }
        },
        '.revisionDate' : {
            observe: 'versionDate',
            onGet: function(date) {
                if (date && date.length)
                    return (!_.isUndefined(date)) ? moment(date).format('DD/MM/YYYY') : '';
                else
                    return '';
            }
        }
    },
    onRender: function () {
        this.stickit();
    },
    onShow() {
        this.$el.find('.dropdown-toggle').dropdown();
        this.renderDocumentTemplates();
    },
    renderDocumentTemplates() {
        if (window.Octus.documentTemplates && (documentTemplates = window.Octus.documentTemplates.filterByType('BRANDED_DOCUMENT')).length > 0) {
            this.model.set('documentTemplates', new Backbone.Collection(documentTemplates).toJSON());
            this.render();
        }
    },
    documentClicked(e) {
        $('.docTr').removeClass('success');
        $(e.target).parent().addClass('success');
        this.trigger('document:selected:show', this.model);
    },
    download() {
        var session = new Session();
        window.open(RecruiterApp.config.API_ROOT + '/document/' + this.model.id + "/download?ticket=" + encodeURIComponent(session.get('authToken')));
    },
    deleteDocument() {
        this.trigger('document:delete', this.model);
    },
    brandDocument(e) {
        e.preventDefault();

        var self        = this;
        var selItems    = [];

        RecruiterApp.core.vent.trigger('blockUI', RecruiterApp.polyglot.t('loading'));

        let templateId = e.target.getAttribute('data-template-id');
        let type = e.target.getAttribute('data-type');

        let generateBrandedDocument = new GenerateBrandedDocument({
            documentId: self.model.get('id'),
            templateId: templateId,
            type: type
        });

        _.delay(() => {
            generateBrandedDocument.save(null, { 
                success (result) {
                    self.trigger('documentList:document:add', new Document(result.toJSON()));
                    RecruiterApp.core.vent.trigger('unBlockUI');
                    RecruiterApp.core.vent.trigger('app:message:success',  RecruiterApp.polyglot.t('generateBrandedDocumentSuccess'));
                },
                error (XMLHttpRequest, textStatus, errorThrown) {
                    RecruiterApp.core.vent.trigger('unBlockUI');

                    if (errorThrown.xhr.status == 415) {
                        RecruiterApp.core.vent.trigger('app:message:error',  RecruiterApp.polyglot.t('fileTypeNotSupported'));
                    } else {
                        RecruiterApp.core.vent.trigger('app:message:error',  RecruiterApp.polyglot.t('generateBrandedDocumentFail'));
                    }
                }
            });            
        }, 500);

    },
    removeTag: function(e) {
        var tagName = $(e.currentTarget).data("item-id");
        var tagText = $(e.currentTarget).text().replace('x ', '');
        this.trigger('documentList:tagList:delete', tagName, tagText);
    }
});

module.exports = BaseDocumentListView = Marionette.CompositeView.extend({
    template: require('../../templates/document/documentList.hbs'),
    itemView: BaseDocumentListItemView,
    itemViewContainer: '.documentListItems',
    onShow: function () { 
        this.initStupidTable();
    },
    onRender: function () { 
        this.initStupidTable();
    },
    initStupidTable: function () {
        $(function(){
            $("#document-list table").stupidtable();
        });
    }
});