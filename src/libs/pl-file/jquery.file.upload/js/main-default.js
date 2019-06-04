/*
 * jQuery File Upload Plugin JS Example 7.1.1
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint nomen: true, unparam: true, regexp: true */
/*global $, window, document */

$(function () {
        'use strict';

        // Initialize the jQuery File Upload widget:
        $('#fileupload').fileupload({
                // Uncomment the following to send cross-domain cookies:
                //xhrFields: {withCredentials: true},
            url: 'upload/php/'
        });

        // Enable iframe cross-domain access via redirect option:
        $('#fileupload').fileupload(
                'option',
                'redirect',
        window.location.href.replace(
                /\/[^\/]*$/,
                '/cors/result.html?%s'));

        // Demo settings:
        $('#fileupload').fileupload('option', {
            url: 'upload/php/',
                maxFileSize: 5000000,
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
                process: [{
                        action: 'load',
                        fileTypes: /^image\/(gif|jpeg|png)$/,
                        maxFileSize: 5000000 // 5MB
                }, {
                        action: 'resize',
                        maxWidth: 900,
                        maxHeight: 480
                }, {
                        action: 'save'
                }]
        });

        // Upload server status check for browsers with CORS support:
        if($.support.cors) {
                $.ajax({
                    url: 'upload/php/',
                    type: 'HEAD'
                }).fail(function () {
                        $('<span class="alert alert-error"/>')
                                .text('Upload server currently unavailable - ' +
                                    new Date())
                                .appendTo('#fileupload');
                });
        }
    
        // Load existing files:
        $('#fileupload').addClass('fileupload-processing');
        $.ajax({
                // Uncomment the following to send cross-domain cookies:
                //xhrFields: {withCredentials: true},
                url: $('#fileupload').fileupload('option', 'url'),
                dataType: 'json',
                context: $('#fileupload')[0]
        }).always(function (result) {
            $(this).removeClass('fileupload-processing');
        }).done(function (result) {
            $(this).fileupload('option', 'done')
                .call(this, null, { result: result });
        });

});
