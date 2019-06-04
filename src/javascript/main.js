var Backbone                   = require('backbone');
var Marionette                 = require('backbone.marionette')
Backbone.$                     = require('jquery');

var _ = require('underscore');
require('backbone.validation');
require('jquery');
require('bootstrap');
require('bootstrap-select');
require('backbone.stickit');
require('select2');

var moment                     = require('moment');
var Spinner                    = require('spin');
var Session                    = require('./session/models/Session');
var RecruiterApp               = require('./RecruiterApp');
var recruiterApp               = new RecruiterApp();

window.Octus                   = {};
window.Octus.TS_FORMAT         = 'DD/MM/YYYY HH:mm';
window.Octus.KENDO_TS_FORMAT   = 'dd/MM/yyyy HH:mm';
window.Octus.KENDO_DATE_FORMAT = 'dd/MM/yyyy';
window.Octus.DATE_FORMAT       = 'DD/MM/YYYY';
window.Octus.ISO_DATE_FORMAT   = 'YYYY-MM-DD';
window.Octus.ISO_TS_FORMAT     = 'YYYY-MM-DDTHH:mm:ss.SSS';
window.Octus.GRIDSTACK         = {
    cellHeight: 40,
    animate: true,
    draggable: true,
    verticalMargin: 10,
    resizable: {
        handles: 'e, se, s, sw, w'
    }
}
window.Octus.GRIDSTACK_JOB       = '[{"x":0,"y":0,"width":4,"height":16},{"x":4,"y":10,"width":8,"height":6},{"x":4,"y":0,"width":8,"height":10},{"x":0,"y":16,"width":12,"height":5},{"x":0,"y":21,"width":12,"height":5},{"x":0,"y":26,"width":6,"height":4},{"x":6,"y":26,"width":6,"height":4},{"x":0,"y":30,"width":12,"height":4},{"x":0,"y":34,"width":12,"height":9}]';
window.Octus.GRIDSTACK_HOME      = '[{"x":0,"y":18,"width":12,"height":7},{"x":0,"y":9,"width":7,"height":9},{"x":7,"y":0,"width":5,"height":9},{"x":7,"y":9,"width":5,"height":9},{"x":0,"y":0,"width":7,"height":9}]';
window.Octus.GRIDSTACK_CANDIDATE = '[{"x":0,"y":0,"width":4,"height":12},{"x":4,"y":0,"width":4,"height":6},{"x":0,"y":19,"width":12,"height":9},{"x":0,"y":28,"width":12,"height":5},{"x":0,"y":33,"width":12,"height":5},{"x":0,"y":38,"width":12,"height":4},{"x":0,"y":12,"width":12,"height":7},{"x":4,"y":6,"width":4,"height":6},{"x":8,"y":0,"width":4,"height":12}]';
window.Octus.GRIDSTACK_COMPANY   = '[{"x":0,"y":0,"width":4,"height":8},{"x":4,"y":0,"width":8,"height":8},{"x":0,"y":8,"width":12,"height":9},{"x":0,"y":17,"width":12,"height":7},{"x":0,"y":24,"width":12,"height":8},{"x":0,"y":32,"width":12,"height":7}]';
window.Octus.GRIDSTACK_CLIENT    = '[{"x":0,"y":0,"width":3,"height":8},{"x":0,"y":8,"width":12,"height":8},{"x":0,"y":16,"width":12,"height":7},{"x":8,"y":0,"width":4,"height":8},{"x":3,"y":0,"width":5,"height":8}]';

window.Octus.KENDO_EDITOR_DEFAULT_TOOLS = [
    "bold", "italic", "underline", "insertUnorderedList", "insertOrderedList", "createLink", "unlink", "cleanFormatting"
];

window.Octus.KENDO_EDITOR_PASTE_CLEANUP = {
    css: "true",
    keepNewLines: true,
    msAllFormatting: true,
    msConvertLists: true,
    msTags: true,
    span: true
};

var CheckPermissionBehavior = require('./session/behaviors/CheckPermissionBehavior');

var session     = new Session();
var proxiedSync = Backbone.sync;

// Backbone.sync = function(method, model, options) {
//     options || (options = {});

//     if (!options.crossDomain) {
//         options.crossDomain = true;
//     }

//     if (!options.xhrFields) {
//         options.xhrFields = {withCredentials:true};
//     }

