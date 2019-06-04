var Backbone = require("backbone"),
    _ = require("underscore"),
    Session = require("./Session");
module.exports = PermissionHelper = Backbone.Model.extend({

    /**
     * Go through each sideMenu entry showing it, rather than hiding
     */
    processSideMenu: function(ref) {
        var session = new Session();
        var sideMenuPermissions = session.getPermissionsForView("leftMenu");
        
        if (!_.isNull(session.get('authToken'))) {
            
            console.warn('PROCESS SIDE MENU')

            if (!_.isNull(sideMenuPermissions)) {
                _.each(sideMenuPermissions, function(perm) {
                    if (perm.read) {
                        ref.$el.find(perm.selector).removeClass('wb')
                    }
                });
            }

            // ref.$el.find('.wb').remove()
        }
    },
    processRole: function() {
        var session = new Session();

        if (!session.hasRole("OCTUS")) {
            _.each($('*[data-oc-role]'), function(selector) {
                var roleToCheck = $(selector).attr('data-oc-role').split(' ');
                _.each(roleToCheck, function(role) {
                    if (!session.hasRole(role)) {
                        $(selector).hide();
                    }
                });
            });
        }
    },
    processPermission: function(opt) {
        var session = new Session();
        _.each($('*[data-oc-permission]'), function(selector) {
            var permissionToCheck = $(selector).attr('data-oc-permission');
            if (!session.hasPermission(permissionToCheck)) {
                if (opt != undefined && opt.mark == true) {
                    $(selector).attr('data-hide', true);
                } else {
                    $(selector).hide();
                }
            }
        });
    },
    processView: function(viewName, ref) {
        var session = new Session();
        var viewPermission = session.getPermissionsForView(viewName);
        var dom = ref && ref.$el ? ref.$el : $('#octus-page');

        if (viewPermission && dom) {            

            RecruiterApp.core.vent.trigger('app:DEBUG:warn', ['Process View', viewName])
            RecruiterApp.core.vent.trigger('app:DEBUG:log', ['Process View', dom])

            if (!_.isNull(session.get('authToken'))) {
                _.each(viewPermission, function(perm) {

                    if (perm.read) {
                        dom.find(perm.selector).removeClass('wb')
                        
                        if (perm.write) {
                            var inputs = dom.find(perm.selector).find('input, select, textarea, button');

                            _.each(inputs, function(input) {
                                input = $(input);
                                input.removeProp('disabled')
                                
                                if (input.attr('data-role') == 'datepicker') {
                                    var datepicker = input.data("kendoDatePicker");
                                        datepicker.enable(true);
                                } else if (input.attr('data-role') == 'timepicker') {
                                    var timepicker = input.data("kendoTimePicker");
                                        timepicker.enable(true);
                                }
                            });

                            if (dom.find('.edit-' + perm.fieldName).length > 0) {
                                dom.find('.edit-' + perm.fieldName).removeClass('wb')
                            }

                            /**
                             * Delete not implemented yet
                             */
                            // if (perm.delete) {
                                if (dom.find('.delete-' + perm.fieldName).length > 0) {
                                    dom.find('.delete-' + perm.fieldName).removeClass('wb')
                                }
                            // }
                        }
                    }
                });

                // _.defer(function(){
                //     if (dom.find('.wb').length > 0) {
                //         console.warn('[wb still hidden]:', dom.find('.wb'))
                //     }
                // });
            }
        }
    }

});
