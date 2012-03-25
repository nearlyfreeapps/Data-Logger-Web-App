var datalogger = function() {
    
    var ScheduleModel = Backbone.RelationalModel.extend({
        defaults: {
            start_date: '',
            start_time: '',
            end_date: '',
            end_time: '',
            repeat: []
        }
    });

    var SensorModel = Backbone.RelationalModel.extend({
        defaults: {
            name: '',
            on: false,
            frequency: 0
        }
    });

    var SensorCollection = Backbone.Collection.extend({
        model: SensorModel
    });

    var TemplateModel = Backbone.RelationalModel.extend({
        defaults: {
            name: '',
        },
        relations: [
            {
                type: Backbone.HasOne,
                key: 'schedule',
                relatedModel: ScheduleModel
            },
            {
                type: Backbone.HasMany,
                key: 'sensors',
                relatedModel: SensorModel,
                collectionType: SensorCollection,
                reverseRelation: {
                    key: 'template'
                }
            }
        ]
    });
    
    var EntryModel = Backbone.RelationalModel.extend({
        relations: [
            {
                type: Backbone.HasOne,
                key: 'sensor',
                relatedModel: SensorModel
            }
        ]
    });

    var EntryCollection = Backbone.Collection.extend({
        model: EntryModel
    });

    var LogModel = Backbone.RelationalModel.extend({
        defaults: {
            name: '',
            start_date: '',
            end_date: ''
        },
        relations: [
            {
                type: Backbone.HasOne,
                key: 'template',
                relatedModel: TemplateModel
            },
            {
                type: Backbone.HasMany,
                key: 'entries',
                relatedModel: EntryModel,
                collectionType: EntryCollection,
                reverseRelation: {
                    key: 'log'
                }
            }
        ]
    });

    var AccelPointModel = Backbone.Model.extend({
        defaults: {
            x: [0,0],
            y: [0,0],
            z: [0,0]
        },
    });
    
    var GpsPointModel = Backbone.Model.extend({
        defaults: {
            latitude:         0.0,
            longitude:        0.0,
            altitude:         0.0, 
            heading:          0.0, 
            speed:            0.0
        },
    });

    var AccelPointCollection = Backbone.Collection.extend({
        model: AccelPointModel,
        addXYZ: function(accelx, accely, accelz) {
 
            if (this.length === 100) {
                this.remove(this.at(0));
            }

            this.each(function(point) {
                var x = point.get('x');
                var y = point.get('y');
                var z = point.get('z');
                point.set({ x: [x[0] + 1, x[1]], y: [y[0] + 1, y[1]], z: [z[0] + 1, z[1]] });
            });
            
            if(device.platform === "Android") {
                this.add({x: [0, accelx / 12.0], y: [0, accely / 12.0], z: [0, accelz / 12.0] });
            } else {
                this.add({x: [0, accelx / 800.0], y: [0, accely / 800.0], z: [0, accelz / 800.0] });
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
    
    var GpsPointCollection = Backbone.Collection.extend({
        model: GpsPointModel,
        addLocation: function(position) {
            if (this.length === 100) {
                this.remove(this.at(0));
            }
            
            this.add({ latitude: position.coords.latitude, longitude: position.coords.longitude, 
            altitude: position.coords.altitude, heading: position.coords.heading, speed: position.coords.speed  });
        },
        getLastLocation: function() {
            var last = this.at(this.length-1)
            var location = [last.get("latitude"), last.get("longitude"), last.get("altitude"), last.get("heading"), last.get("speed")];
            
            for (var i = 0; i < location.length; i++) {
                if (location[i] === null) {
                    location[i] = "N/A";
                }
            }
            
            return location;
        }
    });

    var TemplateCollection = Backbone.Collection.extend({
        model: TemplateModel,
        localStorage: new Store("Templates")
    });

    var LogCollection = Backbone.Collection.extend({
        model: LogModel,
        localStorage: new Store("Logs")
    });

    var templates = new TemplateCollection();
    var logs = new LogCollection();

    var TemplateListView = Backbone.View.extend({
        el: $('#template-list'),
        initialize: function() {
            this.model.bind('reset', this.render, this);
            this.model.bind('add', this.add, this);
            this.model.bind('change', this.change, this);
            this.model.bind('remove', this.remove, this);
        },
        render: function(eventName) {
            _.each(this.model.models, function(template) {
                $(this.el).prepend(
                    new TemplateItemView({model: template}).render().el);
            }, this);
            
            $(this.el).listview('refresh');
            return this;
        },
        change: function(eventName) {
            $(this.el).empty();
            this.render();
        },
        add: function(model) {
            $(this.el).prepend(new TemplateItemView({ model: model }).render().el);
            $(this.el).listview('refresh');
        },
        remove: function(model) {
            $(this.el).empty();
            this.render();
        }
    });


    var LogListView = Backbone.View.extend({
        el: $('#log-list'),
        initialize: function() {
            this.model.bind('reset', this.render, this);
            this.model.bind('add', this.add, this);
            this.model.bind('remove', this.remove, this);
            this.model.bind('change', this.change, this);
        },
        render: function(eventName) {
            _.each(this.model.models, function(log) {
                $(this.el).prepend(
                    new LogItemView({model: log}).render().el);
            }, this);
            
            try {
                $(this.el).listview('refresh');
            } catch(e) {
                //..
            }

            return this;
        },
        change: function(eventName) {
            $(this.el).empty();
            this.render();
        },
        add: function(model) {
            $(this.el).prepend(new LogItemView({ model: model }).render().el);
            try {
                $(this.el).listview('refresh');
            } catch(e) {
                //..
            }

            return this;
        },
        remove: function(model) {
            $(this.el).empty();
            this.render();
        }
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
            $.mobile.changePage($('#add-template'), { transition: 'none', reverse: true, changeHash: false });
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
            $('#stop-template').hide();
            $('#start-template').hide();
            $('#save-template').show();

            if(this.watchID) {
                navigator.accelerometer.clearWatch(this.watchID);
                this.watchID = null;
                this.plot();
            }
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

    var gpsPoints = new GpsPointCollection();
    var GPSView = Backbone.View.extend({
        el: $('#gps-template'),
        initialize: function() {
            this.watchID = null;
            this.render();
        },
        events: {
            'click #gps-template-back': 'back',
            'change #gps-frequency': 'frequency_change'
        },
        back: function(event) {
            event.preventDefault();
            $.mobile.changePage($('#add-template'), { transition: 'none', reverse: true, changeHash: false });
            $('.ui-btn-active').removeClass('ui-btn-active');

            if (this.watchID) {
                navigator.geolocation.clearWatch(this.watchID);
                this.watchID = null;
            }
            
            gpsPoints.reset();
        },
        frequency_change: function(event) {
            $('#stop-template').hide();
            $('#start-template').hide();
            $('#save-template').show();
            
            if(this.watchID) {
                navigator.geolocation.clearWatch(this.watchID);
                this.watchID = null;
                this.plot();
            }
        },
        render: function(eventName) {
            return this;
        },
        plot: function() {
            var frequency = 1000 / $('#gps-frequency').val();
            var options = { enableHighAccuracy: true, frequency: frequency, maximumAge: frequency, timeout: frequency};

            if(this.watchID) {
                navigator.geolocation.clearWatch(this.watchID);
                this.watchID = null;
            }

            this.watchID = navigator.geolocation.watchPosition(this.onGpsSuccess, this.onGpsError, options);
        },
        onGpsSuccess: function(position) {
            gpsPoints.addLocation(position);
            var location = gpsPoints.getLastLocation();
            var url = "http://maps.google.com/maps/api/staticmap?center=" + location[0] + "," + location[1] + "&zoom=13&size=260x150&maptype=roadmap&markers=color:blue%7C" + location[0] + "," + location[1] + "&sensor=true";

            var map_image = new Image();
            map_image.onload = function() {
                $('#map_canvas').html('<img style="border: 1px solid #000" src="' + url + '">');
                $('#map_canvas').show();
            };

            map_image.onerror = function() {
                $('#map_canvas').hide();
            };

            map_image.src = url;
                        
            $('#gps_loading').hide();
            $('#lat_long').html('<br>Latitude: ' + location[0] + '<br>Longitude: ' + location[1] + '<br>Altitude: ' + location[2] + '<br>Heading: ' + location[3] + '<br>Speed: ' + location[4]);
        },
        onGpsError: function() {
            console.log("GPS Error");
        },
    });

    var ScheduleView = Backbone.View.extend({
        el: $('#schedule-template'),
        events: {
            'click #schedule-template-back': 'back',
            'change #start-date': 'show_save',
            'change #start-time': 'show_save',
            'change #end-date': 'show_save',
            'change #end-time': 'show_save'
        },
        back: function(event) {
            $.mobile.changePage($('#add-template'), { transition: 'none', reverse: true, changeHash: false });
        },
        show_save: function(event) {
            $('#stop-template').hide();
            $('#start-template').hide();
            $('#save-template').show();
        }
    });

    var RepeatView = Backbone.View.extend({
        el: $('#repeat-template'),
        events: {
            'click #repeat-template-back': 'back',
            'click #repeat-mon': 'monday',
            'click #repeat-tue': 'tuesday',
            'click #repeat-wed': 'wednesday',
            'click #repeat-thu': 'thursday',
            'click #repeat-fri': 'friday',
            'click #repeat-sat': 'saturday',
            'click #repeat-sun': 'sunday'
        },
        back: function(event) {
            $.mobile.changePage($('#schedule-template'), { transition: 'none', reverse: true, changeHash: false });
        },
        monday: function(event) {
            event.preventDefault();
            $('#mon-check').toggle().toggleClass('selected');
            $('#stop-template').hide();
            $('#start-template').hide();
            $('#save-template').show();
        },
        tuesday: function(event) {
            event.preventDefault();
            $('#tue-check').toggle().toggleClass('selected');
            $('#stop-template').hide();            
            $('#start-template').hide();
            $('#save-template').show();
        },
        wednesday: function(event) {
            event.preventDefault();
            $('#wed-check').toggle().toggleClass('selected');
            $('#stop-template').hide();            
            $('#start-template').hide();
            $('#save-template').show();
        },
        thursday: function(event) {
            event.preventDefault();
            $('#thu-check').toggle().toggleClass('selected');
            $('#stop-template').hide();            
            $('#start-template').hide();
            $('#save-template').show();
        },
        friday: function(event) {
            event.preventDefault();
            $('#fri-check').toggle().toggleClass('selected');
            $('#stop-template').hide();         
            $('#start-template').hide();
            $('#save-template').show();
        },
        saturday: function(event) {
            event.preventDefault();
            $('#sat-check').toggle().toggleClass('selected');
            $('#stop-template').hide();
            $('#start-template').hide();
            $('#save-template').show();
        },
        sunday: function(event) {
            event.preventDefault();
            $('#sun-check').toggle().toggleClass('selected');
            $('#stop-template').hide();
            $('#start-template').hide();
            $('#save-template').show();
        }

    });

    var accelerometerView = new AccelerometerView();
    var gpsView = new GPSView();

    var AddTemplateView = Backbone.View.extend({
        el: $('#add-template'),
        initialize: function() {
            this.model = null;
            this.log = null;
        },
        events: {
            'click #save-template': 'save_template',
            'click #add-template-back': 'back',
            'click #start-template': 'start_template',
            'click #stop-template': 'stop_template',
            'change #schedule-switch': 'schedule_switch',
            'change #accelerometer-switch': 'accelerometer_switch',
            'change #gps-switch': 'gps_switch',
            'change #template-name': 'template_name',
            'click #delete': 'delete_template',
            'click #delete-confirm': 'delete_confirm',
            'click #accelerometer-temp': 'accelerometer_template',
            'click #gps-temp': 'gps_template'
        },
        accelerometer_template: function(event) {
            event.preventDefault();

            if ($('#accelerometer-switch').val() === "on") {
                $.mobile.changePage($('#accelerometer-template'), { transition: 'none', reverse: false, changeHash: false });
                $('.ui-btn-active').removeClass('ui-btn-active');

                if(this.model !== null) {
                    $('#accelerometer-frequency').val(this.model.get('sensors').at(0).get('frequency')).slider('refresh');
                } else {
                    $('#accelerometer-frequency').val('10').slider('refresh');
                }
                accelerometerView.plot();
            }
        },
        gps_template: function(event) {
            event.preventDefault();

            if ($('#gps-switch').val() === "on") {
                $.mobile.changePage($('#gps-template'), { transition: 'none', reverse: false, changeHash: false })
                $('.ui-btn-active').removeClass('ui-btn-active');
                
                if(this.model !== null) {
                    $('#gps-frequency').val(this.model.get('sensors').at(1).get('frequency')).slider('refresh');
                } else {
                    $('#gps-frequency').val('10').slider('refresh');
                }
                $('#gps_loading').show();
                $('#map_canvas').hide();
                $('#lat_long').empty();
                gpsView.plot();
            }
        },
        init: function(model) {
            this.model = model;

            $('#start-date').val('');
            $('#start-time').val('');
            $('#end-date').val('');
            $('#end-time').val('');
            $('.day-check').each(function(index, element) {
                $(element).hide().removeClass('selected');
            });
            $('#start-date-time').text('N/A');
            $('#end-date-time').text('N/A');
            $('#repeats').text('None');
            if(this.model === null) {
                //Configure Empty Add Template View
                $('#template-name').val('');
                $('#schedule-switch').val('Off').slider('refresh');
                $('#schedule-block').hide();
                $('#accelerometer-switch').val('Off').slider('refresh');
                $('#gps-switch').val('Off').slider('refresh');
                $('#delete-list').hide();
            } else {
                //Configure Existing Template View
                $('#template-name').val(this.model.get('name'));
                $('#accelerometer-switch').val(this.model.get('sensors').at(0).get('state')).slider('refresh');
                $('#gps-switch').val(this.model.get('sensors').at(1).get('state')).slider('refresh');
                if(this.model.has('schedule')) {
                    //.. show schedule
                    $('#schedule-switch').val('on').slider('refresh');
                    $('#schedule-block').show();
                    
                    $('#start-date').val(this.model.get('schedule').get('start_date'));
                    $('#start-time').val(this.model.get('schedule').get('start_time'));
                    $('#end-date').val(this.model.get('schedule').get('end_date'));
                    $('#end-time').val(this.model.get('schedule').get('end_time'));
                    $('#start-date-time').text(this.model.get('schedule').get('start_date') + ' ' + this.model.get('schedule').get('start_time'));
                    $('#end-date-time').text(this.model.get('schedule').get('end_date') + ' ' + this.model.get('schedule').get('end_time'));
                    var repeat_string = ''
                    _.each(this.model.get('schedule').get('repeat'), function(element) {
                        $('#' + element + '-check').show().addClass('selected');
                        repeat_string = repeat_string + ' ' + element;
                    });

                    if(repeat_string.length > 16) {
                        repeat_string = repeat_string.substring(0, 16) + '...';
                    }

                    $('#repeats').text(repeat_string);

                    if($.trim($('#start-date-time').text()) === '') {
                        $('#start-date-time').text('N/A');
                    }
                    if($.trim($('#end-date-time').text()) === '') {
                        $('#end-date-time').text('N/A');
                    }
                    if($.trim($('#repeats').text()) === '') {
                        $('#repeats').text('None');
                    }   
                } else {
                    $('#schedule-switch').val('off').slider('refresh');
                    $('#schedule-block').hide();
                }
            
                $('#delete-list').show();
                $('#delete-confirm-block').hide();
                $('#stop-template').hide();
                $('#save-template').hide();
                $('#start-template').show();
            }
        },
        delete_template: function(event) {
            event.preventDefault();
            $('#delete-confirm-block').toggle();
        },
        delete_confirm: function(event) {
            event.preventDefault();
            this.model.destroy();
            $.mobile.changePage($('#settings'), { transition: 'none', reverse: true, changeHash: true });
        },
        performLogging: function() {
            var date = new Date();
            this.log = logs.create({name: this.model.get('name'), start_date: date.toLocaleString(), template: this.model, end_date: 'N/A' });
            this.log.save();
        },
        start_template: function(event) {
            event.preventDefault();
            this.performLogging();
            $('#start-template').hide();
            $('#stop-template').show();
            $('#template-name').textinput('disable');
            $('#schedule-switch').slider('disable');
            $('#accelerometer-switch').slider('disable');
            $('#gps-switch').slider('disable');
            $('#delete-confirm').button('disable');
            $('#add-template-back').hide();
        },
        stop_template: function(event) {
            event.preventDefault();
            var date = new Date();
            this.log.set({ end_date: date.toLocaleString() });
            this.log.save();
            this.log = null;
            $('#template-name').textinput('enable');
            $('#schedule-switch').slider('enable');
            $('#accelerometer-switch').slider('enable');
            $('#gps-switch').slider('enable');
            $('#delete-confirm').button('enable');
            $('#add-template-back').show();
            $('#stop-template').hide();
            $('#start-template').show();
        },
        save_template: function(event) {
            event.preventDefault();
            if($('#template-name').val() === '') {
                alert('Enter a template name before saving');
            } else {
                if(this.model === null) {
                    var template = templates.create({
                        name: $('#template-name').val()
                    });

                    template.get('sensors').add([
                        { name: 'accelerometer', state: $('#accelerometer-switch').val(),
                        frequency: $('#accelerometer-frequency').val() }
                    ]);

                    template.get('sensors').add([
                        { name: 'gps', state: $('#gps-switch').val(),
                            frequency: $('#gps-frequency').val() }
                    ]);
                 
                    if($('#schedule-switch').val() === 'on') {
                        var days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                        var repeat = [];
                        $('.repeat').each(function(index, element) {
                            if($(element).find('.day-check').hasClass('selected')) {
                                repeat.push(days[index]);
                            }
                        });

                        template.set({schedule: {start_date: $('#start-date').val(), start_time: $('#start-time').val(),
                            end_date: $('#end-date').val(), end_time: $('#end-time').val(), repeat: repeat}});
                    }
                 
                    template.save();
                    this.init(template);
                } else {
                    // Update Existing Model
                    var template = this.model;

                    template.set({name: $('#template-name').val()});
                    template.get('sensors').at(0).set({ state: $('#accelerometer-switch').val(),
                        frequency: $('#accelerometer-frequency').val() });
                    template.get('sensors').at(1).set({ state: $('#gps-switch').val(),
                        frequency: $('#gps-frequency').val() });
                    
                    if($('#schedule-switch').val() === 'on') {
                        var days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                        var repeat = [];
                        $('.repeat').each(function(index, element) {
                            if($(element).find('.day-check').hasClass('selected')) {
                                repeat.push(days[index]);
                            }
                        });

                        template.set({schedule: {start_date: $('#start-date').val(), start_time: $('#start-time').val(),
                            end_date: $('#end-date').val(), end_time: $('#end-time').val(), repeat: repeat}});                    } else if($('#schedule-switch').val() == 'off' && template.has('schedule')) {
                        template.unset('schedule');
                    }

                    template.save();
                    this.init(template);
                }
                
                $('#delete-list').show();
                $('#delete-confirm-block').hide();
                $('#stop-template').hide();
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
            if($('#schedule-switch').val() === 'on') {
                $('#stop-template').hide();
                $('#start-template').hide();
                $('#save-template').show();
                $('#schedule-block').show();
            } else {
                $('#stop-template').hide();
                $('#save-template').show();
                $('#schedule-block').hide();
                $('#start-template').hide();
            }
        },
        accelerometer_switch: function(event) {
            event.preventDefault();
            $('#stop-template').hide();
            $('#start-template').hide();
            $('#save-template').show();
        },
        gps_switch: function(event) {
            event.preventDefault();
            $('#stop-template').hide();
            $('#start-template').hide();
            $('#save-template').show();
        },
        template_name: function(event) {
            $('#stop-template').hide();
            $('#start-template').hide();
            $('#save-template').show();
        },
        render: function(eventName) {
            return this;
        },
    });


    var templateListView = new TemplateListView({ model: templates });
    var logListView = new LogListView({ model: logs });
    var addTemplateView = new AddTemplateView();

    var TemplateItemView = Backbone.View.extend({
        tagName: 'li',
        events: {
            'click a': 'template_click'
        },
        template: $('#template-list-item').html(),
        template_click: function(event) {
            event.preventDefault();
            $.mobile.changePage($('#add-template'), { transition: 'none', reverse: false, changeHash: false });
            addTemplateView.init(this.model);
        },
        render: function(eventName) {
            $(this.el).html(Mustache.to_html(this.template, this.model.toJSON()));
            return this;
        }
    });

    var LogItemView = Backbone.View.extend({
        tagName: 'li',
        events: {
            'click a': 'log_click'
        },
        template: $('#log-list-item').html(),
        log_click: function(event) {
            event.preventDefault();
        },
        render: function(eventName) {
            $(this.el).html(Mustache.to_html(this.template, this.model.toJSON()));
            return this;
        }
    });

    var scheduleView = new ScheduleView();
    var repeatView = new RepeatView();
    templates.fetch();
    logs.fetch();

    var Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            'settings': 'settings',
            'logs': 'logs',
            'add-template': 'add_template',
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
            $('#logs-list').listview('refresh');

        },
        add_template: function() {
            $.mobile.changePage($('#add-template'), { transition: 'none', reverse: false, changeHash: false });
            addTemplateView.init(null);
            $('.ui-btn-active').removeClass('ui-btn-active');
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