//     return proxiedSync(method, model, options);
// };

jQuery.fn.removeAttributes = function() {
    return this.each(function() {
        var attributes = $.map(this.attributes, function(item) {
            return item.name;
        });
        var img = $(this);
        $.each(attributes, function(i, item) {
            img.removeAttr(item);
        });
    });
}

// Not included: "DOCTYPE", "br", "pre"
// var htmlTagList = [
//     "a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","blockquote","body","button","canvas","caption","cite","code","col","colgroup","command","datalist","dd","del","details","dfn","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","iframe","img","input","ins","p","ol","li","ul","span","table","tr","td","tbody","thead","label","textarea","pre","kbd","keygen","legend","link","map","mark","menu","meta","meter","nav","noscript","object","optgroup","option","output","param","progress","q","rp","rt","ruby","s","samp","script","section","select","small","source","strong","style","sub","summary","sup","tfoot","th","time","title","track","u","var","video","wbr","xml"
// ];
// var htmlTagEmptyList    = _.map(htmlTagList, function(tag) { return tag + ':empty'; });
// var htmlTagHasBrList    = _.map(htmlTagList, function(tag) { return tag + ':has(>br)'; });
// var htmlTagListStr      = htmlTagList.toString();
// var htmlTagEmptyListStr = htmlTagEmptyList.toString();
// var htmlTagHasBrListStr = htmlTagHasBrList.toString();

