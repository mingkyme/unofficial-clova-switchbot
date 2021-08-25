const PORT = 2998;
const express = require('express');
const fs = require('fs');
const app = express();
const axios = require('axios').default;

// HTTPS Setting
// const https = require('https');
// const options = {
//     key: fs.readFileSync('../privkey.pem'),
//     cert: fs.readFileSync('../cert.pem'),
//     ca: fs.readFileSync('../fullchain.pem')
// };

// https.createServer(options, app).listen(PORT);
app.listen(PORT); // only http

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/login', function (req, res) {
    res.sendFile(__dirname + "/public/login.html");
});
app.post('/fulfillment', function (req, res) {
    let command = req.body.header.name;
    //let token = req.body.payload.accessToken;
    switch (command) {
        case "DiscoverAppliancesRequest":
            DiscoverAppliancesRequest(req, res);
            break;
        case "TurnOnRequest":
            TurnOnRequest(req, res);
            break;
        case "TurnOffRequest":
            TurnOffRequest(req, res);
            break;
        case "GetCurrentTemperatureRequest":
            GetCurrentTemperatureRequest(req, res);
            break;
        case "GetHumidityRequest":
            GetHumidityRequest(req, res);
            break;
        case "SetTargetTemperatureRequest":
            SetTargetTemperatureRequest(req, res);
            break;
        case "DecrementChannelRequest":
            DecrementChannelRequest(req, res);
            break;
        case "DecrementVolumeRequest":
            DecrementVolumeRequest(req, res);
            break;
        case "IncrementChannelRequest":
            IncrementChannelRequest(req, res);
            break;
        case "IncrementVolumeRequest":
            IncrementVolumeRequest(req, res);
            break;
        case "SetChannelRequest":
            SetChannelRequest(req, res);
            break;
        case "StartOscillationRequest":
            StartOscillationRequest(req, res);
            break;
        default:
            res.sendStatus(403);
            break;
    }
});

app.post('/login', function (req, res) {
    // let response_type = req.body.response_type;
    // let client_id = req.body.client_id;
    // let scope = req.body.scope;
    let redirect_uri = req.body.redirect_uri;
    let state = req.body.state;
    let token = req.body.token;

    let url = decodeURIComponent(redirect_uri) + "?state=" + state + "&code=" + token + "&token_type=Bearer";
    res.redirect(url);
});
app.post('/token', function (req, res) {
    res.send(
        {
            "access_token": req.body.code
        }
    );
});
function DiscoverAppliancesRequest(req, res) {
    let token = req.body.payload.accessToken;
    axios.get('https://api.switch-bot.com/v1.0/devices', { headers: { 'Authorization': token } })
        .then(function (response) {
            // Switchbot devices
            let devices = response.data.body.deviceList;
            let bots = devices.filter(x => x.deviceType == 'Bot');
            let meters = devices.filter(x => x.deviceType == 'Meter');

            // IR Devices
            let irDevices = response.data.body.infraredRemoteList;
            // IR Air Conditioner
            let airConditioners = irDevices.filter(x => x.remoteType == 'Air Conditioner');
            // IR TV
            let tvs = irDevices.filter(x => x.remoteType == 'DIY TV');
            // IR Air Purifier
            let airPurifiers = irDevices.filter(x => x.remoteType == 'DIY Air Purifier');
            // IR Fan
            let fans = irDevices.filter(x => x.remoteType == 'DIY Fan');

            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "unofficial-clova-switchbot";
            resultObject.header.namespace = "unofficial-clova-switchbot";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            resultObject.payload.discoveredAppliances = new Array();

            // Switchbot
            for (let i = 0; i < bots.length; i++) {
                let bot = new Object();
                bot.applianceId = bots[i].deviceId;
                bot.manufacturerName = "switchbot";
                bot.modelName = "switchbot";
                bot.friendlyName = bots[i].deviceName;
                bot.isIr = false;
                bot.actions = ["TurnOn", "TurnOff"];
                bot.applianceTypes = ["SWITCH"];
                resultObject.payload.discoveredAppliances.push(bot);
            }

            // Meter
            for (let i = 0; i < meters.length; i++) {
                let meter = new Object();
                meter.applianceId = meters[i].deviceId;
                meter.manufacturerName = "switchbot";
                meter.modelName = "meter";
                meter.friendlyName = meters[i].deviceName;
                meter.isIr = false;
                meter.actions = ["GetCurrentTemperature", "GetHumidity"];
                meter.applianceTypes = ["AIRSENSOR"];
                resultObject.payload.discoveredAppliances.push(meter);
            }

            // IR Air Conditioner
            for (let i = 0; i < airConditioners.length; i++) {
                let airConditioner = new Object();
                airConditioner.applianceId = airConditioners[i].deviceId;
                airConditioner.manufacturerName = "switchbot";
                airConditioner.modelName = "IR Air Conditioner";
                airConditioner.friendlyName = airConditioners[i].deviceName;
                airConditioner.isIr = true;
                airConditioner.actions = ["TurnOn", "TurnOff", 'SetTargetTemperature'];
                airConditioner.applianceTypes = ["AIRCONDITIONER"];
                resultObject.payload.discoveredAppliances.push(airConditioner);
            }

            // IR TV
            for (let i = 0; i < tvs.length; i++) {
                let tv = new Object();
                tv.applianceId = tvs[i].deviceId;
                tv.manufacturerName = "switchbot";
                tv.modelName = "IR TV";
                tv.friendlyName = tvs[i].deviceName;
                tv.isIr = true;
                tv.actions = ["TurnOn", "TurnOff", 'DecrementChannel', 'DecrementVolume', 'IncrementChannel', 'IncrementVolume', 'SetChannel'];
                tv.applianceTypes = ["SMARTTV"];
                resultObject.payload.discoveredAppliances.push(tv);
            }

            // IR Air Purifier
            for (let i = 0; i < airPurifiers.length; i++) {
                let airPurifier = new Object();
                airPurifier.applianceId = airPurifiers[i].deviceId;
                airPurifier.manufacturerName = "switchbot";
                airPurifier.modelName = "IR Air Purifier";
                airPurifier.friendlyName = airPurifiers[i].deviceName;
                airPurifier.isIr = true;
                airPurifier.actions = ["TurnOn", "TurnOff"];
                airPurifier.applianceTypes = ["AIRPURIFIER"];
                resultObject.payload.discoveredAppliances.push(airPurifier);
            }

            // IR Fan
            for (let i = 0; i < fans.length; i++) {
                let fan = new Object();
                fan.applianceId = fans[i].deviceId;
                fan.manufacturerName = "switchbot";
                fan.modelName = "IR Fan";
                fan.friendlyName = fans[i].deviceName;
                fan.isIr = true;
                fan.actions = ["TurnOn", "TurnOff", 'StartOscillation'];
                fan.applianceTypes = ["FAN"];
                resultObject.payload.discoveredAppliances.push(fan);
            }
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        })
}
function TurnOnRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    axios.post('https://api.switch-bot.com/v1.0/devices/' + applianceId + "/commands", { "command": "turnOn", "parameter": "default", "commandType": "command" }, { headers: { 'Authorization': token } })
        .then(function (response) {
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "TurnOnConfirmation";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        });

}
function TurnOffRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    axios.post('https://api.switch-bot.com/v1.0/devices/' + applianceId + "/commands", { "command": "turnOff", "parameter": "default", "commandType": "command" }, { headers: { 'Authorization': token } })
        .then(function (response) {
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "TurnOffConfirmation";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);

        });

}

function GetCurrentTemperatureRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    axios.get('https://api.switch-bot.com/v1.0/devices/' + applianceId + '/status', { headers: { 'Authorization': token } })
        .then(function (response) {
            // response.data.body.temperature
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "GetCurrentTemperatureResponse";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            resultObject.payload.currentTemperature = new Object();
            resultObject.payload.currentTemperature.value = response.data.body.temperature;
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        });
}
function GetHumidityRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    axios.get('https://api.switch-bot.com/v1.0/devices/' + applianceId + '/status', { headers: { 'Authorization': token } })
        .then(function (response) {
            // response.data.body.humidity
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "GetHumidityResponse";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            resultObject.payload.humidity = new Object();
            resultObject.payload.humidity.value = response.data.body.humidity;
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        });
}
function SetTargetTemperatureRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    let wantTemperature = req.body.payload.targetTemperature.value;
    axios.post('https://api.switch-bot.com/v1.0/devices/' + applianceId + "/commands", { "command": "setAll", "parameter": wantTemperature+",2,4,on", "commandType": "command" }, { headers: { 'Authorization': token } })
        .then(function (response) {
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "SetTargetTemperatureConfirmation";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        });
}
function DecrementChannelRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    axios.post('https://api.switch-bot.com/v1.0/devices/' + applianceId + "/commands", { "command": "channelSub", "parameter": "default", "commandType": "command" }, { headers: { 'Authorization': token } })
        .then(function (response) {
            // response.data.body.humidity
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "DecrementChannelConfirmation";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        });
}
function DecrementVolumeRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    axios.post('https://api.switch-bot.com/v1.0/devices/' + applianceId + "/commands", { "command": "volumeSub", "parameter": "default", "commandType": "command" }, { headers: { 'Authorization': token } })
        .then(function (response) {
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "DecrementVolumeConfirmation";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        });
}
function IncrementChannelRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    axios.post('https://api.switch-bot.com/v1.0/devices/' + applianceId + "/commands", { "command": "channelAdd", "parameter": "default", "commandType": "command" }, { headers: { 'Authorization': token } })
        .then(function (response) {
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "IncrementChannelConfirmation";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        });
}
function IncrementVolumeRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    axios.post('https://api.switch-bot.com/v1.0/devices/' + applianceId + "/commands", { "command": "volumeAdd", "parameter": "default", "commandType": "command" }, { headers: { 'Authorization': token } })
        .then(function (response) {
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "IncrementVolumeConfirmation";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        });
}
function SetChannelRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    let wantChannel = req.body.payload.channel;
    axios.post('https://api.switch-bot.com/v1.0/devices/' + applianceId + "/commands", { "command": "SetChannel", "parameter": wantChannel, "commandType": "command" }, { headers: { 'Authorization': token } })
        .then(function (response) {
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "SetChannelConfirmation";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        });
}
function StartOscillationRequest(req, res) {
    let token = req.body.payload.accessToken;
    let applianceId = req.body.payload.appliance.applianceId;
    axios.post('https://api.switch-bot.com/v1.0/devices/' + applianceId + "/commands", { "command": "swing", "parameter": "default", "commandType": "command" }, { headers: { 'Authorization': token } })
        .then(function (response) {
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "StartOscillationConfirmation";
            resultObject.header.payloadVersion = "1.0";
            resultObject.payload = new Object();
            res.send(resultObject);
        })
        .catch(function (error) {
            console.log(error);
            res.sendStatus(403);
        });
}