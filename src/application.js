var datalogger = {

    Router: Backbone.Router.extend({
        routes: {
            '': 'index',
            'settings': 'settings',
            'logs': 'logs',
            'add-template': 'add_template'
        },

        index: function () {},

        settings: function() {
            $.mobile.changePage($('#settings'), { transition: "none" });
            $('.ui-btn-active').removeClass('ui-btn-active');
        },  

        logs: function() {
            $.mobile.changePage($('#logs'), { transition: "none" });
            $('.ui-btn-active').removeClass('ui-btn-active');
        },

        add_template: function() {
            $.mobile.changePage($('#add-template'), { transition: "slide" });
            $('.ui-btn-active').removeClass('ui-btn-active');
        }
    }),

    init: function() {
        var router = new datalogger.Router();
        Backbone.history.start();
    }

};


$(function() {
    datalogger.init();
});

$(document).bind('mobileinit', function(){      
    $.mobile.ajaxEnabled = false;
    $.mobile.linkBindingEnabled = false;
    $.mobile.hashListeningEnabled = false;
});

