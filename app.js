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

/* =========================
   MAPA
========================= */

const map = L.map('map').setView([-36.6066, -72.1034], 12);

const marcadores = L.layerGroup().addTo(map);
const marcadoresUnidades = L.layerGroup().addTo(map);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19
    }
).addTo(map);

L.marker([-36.6066, -72.1034])
.addTo(map)
.bindPopup("Central de Bomberos");

/* =========================
   DASHBOARD
========================= */

const totalEmergencias =
document.getElementById("totalEmergencias");

const totalDisponibles =
document.getElementById("totalDisponibles");

const totalRuta =
document.getElementById("totalRuta");

const totalIncendios =
document.getElementById("totalIncendios");

/* =========================
   TABLAS
========================= */

const tablaBody =
document.getElementById("tablaBody");

const tablaUnidades =
document.getElementById("tablaUnidades");

/* =========================
   CAMBIAR ESTADO EMERGENCIAS
========================= */

window.cambiarEstado = function(id, estado){

    update(
        ref(db, "emergencias/" + id),
        {
            estado: estado
        }
    );

};

/* =========================
   CAMBIAR ESTADO UNIDADES
========================= */

window.cambiarEstadoUnidad = function(unidad, estado){

    update(
        ref(db, "unidades/" + unidad),
        {
            estado: estado
        }
    );

};

/* =========================
   BOTÓN DESPACHAR
========================= */

document
.getElementById("btnDespachar")
.addEventListener("click", () => {

    const direccion =
    document.getElementById("direccion").value.trim();

    const tipo =
    document.getElementById("tipo").value;

    const compania =
    document.getElementById("compania").value;

    const unidad =
    document.getElementById("unidad").value;

    if(!direccion){

        alert("Ingrese una dirección");
        return;

    }

 fetch(
`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(direccion)}&format=jsonv2&limit=1`
)
.then(res => res.json())
.then(data => {

    console.log("Nominatim:", data);

    let lat = -36.6066;
    let lng = -72.1034;

    if(data.length > 0){

        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);

    }

    console.log("Latitud:", lat);
    console.log("Longitud:", lng);

    push(ref(db, "emergencias"), {

        direccion,
        tipo,
        compania,
        unidad,

        lat,
        lng,

        estado: "ACTIVA",

        hora: new Date().toLocaleTimeString()

    });

})
.catch(error => {
    console.error("Error Nominatim:", error);
});

document.getElementById("direccion").value = "";
});
/* =========================
   CARGAR EMERGENCIAS
========================= */

onValue(
    ref(db, "emergencias"),
    (snapshot) => {

        marcadores.clearLayers();
        tablaBody.innerHTML = "";

        const datos = snapshot.val();

        let activas = 0;
        let incendios = 0;

        if (!datos) {

            totalEmergencias.textContent = 0;
            totalIncendios.textContent = 0;

            return;
        }

        let numero = 1;

        for (let id in datos) {

            if (datos[id].estado === "CERRADA") {
                continue;
            }

            if (datos[id].lat && datos[id].lng) {

                const marker = L.marker([
                datos[id].lat,
                datos[id].lng
            ])
                .addTo(marcadores);
                marker.bindPopup(`
                <b>${datos[id].tipo}</b><br>
                 ${datos[id].direccion}<br>
                 ${datos[id].compania}<br>
                 ${datos[id].unidad}<br>
                 ${datos[id].estado}
          `);

            }

            activas++;

            if (datos[id].tipo === "Incendio") {
                incendios++;
            }

            let fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${numero}</td>
                <td>${datos[id].tipo || ""}</td>
                <td>${datos[id].direccion || ""}</td>
                <td>${datos[id].compania || ""}</td>
                <td>${datos[id].unidad || ""}</td>
                <td>${datos[id].hora || ""}</td>
                <td>${datos[id].estado || ""}</td>

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
        totalEmergencias.textContent = activas;
        totalIncendios.textContent = incendios;

    }
);
/* =========================
   CARGAR UNIDADES
========================= */

onValue(
ref(db, "unidades"),
(snapshot) => {

    tablaUnidades.innerHTML = "";

    marcadoresUnidades.clearLayers();

    const unidades = snapshot.val();

    let disponibles = 0;
    let enRuta = 0;

    if(!unidades){

        totalDisponibles.textContent = 0;
        totalRuta.textContent = 0;

        return;
    }

    for(let nombre in unidades){

        /* GPS EN MAPA */

        if(
            unidades[nombre].lat &&
            unidades[nombre].lng
        ){

           const iconoCarro = L.divIcon({
    html: `🚒<br><small>${nombre}</small>`,
    className: "iconoUnidad",
    iconSize: [50, 50]
});

L.marker(
    [
        unidades[nombre].lat,
        unidades[nombre].lng
    ],
    {
        icon: iconoCarro
    }
)
.addTo(marcadoresUnidades)
.bindPopup(`
    <b>${nombre}</b><br>
    Estado: ${unidades[nombre].estado}
`);

        }

        if(unidades[nombre].estado === "Disponible"){
            disponibles++;
        }

        if(unidades[nombre].estado === "En Ruta"){
            enRuta++;
        }

        let fila =
        document.createElement("tr");

        fila.innerHTML = `

        <td>${nombre}</td>

        <td>${unidades[nombre].estado || ""}</td>

        <td>

            <button onclick="cambiarEstadoUnidad('${nombre}','Disponible')">
                Disponible
            </button>

            <button onclick="cambiarEstadoUnidad('${nombre}','En Ruta')">
                Ruta
            </button>

            <button onclick="cambiarEstadoUnidad('${nombre}','En Trabajo')">
                Trabajo
            </button>

        </td>

        `;

        tablaUnidades.appendChild(fila);

    }

    totalDisponibles.textContent = disponibles;
    totalRuta.textContent = enRuta;

});
/* =========================
   SERVICE WORKER
========================= */

if ("serviceWorker" in navigator) {

    navigator.serviceWorker
    .register("./sw.js")
    .then(() => {
        console.log("Service Worker registrado");
    })
    .catch(error => {
        console.error(error);
    });

}
