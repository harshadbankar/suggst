
Project Variables:
    1. vapidKeysGenerated:
         {"publicKey":"BJA_1G1ephQab5m2znLpRIhzDpl_O9zOHacOpH2lxoQNvpw2wtkge3iO0bQnw4Kep1SHJ5SgvAlx4CidEzHbV3s",
         "privateKey":"vCDB_3unryWonxzhpnFxsHzrxGOvhoqTYGzH5opQO-w"}


To Improve:

1. Check how to remove old subscription list for any client, when new subscription object comes in for same browser

- Errors to resolve:

1. Check UI bug in case of notification blocked by user
2. Check why for some users, auth parameter is not coming in notification subscription json error is coming :
      Logs:

        Sending push notification to user {"endpoint":"https://android.googleapis.com/gcm/send/cp1Ia_-Ex6g:APA91bFzlqJZbfFPwFBo8AFA1d3UtLDoxQugvOYhyuK-fW3EV43WkJeLQpFhkvxBIkdD6sR7E5KfHTignRVtQPBAHeBUg9z87y2B9Umsj58W_EuQ2wfiA8HFDcR-lplObAROyH2oFiFt","addedOn":"2016-12-12T18:07:33.056Z","_id":"584ee76520cc45ae3238082d"}
        /var/lib/openshift/584dbf2489f5cfd6050001c1/app-root/runtime/repo/node_modules/mongodb/lib/utils.js:98
            process.nextTick(function() { throw err; });
                                          ^
        TypeError: Cannot read property 'auth' of undefined
3. Check out why this error is coming :

        (node:342493) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): WebPushError: Received unexpected response code
        (node:342493) DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
        (node:342493) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 2): WebPushError: Received unexpected response code


- Functionality:

NodeJs API:

1. POST /notifyapi/sendNotificationSubscription :
 Request :
    {
        endpoint: "https://fcm.googleapis.com/fcm/send/dQq-KGAJxQU:APA91bHvkR138gjUj2yZ4ySgMCzMxPg85QHvcb_qS1shtkJ18iybAHryyo2fPXGo5L9WoGXR4t-HBwJNaLx8jJzqfLkzl6M3QgxAubtyZrWfeYbRA5QQbnrvqbUC5TqZCwGhTVkTbFhe"
        notificationText: "hello"
    }
  Response:
    {"status":"OK"}

  Functionality: This POST request will send notification to given Request subscription object

2. POST /notifyapi/addNotificationSubscription :
 Request:
 {
 	endpoint: "https://fcm.googleapis.com/fcm/send/dqXu4PsOUno:APA91bFDi4sIzuT1pWOZdT3zlb3Ucnx61nqnJ4ZUKwWACotUQDjWwvIaVoTcUHFbpBAIamInxcrp9XMjh1k3YuudxDpCEyW1GVUmPVLnLIJBYdY_5JIWJwhQE5IHF5E1uvk51UdIhTBt"
 	keys: {
 		auth: "e9GmLTNz604dhwi6JzArnQ=="
 		p256dh: "BFSc6k_G8CjlNSSiaKLZq9HWi3T6TWWV7REJHzYGoHtwDhwrrMgT2MZVhVRGwsdLMVcrDu1q81-exH8_8rhO4Zg="
 	}
 }
 Response:
    {"status":"OK"}

 Functionality: This request will save subscription to mongodb

3. GET /notifyapi/sendToAll

  Request:
    URL PARAM:
       a. msg - to send message to all subscribed users
  Response: {"status":"OK"}
