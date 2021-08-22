const PORT = 2998;
const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();
const axios = require('axios').default;
const options = {
    key: fs.readFileSync('../privkey.pem'),
    cert: fs.readFileSync('../cert.pem'),
    ca: fs.readFileSync('../fullchain.pem')
};
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

https.createServer(options, app).listen(PORT);
app.get('/login', function (req, res) {
    res.sendFile(__dirname + "/public/login.html");
});
app.post('/fulfillment', function (req, res) {
    // let command = req.body.header.name;
    // let token = req.body.payload.accessToken;
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
            let bots = response.data.body.deviceList.filter(x => x.deviceType == 'Bot');
            let resultObject = new Object();
            resultObject.header = new Object();
            resultObject.header.messageId = req.body.header.messageId;
            resultObject.header.name = "unofficial-clova-switchbot";
            resultObject.header.namespace = "unofficial-clova-switchbot",
                resultObject.header.payloadVersion = "1.0"
            resultObject.payload = new Object();
            resultObject.payload.discoveredAppliances = new Array();

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