var BASE = {
    baseFn: {
        /*  Cleans the value from copy paste
            Used together with KendoEditor
            Fired when when user copy+paste into KendoEditor
            e: string = equire the response */
        // CLEAN_PASTE: function (e) {
        //     e = e.replace(/(?:\r\n|\r|\n)/g, '<br />'); // replace \n with <br />

        //     var htmlPaste   = '';
        //     var _div        = $('<div>');
        //         _div.html(e);

        //     var comments = new RegExp(
        //         '<!--[\\s\\S]*?(?:-->)?' // A html comment
        //         + '<!---+>?'  // A comment with no body
        //         + '|<!(?![dD][oO][cC][tT][yY][pP][eE]|\\[CDATA\\[)[^>]*>?' // CDATA
        //         + '|<[?][^>]*>?',  // A pseudo-comment
        //         'g');
            
        //     _div.find(htmlTagListStr).removeAttributes();

        //     // remove empty tags
        //     _div.find(htmlTagEmptyListStr).remove();
        //     // remove tags with just a BR
        //     _div.find(htmlTagHasBrListStr).filter(function() { 
        //         return !this.textContent.trim() && !$('br', this).siblings(':not(br)').length; 
        //     }).remove();

        //     _div.find('font').unwrap();
        //     _div.find('pre').wrapInner('<span>').find('span').unwrap();
        //     _div.find('span').contents().unwrap();

        //     _div.find('table tr td').children().unwrap().unwrap().unwrap().unwrap(); // clean out table and try to retain the content
            
        //     htmlPaste = _div.html()

        //     // remove comments
        //     htmlPaste = htmlPaste.replace(comments, "");
            
        //     // remove none breaking space
        //     htmlPaste = htmlPaste.replace(/&nbsp;/g, '');

        //     // remove xml
        //     _div.html(htmlPaste);

        //     // remove style tags
        //     _div.find('style').remove();

        //     // remove empty tags one more time
        //     _div.find(htmlTagEmptyListStr).remove();
        //     // remove tags with just a BR one more time
        //     _div.find(htmlTagHasBrListStr).filter(function() { 
        //         return !this.textContent.trim() && !$('br', this).siblings(':not(br)').length; 
        //     }).remove();

        //     htmlPaste = _div.html();

        //     // remove Microsoft Office HTML paragraph element
        //     var ms = new RegExp('o:p>', 'g');
        //     htmlPaste = htmlPaste.replace(ms, "p>");
            
        //     console.warn("Pasted:", htmlPaste);
        //     return htmlPaste;
        // },
        SHOW_REQUIRED: function (e) {
            e.find('h4.title').append('<span class="requiredInput">*</span>')  
        },
        NUMBERS_ONLY: function (e) {
            if (e.type == "keypress") {
                // Numbers + dashes
                var charCode = (e.which) ? e.which : event.keyCode;
                if (charCode != 46 && charCode != 45 && charCode > 31 && (charCode < 48 || charCode > 57))
                    return false;

                return true;
            } else if (e.type == "keyup") {
                _.defer(function(){ 
                    var value = $(e.currentTarget).val();
                    var nonNum = value.match(/[^0-9 \-]/g);

                    if (nonNum && nonNum.length > 0) {
                        alert('Only numbers are allowed');
                        value = value.replace(/[^0-9 \-]/g, ''); // strip out all non numbers
                        value = value.replace(/\s\s+/g, ' '); // condensed multiple spaces into 1 space
                        $(e.currentTarget).val(value);
                        $(e.currentTarget).trigger('change');
                    }
                });
            }
            
        },
        EDITABLE: function (e, view) {
            var $el         = $(e.currentTarget).parent(),
                type        = $el.attr('data-type')
                value       = $el.attr('data-value')
                key         = $el.attr('data-key'),
                oriHTML     = $el.html(),
                isGrid      = view.KENDO_GRID_BUILT;

            var inputHTML =     '<div class="input-group">'

            if (type == 'text') {
                inputHTML +=        '<input class="form-control" type="text" value="' + value + '">'
            } else if (type == 'select') {
                var refData = window.Octus[$el.attr('data-option')]; 
                
                if (_.isNull(refData) || _.isUndefined(refData) || _.isEmpty(refData)) {
                    console.error('Error with refData', refData, 'null, undefined or empty');
                }

                var option       = refData.toJSON();
                var sel_ed       = '';
                var nonRefDatVal = false;

                inputHTML +=        '<select class="form-control">'
                _.each(option, function(op) {
                    sel_ed = op.key == key || op.value == key || op.key == value || op.value == value || op.value.indexOf(key) != -1 ? 'selected="true"' : '';
                    if (_.isEmpty(sel_ed)) {
                        nonRefDatVal = true;
                    }
                    inputHTML +=        `<option value="${op.key}" ${sel_ed}>${op.value}</option>`;
                });

                if (nonRefDatVal) {
                    inputHTML +=        `<option value="${key}" selected="true" disabled="disabled">${value}</option>`;
                }
                
                inputHTML +=        '</select>';
            } else if (type == 'number') {
                inputHTML +=        `<input type="number" class="form-control" value="${value}"></input>`;
            } else if (type == 'date') {
                inputHTML +=        `<input class="datepicker form-control" type="text" value="${value}"/>`;
            }

            inputHTML +=    `<span class="input-group-btn editting">
                                <button class="btn btn-default btn-yes" type="button"><span class="glyphicon glyphicon-ok"></span></button><button class="btn btn-default btn-no" type="button"><span class="glyphicon glyphicon-remove"></span></button>
                            </span>
                        </div>`;
            
            var classVal    = $el.attr('data-class')      
            var inputEl     = $(inputHTML);
            
            inputEl.find('input.form-control').val(value)
            inputEl.addClass(classVal)

            $el.html(inputEl);
            $el.data('oriHTML', oriHTML);

            if (!isGrid) {
                view.events['click .btn-yes'] = 'setNewValue';
                view.events['click .btn-no']  = 'revertOldValue';
                view.delegateEvents();
            }
        },
        REDUCE_FUNCTION: function () {
            var deviceAgent     = navigator.userAgent.toLowerCase();
            var windowsize      = $(window).width();

            // 1) Mobile Screen + Touch        = Reduced Func
            // 2) Desktop Screen + Touch       = MS Surface, Lenovo Yoga, Tablet. Show as much as we can
            // 3) Desktop Screen + No Touch    = No reduced func
            // 4) Mobile Screen + No Touch     = Viewing on desktop but smaller screen. No reduced func

            // $('html').hasClass('touch') || 
            var touchEnabled = deviceAgent.match(/(iphone|ipod|ipad|android|iemobile|blackberry|bada)/) || $('html').hasClass('touch');

            if (windowsize < 768 && touchEnabled) { // 1)
                return {
                    mobileScreen: true,
                    touch: true
                }
            } else if (windowsize >= 768 && touchEnabled) { // 2)
                return {
                    mobileScreen: false,
                    touch: true
                }
            } else if (windowsize >= 768 && !touchEnabled) { // 3)
                return {
                    mobileScreen: false,
                    touch: false
                }
            } else if (windowsize < 768 && !touchEnabled) { // 4)
                return {
                    mobileScreen: true,
                    touch: false
                }
            } else {
                RecruiterApp.core.vent.trigger('app:error',["Unknown Device","Device not recognise. Revert to default"]);
                return {
                    mobileScreen: false,
                    touch: false
                }
            }
        },
        CONVERT_ARRAY_TO_MOMENT: function(array) {
    
            var m = moment();

            if (!array) {
                
                // if is null or undefined returns moment object empty
                return m;
            } else if (!(array instanceof Array)) {

                // if it is no a array, try to create moment with the value
                return moment(array);

            } else if (array.length == 5) {

                // parse with date time
                m.year(array[0]);
                m.month(array[1] - 1); 
                m.date(array[2]);
                m.hour(array[3]); 
                m.minute(array[4]);

            } else if (array.length == 3) {

                // parse with date
                m.year(array[0]);
                m.month(array[1] - 1); 
                m.date(array[2]);
            } else if (array.length >= 6) {

                m.year(array[0]);
                m.month(array[1] - 1); 
                m.date(array[2]);
                m.hour(array[3]); 
                m.minute(array[4]);
                m.second(array[5]);
            }

            return m;
        },

        EXTRACT_NUMBER: function(value) {
            if (value && typeof value === 'string') {
                value = value.replace(/[^0-9 \-]/g, '');
                value = value.replace(/\s\s+/g, ' ');
            }
            return value;
        }
    }
}

