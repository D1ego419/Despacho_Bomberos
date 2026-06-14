importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js");

firebase.initializeApp({

  apiKey: "AIzaSyBliO3lZa5Sh5OTobqqlpJvyuWuGE0kl0A",
  authDomain: "despacho-bomberos-2fa34.firebaseapp.com",
  projectId: "despacho-bomberos-2fa34",
  storageBucket: "despacho-bomberos-2fa34.firebasestorage.app",
  messagingSenderId: "669224408858",
  appId: "1:669224408858:web:13f8e016f183663c65bea3"

});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

    self.registration.showNotification(
        payload.notification.title,
        {
            body: payload.notification.body,
            icon: "/icon-192.png"
        }
    );

});