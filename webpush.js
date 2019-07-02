'use strict';

function WebPushManager() {
    var self = this;

    self.swRegistration = null;
    self.isSubscribed = null;

    self.publicKey = 'BDE3WO6wwPHIJs_gsiEpuuCwx-A-2xlFZGZOOKLVWDIiGOmz1k4f6S6UheflauLBDtqUNCAeroGICKx0s3gUYTc';

    self.init = function (callback) {
        return navigator.serviceWorker.register('/worker.js')
            .then(function(registration) {
                self.swRegistration = registration;

                return registration.pushManager.getSubscription();
            })
            .then(function (subscription) {
                self.isSubscribed = !!subscription;

                if (callback) {
                    callback();
                }
            });
    };

    self.subscribeUser = function (callback) {
        return self.swRegistration.pushManager.getSubscription()
            .then(function (subscription) {
                if (!subscription) {
                    var subscribeOptions = {
                        userVisibleOnly: true,
                        applicationServerKey: self.urlBase64ToUint8Array(self.publicKey)
                    };

                    return self.swRegistration.pushManager.subscribe(subscribeOptions);
                } else {
                    return null;
                }
            })
            .then(function(pushSubscription) {
                self.isSubscribed = !!pushSubscription;

                if (!pushSubscription) {
                    return null;
                }

                console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
                self.sendSubscriptionToBackEnd(pushSubscription, false);

                if (callback) {
                    callback(pushSubscription);
                }

                return pushSubscription;
            });
    };

    self.unsubscribeUser = function (callback) {
        if (!self.swRegistration || !self.isSubscribed) {
            return null;
        }

        self.swRegistration.pushManager.getSubscription()
            .then(function(subscription) {
                if (subscription) {
                    self.sendSubscriptionToBackEnd(subscription, true);
                    return subscription.unsubscribe();
                }
            })
            .catch(function(error) {
                console.log('Error unsubscribing', error);
            })
            .then(function() {
                console.log('User is unsubscribed.');
                self.isSubscribed = false;

                if (callback) {
                    callback();
                }
            });
    };

    self.urlBase64ToUint8Array = function (base64String) {
        var padding = '='.repeat((4 - base64String.length % 4) % 4);
        var base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        var rawData = window.atob(base64);
        var outputArray = new Uint8Array(rawData.length);

        for (var i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }

        return outputArray;
    };

    self.sendSubscriptionToBackEnd = function (subscription, unsubscribe) {
        var xmlhttp = new XMLHttpRequest();

        xmlhttp.open("POST", unsubscribe ? "https://webpushbuilder.com/subscription/NqZEwzWL/unsubscribe" : "https://webpushbuilder.com/subscription/NqZEwzWL/subscribe");
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(JSON.stringify(subscription));
    }
}
if ('serviceWorker' in navigator && 'PushManager' in window) {
    var wpm = new WebPushManager();

    wpm.init(function () {
        wpm.subscribeUser();
    });
}