function make_base_auth(user, password) {
    var tok  = user + ':' + password;
    var hash = btoa(tok);
    return "Basic " + hash;
}

//fancy random token, losely after https://gist.github.com/jed/982883
function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e16]+1e16).replace(/[01]/g,b)};

_.extend(Backbone.Model.prototype, Backbone.Validation.mixin);

_.extend(Backbone.Validation.callbacks, {
    valid: function (view, attr, selector) {
        //console.log("View", view);
        //console.log("Attr", attr);
        var $el = view.$('[name=' + attr + ']'),
            $group = $el.closest('.form-group');

        $group.removeClass('has-error');
        $group.find('.help-block').html('').addClass('hidden');
    },
    invalid: function (view, attr, error, selector) {
        //console.log("View", view);
        //console.log("Attr: "+ attr);
        var $el = view.$('[name=' + attr + ']'),
            $group = $el.closest('.form-group');

        $group.addClass('has-error');
        $group.find('.help-block').html(error).removeClass('hidden');
    }
});

_.extend(Marionette.CompositeView.prototype, BASE);
_.extend(Marionette.ItemView.prototype, BASE);
_.extend(Marionette.Layout.prototype, BASE);

Backbone.Stickit.addHandler({
    selector: 'select.selectpicker',
    initialize: function($el, val, model, options) {
        $el.selectpicker();
    }
});

Backbone.Stickit.addHandler({
    selector: 'select.select2',
    initialize: function($el, val, model, options) {
        $el.select2();
    }
});

window.Octus.Behaviors = {};
Backbone.Marionette.Behaviors.behaviorsLookup = function() {
    return window.Octus.Behaviors;
};

window.Octus.Behaviors.CheckPermissions = CheckPermissionBehavior;

// Label Priorities:
// - translation from reference data
// - value from reference data
// - polyglot.t translation
// - key
RecruiterApp.dictionary = {
    t: function (_key) {
        if (_.isNull(_key)) {
            return _key;
        }

        var refData     = _.findWhere(window.Octus.dictionary, {key: _key}),
            returnLabel = "";

        if (refData) {
            return refData.label;
        } else if (!_.isUndefined(_key)) {
            return RecruiterApp.dictionary.polyglot.t(_key);
        } else {
            return "";
        }
    },
    k: function (_translate) {
        var _k = _.findKey(RecruiterApp.dictionary.polyglot.phrases, function (val, key) {
            if (val == _translate) return key;
        });
        if (_k) {
            return _k;
        } else {
            RecruiterApp.core.vent.trigger('app:DEBUG:warn', ['POLYGLOT','No key for translation: ' + _translate])
            return "";
        }
    },
    has: function (_label) {
        var refData     = _.size(_.findWhere(window.Octus.dictionary, {label: _label}));
        var polyglot    = RecruiterApp.dictionary.polyglot.has(_label);

        if (refData || polyglot) {
            return true;
        } else {
            return false;
        }
    }
}

recruiterApp.start();