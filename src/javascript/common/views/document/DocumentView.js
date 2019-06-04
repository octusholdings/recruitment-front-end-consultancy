/*
 * DocumentView
 */
var Marionette = require('backbone.marionette'),
    stickit    = require('backbone.stickit'),
    Session    = require('../../../session/models/Session'),
    imageViewer = require('imageViewer'),
    viewer, emptyMessage;

module.exports = DocumentView = Marionette.ItemView.extend({
    template: require('../../templates/document/documentView.hbs'),
    events: {
        'click .show-text'  : 'showText',
        'click .show-pdf'   : 'showPDF',
        'click .show-image' : 'showImage',
        'click .show-office': 'showOffice',
        'click .download'   : 'download'
    },
    bindings: {
        '.document-display-name': {
            observe: 'displayName',
            onGet(displayName) {
                return (displayName ? displayName : this.model.get('fileName'));
            }
        }
    },
    onRender: function() {
        this.stickit();
    },
    onShow: function() {
        emptyMessage = `<p>${RecruiterApp.polyglot.t('noPreviewAvailable')}</p>`;

        let contentType = this.model.attributes.contentType;
            contentType = this.model.getFileType(contentType);

        if (!_.isNull(contentType) && !_.isUndefined(contentType)) {
            $('#document-viewer').attr('class', `section-content cvLimitContent ${contentType}`);
            this.toggleTabs(contentType);

        } else {
            this.toggleTabs();
        }
    },
    showText: function() {
        this.toggleTabs('text');
    },
    showPDF: function() {
        this.toggleTabs('pdf');
    },
    showImage: function() {
        this.toggleTabs('image');
    },
    showOffice: function() {
        this.toggleTabs('office');
    },
    download() {
        var session = new Session();
        window.open(RecruiterApp.config.API_ROOT + '/document/' + this.model.id + "/download?ticket=" + encodeURIComponent(session.get('authToken')));
    },
    loadTextOnly: function() {
        let self = this;
        let documentRender = new DocumentRender({ id: self.model.get('id') });
        documentRender.fetch({ success: () => {
            let contents = documentRender.attributes.content ? documentRender.attributes.content : emptyMessage;
            self.$el.find('.cvContent').html(contents);

            // Handle empty text contents for certain images
            let htmlBody = self.$el.find('.cvContent');
            if (_.isEmpty(htmlBody.text().trim())) {
                self.$el.find('.cvContent').html(emptyMessage);
            }
        }});
    },
    loadFilePreview: function(tabName) {
        let self = this;

        let session = new Session();
        let url = `${RecruiterApp.config.API_ROOT}/document/${self.model.id}/preview`;

        if (tabName == 'pdf') {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
            xhr.onload = function(e) {
                if (this.status == 200) {
                    let type = xhr.getResponseHeader('Content-Type');
                    let blob = new Blob([this.response], {type: type});
                    let fileUrl = URL.createObjectURL(blob); 
                    let html = `<iframe src="${fileUrl}" width="100%" height="450" allowfullscreen webkitallowfullscreen></iframe>`;
                    self.$el.find('.cvContent').html(html);

                } else {
                    RecruiterApp.core.vent.trigger('unBlockUI');
                    RecruiterApp.core.vent.trigger('app:message:error', 'Unable to render document');
                }
            };
            xhr.send(JSON.stringify(self.model.attributes));

        } else {
            let html = `<iframe src="https://docs.google.com/gview?url=${url}?X-Auth-Token=${encodeURIComponent(session.get('authToken'))}&embedded=true" width="100%" height="450" allowfullscreen webkitallowfullscreen></iframe>`;
            _.defer(() => self.$el.find('.cvContent').html(html));
        }
    },
    loadImage: function() {
        var self = this;

        let session = new Session();
        let url = `${RecruiterApp.config.API_ROOT}/document/${self.model.id}/preview`;

        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
        xhr.onload = function(e) {
            if (this.status == 200) {
                let type = xhr.getResponseHeader('Content-Type');
                let blob = new Blob([this.response], {type: type});
                let fileUrl = URL.createObjectURL(blob);

                let html = 
                    `<p><b>${RecruiterApp.polyglot.t('mouseWheelOrPinchToZoomOnImage')}</b></p>
                    <img src="${fileUrl}" data-high-res-src="${fileUrl}" width="100%" alt="Document preview" />`

                if (!_.isNull(viewer) && !_.isUndefined(viewer)) {
                    viewer.destroy();
                }

                self.$el.find('.cvContent').html(html);
                viewer = ImageViewer('.cvContent img');

            } else {
                RecruiterApp.core.vent.trigger('unBlockUI');
                RecruiterApp.core.vent.trigger('app:message:error', 'Unable to render document');
            }
        };
        xhr.send(JSON.stringify(self.model.attributes));
    },
    toggleTabs: function(tabName) {
        $('#document-viewer button').removeClass('active');
        switch (tabName) {
            case 'pdf':
                this.$('.show-pdf').addClass('active');
                this.loadFilePreview(tabName);
                break;

            case 'image':
                this.$('.show-image').addClass('active');
                this.loadImage();
                break;

            case 'office':
                this.$('.show-office').addClass('active');
                this.loadFilePreview();
                break;

            case 'text':
                this.$('.show-text').addClass('active');
                this.loadTextOnly();
                break;

            default:
                this.$('.show-text').addClass('active');
                $('#document-viewer').attr('class', `section-content cvLimitContent`);
                this.$el.find('.cvContent').html(emptyMessage);
                break;
        }
    }
});