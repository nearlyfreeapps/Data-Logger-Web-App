var datalogger = function() {
    
    var TemplateModel = Backbone.Model.extend({
        defaults: {
            name: 'Template Name',
        }
    });

    var TemplateCollection = Backbone.Collection.extend({
        model: TemplateModel,
        localStorage: new Store('Templates')
    });

    var TemplateListView = Backbone.View.extend({
        el: $('#template-list'),
        initialize: function() {
            this.model.bind('reset', this.render, this);
        },
        render: function(eventName) {
            _.each(this.model.models, function(template) {
                $(this.el).append(
                    new TemplateItemView({model: template}).render().el);
            }, this);
            
            $(this.el).listview('refresh');
            return this;
        }
    });

    var TemplateItemView = Backbone.View.extend({
        tagName: 'li',
        className: 'tall-list',
        template: _.template($('#template-list-item').html()),
        render: function(eventName) {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        }
    });

    var Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            'settings': 'settings',
            'logs': 'logs',
            'add-template': 'add_template'
        },

        index: function() {},

        settings: function() {
            $.mobile.changePage($('#settings'), { transition: 'none', reverse: false, changeHash: false });
            $('.ui-btn-active').removeClass('ui-btn-active');
        },  

        logs: function() {
            $.mobile.changePage($('#logs'), { transition: 'none', reverse: false, changeHash: false });
            $('.ui-btn-active').removeClass('ui-btn-active');
        },

        add_template: function() {
            $.mobile.changePage($('#add-template'), { transition: 'slide', reverse: false, changeHash: false });
            $('.ui-btn-active').removeClass('ui-btn-active');
        }
    });


    /* App initialization */
    var router = new Router();
    Backbone.history.start();

    var templates = new TemplateCollection();
    var templateListView = new TemplateListView({ model: templates });
    templates.fetch();

};


$(function() {
    datalogger();
});

