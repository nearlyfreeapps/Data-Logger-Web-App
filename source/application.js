var datalogger = function() {
    
    var TemplateModel = Backbone.Model.extend({
        defaults: {
            name: 'Template Name',
        }
    });
    
    var AccelPointModel = Backbone.Model.extend({
        defaults: {
            x: 0,
            y: 0
        },
    });

    var AccelPointCollection = Backbone.Collection.extend({
        model: AccelPointModel,
        addX: function(x) {
            console.log('Adding Point ' + (this.length + 1) + ' , ' + x);

            if (this.length == 100) {
                this.remove(this.at(0));
            }

            this.each(function(point) {
                point.set({ x: point.get('x') + 1 });
            });

            this.add({x: 0, y: x});
        },
        toArray: function() {
            var points = [];

            this.each(function(point) {
                points.push([point.get('x'), point.get('y')]);
            });
            return points;
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

    var AddTemplateView = Backbone.View.extend({
        el: $('#add-template'),
        events: {
            'click #save-template': 'save_template',
            'click #add-template-back': 'back'
        },
        save_template: function(event) {
            event.preventDefault();
            alert('Attempting to save template');
        },
        back: function(event) {
            event.preventDefault();
            $.mobile.changePage($('#settings'), { transition: 'slide', reverse: true, changeHash: true });
            $('.ui-btn-active').removeClass('ui-btn-active');
        },
        render: function(eventName) {
            return this;
        },
    });

    var options = {
        series: { color: 'blue', shadowSize: 0 },
        yaxis: { min: -5, max: 5 },
        xaxis: { min: 0, max: 100, show: false }
    };
    
    var accelPoints = new AccelPointCollection();
    var accelerometerPlot = $.plot($('#accelerometer-graph'), [ [[0, 0]] ], options);    

    var AccelerometerView = Backbone.View.extend({
        el: $('#accelerometer-template'),
        initialize: function() {
            this.watchID = null;
            this.render();
        },
        events: {
            'click #accelerometer-template-back': 'back'
        },
        back: function(event) {
            event.preventDefault();
            $.mobile.changePage($('#add-template'), { transition: 'slide', reverse: true, changeHash: true });
            $('.ui-btn-active').removeClass('ui-btn-active');
            
            if(this.watchID) {
                navigator.accelerometer.clearWatch(this.watchID);
                this.watchID = null;
            }

            accelerometerPlot.setData([]);
            accelerometerPlot.draw();
            accelPoints.refresh([]);
        },
        render: function(eventName) {
            return this;
        },
        plot: function() {
            var options = { frequency: 100 };
            this.watchID = navigator.accelerometer.watchAcceleration(this.onAccelSuccess, this.onAccelError, options);
        },
        onAccelSuccess: function(acceleration) {
            accelPoints.addX(acceleration.x);
            accelerometerPlot.setData([ accelPoints.toArray() ]);
            accelerometerPlot.draw();
        },
        onAccelError: function() {
            console.log("Accelerometer Error");
        }
    });

    var templates = new TemplateCollection();
    var templateListView = new TemplateListView({ model: templates });
    var addTemplateView = new AddTemplateView();
    var accelerometerView = new AccelerometerView();
    templates.fetch();

    var Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            'settings': 'settings',
            'logs': 'logs',
            'add-template': 'add_template',
            'accelerometer-template': 'accelerometer_template'
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
        },
        accelerometer_template: function() {
            $.mobile.changePage($('#accelerometer-template'), { transition: 'slide', reverse: false, changeHash: false });
            $('.ui-btn-active').removeClass('ui-btn-active');

            accelerometerView.plot();
        }

    });

    /* App initialization */
    var router = new Router();
    Backbone.history.start();
};


$(function() {
    datalogger();
});

