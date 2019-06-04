var Backbone = require('backbone'),
    _       = require('underscore'),
    CurrentUser = require('../../common/models/CurrentUser');
    
module.exports = Session = Backbone.Model.extend({
    url: function () {
            return RecruiterApp.config.API_ROOT + '/session';
    },
    initialize: function(options) {
        var self = this;
        // self.set('redirectFrom', options.redirectFrom);
        $.ajaxSetup({
            headers: {
                'X-CSRF-Token' : self.csrf
            }
        });
        // check for localStorage support
        if (Storage && localStorage) {
            this.supportStorage = true;
            //localStorage.removeItem("permissions");
        }
    },
    get : function(key) {
        if (this.supportStorage) {
            var data = localStorage.getItem(key);
            if (data && data[0] === '{') {
                return JSON.parse(data);
            } else {
                return data;
            }
        } else {
            return Backbone.Model.prototype.get.call(this, key);
        }
    },
    set : function(key, value) {
        if (this.supportStorage) {
            localStorage.setItem(key, value);
        } else {
            Backbone.Model.prototype.set.call(this, key, value);
        }
        return this;
    },
    unset: function(key) {
        if (this.supportStorage) {
            localStorage.removeItem(key);
        } else {
            Backbone.Model.prototype.unset.call(this, key);
        }
        return this;
    },
    clear: function() {
        if (this.supportStorage) {
            localStorage.clear();
        } else {
            Backbone.Model.prototype.clear(this);
        }
    },
    resetLocalPerm: function (view) {
        var self = this;
        if (view.indexOf('Grid') != -1) {
            if (view.indexOf('candidate') != -1) {
                console.warn('Change in candidateGridView permission. Clearing candidateGridView localStorage')
                self.unset('candidateGridOpt')
                    .unset('candidateGridSaved')
                    .unset('candidateCurrentPage')
                    .unset('candidateFilter')
                    .unset('candidateMenu')
                    .unset('candidateSearchCriteria');
            } else if (view.indexOf('client') != -1) {
                console.warn('Change in clientGridView permission. Clearing clientGridView localStorage')
                self.unset('clientGridOpt')
                    .unset('clientGridSaved')
                    .unset('clientCurrentPage')
                    .unset('clientFilter')
                    .unset('clientMenu')
                    .unset('clientSearchCriteria');
            } else if (view.indexOf('company') != -1) {
                console.warn('Change in companyGridView permission. Clearing companyGridView localStorage')
                self.unset('companyGridOpt')
                    .unset('companyGridSaved')
                    .unset('companyCurrentPage')
                    .unset('companyFilter')
                    .unset('companyMenu')
                    .unset('companySearchCriteria');
            } else if (view.indexOf('job') != -1) {
                console.warn('Change in jobGridView permission. Clearing jobGridView localStorage')
                self.unset('jobGridOpt')
                    .unset('jobGridSaved')
                    .unset('jobCurrentPage')
                    .unset('jobFilter')
                    .unset('jobMenu')
                    .unset('jobSearchCriteria');
            }
        }
    },
    login: function(username, password, url, debug) {
        var self = this;
        var login = $.ajax({
            url : RecruiterApp.config.API_ROOT + '/authenticate',
            contentType: "application/json",
            type: 'POST',
            beforeSend: function (request) {
                request.setRequestHeader("X-Auth-Username", username);
                request.setRequestHeader("X-Auth-Password", password);
            }
        });
        login.done(function(data, textStatus, jqXHR) {
            self.set('authenticated', true);
            self.set('authToken', data.token);
            var currentUser = new CurrentUser();
            currentUser.fetch({ success: function() {
                var  settings = currentUser.get('settings');
                settings.forEach(function(setting) {
                    console.log("Setting key=" + setting.get('key') + " value=" + setting.get('value'));
                    self.set(setting.get('key'), setting.get('value'));
                });
                self.set('id', currentUser.get('id'));
                self.set('fullName', currentUser.get('fullName'));
                //self.set('profilePicture', currentUser.get('profilePicture'));
                // self.set('mainRole', currentUser.get('mainRole'));
                self.set('userName', currentUser.get('username'));
                self.set('language', currentUser.get('language'));
                _.each(self.get('viewPermissionList'), function(permsView, id) {
                    var view;
                    if (!currentUser.get('viewPermissionList')[id]) {
                        console.error('Permission for view: ' + id + ' is not present /n skipping view "' + id + '". Please check that you have the permissions for this view');
                    } else {
                        // there is difference in viewPermssionsList lengths between local and remote
                        if (permsView.length != currentUser.get('viewPermissionList')[id].length) {
                            console.warn('Change in ' + id + ' permssion length')
                            self.resetLocalPerm(id)
                        // there is no difference in viewPermisionsList between local and remote, check inner permissions
                        } else {
                            var changedPerms = _.filter(permsView, function(perm) {

                                var _perm = _.find(currentUser.get('viewPermissionList')[id], {fieldName: perm.fieldName, roleId: perm.roleId});

                                // test difference between each permission
                                if (_perm && (perm.read != _perm.read || perm.write != _perm.write || perm.delete != _perm.delete || perm.selector != _perm.selector)) {
                                    view = perm.viewName
                                    return perm
                                }
                            });

                            if (changedPerms.length > 0) self.resetLocalPerm(view)
                        }
                    }
                });

                self.set('permissions', JSON.stringify(currentUser.get('permissions')));
                self.set('viewPermissionList', JSON.stringify(currentUser.get('viewPermissionList')));

                var roleList = currentUser.get('roleList');

                self.set('roleList', JSON.stringify(roleList));

                if (self.get('redirectFrom')) {
                    var path = self.get('redirectFrom');
                    self.unset('redirectForm');
                    Backbone.history.navigate(path, { trigger: true});
                } else {
                    Backbone.history.navigate('', { trigger : true});
                }

                if (debug) {
                    var _j = JSON.parse(localStorage['permissions']); _j.push('DEBUG'); localStorage.setItem('permissions', JSON.stringify(_j));
                }

                RecruiterApp.core.vent.trigger('ga:send', {
                    hitType: 'event',
                    eventCategory: 'User Login',
                    eventAction: 'Login',
                    eventLabel: 'Success'
                })
                RecruiterApp.core.vent.trigger('app:loadData', url);
            }});
        });

        login.fail(function(jqXHR, textStatus, errorThrown ) {
            console.log("There was a failure..." + textStatus);
            // Backbone.history.navigate('login', { trigger: true });
            RecruiterApp.core.vent.trigger('ga:send', {
                hitType: 'event',
                eventCategory: 'User Login',
                eventAction: 'Login',
                eventLabel: 'Fail'
            })
            RecruiterApp.core.vent.trigger('app:message:warning', 'Login failed');
            self.trigger('login:error');
        });

    },
    logout: function(callback) {
        var self = this;
        console.log("Logging out session");
        $.ajax({
            type: 'GET',
            url : RecruiterApp.config.API_ROOT + '/logout'
        }).done(function(response) {
            //Set the new csrf token to csrf vaiable and
            //call initialize to update the $.ajaxSetup
            // with new csrf
            self.csrf = response._csrf;
            self.initialize();
            if (callback != undefined) {
                callback();
            }

            RecruiterApp.core.vent.trigger('ga:send', { 
                hitType: 'event', 
                eventCategory: 'User Login',
                eventAction: 'Logout',
                eventLabel: 'Success',
            });

            window.location.hash = '#/login';
        });
    },

    getAuth: function(callback) {
        var self = this;
        var Session = self.fetch();

        Session.done(function(response) {
            self.set('authenticated', true);
            self.set('user', JSON.stringify(response.user));
        });

        Session.fail(function(response) {
            response = JSON.parse(response.responseText);
            self.clear();
            self.csrf = response._csrf !== self.csrf ? response._csrf : self.csrf;
            self.initialize();
        });

        Session.always(callback);
    },

    getAuthToken: function() {
        return this.get('authToken');
    },

    //TODO - these two functions will need optimizing as i'm expecting them to be called a lot... making a simple dict should be a good start

    getPermissionSet: function(targetType) { // function not used
        var self = this;


        var permissionList = self.get('viewPermissionList');
        if (permissionList != undefined) {
            var permissionObject = JSON.parse(permissionList);
            console.log("PermissionObject", permissionObject);
            // return _.map(permissionObject, function(existingPermission) {
            //     if (existingPermission.targetType == targetType) {
            //         return true;
            //     }
            // });

            return _.filter(permissionObject, function(existingPermission) {
                if (existingPermission.targetType == targetType) {
                    return existingPermission;
                }
            });
            // return _.find(permissionObject, function (existingPermission) {
            //     // console.log("checking permission '" + permission + "' against existingPermission=", existingPermission);
            //     if (existingPermission.targetType == targetType) {
            //         return true;
            //     }
            // });
        } else {
            console.log("viewPermissionList is undefined");
        }
    },

    getPermissionsForView: function(viewName) {
        var self = this;
        var viewPermissionList = self.get('viewPermissionList');
        if (viewPermissionList != undefined) {
            var permissionLists = viewPermissionList[viewName];
            if (permissionLists != undefined) {
                return permissionLists;
            } else {
                return null;
            }
            // return permissionObject[viewName];
        }
    },

    hasPermission: function(permission) {
        var self = this;
        var permissionList = self.get('permissions');
        if (permissionList != undefined) {
            var permissionObject = JSON.parse(permissionList);
            return _.find(permissionObject, function (existingPermission) {
                if (existingPermission == permission) {
                    return true;
                }
            });
        }
    },

    isRequired: function(entity, field) {
        var self = this;
        // console.log("Checking if " + entity + "." + field + " is required");
        var viewPermissionList = self.get('viewPermissionList');
        var result = false;
        if (viewPermissionList != undefined) {
            var entityPermissions = viewPermissionList[entity];
            var foundIt = _.find(entityPermissions, function(permission) {
                if (permission.fieldName == field) {
                    // console.log(field + "  is required=" + permission.required + " it is a " +
                    //     typeof(permission.required));
                    return permission;
                }
            });
            if (foundIt != undefined) {
                result = foundIt.required;
            }
        }
        return result;
    },

    hasPermissionsForView: function(name, field) {
        var self = this;
        var viewPermissionList = self.get('viewPermissionList');
        if (viewPermissionList != undefined) {
            var panel = viewPermissionList[name];
            if (panel) {
                for (i = 0; i < panel.length; i++) {
                    if (panel[i].read) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    hasRole: function(role) {
        var self = this;
        var roleList = self.get('roleList');
        if (roleList != undefined && typeof(roleList) != "undefined") {
            var roleObject = JSON.parse(roleList);
            return _.find(roleObject, function (existingRole) {
                if (existingRole.name == role) {
                    return true;
                }
            });
        }
    }

});