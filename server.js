var express = require('express');
var app = require('express')();
//Load the request module
var request = require('request');
var http = require('http').Server(app);


var io = require('socket.io')(http);
var databaseName = 'chargeandmove';

// default to a 'localhost' configuration:
var connection_string = '127.0.0.1:27017/moveandcharge';
// if OPENSHIFT env variables are present, use the available connection info:
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
        process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
        process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
        process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
        process.env.OPENSHIFT_APP_NAME;
}

var mongojs = require('mongojs');
var db = mongojs(connection_string);

var notificationCollection = db.collection('notificationCollection');
var vapidKeyCollection = db.collection('vapidKeyCollection');

//remove all rows from code
// notificationCollection.remove()
// vapidKeyCollection.remove();

db.on('error', function (err) {
    console.log('database error', err)
});

db.on('connect', function () {
    console.log('database connected')
});

var webpush = require('web-push');

//from firebase
var gcmApiKey = 'AAAArCJxczc:APA91bFXVrYh65BH2FQwFkoFiSosADf4jXMQHxXUkKC_4NL25TfGAVxqm06xvGg01L7oqSaBhyV4jAvx8vEtyoCy8hMz75XSYBMzSWn_XDYE8Wkni32Hk_mnUt6fAT8L_Ssl4-z64HFdKGRz4VI_9lsIAgf2NLl5fg';
var gcmApiKeyLegacy = 'AIzaSyBLHrOWtK5M7xrzhtDsXiVclKePqgx6YKQ';

app.use(express.static('public'));
var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
if (typeof ipaddress === "undefined") {
    //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
    //  allows us to run/test the app locally.
    console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
    ipaddress = "127.0.0.1";
}
;

http.listen(port, ipaddress, function () {
    console.log('%s: Suggst Node server started on %s:%d ...',
        Date(Date.now()), ipaddress, port);

    // push notification code :

    //configure notification plugin

    //var vapidKeysGenerated = webpush.generateVAPIDKeys();
    //console.log('vapidKeysGenerated: ' + JSON.stringify(vapidKeysGenerated));
    webpush.setGCMAPIKey(gcmApiKeyLegacy);

    webpush.setVapidDetails(
        'mailto:bankarharshad91@gmail.com',
        'BGHtDtk4JkbYaAurSc1UqT_1YATyxcrsh9CFfd_XZAXgiQzj4gc37oBsZuJ3985xfbpFc8l49LLYcLeyH3nfaBA',
        'MVG_PyAt8myoBzMusQx9_tkpbb-IfTn8ukiuUYaLXQg'
    );
});


app.post('/notifyapi/addNotificationSubscription', function (req, res) {
    var buffer = [];
    req.on('data', function (chunk) {
        buffer.push(chunk);
    });

    var trueResponse = {
        statusCode: 200,
        headers: {
            'content-type': 'application/json'
        },
        body: {
            status: 'OK'
        }
    }

    var falseResponse = {
        statusCode: 400,
        headers: {
            'content-type': 'application/json'
        },
        body: {
            status: 'NO'
        }
    }
    req.on('end', function () {
        var payload = {};
        try {
            payload = JSON.parse(Buffer.concat(buffer).toString());
            console.log("received notification data to add : " + JSON.stringify(payload));
        } catch (e) {
        }

        notificationCollection.find({endpoint: payload.endpoint}).toArray(function (err, allMsg) {

            if (allMsg.length == 0) {

                var tempDateTime = new Date();
                payload.addedOn = tempDateTime;
                console.log('Saving pushnotification data: %s', JSON.stringify(payload));
                notificationCollection.insert(payload, function (error, result) {
                    if (error) {
                        console.log('Error while adding notification data for user %s', payload.endpoint);
                        res.writeHead(falseResponse.statusCode, falseResponse.headers);
                        res.end(JSON.stringify({status: "Error in mongo DB while adding this device for push notification"}));
                    }
                    else {
                        console.log('Notification data added successfully for user %s on %s', payload.endpoint, tempDateTime);
                        res.writeHead(trueResponse.statusCode, trueResponse.headers);
                        res.end(JSON.stringify(trueResponse.body));
                    }
                });
            }
            else {
                console.log('notification data for user %s is already added for endpoint %s', payload.endpoint, payload.endpoint);
                res.writeHead(falseResponse.statusCode, falseResponse.headers);
                res.end(JSON.stringify({status: "This device is already added for notification"}));

            }
        })
    });

});

