var UserHotList 						= require('./models/UserHotList'),
_ = require('underscore'),
    KendoNewHotList                     = require('../common/views/KendoNewHotList'),
    PermissionHelper                    = require("../session/models/PermissionHelper"),
    moment                              = require('moment'),
	Backbone 							= require('backbone');

module.exports = UserHotListHelpers = Backbone.View.extend({
	TYPE: '',
	KENDO: false,
	/**
     * Load the saved hotList from backend will be appended to the menu
     * @param {String} type 'list' or 'editor'. If its "editor", the `create`,
     * `add`, `view`, `delete` and `share` will be available. If its "list",
     * none of the options will be available, it will simply list and upon click
     * will return the HotListID and contents. Default is 'editor'
     */
	LOAD_SAVED_HOTLIST: function (type) {
        if (_.isUndefined(type)) type = 'editor';
            
        var helper = this;
        var _menuData;

        RecruiterApp.core.vent.trigger('app:DEBUG:warn', ['UserHotListHelpers','LOAD_SAVED_HOTLIST. type: "' + type + '". Kendo: "' + helper.KENDO + '". ' + moment().format('h:mm:ss.SSS a')]);

		if (helper.KENDO) {
			_menuData = $("#menu").data('kendoMenu')
			_menuData.remove('.hotList')
		} else {
			_menuData = helper.SELF.$el.find('.hotlist-list')
			_menuData.html('')
		}

		var hotList = new UserHotList();
        var maxPerList = 10;

        hotList.type = helper.TYPE.toUpperCase();
        hotList.permissions = true
        hotList.fetch({
            success: function () {
                maxPerList = _.size(hotList.toJSON()) < maxPerList ? _.size(hotList.toJSON()) : maxPerList;

                if (!helper.KENDO && type != 'list') { 
                    _menuData.append('<li><a class="createHotList" href="#"><i class="fa fa-plus" aria-hidden="true"></i> <span class="glyphicon glyphicon-fire"></span> ' + RecruiterApp.polyglot.t("createAHotList") + '</a></li>')
                }

                for (var i = 0; i < _.size(hotList.toJSON()); i++) {
                	if (helper.KENDO) {
                    	_menuData.append(helper.NEW_HOTLIST_TEMPLATE(hotList.toJSON()[i].id, hotList.toJSON()[i].name, hotList.toJSON()[i].itemList, hotList.toJSON()[i].permissions, type), '.addToHotList')
                	} else {
                    	_menuData.append(helper.NEW_HOTLIST_TEMPLATE(hotList.toJSON()[i].id, hotList.toJSON()[i].name, hotList.toJSON()[i].itemList, hotList.toJSON()[i].permissions, type))
                	}
                }

                if (_.size(hotList.toJSON()) == 0 && type == 'list') {
                    let emptyHotListText = RecruiterApp.polyglot.t('youHaveNo' + helper.TYPE.slice(0, 1).toUpperCase() + helper.TYPE.slice(1).toLowerCase() + 'Hotlist');
                    
                    _menuData.prev('.btn').prop('disabled', true)
                    _menuData.prev('.btn').find('.add-from-hotlist-text').html(emptyHotListText)
                }

                helper.UPDATE_SAVED_HOTLIST_TOTAL('add')
                
                if (helper.KENDO) {
                    helper.HOTLIST_KENDO_EVENTS_LISTENER();
                }

                var permissionHelper = new PermissionHelper();
                permissionHelper.processView(helper.TYPE + 'Detail', helper.SELF);
            }
        })
	},
	/**
     * Template to be used by hotList to be added to menu
     * @param {String} id    correspond with listID in backend
     * @param {String} name  name of list
     * @param {Object} list  hotList list its self
     * @param {Object} perms permission object
     * @param {String} type  'list' or 'editor'. Default is 'editor'
     */
	NEW_HOTLIST_TEMPLATE: function (id, name, list, perms, type) {
		var helper = this;

		if (helper.KENDO) {
			return {
	            text: function () { 
                    var hlEl = "";
	                if (_.findWhere(perms, {target: localStorage['userName']}).permissions.indexOf('OWNER') > -1) {                
	                    hlEl += "<span class='hotListItem' data-opt='" + id + "'> <i class='fa fa-fw fa-user' aria-hidden='true'></i> <span class='truncated' title='" + name + "'>" + name + "</span></span>"
	                } else {
	                    hlEl += "<span class='hotListItem' data-opt='" + id + "'> <i class='fa fa-fw fa-users' aria-hidden='true'></i> <span class='truncated' title='" + name + "'>" + name + "</span></span>" 
	                }
                    
                    hlEl += '<span class="btn-group btn-group-xs">';
                    hlEl += "<span class='btn btn-default'><strong>" + list.length + "</strong></span>";

                    if (_.findWhere(perms, {target: localStorage['userName']}).permissions.indexOf('WRITE') > -1) {
                        hlEl += '<span class="btn btn-default appendToHotList"><i class="fa fa-fw fa-plus"></i></span>';
                    }

                    if (_.findWhere(perms, {target: localStorage['userName']}).permissions.indexOf('READ') > -1) {
                        hlEl += '<span class="btn btn-default manageHotList"><i class="fa fa-fw fa-pencil"></i></span>';
                    }

                    if (_.findWhere(perms, {target: localStorage['userName']}).permissions.indexOf('DELETE') > -1) {
                        hlEl += '<span class="btn btn-default deleteHotList"><i class="fa fa-fw fa-trash-o"></i></span>';
                    }

                    hlEl += '<span class="btn btn-default shareHotList"><i class="fa fa-fw fa-share"></i></span>';

                    hlEl += '</span>'
                    return hlEl;
	            }(),
	            encoded: false,
	            cssClass: "hotList " + id,
	        }
	    } else {
	   		return function () {
	            return '<li class="dropdown-submenu hotList-wrap" data-opt="' + id + '"><a>' + function () {
	                if (_.findWhere(perms, {target: localStorage['userName']}).permissions.indexOf('OWNER') > -1 ) {
	                    return '<i class="fa fa-fw fa-user" aria-hidden="true"></i> '
	                } else {
	                    return '<i class="fa fa-fw fa-users" aria-hidden="true"></i> '
	                }
	            }() + '<span class="name">' + name + '</span>' + ' <span class="badge badge-notify">' + list.length + '</span></a>' + function () {
                    var act = ''

                    if (type != 'list') {
                        act += '<ul class="dropdown-menu">';

                        if (_.findWhere(perms, {target: localStorage['userName']}).permissions.indexOf('WRITE') > -1) {
                            act += '<li><a class="appendToHotList" href="#">' + RecruiterApp.polyglot.t('add') + ' <i class="fa fa-plus"></i></a></li>'
                        }

                        if (_.findWhere(perms, {target: localStorage['userName']}).permissions.indexOf('READ') > -1) {
                            act += '<li><a class="manageHotList" href="#"> ' + RecruiterApp.polyglot.t('view') + ' <i class="fa fa-pencil"></i></a></li>'
                        }

                        if (_.findWhere(perms, {target: localStorage['userName']}).permissions.indexOf('DELETE') > -1) {
                            act += '<li><a class="deleteHotList" href="#">' + RecruiterApp.polyglot.t('delete') + ' <i class="fa fa-trash-o"></i></a></li>'
                        }

                        act += '<li><a class="shareHotList" href="#">' + RecruiterApp.polyglot.t('share') + ' <i class="fa fa-share-square-o"></i></a></li>'
                        act += '</ul>'
                    }
	                return act;
	            }() + '</li>'
	        }();
	    }
	},
    /**
     * View all hotList btn will open a modal to list out all the 
     */
    VIEW_ALL_LISTENER: function (allHotList) {
        var helper = this;
        var viewAllBtn = this.SELF.$el.find('.viewAllHotList');
        
        allHotList = _.map(allHotList, function(_hl){ return _hl });

        viewAllBtn.click(function() {
            var viewAllHotList = new KendoViewAllHotList({
                collection: new Backbone.Collection(allHotList),
                type: helper.TYPE
            })

            RecruiterApp.core.vent.trigger('app:modal:show', viewAllHotList)
        });
    },
    HOTLIST_KENDO_EVENTS_LISTENER: function () {
        var helper = this;
        var appendToHotList = helper.SELF.$el.find('.appendToHotList');
        var manageHotList   = helper.SELF.$el.find('.manageHotList');
        var deleteHotList   = helper.SELF.$el.find('.deleteHotList');
        var shareHotList    = helper.SELF.$el.find('.shareHotList');

        helper.SELF.events['click .appendToHotList']    = 'APPEND_TO_HOTLIST';
        helper.SELF.events['click .manageHotList']      = 'MANAGE_HOTLIST';
        helper.SELF.events['click .deleteHotList']      = 'DELETE_HOTLIST';
        helper.SELF.events['click .shareHotList']       = 'SHARE_HOTLIST';
        helper.SELF.delegateEvents()
    },
	/**
     * Update saved hotlist total of hotList in the kendoMenu
     * @param {String} state "add" or "remove" to control the styling
     */ 
	UPDATE_SAVED_HOTLIST_TOTAL: function (state) {
		var helper = this;
        var savedHotLists = helper.SELF.$el.find('#saved-hotLists');
        
        var hotList = new UserHotList();
        hotList.type = helper.TYPE.toUpperCase()
        hotList.fetch({
            success: function () {
                if (_.size(hotList.toJSON()) > 0) {
                    savedHotLists.html(_.size(hotList.toJSON()))

                    if (state) {
                        savedHotLists.addClass(state);

                        setTimeout(function () {
                            savedHotLists.removeClass(state);
                        }, 4000)
                    }
                } else {
                    savedHotLists.html('')
                }
            }
        })
	},
	/**
     * Create a hotList will be fired from the KendoGrid will open a modal
     * KendoNewHotList(). Model will gather user input name of hotList and upon
     * click "Save" will then trigger CREATE_NEW_HOTLIST
     */
	CREATE_HOT_LIST: function (scope) {
		var helper = this;
        var newHotListForm = new KendoNewHotList({
            model: new Backbone.Model()
        })

        newHotListForm.on('onCreateHotList', function (hotList) {
            helper.CREATE_NEW_HOTLIST(hotList, scope)
        })

        RecruiterApp.core.vent.trigger('app:modal:show', newHotListForm)
	},
	/**
     * The actual function that will create a new hotlist
     * @param {String} listName name of the hotList that is provided by
     * KendoNewHotList() modal
     */
	CREATE_NEW_HOTLIST: function (listName, scope) {
        var helper = this;

        var _menuData, _grid;
        if (helper.KENDO) {
        	_menuData = $("#menu").data('kendoMenu')
        	_grid = $("#grid").data('kendoGrid')
        } else {
        	_menuData = helper.SELF.$el.find('.hotlist-list')
        }
        
        var _newHotList = new UserHotList({name: listName, type: helper.TYPE.toUpperCase()});

        _newHotList.save(null, {
            success: function () {
                RecruiterApp.core.vent.trigger('app:message:success', RecruiterApp.polyglot.t("newHotListCreated") + " " + listName);

                var selItems;
                if (helper.KENDO) {
                	var selectedItems   = _grid.select();
	                selItems = _.uniq(_.map(selectedItems, function (item) {
	                    var selItem = _grid.dataItem(item)
	                    return selItem.id;
	                }))
                } else {
                    var recordId = helper.SELF.model.get('candidateId') || helper.SELF.model.get('id');
                	selItems = [recordId]
                }
                
                helper.ADD_TO_HOTLIST(_newHotList.id, selItems, scope)

                if (scope) {
                    RecruiterApp.core.vent.trigger('ga:send', { 
                        hitType: 'event', 
                        eventCategory: scope,
                        eventAction: 'CreateHotList',
                        eventLabel: 'Success'
                    });
                }
            }, 
            error: function () {
                if (scope) {
                    RecruiterApp.core.vent.trigger('ga:send', { 
                        hitType: 'event', 
                        eventCategory: scope,
                        eventAction: 'CreateHotList',
                        eventLabel: 'Fail'
                    });
                }
            }
        })
	},
	/**
     * Add to hotList
     * @param {Number} listID correspond with the backend
     * @param {Array} items  array of items to add to hotList
     */
	ADD_TO_HOTLIST: function (listID, items, scope) {  
		var helper = this,
            _addToHotList = new UserHotList({ id: listID })

        if (items.length == 0) {
            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("noRecordSelectedPleaseSelectRecordAddHotList"));
            return false;
        }

        _addToHotList.fetch({
            success: function () {
                var list = _addToHotList.toJSON().itemList;
                var notExisting = _.difference(items, list)
                var existing = _.intersection(items, list)

                if (existing.length > 0 && existing.length < items.length) {
                    RecruiterApp.core.vent.trigger('app:message:warning', RecruiterApp.polyglot.t("pleaseNoteRecordAlreadyExistHotList") + " " + existing.length);
                } else if (existing.length > 0 && existing.length == items.length) {
                    RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t("recordsAlreadyExistHotList") + " " + existing.length);
                    return false
                }

                _addToHotList.list = _.union(notExisting, list);
                _addToHotList.getItems = true
                _addToHotList.save({list: _.union(notExisting, list)}, {
                    success: function () {
                        helper.LOAD_SAVED_HOTLIST()
                        helper.UPDATE_SAVED_HOTLIST_TOTAL('add')
                        RecruiterApp.core.vent.trigger('app:message:info', notExisting.length + ' ' + RecruiterApp.polyglot.t("recordsAddedHotList"));

                        if (scope) {
                            RecruiterApp.core.vent.trigger('ga:send', { 
                                hitType: 'event', 
                                eventCategory: scope,
                                eventAction: 'AddToHotList',
                                eventLabel: 'Success'
                            });
                        }
                    },
                    error: function () {
                        if (scope) {
                            RecruiterApp.core.vent.trigger('ga:send', { 
                                hitType: 'event', 
                                eventCategory: scope,
                                eventAction: 'AddToHotList',
                                eventLabel: 'Fail'
                            });
                        }
                    }
                });
            }
        })
	},
	/**
     * Delete hotlist based on the listID provided
     * @param {String} listID listID will correspond with the backend
     */
	DELETE_HOTLIST: function (listID, scope) {
		var helper = this;
        var confirmDeleteView = new ConfirmDeleteView();

        RecruiterApp.core.vent.trigger('app:modal:show',confirmDeleteView);
        confirmDeleteView.on('deleteConfirmed', function() {
            _addToHotList = new UserHotList({ id: listID })
            _addToHotList.destroy({
                success: function () {
                    RecruiterApp.core.vent.trigger('app:modal:close');
                    RecruiterApp.core.vent.trigger('app:message:warning', RecruiterApp.polyglot.t("hostListDeleted"));
                    helper.LOAD_SAVED_HOTLIST();
                    helper.UPDATE_SAVED_HOTLIST_TOTAL('remove');

                    if (scope) {
                        RecruiterApp.core.vent.trigger('ga:send', { 
                            hitType: 'event', 
                            eventCategory: scope,
                            eventAction: 'DeleteHotList',
                            eventLabel: 'Success'
                        });
                    }
                }, 
                error: function () {
                    if (scope) {
                        RecruiterApp.core.vent.trigger('ga:send', { 
                            hitType: 'event', 
                            eventCategory: scope,
                            eventAction: 'DeleteHotList',
                            eventLabel: 'Fail'
                        });
                    }
                }
            })
        });
	},
	/**
     * Share hotList will give navigate to url
     * @param {Number} listID correspond with the backend
     */
	SHARE_HOTLIST: function (listID) {
		var helper = this;
        window.location.hash = "/userhotlist/detail/" + helper.TYPE.toLowerCase() + "/" + listID + "/share";
	},
	/**
     * Manage hotList will navigate to the hotList detail page
     * @param {Number} listID correspond with the backend
     */
	MANAGE_HOTLIST: function (listID) {
		var helper = this;
        window.location.hash = "/userhotlist/detail/" + helper.TYPE.toLowerCase() + "/" + listID;
	}
})