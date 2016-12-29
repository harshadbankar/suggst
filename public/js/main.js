'use strict';

var app = angular.module("pushNotification", ['ui.router']);
var apiNotification = {
    "addNotificationSubscription": "notifyapi/addNotificationSubscription",
    "sendNotificationSubscription": "notifyapi/sendNotificationSubscription"
};

const applicationServerPublicKey = 'BGHtDtk4JkbYaAurSc1UqT_1YATyxcrsh9CFfd_XZAXgiQzj4gc37oBsZuJ3985xfbpFc8l49LLYcLeyH3nfaBA';


var isSubscribed = false;
var swRegistration = null;

app.config(function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/notify');

    $stateProvider
        .state('create-space', {
            url: '/create-space',
            templateUrl: '../templates/create-space.html',
            controller: 'mydetailsController'
        })
        .state('add-name', {
            url: '/add-name',
            templateUrl: '../templates/add-name.html',
            controller: 'mydetailsController'
        })
        .state('notification', {
            url: '/notify',
            templateUrl: '../templates/notify.html',
            controller: 'notificationController'
        })
        .state('mydetails', {
            url: '/mydetails',
            templateUrl: '../templates/mydetails.html',
            controller: 'mydetailsController'
        });

});

app.controller('mydetailsController', function ($scope, $http, $state) {

});

app.controller('notificationController', function ($scope, $http, $state) {

    $scope.sendNotifyBtnFlag = false;
    $scope.noSupport = false;
    $scope.messageToSend = "";

    $scope.pushNotificationSupported = true;
    $scope.userPermission = false;

    $scope.registerWebWorker = function () {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            console.log('Service Worker and Push is supported');

            navigator.serviceWorker.register('sw.js')
                .then(function (swReg) {
                    console.log('Service Worker is registered', swReg);

                    //Manifest file:

                    var head = document.head;
                    var noManifest = true;
                    // Walk through the head to check if a manifest already exists
                    for (var i = 0; i < head.childNodes.length; i++) {
                        if (head.childNodes[i].rel === 'manifest') {
                            noManifest = false;
                            break;
                        }
                    }
                    // If there is no manifest already, add one.
                    if (noManifest) {
                        var manifest = document.createElement('link');
                        manifest.rel = 'manifest';
                        manifest.href = 'manifest.json';
                        document.head.appendChild(manifest);
                    }

                    swRegistration = swReg;

                    initialiseUI();
                })
                .catch(function (error) {
                    console.error('Service Worker Error', error);
                });
        } else {
            $scope.pushNotificationSupported = false;
            console.warn('Push messaging is not supported');
        }
    };

    $scope.registerWebWorker();

    function initialiseUI() {

        // Set the initial subscription value
        swRegistration.pushManager.getSubscription()
            .then(function (subscription) {
                isSubscribed = !(subscription === null);
                if (isSubscribed) {
                    console.log('User is subscribed.');
                    $scope.userPermission = true;
                } else {
                    console.log('User is NOT subscribed.');
                    subscribeUser();
                }
            });
    }

    $scope.sendNotification = function (msg) {
        if(document.getElementById('user').value != '' || msg != '') {
            console.log("Message to send : %s %s", document.getElementById('user').value,msg); // TODO: inspect while value is null for this by model
            swRegistration.pushManager.getSubscription()
                .then(function (subscription) {
                    if(subscription !== undefined || subscription !== null || subscription !== 'null'){
                        $http({
                            method: 'POST',
                            url: apiNotification.sendNotificationSubscription,
                            data: JSON.stringify({
                                notificationText: document.getElementById('user').value || msg,
                                endpoint: subscription.endpoint
                            })
                        }).then(function successCallback(response) {
                                $scope.sendNotifyBtnFlag = true;
                                if (response.data) {
                                    console.log('Notification send Success: ' + JSON.stringify(response.data));
                                }
                            },
                            function (response) {
                                console.log('Notification send failed : ' + JSON.stringify(response.data));
                            });
                    }

                });
        }
    };
    function updateSubscriptionOnServer(subscription) {
        // TODO: Send subscription to application server

        if (subscription !== null) {
            $http({
                method: 'POST',
                url: apiNotification.addNotificationSubscription,
                data: JSON.stringify(subscription)
            }).then(function successCallback(response) {
                    $scope.sendNotifyBtnFlag = true;
                    if (response.data) {
                        $scope.sendNotifyBtnFlag = true;
                        console.log('addNotificationSubscription Success: ' + JSON.stringify(response.data));
                        $scope.sendNotification('Welcome to next gen notification');
                    }
                },
                function (response) {
                    console.log('addNotificationSubscription failed : ' + JSON.stringify(response.data));
                });
        }
    }
    $scope.enablePushNotification = function () {
        if(swRegistration != null) {
            subscribeUser();
        }
        else {
            $scope.registerWebWorker();
        }

    };
    function subscribeUser() {
        Notification.requestPermission().then(function (result) {
            if (result === 'denied') {
                console.log('Permission wasn\'t granted. Allow a retry.');
                $scope.userPermission = true;
                return;
            }
            if (result === 'default') {
                console.log('The permission request was dismissed.');
                $scope.userPermission = true;
                return;
            }

            // Do something with the granted permission.
            $scope.userPermission = false;
            const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
            swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                })
                .then(function (subscription) {
                    console.log('User is subscribed:', subscription);
                    updateSubscriptionOnServer(subscription);
                })
                .catch(function (err) {
                    alert('Failed to subscribe for push notification, please try again');
                });
        });

    }

    function urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (var i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

});
