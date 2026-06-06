import { app } from "./firebase.js";

import {
    getDatabase,
    ref,
    update
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const db = getDatabase(app);

document
.getElementById("btnGPS")
.addEventListener("click", () => {

    const unidad =
    document.getElementById("unidad").value;

    navigator.geolocation.watchPosition(

        (position) => {

            update(
                ref(db, "unidades/" + unidad),
                {
                    estado: "En Ruta",

                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
            );

            console.log(
                position.coords.latitude,
                position.coords.longitude
            );

        },

        (error) => {
            alert("GPS no disponible");
            console.error(error);
        },

        {
            enableHighAccuracy: true
        }

    );

});