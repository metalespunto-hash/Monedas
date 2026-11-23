# Monedas – Sistema de retiro de monedas

App web (una sola página) para cargar vendedores de monedas, armar la ruta de retiro por cercanía y marcar retirados. Se usa desde el celular como acceso directo. Todo el texto de la app está en español (Argentina).

## Archivos
- `index.html`: toda la app (HTML, CSS y JS juntos). Sin build ni dependencias locales.
- `sw.js`: service worker para que funcione sin internet (app, librerías y mapa ya visto).
- `manifest.webmanifest` + `icons/`: logo del acceso directo (`icons/icon.svg` es la fuente).

## Pantalla
Pantalla tipo app: encabezado y barra fijos, solo se desplaza `<main>`. En el celular el mapa se mueve con dos dedos. Tres pestañas (`tab()`): **Ruta** (próxima parada, armar ruta, mapa), **Cargar** (formulario con total y Guardar fijos abajo) y **Vendedores** (buscador, filtro Pendientes/Retirados/Todos, tarjetas compactas que se abren con la flechita).

## Cómo funciona
- Datos en Supabase, tabla `vendedores` (nombre, apellido, telefono, direccion, localidad, dia, hora, monedas{tipo:cantidad}, coord{lat,lon}, orden, retirado). Orden 999 = fuera de ruta.
- Copia local en `localStorage` (`vendedores`) + cola de cambios (`cola`) que se sube con `sincronizar()` cuando hay internet. Los vendedores cargados sin internet usan id `tmp-...` hasta subirse.
- Configuración en `localStorage` (`config`): origen (`dir` o `gps`), dirección/localidad de salida, coord, radio del modo automático, logo propio.
- Ruta: vecino más cercano desde el punto de salida (`armarRuta`).
- Direcciones con Nominatim (OpenStreetMap), recorrido en el mapa con OSRM, mapa con Leaflet.
- Precios de las monedas: constante `PRECIOS` en `index.html`. Localidades: `LOCALIDADES`.
- Editar vendedor: `editar(id)` carga los datos en la pestaña Cargar (`editId`); si cambia la dirección se vuelve a ubicar en el mapa.
- WhatsApp: un mensaje predeterminado en `cfg.mensaje` (original en `MENSAJE`, acepta {nombre} {total} {direccion} {cuando}). Al tocar WhatsApp, `#wspDlg` deja mandar ese o escribir otro.

## Al hacer cambios
- Subir `VERSION` en `index.html` (formato `AAAA-MM-DD-x`) para que los celulares se actualicen solos.
- Si se agregan archivos que la app necesita sin internet, sumarlos a `PRE_APP` en `sw.js` y subir el nombre de la caché `APP`.
