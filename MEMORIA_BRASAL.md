# Brasal 2.0 - Memoria del Proyecto y Estado Actual

Este documento sirve como registro oficial de la arquitectura, funcionalidades y estado de **Brasal 2.0**. Fue diseñado para ser consultado en futuras sesiones como contexto base principal para el desarrollo y mantenimiento de la aplicación.

## Directorio Base
`/home/rolandomdna/.gemini/antigravity/scratch/app-brasal-1502/deploy/brasal_v2.0`

## Arquitectura Principal
Brasal 2.0 es una PWA construida con Vanilla JS, Tailwind CSS, y almacenamiento local persistente.
- **`app.js`**: Controlador principal, maneja el estado global (`state`), el enrutamiento (`navigate`, `goBack`), interacciones de usuario y el ciclo de vida de carga (`loadState()`).
- **`components.js`**: Contiene todas las vistas y componentes UI construidos mediante Template Literals nativos.
- **`db.js`**: Capa de abstracción de datos para `IndexedDB` (`BrasalDB`). Controla la creación de tablas (clients, products, history) y proporciona APIs Promise-based para todas las interacciones de datos CRUD.

## Base de Datos (IndexedDB - BrasalDB v5)
Brasal 2.0 abandonó `localStorage` por completo e implementó IndexedDB para manejar grandes volúmenes de transacciones.
- **Versión de Esquema Actual**: v5. 
- **Tablas (Object Stores)**:
    - `clients`: Almacena el nombre, la ruta asignada y su orden (`order`) dentro de esa ruta. No tiene restricciones de índice por nombre único.
    - `products`: Catálogo de productos en venta con estado activo/inactivo.
    - `history`: Guarda los pedidos (`orders`), cobros (`payments`) y devoluciones (`returns`).
- **Manejo de Datos Iniciales**: La generación de clientes fundacionales se inyecta silenciosamente a través de `app.js` tras el inicio de la base de datos para prevenir abortos transaccionales duros en el evento de actualización.

## Características Clave Implementadas en v2.0
1.  **Reorganización Drag & Drop (SortableJS):**
    Los usuarios pueden reorganizar de forma manual e intuitiva las listas de clientes manteniendo presionado y arrastrando. Este nuevo orden se guarda de forma persistente en IndexedDB (`db.js -> updateClientOrder`).
    
2.  **Registros del Pasado:**
    La aplicación permite la inyección de operaciones de cobros y devoluciones en fechas anteriores (`PastRecordsType` / `PastReturnsDate`).
    - Incluye navegación cíclica: Tras procesar un cliente del pasado, el router devuelve al usuario a la lista principal bajo la misma fecha, permitiendo procesos de grabación en lote eficientes.

3.  **Edición y Borrado de Registros de Historial:**
    Los Informes Diarios permiten acceder a cualquier registro creado y realizar dos acciones directamente en la base de datos:
    - Borrar completamente.
    - Editar cantidades utilizando el sistema Numpad que sincroniza los cambios actualizando el registro original (`db.js -> updateTransaction`).
    
4.  **Productos Personalizados (Ad Hoc):**
    En pedidos y devoluciones, es posible introducir textos libres en caso de ventas de productos únicos / no catalogados mediante un `prompt`.

## Parches y Actualizaciones (v2.1)
Durante las rondas de pruebas, se han implementado una serie de correcciones críticas a la usabilidad y consistencia de los datos:
1.  **Soporte de Cantidades Fraccionadas:** El Numpad se hizo contextual. Para los cobros, permite introducir un punto decimal libre `.` (ej. 10.25€), pero para el pan (pedidos/devoluciones), el botón se transforma en un **`+ ½`** asegurando una inserción segura de productos en medias unidades (ej. 4.5 panes).
2.  **Enrutamiento de Cancelación:** El botón "Atrás" desde dentro de un menú de operación (como elegir cliente o meter números) ahora cancela y aborta el flujo empujando al usuario al menú principal de rutas (`RouteMenu` o `PastRecordsMenu`), en lugar de viajar estrictamente hacia atrás deshaciendo la historia.
3.  **Parcheador Silencioso de Base de Datos:** Se inyectó un script en la secuencia de carga de `app.js` (`loadState`) que detecta y corrige erratas históricas almacenadas en disco duro (e.g. "Colone" a "Colón"), reparando los catálogos y el historial sin intervención del usuario ni pérdida de datos.
4.  **Versionado de Service Worker:** Se actualizó `sw.js` a la versión `brasal-1502-v2.1` incorporando un destructor de cachés antiguos en el evento `activate` para asegurar que las PWAs descarguen la interfaz más nueva instantáneamente.

## Empaquetado Actual
La aplicación fue compilada en un archivo `brasal_v2.0.zip` excluyendo archivos de git, lista para ser transformada en un APK mediante la herramienta de empaquetado PWA Builder.

*(Nota: Este documento y su descripción técnica son la huella de memoria para Brasal 2.0 / 2.1).*
