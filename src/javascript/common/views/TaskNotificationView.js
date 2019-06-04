/*
 * HeaderView
 */
define([
    'underscore'
    , 'marionette'
    , 'text!common/templates/taskNotification.html'
    , 'text!common/templates/taskNotificationItem.html'
    , 'vent'
], function (_, Marionette, template, templateItem, vent) {
    var TaskNotificationView = {};

    var TaskNotificationItemView = Marionette.ItemView.extend({
        template: _.template(templateItem),

        tagName: 'li',

        bindings: {
            '.event': 'event', '.when': 'when', '.what': 'what',
            'select#name': {
                observe: 'id',
                selectOptions: {
                    collection: 'window.Octus.paymentEventList',
                    labelPath: 'value',
                    valuePath: 'key'
                }
            }, 'select#type': {
                observe: 'type'
            }
        },
        onRender: function () {
            this.stickit();
        }

    });

    TaskNotificationView = Marionette.CompositeView.extend({
        itemView: TaskNotificationItemView,
        template: template,
        itemViewContainer: '#tasks-notification',
//        itemViewContainer: '.tasks-bar',
        tagName: "ul",
        className: "dropdown-menu extended tasks-bar",
        initialize: function () {
            console.log("Tasks", this.collection);
        }
    });

    return TaskNotificationView;
});
