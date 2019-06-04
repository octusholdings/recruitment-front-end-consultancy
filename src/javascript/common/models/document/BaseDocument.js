var Backbone = require('backbone');

const FileTypeMap = {
    PDF    : ['application/pdf'],
    IMAGE  : ['image/gif','image/x-icon','image/png','image/jpeg','image/svg+xml','image/tiff','image/webp'],
    OFFICE : [
    	'application/msword', // .doc, .dot
    	'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    	'application/vnd.openxmlformats-officedocument.wordprocessingml.template', // .dotx
    	'application/vnd.ms-word.document.macroEnabled.12', // .docm, .dotm
    	'application/vnd.ms-excel', // .xls, .xlt, .xla
    	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    	'application/vnd.openxmlformats-officedocument.spreadsheetml.template', // .xltx
    	'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
    	'application/vnd.ms-excel.template.macroEnabled.12', // .xltm
    	'application/vnd.ms-excel.addin.macroEnabled.12', // .xlam
    	'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // .xlsb
    	'application/vnd.ms-powerpoint' // .ppt, .pot, .pps, .ppa
    ]
};

module.exports = BaseDocument = Backbone.Model.extend({
	// Common function for Document models
	getFileType: contentType => {
		if (FileTypeMap.PDF.indexOf(contentType) > -1) {
			return 'pdf';

		} else if (FileTypeMap.IMAGE.indexOf(contentType) > -1) {
            return 'image';

        } else if (FileTypeMap.OFFICE.indexOf(contentType) > -1) {
            return 'office';

        } else 
            return undefined;
	}
});