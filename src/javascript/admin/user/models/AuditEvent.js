var Backbone = require('backbone');
module.exports = AuditEvent = Backbone.Model.extend({
    url: function() {
        return RecruiterApp.config.ADMIN_API_ROOT + '/auditEvent/' + this.username;
    },
    comparator : function(auditEvent) {
        return auditEvent.get('auditEventname');
    }
});