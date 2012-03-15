var datalogger = function() {
    
    var ScheduleModel = Backbone.Model.extend({
        defaults: {
            start: '',
            end: '',
            repeat: ''
        }
    });

    var SensorModel = Backbone.Model.extend({
        defaults: {
            name: '',
            on: false
        }
    });

    var SensorCollection = Backbone.Collection.extend({
        model: SensorModel
    });

    var TemplateModel = Backbone.Model.extend({
        defaults: {
            name: '',
        }//,
        /*initialize : function() {
            this.sensors = new SensorCollection;
            this.schedule = new ScheduleModel;
        }*/
    });
    
    var AccelPointModel = Backbone.Model.extend({
        defaults: {
            x: [0,0],
            y: [0,0],
            z: [0,0]
        },
    });

    var AccelPointCollection = Backbone.Collection.extend({
        model: AccelPointModel,
        addXYZ: function(accelx, accely, accelz) {
 
            if (this.length == 100) {
                this.remove(this.at(0));
            }

            this.each(function(point) {
                var x = point.get('x');
                var y = point.get('y');
                var z = point.get('z');
                point.set({ x: [x[0] + 1, x[1]], y: [y[0] + 1, y[1]], z: [z[0] + 1, z[1]] });
            });
            
            if(device.platform == "BlackBerry") {
                this.add({x: [0, accelx / 800.0], y: [0, accely / 800.0], z: [0, accelz / 800.0] });
            } else {
                this.add({x: [0, accelx / 12.0], y: [0, accely / 12.0], z: [0, accelz / 12.0] });
            }
        },
        toArrayX: function() {
            var points = [];

            this.each(function(point) {
                points.push(point.get('x'));
            });

            return points;
        },
        toArrayY: function() {
            var points = [];

            this.each(function(point) {
                points.push(point.get('y'));
            });

            return points;
        },
        toArrayZ: function() {
            var points = [];

            this.each(function(point) {
                points.push(point.get('z'));
            });

            return points
        }
    });

    var TemplateCollection = Backbone.Collection.extend({
        model: TemplateModel,
        localStorage: new Store("Templates")
    });

    var templates = new TemplateCollection();

    var TemplateListView = Backbone.View.extend({
        el: $('#template-list'),
        initialize: function() {
            this.model.bind('reset', this.render, this);
            this.model.bind('add', this.add, this);
        },
        render: function(eventName) {
            _.each(this.model.models, function(template) {
                $(this.el).append(
                    new TemplateItemView({model: template}).render().el);
            }, this);
            
            $(this.el).listview('refresh');
            return this;
        },
        add: function(model) {
            $(this.el).append(new TemplateItemView({ model: model }).render().el);
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
            'click #add-template-back': 'back',
            'click #start-template': 'start_template',
            'change #schedule-switch': 'schedule_switch',
            'change #accelerometer-switch': 'accelerometer_switch',
            'change #gps-switch': 'gps_switch',
            'change #camera-switch': 'camera_switch',
            'change #template-name': 'template_name'
        },
        start_template: function(event) {
            alert('Start the logging session...');
        },
        save_template: function(event) {
            if($('#template-name').val() == '') {
                alert('Enter a template name before saving');
            } else {                
                templates.add({ name: $('#template-name').val()});

                $('#save-template').hide();
                $('#start-template').show();
            }
        },
        back: function(event) {
            event.preventDefault();
            $.mobile.changePage($('#settings'), { transition: 'none', reverse: true, changeHash: true });
            $('.ui-btn-active').removeClass('ui-btn-active');
        },
        schedule_switch: function(event) {
            if($('#schedule-switch').val() == 'on') {
                $('#start-template').hide();
                $('#save-template').show();
                $('#schedule-block').show();
            } else {
                $('#save-template').hide();
                $('#schedule-block').hide();
                $('#start-template').show();
            }
        },
        accelerometer_switch: function(event) {
            alert($('#accelerometer-switch').val());
        },
        gps_switch: function(event) {
            alert($('#gps-switch').val());
        },
        camera_switch: function(event) {
            alert($('#camera-switch').val());
        },
        template_name: function(event) {
            $('#start-template').hide();
            $('#save-template').show();
        },
        render: function(eventName) {
            return this;
        },
    });

    var options = {
        series: { shadowSize: 0 },
        yaxis: { min: -3, max: 3 },
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
            'click #accelerometer-template-back': 'back',
            'change #accelerometer-frequency': 'frequency_change'
        },
        back: function(event) {
            event.preventDefault();
            $.mobile.changePage($('#add-template'), { transition: 'none', reverse: true, changeHash: true });
            $('.ui-btn-active').removeClass('ui-btn-active');
            
            if(this.watchID) {
                navigator.accelerometer.clearWatch(this.watchID);
                this.watchID = null;
            }

            accelerometerPlot.setData([ [] ]);
            accelerometerPlot.draw();
            accelPoints.reset();
        },
        frequency_change: function(event) {
            if(this.watchID) {
                navigator.accelerometer.clearWatch(this.watchID);
                this.watchID = null;
            }

            this.plot();
        },
        render: function(eventName) {
            return this;
        },
        plot: function() {
            var frequency = 1000 / $('#accelerometer-frequency').val();
            var options = { frequency: frequency};
            this.watchID = navigator.accelerometer.watchAcceleration(this.onAccelSuccess, this.onAccelError, options);
        },
        onAccelSuccess: function(acceleration) {
            accelPoints.addXYZ(acceleration.x, acceleration.y, acceleration.z);
            accelerometerPlot.setData([ {data: accelPoints.toArrayX(), color: 'red' }, {data: accelPoints.toArrayY(), color: 'green'}, {data: accelPoints.toArrayZ(), color: 'blue'} ]);
            accelerometerPlot.draw();
        },
        onAccelError: function() {
            console.log("Accelerometer Error");
        }
    });

    var ScheduleView = Backbone.View.extend({
        el: $('#schedule-template'),
        events: {
            'click #schedule-template-back': 'back',
            'click #schedule-template-done': 'done'
        },
        back: function(event) {
            $.mobile.changePage($('#add-template'), { transition: 'none', reverse: true, changeHash: true });
        },
        done: function(event) {
            $.mobile.changePage($('#add-template'), { transition: 'none', reverse: true, changeHash: true });
        },
    });

    var RepeatView = Backbone.View.extend({
        el: $('#repeat-template'),
        events: {
            'click #repeat-template-back': 'back',
        },
        back: function(event) {
            $.mobile.changePage($('#schedule-template'), { transition: 'none', reverse: true, changeHash: true });
        },
    });

    

    var templateListView = new TemplateListView({ model: templates });
    var addTemplateView = new AddTemplateView();
    var accelerometerView = new AccelerometerView();
    var scheduleView = new ScheduleView();
    var repeatView = new RepeatView();
    templates.fetch();

    var Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            'settings': 'settings',
            'logs': 'logs',
            'add-template': 'add_template',
            'accelerometer-template': 'accelerometer_template',
            'schedule-template': 'schedule_template',
            'repeat-template': 'repeat_template'
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
            $.mobile.changePage($('#add-template'), { transition: 'none', reverse: false, changeHash: false });
            $('.ui-btn-active').removeClass('ui-btn-active');
            $('#template-name').val('');
            $('#schedule-switch').val('Off');
            $('#schedule-block').hide();
            $('#accelerometer-switch').val('Off');
            $('#gps-switch').val('Off');
            $('#camera-switch').val('Off');
        },
        accelerometer_template: function() {
            $.mobile.changePage($('#accelerometer-template'), { transition: 'none', reverse: false, changeHash: false })
            $('.ui-btn-active').removeClass('ui-btn-active');
            alert(device.platform);
            accelerometerView.plot();
        },
        schedule_template: function() {
            $.mobile.changePage($('#schedule-template'), { transition: 'none', reverse: false, changeHash: false });
            $('.ui-btn-active').removeClass('ui-btn-active');
        },
        repeat_template: function() {
            $.mobile.changePage($('#repeat-template'), { transition: 'none', reverse: false, changeHash: false });
            $('.ui-btn-active').removeClass('ui-btn-active');
        }

    });

    /* App initialization */
    var router = new Router();
    Backbone.history.start();
};


$(function() {
    datalogger();
});

