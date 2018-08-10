$(function () {
    document.addEventListener("deviceready", function(){
        app.initialize();
    });
})

var app = {
    initialize: function() {
        this.bindEvents();

        this.geolocation();
    },
    
    bindEvents: function() {
        var root = this;

        $('.bar .icon-refresh').on('click', function(){
            root.initialize();
        })
    },

    geolocation: function() {
        var root = this;
        navigator.geolocation.getCurrentPosition(function(position){
            $('.latitude').text(position.coords.latitude);
            $('.longitude').text(position.coords.longitude);
            root.getCurrentWeather(position.coords.latitude, position.coords.longitude);
            root.getForecastWeather(position.coords.latitude, position.coords.longitude);
        },function(err){
            console.log(err)
            $.alert(err.message);
        },{ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
    },

    getCurrentWeather: function(latitude, longitude) {
        var root = this;

        var API_KEY = "DFJBGoKTUscFmkhe";

        var requestUrl = "https://api.caiyunapp.com/v2/" + API_KEY + "/" + longitude + "," + latitude + "/realtime.json";
        $.ajax({
            type: 'GET',
            url: requestUrl,
            success: function(data){
                if (data.status != 'ok') {
                    $.alert(JSON.stringify(data));
                    return;    
                }
                $('#current-weather .desc').html(root.getDescOfWeather(data.result.skycon, data.result.precipitation.local.intensity));
                $('#current-weather .temperature span').html(data.result.temperature);
                $('#current-weather .aqi span').html(data.result.aqi);
                $('#current-weather .time span').html(root.formatDate(data.server_time));
            },
            error: function(){
            }
        })
    },

    getForecastWeather: function(latitude, longitude) {
        var root = this;
        
        var API_KEY = "DFJBGoKTUscFmkhe";

        var requestUrl = "https://api.caiyunapp.com/v2/" + API_KEY + "/" + longitude + "," + latitude + "/forecast.json";
        $.ajax({
            type: 'GET',
            url: requestUrl,
            success: function(data){
                if (data.status != 'ok') {
                    $.alert(JSON.stringify(data));
                    return;    
                }
                $('#forecast-weather .time span').html(root.formatDate(data.server_time));

                $('#tab1 .description').html(data.result.hourly.description);
                $('#tab3 .description').html(data.result.minutely.description);

                var tab1Html = "";
                $.each(data.result.hourly.skycon, function(i, e){
                    if (root.getNowFormatDate() == e.datetime.substring(0, 10)) {
                        if (i%4 == 0) {
                            tab1Html += '<div class="row">';
                        }
                        tab1Html += '<div class="col-25"><div>' + e.datetime.substring(11, 13) + '时</div><div>' + root.getDescOfWeather(e.value, data.result.hourly.precipitation[i].value) + '</div></div>';
                        if (i%4 == 3) {
                            tab1Html += '</div>';
                        }
                        if (i+1 == data.result.hourly.skycon.length && i%4 != 3) {
                            tab1Html += '</div>';
                        }
                    }
                })

                $('#tab1 .divide-line').next().remove();
                $('#tab1 .divide-line').after(tab1Html);

                var tab2Html = "";

                for (var i = 0; i < 5; i++) {
                    tab2Html += '<div class="card"><div class="card-content">' + 
                    '<div class="card-header">' + data.result.daily.skycon[i].date + '</div>' + 
                    '<div class="card-content-inner"><div class="row">' + 
                    '<div class="col-33">' + data.result.daily.temperature[i].min + '°~' + data.result.daily.temperature[i].max + '°</div>' + 
                    '<div class="col-20">' + root.getDescOfWeather(data.result.daily.skycon[i].value) + 
                    '</div><div class="col-45">空气质量 ' + data.result.daily.aqi[i].min + '~' + data.result.daily.aqi[i].max + '</div></div></div></div></div>'
                }

                $('#tab2 .content-block').html(tab2Html);

                root.getOneHourChart(data.result.minutely.precipitation);
            },
            error: function(){
            }
        })
    },

    getDescOfWeather: function(skycon, precipitation) {
        if (skycon == 'CLEAR_DAY') return "晴天";
        if (skycon == 'CLEAR_NIGHT') return "晴夜";
        if (skycon == 'PARTLY_CLOUDY_DAY') return "多云";
        if (skycon == 'PARTLY_CLOUDY_NIGHT') return "多云";
        if (skycon == 'CLOUDY') return "阴";
        if (skycon == 'RAIN') {
            if (parseFloat(precipitation) >= 0.05 && parseFloat(precipitation) <= 0.9) {
                return "小雨";
            }
            if (parseFloat(precipitation) > 0.9 && parseFloat(precipitation) <= 2.87) {
                return "中雨";
            }
            if (parseFloat(precipitation) > 2.87) {
                return "大雨";
            }
            return "雨";
        }
        if (skycon == 'SNOW') return "雪";
        if (skycon == 'WIND') return "风";
        if (skycon == 'HAZE') return "雾霾沙尘";
    },

    formatDate: function(timestamp) {
        var date = new Date(timestamp*1000);
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var minute = date.getMinutes();
        return month + "/" + day + "  " + hour + ":" + minute;
    },

    getNowFormatDate: function() {
        var date = new Date();
        var seperator1 = "-";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        var currentdate = year + seperator1 + month + seperator1 + strDate;
        return currentdate;
    },

    getOneHourChart: function(precipitation) {
        var ctx = document.getElementById("myChart").getContext('2d');

        var data = [precipitation[0], precipitation[5], precipitation[10], precipitation[15], precipitation[20], precipitation[25], precipitation[30], precipitation[35], precipitation[40], precipitation[45], precipitation[50], precipitation[55], precipitation[60]]

        var config = {
            type: 'line',
            data: {
                labels: ['0', '10', '20', '30', '40', '50', '60'],
                datasets: [{
                    label: '0.03-0.25小雨，0.25-0.35中雨, 0.35以上大雨',
                    backgroundColor: "#0894ec",
                    borderColor: "#0894ec",
                    data: precipitation,
                    fill: false,
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: '未来一小时降雨量'
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    xAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: '分钟'
                        }
                    }],
                    yAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: '降雨量'
                        }
                    }]
                }
            }
        };
        var myChart = new Chart(ctx, config);
    }
};
