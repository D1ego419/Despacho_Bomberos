import { app } from "./firebase.js";

import {
    getMessaging,
    getToken
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js";

import {
    getDatabase,
    ref,
    set
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const messaging = getMessaging(app);
const db = getDatabase(app);

console.log("Notificaciones cargadas");

Notification.requestPermission()
.then(async (permission) => {

    console.log("Permiso:", permission);

    if (permission !== "granted") {

        alert("Permiso de notificaciones rechazado");
        return;

    }

    const token = await getToken(
        messaging,
        {
            vapidKey: "BM3tMy9imALNn3O35QvQJHiwxelhyghNZMCYMQwGxQQWToPjC-QvUcxxKiyLx2e4VlHIWeyRroxphT6ioRYQSI8"
        }
    );

    console.log("TOKEN FCM:");
    console.log(token);

    await set(
        ref(
            db,
            "tokens/" + token.replace(/[.#$/[\]]/g, "_")
        ),
        {
            token: token,
            fecha: new Date().toISOString()
        }
    );

    console.log("Token guardado en Firebase");

});