app.post('/notifyapi/sendNotificationSubscription', function (req, res) {
    var buffer = [];
    req.on('data', function (chunk) {
        buffer.push(chunk);
    });

    var trueResponse = {
        statusCode: 200,
        headers: {
            'content-type': 'application/json'
        },
        body: {
            status: 'OK'
        }
    }

    var falseResponse = {
        statusCode: 400,
        headers: {
            'content-type': 'application/json'
        },
        body: {
            status: 'NO'
        }
    }
    req.on('end', function () {
        var payload = {};
        try {
            payload = JSON.parse(Buffer.concat(buffer).toString());
            console.log("To Send notification : " + JSON.stringify(payload));
        } catch (e) {
        }


        if (payload.endpoint !== '') {
            notificationCollection.find({endpoint: payload.endpoint}).toArray(function (err, allMsg) {

                if (allMsg.length == 0) {
                    console.log('No notification data present in db');
                    res.writeHead(falseResponse.statusCode, falseResponse.headers);
                    res.end(JSON.stringify({status: "No notification data present in db"}));
                }
                else {
                    for (var i = 0; i < allMsg.length; i++) {
                        var jsonException = false;
                        var tempNotficationData = allMsg[i];
                        var userDeviceCount = 0;
                        console.log("temp data to compare: %s", JSON.stringify(tempNotficationData));
                        console.log('Sending push notification to user %s', JSON.stringify(tempNotficationData));
                        var pushSubscription=undefined;
                        try {
                            pushSubscription = {
                                endpoint: tempNotficationData.endpoint,
                                keys: {
                                    auth: tempNotficationData.keys.auth,
                                    p256dh: tempNotficationData.keys.p256dh
                                }
                            };
                            userDeviceCount++;
                            webpush.sendNotification(pushSubscription, payload.notificationText || 'Welcome to New notification world');
                            console.log('Sent notification to user: %s', payload.endpoint);
                            if (i == allMsg.length - 1 && !jsonException) {
                                console.log('Sent notification to all %s devices of user', userDeviceCount);
                                userDeviceCount = 0;
                                res.writeHead(trueResponse.statusCode, trueResponse.headers);
                                res.end(JSON.stringify(trueResponse.body));

                            }
                        }
                        catch (e){
                            jsonException = true;
                            res.writeHead(falseResponse.statusCode, falseResponse.headers);
                            res.end(JSON.stringify({status: "Sorry, something went wrong"}));
                        }

                    }

                }
            });
        }
        else {
            res.writeHead(falseResponse.statusCode, falseResponse.headers);
            res.end(JSON.stringify({status: "Invalid Request"}));
        }
    })
});


app.get('/notifyapi/sendToAll', function (req, res) {

    res.writeHead(200, {
        'content-type': 'application/json'
    });

    notificationCollection.find().toArray(function (err, allMsg) {

        if (allMsg.length == 0) {
            console.log('No notification data present in db');
            res.end(JSON.stringify({status: "No notification data present in db"}));
        }
        else {
            for (var i = 0; i < allMsg.length; i++) {
                var tempNotficationData = allMsg[i];

                console.log('Sending push notification to user %s', JSON.stringify(tempNotficationData));
                try {
                    var pushSubscription = {
                        endpoint: tempNotficationData.endpoint,
                        keys: {
                            auth: tempNotficationData.keys.auth,
                            p256dh: tempNotficationData.keys.p256dh
                        }
                    };

                    webpush.sendNotification(pushSubscription, req.query.msg || 'Welcome to New notification world');
                    console.log('Sent notification to user: %s', tempNotficationData.endpoint);
                    if (i == allMsg.length - 1) {
                        console.log('Sent notification to all of the users');
                        res.end(JSON.stringify({status:"OK"}));
                    }
                }
                catch (e) {
                    res.end(JSON.stringify({status: "Sorry, Something went wrong"}));
                }


            }

        }
    });
});
