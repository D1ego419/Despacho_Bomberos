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

 const alarma = new Audio("./sirena.mp3");
alarma.volume = 1.0;

/* =========================
   MAPA
========================= */

const map = L.map('map').setView([-36.6066, -72.1034], 12);

const marcadores = L.layerGroup().addTo(map);
const marcadoresUnidades = L.layerGroup().addTo(map);
let rutaActual = null;

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19
    }
).addTo(map);

L.marker([-36.6066, -72.1034])
.addTo(map)
.bindPopup("Central de Bomberos");

function mostrarRuta(
    latUnidad,
    lngUnidad,
    latEmergencia,
    lngEmergencia
){
console.log(
        "MOSTRAR RUTA",
        latUnidad,
        lngUnidad,
        latEmergencia,
        lngEmergencia
    );
    
    if(rutaActual){
        map.removeControl(rutaActual);
    }

    rutaActual = L.Routing.control({

    waypoints: [

        L.latLng(latUnidad, lngUnidad),
        L.latLng(latEmergencia, lngEmergencia)

    ],

    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    show: false,

    lineOptions: {
        styles: [
            {
                color: "red",
                opacity: 0.8,
                weight: 6
            }
        ]
    },

    createMarker: function() {
        return null;
    }

}).addTo(map);

}

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

const detalleEmergencia =
document.getElementById("detalleEmergencia");

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
    update(
    ref(db, "unidades/" + unidad),
    {
        estado: "En Ruta"
    }
);

})
.catch(error => {
    console.error("Error Nominatim:", error);
});

document.getElementById("direccion").value = "";
});
/* =========================
   CARGAR EMERGENCIAS
========================= */
let ultimaEmergencia = null;
let cantidadEmergenciasAnterior = 0;
onValue(
ref(db, "emergencias"),
(snapshot) => {

    marcadores.clearLayers();
    tablaBody.innerHTML = "";

    const datos = snapshot.val();

    let ultima = null;

    const cantidadActual =
    datos ? Object.keys(datos).length : 0;

    let activas = 0;
    let incendios = 0;



        if (!datos) {

            totalEmergencias.textContent = 0;
            totalIncendios.textContent = 0;

            detalleEmergencia.innerHTML =
            "Sin emergencias activas";

            return;
        
        }

        let numero = 1;

        for (let id in datos) {

            if (datos[id].estado === "CERRADA") {
                continue;
            }
            ultima = datos[id];
            ultimaEmergencia = {
                 lat: datos[id].lat,
                lng: datos[id].lng

        };
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

            if(
        cantidadEmergenciasAnterior > 0 &&
        cantidadActual > cantidadEmergenciasAnterior &&
        ultima
    ){

        alarma.play();

        if(Notification.permission === "granted"){

            new Notification(
                `🚨 ${ultima.tipo}`,
                {
                    body:
                    `${ultima.direccion} | ${ultima.unidad}`
                }
            );

        }

        if(navigator.vibrate){
            navigator.vibrate([500,300,500]);
        }

    }

    cantidadEmergenciasAnterior = cantidadActual;

        if(ultima){

    detalleEmergencia.innerHTML = `
        <b>Tipo:</b> ${ultima.tipo}<br>
        <b>Dirección:</b> ${ultima.direccion}<br>
        <b>Compañía:</b> ${ultima.compania}<br>
        <b>Unidad:</b> ${ultima.unidad}<br>
        <b>Estado:</b> ${ultima.estado}<br>
        <b>Hora:</b> ${ultima.hora}
     `;
    }


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

const marcadorUnidad = L.marker(
[
    unidades[nombre].lat,
    unidades[nombre].lng
],
{
    icon: iconoCarro
}
)
.addTo(marcadoresUnidades);

marcadorUnidad.bindPopup(`
    <b>${nombre}</b><br>
    Estado: ${unidades[nombre].estado}
`);

if(
    ultimaEmergencia &&
    unidades[nombre].estado === "En Ruta"
){

    mostrarRuta(
        unidades[nombre].lat,
        unidades[nombre].lng,
        ultimaEmergencia.lat,
        ultimaEmergencia.lng
    );

}

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

        <td>
        <span class="estado-${unidades[nombre].estado.replace(/\s/g,'')}">
        ${unidades[nombre].estado}
        </span>
        </td>

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
