import { app } from "./firebase.js";

import {
    getDatabase,
    ref,
    push,
    onValue,
    update
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const db = getDatabase(app);

/* MAPA */

const map = L.map('map').setView([-36.6066, -72.1034], 12);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19
    }
).addTo(map);

L.marker([-36.6066, -72.1034])
.addTo(map)
.bindPopup("Central de Bomberos");

/* CAMBIAR ESTADO */

window.cambiarEstado = function(id, estado){

    update(
        ref(db, "emergencias/" + id),
        {
            estado: estado
        }
    );

}

/* TABLA */

const tablaBody =
document.getElementById("tablaBody");

/* BOTÓN DESPACHAR */

document
.getElementById("btnDespachar")
.addEventListener("click", () => {

    const direccion =
    document.getElementById("direccion").value;

    const tipo =
    document.getElementById("tipo").value;

    const compania =
    document.getElementById("compania").value;

    const unidad =
    document.getElementById("unidad").value;

    push(ref(db, "emergencias"), {

        direccion,
        tipo,
        compania,
        unidad,

        estado: "ACTIVA",

        hora: new Date().toLocaleTimeString()

    });

});

/* CARGAR EMERGENCIAS */

onValue(
ref(db, "emergencias"),
(snapshot) => {

    tablaBody.innerHTML = "";

    const datos = snapshot.val();

    if(!datos) return;

    let numero = 1;

    for(let id in datos){

        let fila =
        document.createElement("tr");

        fila.innerHTML = `

        <td>${numero}</td>
        <td>${datos[id].tipo}</td>
        <td>${datos[id].direccion}</td>
        <td>${datos[id].compania}</td>
        <td>${datos[id].unidad}</td>
        <td>${datos[id].hora}</td>
        <td>${datos[id].estado}</td>

        <td>

        <button onclick="cambiarEstado('${id}','EN RUTA')">
        Ruta
        </button>

        <button onclick="cambiarEstado('${id}','EN TRABAJO')">
        Trabajo
        </button>

        <button onclick="cambiarEstado('${id}','CONTROLADA')">
        Controlada
        </button>

        <button onclick="cambiarEstado('${id}','CERRADA')">
        Cerrar
        </button>

        </td>
        `;

        tablaBody.appendChild(fila);

        numero++;

    }

});