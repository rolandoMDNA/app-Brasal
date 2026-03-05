/**
 * Base de Datos: BrasalDB (IndexedDB)
 * Modulo encargado de persistir clientes, productos y transacciones.
 */

const DB_NAME = 'BrasalDB';
const DB_VERSION = 5; // Incremented version to drop the unique name constraint

export let db;

// Datos Iniciales por defecto
export const initialClients = {
    1: ["Mariano", "Angel", "Sisi", "Desp La Legua", "Desp Buena Vista", "Desp Santa Barbara", "Tavera", "Ingenio", "Anjofevi", "Teresa", "Rocio", "Laura", "Fredy", "Kiko", "Komo", "Moterey", "Paqui"],
    2: ["Maria Jose", "Mercadito", "Antonio", "Rafa", "Wilson", "Desp Casco", "Mari Luz", "Luis", "Paco", "Txoco", "Paqui"]
};

export const initialProducts = [
    "Viena", "Candeal P", "Candeal L", "Colón", "Integral", "Pistola",
    "Artesana", "Libreta", "Pulga", "Cubano", "Sin Sal", "Hostelero",
    "Centno", "Espelta", "Chapata", "Baguetina", "Viena Precocida", "Migas"
];

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB Error:", event.target.error);
            reject("No se pudo abrir la base de datos local: " + (event.target.error ? event.target.error.message : "Desconocido"));
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("IndexedDB Initialized successfully");
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            console.log("Upgrading database from version", event.oldVersion, "to", event.newVersion);
            db = event.target.result;

            // Tabla de Clientes
            if (!db.objectStoreNames.contains('clients')) {
                const clientStore = db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
                clientStore.createIndex('name', 'name', { unique: false }); // Name no longer unique since clients can appear in multiple routes
                clientStore.createIndex('route', 'route', { unique: false });
            } else if (event.oldVersion < 5) {
                // Remove unique constraint from name index on upgrade
                const clientTransaction = event.target.transaction;
                const clientStore = clientTransaction.objectStore('clients');
                if (clientStore.indexNames.contains('name')) {
                    clientStore.deleteIndex('name');
                    clientStore.createIndex('name', 'name', { unique: false });
                }
            }

            // Tabla de Productos
            if (!db.objectStoreNames.contains('products')) {
                const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
                productStore.createIndex('name', 'name', { unique: true });
            }

            // Tabla de Historial (Pedidos, Devoluciones, Cobros)
            if (!db.objectStoreNames.contains('history')) {
                const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
                historyStore.createIndex('date', 'date', { unique: false });
                historyStore.createIndex('client', 'client', { unique: false });
                historyStore.createIndex('type', 'type', { unique: false }); // 'orders', 'returns', 'payments'
            }
        };
    });
};

/**
 * CLIENTES
 */
export const getClientsByRoute = (routeId) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['clients'], 'readonly');
        const store = transaction.objectStore('clients');
        const index = store.index('route');
        const request = index.getAll(routeId);

        request.onsuccess = () => {
            const clients = request.result;
            clients.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
            resolve(clients.map(c => c.name));
        };
        request.onerror = () => reject("Error fetching clients");
    });
};

export const addClient = (name, routeId) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['clients'], 'readwrite');
        const store = transaction.objectStore('clients');
        const request = store.add({ name, route: parseInt(routeId) });

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error adding client");
    });
};

export const updateClientOrder = (routeId, orderedNames) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['clients'], 'readwrite');
        const store = transaction.objectStore('clients');
        const index = store.index('route');
        const request = index.getAll(routeId);

        request.onsuccess = () => {
            const clients = request.result;
            clients.forEach(c => {
                c.order = orderedNames.indexOf(c.name);
                store.put(c);
            });
            resolve();
        };
        request.onerror = () => reject("Error updating order");
    });
};

/**
 * PRODUCTOS
 */
export const getActiveProducts = () => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const request = store.getAll();

        request.onsuccess = () => {
            const active = request.result.filter(p => p.active !== false).map(p => p.name);
            resolve(active);
        };
        request.onerror = () => reject("Error fetching products");
    });
};

/**
 * HISTORIAL
 */
export const addTransaction = (entry) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        const request = store.add({ ...entry, timestamp: new Date().getTime() });

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error saving transaction");
    });
};

export const getHistoryByType = (type) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const index = store.index('type');
        const request = type === 'all' ? store.getAll() : index.getAll(type);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error fetching history");
    });
};

export const getAllHistory = () => {
    return getHistoryByType('all');
};

export const clearHistoryData = () => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject("Error clearing history");
    });
};

export const updateTransaction = (id, updatedEntry) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        const request = store.put({ ...updatedEntry, id }); // Ensure ID is maintained

        request.onsuccess = () => resolve();
        request.onerror = () => reject("Error updating transaction");
    });
};

export const deleteTransaction = (id) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject("Error deleting transaction");
    });
};
