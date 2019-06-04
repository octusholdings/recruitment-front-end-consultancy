var Marionette                      = require('backbone.marionette'),
    stickit                         = require('backbone.stickit'),
    imageViewer                     = require('imageViewer'),
    // UserHotListDocumentRender       = require('../../userHotList/models/UserHotListDocumentRender'),
    BaseCompositeView               = require('../../common/views/BaseCompositeView'),
    // DocumentRender                  = require('../../candidateDashboard/document/DocumentRender'),
    Session                         = require('../../session/models/Session'),
    viewer;

module.exports = KendoDocumentsItemView = Marionette.ItemView.extend({
    tagName: 'a',
    className: 'document-item btn',
    template: require('../templates/kendoDocumentsItemView.hbs'),
    events: {
        'click' : 'previewThis'
    },
    setActive() {
        this.$el.addClass('btn-primary')
    },
    previewThis() {
        this.options.parent.previewByModel(this.model)
    }
});    

module.exports = KendoDocumentsView = BaseCompositeView.extend({
    template: require('../templates/kendoDocumentsModal.hbs'),
    itemView: KendoDocumentsItemView,
    itemViewContainer: '.documents-list ul',

    events: {
        'click .show-text'  : 'showText',
        'click .show-pdf'   : 'showPDF',
        'click .show-image' : 'showImage',
        'click .show-office': 'showOffice'
    },

    bindings: {
        '#document-text': {
            observe: 'fileContent',
            updateMethod: 'html'
        },
        'span.results .no': 'results',
        'span.fileName': 'fileName',
        '.tags': {
            observe: 'tagList',
            updateMethod: 'html',
            onGet (val) {
                if (val) {
                    return _.map(val, function(va) {
                        return '<span class="label label-default">' + RecruiterApp.polyglot.t(va) + '</span>'
                    }).join(' ');
                } else {
                    return '';
                }
            }
        },
    },

    itemViewOptions () { 
        return { parent: this }; 
    },

    onShow () {
        this.previewById();
    },

    onRender () {
        this.stickit();
    },

    previewById (id) {
        var documentModel = this.collection.find((col) => { return col.get('count') > 0});

        if (_.isUndefined(id) && _.isUndefined(documentModel)) {
            id = 0;            
            documentModel = this.collection.at(id);
        }

        this.previewDocument(documentModel);
    },

    previewByModel (model) {
        if (_.isUndefined(model)) {
            console.error('we have a undefined document model');
            return false;
        }

        this.previewDocument(model);
    },
    
    previewDocument (documentModel) {

        var documentView = this.children.findByModel(documentModel);

        if (_.isUndefined(documentView)) {
            console.error('we have a undefined document view');
            return false;
        }

        this.model.set({
            fileContent : documentModel.get('fileContent') || documentModel.get('content'),
            results     : documentModel.get('count'),
            fileName    : documentModel.get('displayName') || documentModel.get('fileName'),
            tagList     : documentModel.get('tagList'),
            documentId  : documentModel.get('id')
        });

        this.$el.find('.document-item').removeClass('btn-primary');
        
        documentView.setActive();
        this.toggleContentType(documentModel.get('displayName') || documentModel.get('fileName'));
    },

    toggleContentType (fileName) {

        if (_.isUndefined(fileName) || _.isNull(fileName)) {
            console.warn('DOCUMENT VIEW: default content type');
        } else {
            fileName = fileName.toLowerCase();
        }

        this.$el.find('.btn-content-type').removeClass('hidden');

        if (fileName.indexOf('.pdf') > -1) {
            this.$el.find('.show-image').addClass('hidden');
            this.$el.find('.show-office').addClass('hidden');
            this.showText();

        } else if (fileName.indexOf('.jpg') > -1 || fileName.indexOf('.jpeg') > -1 || fileName.indexOf('.gif') > -1 || fileName.indexOf('.ico') > -1 || fileName.indexOf('.png') > -1 || fileName.indexOf('.svg') > -1 || fileName.indexOf('.tiff') > -1) {
            this.$el.find('.show-text').addClass('hidden');
            this.$el.find('.show-pdf').addClass('hidden');
            this.$el.find('.show-office').addClass('hidden');
            this.showImage();

        } else if (fileName.indexOf('.doc') > -1 || fileName.indexOf('.dot') > -1 || fileName.indexOf('.docx') > -1 || fileName.indexOf('.dotx') > -1 || fileName.indexOf('.docm') > -1 || fileName.indexOf('.dotm') > -1 || fileName.indexOf('.xls') > -1 || fileName.indexOf('.xlt') > -1 || fileName.indexOf('.xla') > -1 || fileName.indexOf('.xlsx') > -1 || fileName.indexOf('.xltx') > -1 || fileName.indexOf('.ppt') > -1 || fileName.indexOf('.pptx') > -1) {
            this.$el.find('.show-image').addClass('hidden');
            this.$el.find('.show-pdf').addClass('hidden');
            this.showText();

        } else {
            this.$el.find('.show-image').addClass('hidden');
            this.$el.find('.show-pdf').addClass('hidden');
            this.$el.find('.show-office').addClass('hidden');
            this.showText();
        }
    },
    showText: function(e) {
        this.loadTextOnly();
        this.toggleTabs('TEXT-ONLY');
    },
    showPDF: function(e) {
        this.loadFilePreview('PDF');
        this.toggleTabs('PDF');
    },
    showImage: function(e) {
        this.loadImage();
        this.toggleTabs('IMAGE');
    },
    showOffice: function(e) {
        this.loadFilePreview();
        this.toggleTabs('OFFICE');
    },
    loadTextOnly: function() {
        this.$el.find('.document-content > div').addClass('hidden')
        this.$el.find('#document-text').removeClass('hidden');
    },
    loadFilePreview: function(tabName) {
        var self = this;

        var session = new Session();
        var url = RecruiterApp.config.API_ROOT + '/document/' + self.model.get('documentId') + '/preview';

        if (tabName == 'PDF') {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
            xhr.onload = function(e) {
                if (this.status == 200) {
                    var type = xhr.getResponseHeader('Content-Type');
                    var blob = new Blob([this.response], {type: type});
                    var fileUrl = URL.createObjectURL(blob); 
                    var html = '<iframe src="' + fileUrl + '" width="100%" height="450" allowfullscreen webkitallowfullscreen></iframe>';
                    self.$el.find('#document-pdf').html(html);

                } else {
                    RecruiterApp.core.vent.trigger('unBlockUI');
                    RecruiterApp.core.vent.trigger('app:message:error', 'Unable to render document');
                }
            };
            xhr.send(JSON.stringify(self.model.attributes));

        } else {
            var html = '<iframe src="https://docs.google.com/gview?url=' + url + '?X-Auth-Token=' + encodeURIComponent(session.get('authToken')) + '&embedded=true" width="100%" height="450" allowfullscreen webkitallowfullscreen></iframe>';
            self.$el.find('#document-office').html(html);
        }

    },
    loadImage: function() {
        var self = this;

        var session = new Session();
        var url = RecruiterApp.config.API_ROOT + '/document/' + self.model.get('documentId') + '/preview';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
        xhr.onload = function(e) {
            if (this.status == 200) {
                var type = xhr.getResponseHeader('Content-Type');
                var blob = new Blob([this.response], {type: type});
                var fileUrl = URL.createObjectURL(blob);

                var html = 
                    '<p><b>' + RecruiterApp.polyglot.t('mouseWheelOrPinchToZoomOnImage') + '</b></p>' +
                    '<img src="' + fileUrl + '" data-high-res-src="' + fileUrl + '" width="100%" alt="Document preview" />'

                if (!_.isNull(viewer) && !_.isUndefined(viewer)) {
                    viewer.destroy();
                }

                self.$el.find('#document-image').html(html);
                viewer = ImageViewer('#document-image img');

            } else {
                RecruiterApp.core.vent.trigger('unBlockUI');
                RecruiterApp.core.vent.trigger('app:message:error', 'Unable to render document');
            }
        };
        xhr.send(JSON.stringify(self.model.attributes));
    },
    toggleTabs: function(tabName) {
        
        this.$el.find('.btn-content-type').removeClass('active');
        this.$el.find('.document-content > div').addClass('hidden')

        switch(tabName) {
            case 'TEXT-ONLY':
                this.$el.find('.show-text').addClass('active');
                this.$el.find('#document-text').removeClass('hidden');
                break;

            case 'PDF':
                this.$el.find('.show-pdf').addClass('active');
                this.$el.find('#document-pdf').removeClass('hidden');
                break;

            case 'IMAGE':
                this.$el.find('.show-image').addClass('active');
                this.$el.find('#document-image').removeClass('hidden');
                break;

            case 'OFFICE':
                this.$el.find('.show-office').addClass('active');
                this.$el.find('#document-office').removeClass('hidden');

                break;

            default:
                this.$el.find('.show-text').addClass('active');
                RecruiterApp.core.vent.trigger('unBlockUI');
                RecruiterApp.core.vent.trigger('app:message:error', 'Unable to render document');

                break;
        }
    }
});