import * as Comp from './components.js';
import * as DB from './db.js';

/**
 * APPLICATION STATE
 */
const state = {
    currentView: 'home',
    viewData: {},
    clients: {
        1: [],
        2: []
    },
    products: [],
    history: [],
    historyStack: [],
    numpadValue: '0',
    tempClient: { name: '', route: null, lists: [] },
    tempItems: [],
    selectedAnalysisDay: new Date().getDay() // 0=Sun, 1=Mon, ..., 6=Sat
};

// --- DATA PERSISTENCE (IndexedDB) ---

async function loadState() {
    try {
        await DB.initDB();

        // Load data concurrently
        const [clientsR1, clientsR2, products, history] = await Promise.all([
            DB.getClientsByRoute(1),
            DB.getClientsByRoute(2),
            DB.getActiveProducts(),
            DB.getAllHistory()
        ]);

        // Sync missing initial clients (e.g. newly added ones like Paqui across updates)
        let needsRefresh = false;
        if (DB.db) {
            // First time DB setup for products
            if (products.length === 0) {
                try {
                    const tx = DB.db.transaction(['products'], 'readwrite');
                    const store = tx.objectStore('products');
                    DB.initialProducts.forEach(name => store.put({ name, active: true }));
                    needsRefresh = true;
                } catch (err) {
                    console.warn("Could not sync products", err);
                }
            }

            for (const route of [1, 2]) {
                const currentNames = route === 1 ? clientsR1 : clientsR2;
                const expectedNames = DB.initialClients[route];

                for (const name of expectedNames) {
                    if (!currentNames.includes(name)) {
                        try {
                            // Quick internal transaction to add missing client to DB
                            const transaction = DB.db.transaction(['clients'], 'readwrite');
                            const store = transaction.objectStore('clients');
                            store.put({ name, route });
                            needsRefresh = true;
                        } catch (err) {
                            console.warn("Could not sync client", name, err);
                        }
                    }
                }
            }

            // Silent patch for "Colone" -> "Colón"
            try {
                const patchTx = DB.db.transaction(['products', 'history'], 'readwrite');
                const pStore = patchTx.objectStore('products');
                const hStore = patchTx.objectStore('history');

                pStore.getAll().onsuccess = (e) => {
                    const prods = e.target.result;
                    prods.forEach(p => {
                        if (p.name === 'Colone') {
                            p.name = 'Colón';
                            pStore.put(p);
                            needsRefresh = true;
                        }
                    });
                };

                hStore.getAll().onsuccess = (e) => {
                    const hist = e.target.result;
                    hist.forEach(h => {
                        if (h.product === 'Colone') {
                            h.product = 'Colón';
                            hStore.put(h);
                        }
                    });
                };
            } catch (err) {
                console.warn("Could not patch Colone", err);
            }
        }

        if (needsRefresh) {
            // Re-fetch if we added anyone
            state.clients[1] = await DB.getClientsByRoute(1);
            state.clients[2] = await DB.getClientsByRoute(2);
            state.products = await DB.getActiveProducts();
        } else {
            state.clients[1] = clientsR1;
            state.clients[2] = clientsR2;
            state.products = products;
        }

        state.history = history;

        // Render after loading
        render();
    } catch (e) {
        console.error('Error loading state from DB:', e);
        showToast('Error al cargar datos', 'error');
    }
}

// Initial load request
loadState();

// --- UI FEEDBACK ---
window.showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon selection based on type
    let icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';
    if (type === 'info') icon = 'info';

    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5 font-bold"></i>
        <span class="font-bold">${message}</span>
    `;

    container.appendChild(toast);

    // Initialize icon
    if (window.lucide) window.lucide.createIcons();

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

/**
 * CORE LOGIC
 */
window.navigate = (view, data = {}, isBack = false) => {
    // Clear history stack when arriving at root navigation points
    if (view === 'home' || view === 'route' || view === 'past-records-type') {
        state.historyStack = [];
    } else if (!isBack && state.currentView !== view) {
        state.historyStack.push({ view: state.currentView, data: state.viewData });
    }

    state.currentView = view;
    state.viewData = data;
    render();
    window.scrollTo(0, 0);
};

window.goBack = () => {
    const { currentView, viewData } = state;

    // Custom back logic for checkout streams: abort to parent menu
    if (currentView === 'numpad' || currentView === 'products' || currentView === 'clients') {
        if (viewData.customDate) {
            return navigate('past-records-type', {
                routeId: viewData.routeId,
                customDate: viewData.customDate
            });
        } else if (viewData.routeId) {
            return navigate('route', {
                id: viewData.routeId,
                name: viewData.routeId === 1 ? 'Rubén' : 'José'
            });
        }
    }

    if (state.historyStack.length > 0) {
        const last = state.historyStack.pop();
        window.navigate(last.view, last.data, true);
    } else {
        window.navigate('home');
    }
};

window.selectClient = (client, type, routeId) => {
    state.tempItems = []; // Clear previous temporary items
    if (type === 'payments') {
        navigate('numpad', { title: `Pago de ${client}`, unit: '€', type, client, isDecimal: true, routeId, customDate: state.viewData.customDate });
    } else {
        navigate('products', { type, client, routeId, customDate: state.viewData.customDate });
    }
};

window.selectProduct = (product, type, client, routeId) => {
    navigate('numpad', { title: `${product} - ${client}`, unit: 'uds', type, client, product, routeId, customDate: state.viewData.customDate, isDecimal: true });
};

window.numpadPress = (val) => {
    if (val === 'DEL') {
        state.numpadValue = state.numpadValue.length > 1 ? state.numpadValue.slice(0, -1) : '0';
    } else if (val === '.5') {
        // Prevent adding .5 if a decimal is already present
        if (!state.numpadValue.includes('.')) {
            state.numpadValue += val;
        }
    } else {
        if (state.numpadValue === '0' && val !== '.') {
            state.numpadValue = val.toString();
        } else {
            // Prevent multiple decimals
            if (val === '.' && state.numpadValue.includes('.')) return;
            state.numpadValue += val.toString();
        }
    }
    document.getElementById('numpad-display').innerText = state.numpadValue;
};

window.numpadConfirm = async () => {
    const value = state.numpadValue;
    const { type, client, product, routeId, customDate, editingId } = state.viewData;

    const entry = {
        date: customDate || new Date().toISOString().split('T')[0],
        client,
        type,
        value: parseFloat(value),
        product: product || ''
    };

    // Reset numpad
    state.numpadValue = '0';

    if (editingId) {
        try {
            const numericEditId = Number(editingId);
            const oldEntry = state.history.find(h => h.id === numericEditId) || {};
            const fullEntry = { ...oldEntry, ...entry, id: numericEditId };

            await DB.updateTransaction(numericEditId, fullEntry);
            const index = state.history.findIndex(h => h.id === numericEditId);
            if (index !== -1) {
                state.history[index] = fullEntry;
            }
            showToast('Registro editado correctamente');
            goBack();
        } catch (error) {
            console.error(error);
            showToast('Error al editar registro', 'error');
        }
        return; // Complete edit transaction securely before falling through
    }

    if (type === 'orders' || type === 'returns') {
        state.tempItems.push(entry);
        showToast(`${entry.value} ${product} añadidos`);
        navigate('products', { type, client, routeId, customDate });
    } else {
        try {
            const id = await DB.addTransaction(entry);
            entry.id = id; // Update local state for immediate render
            state.history.push(entry);
            showToast(`Pago de ${entry.value}€ registrado`);
            if (customDate) {
                navigate('clients', { routeId, type: 'payments', customDate });
            } else if (routeId) {
                navigate('route', { id: routeId, name: routeId === 1 ? 'Rubén' : 'José' });
            } else {
                goBack();
            }
        } catch (error) {
            showToast('Error al guardar pago', 'error');
        }
    }
};

window.addCustomProduct = () => {
    const customName = prompt('Introduce el nombre del pan o producto especial:');
    if (customName && customName.trim() !== '') {
        const { type, client, routeId } = state.viewData;
        window.selectProduct(customName.trim(), type, client, routeId);
    }
};

window.finishReturns = async () => {
    const { routeId, customDate } = state.viewData;

    try {
        // Save all temp items to DB and capture their new IndexedDB internal IDs
        const ids = await Promise.all(state.tempItems.map(item => DB.addTransaction(item)));

        // Update local history for immediate render with valid IDs!
        state.tempItems.forEach((item, idx) => {
            item.id = ids[idx];
            state.history.push(item);
        });

        state.tempItems = [];

        showToast('Devolución finalizada correctamente');
        if (customDate) {
            navigate('clients', { routeId, type: 'returns', customDate });
        } else if (routeId) {
            navigate('route', { id: routeId, name: routeId === 1 ? 'Rubén' : 'José' });
        } else {
            navigate('home');
        }
    } catch (e) {
        showToast('Error al guardar devoluciones', 'error');
    }
};

const typeNames = {
    'orders': 'Pedido',
    'returns': 'Devolución',
    'payments': 'Cobro'
};

window.exportData = (format, filter = 'TODO', targetDate = null) => {
    const { history, clients } = state;
    let dataToExport = history;

    // Filter by specific date if provided
    if (targetDate) {
        dataToExport = dataToExport.filter(h => h.date === targetDate);
    }

    // Filter by driver if specified
    if (filter !== 'TODO') {
        const driverClients = (filter === 'RUBÉN') ? clients[1] : (filter === 'JOSÉ' ? clients[2] : []);
        dataToExport = history.filter(h => driverClients.includes(h.client));
    }

    if (format === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40);
        doc.text("CIERRE DE CAJA BRASAL 1502", 20, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fecha: ${targetDate ? targetDate.split('-').reverse().join('/') : new Date().toLocaleDateString()}`, 20, 28);
        doc.text(`Repartidor: ${filter === 'TODO' ? 'TODOS' : filter}`, 20, 33);
        doc.line(20, 37, 190, 37);

        let y = 45;
        let totalRecaudado = 0;

        // Group by client
        const clientsInData = [...new Set(dataToExport.map(h => h.client))];

        clientsInData.forEach(clientName => {
            const clientActions = dataToExport.filter(h => h.client === clientName);
            const returns = clientActions.filter(h => h.type === 'returns');
            const payments = clientActions.filter(h => h.type === 'payments');
            const orders = clientActions.filter(h => h.type === 'orders');

            if (returns.length === 0 && payments.length === 0 && orders.length === 0) return;

            // Check page overflow
            if (y > 240) { doc.addPage(); y = 20; }

            // Client Name Header
            doc.setFillColor(240, 240, 240);
            doc.rect(20, y, 170, 8, 'F');
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text(clientName.toUpperCase(), 25, y + 6);
            y += 12;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            // Returns Section
            if (returns.length > 0) {
                doc.setTextColor(0, 102, 204); // Blue for returns
                doc.text("DEVOLUCIONES:", 25, y);
                y += 5;
                doc.setTextColor(60);
                returns.forEach(ret => {
                    doc.text(`- ${ret.product}: ${ret.value} uds`, 30, y);
                    y += 5;
                });
                y += 2;
            }

            // Payments Section
            if (payments.length > 0) {
                doc.setTextColor(184, 134, 11); // Amber for payments
                const clientTotalPay = payments.reduce((sum, p) => sum + p.value, 0);
                doc.text(`COBROS: ${clientTotalPay.toFixed(2)} €`, 25, y);
                totalRecaudado += clientTotalPay;
                y += 7;
            } else {
                doc.setTextColor(150);
                doc.text("SIN COBROS", 25, y);
                y += 7;
            }

            y += 5; // Space between clients
        });

        // Final Summary (Arqueo)
        if (y > 250) { doc.addPage(); y = 20; }
        y += 10;
        doc.setFillColor(0, 0, 0);
        doc.rect(20, y, 170, 12, 'F');
        doc.setTextColor(255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL CAJA (RECAUDACIÓN):", 25, y + 8);
        doc.text(`${totalRecaudado.toFixed(2)} €`, 150, y + 8);

        doc.save(`informe_cierre_${filter}_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('Informe de cierre generado');

    } else if (format === 'csv' || format === 'xlsx') {
        let csvContent = "data:text/csv;charset=utf-8,Fecha,Cliente,Tipo,Producto,Cantidad_Importe\n";
        dataToExport.forEach(h => {
            csvContent += `${h.date},${h.client},${typeNames[h.type] || h.type},${h.product || ''},${h.value}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `export_brasal_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`${format.toUpperCase()} generado correctamente`);
    }
};

window.confirmOrderDate = async (param) => {
    const { routeId } = state.viewData;
    let date;
    if (typeof param === 'number') {
        date = new Date();
        date.setDate(date.getDate() + param);
    } else {
        date = new Date(param);
        if (isNaN(date.getTime())) return;
    }

    const dateStr = date.toISOString().split('T')[0];

    try {
        const promises = state.tempItems.map(item => {
            item.date = dateStr;
            return DB.addTransaction(item);
        });

        const newIds = await Promise.all(promises);

        state.tempItems.forEach((item, index) => {
            item.id = newIds[index];
            state.history.push(item);
        });

        state.tempItems = [];
        showToast(`Pedido para el: ${date.toLocaleDateString()}`);
        if (routeId) {
            navigate('route', { id: routeId, name: routeId === 1 ? 'Rubén' : 'José' });
        } else {
            navigate('home');
        }
    } catch (e) {
        showToast('Error al guardar pedidos', 'error');
    }
};

window.deleteEntry = async (id) => {
    id = Number(id);
    if (isNaN(id)) return showToast('Registro inválido, por favor recarga', 'error');

    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        try {
            await DB.deleteTransaction(id);
            state.history = state.history.filter(h => h.id !== id);
            showToast('Registro eliminado correctamente');
            render();
        } catch (error) {
            console.error(error);
            showToast('Error al eliminar registro', 'error');
        }
    }
};

window.editEntry = (id) => {
    id = Number(id);
    if (isNaN(id)) return showToast('Registro inválido, por favor recarga', 'error');

    const entry = state.history.find(h => h.id === id);
    if (!entry) return;

    // Navigate to numpad with a special mode for editing
    navigate('numpad', {
        title: `Editar ${entry.client}`,
        unit: entry.type === 'payments' ? '€' : 'uds',
        type: entry.type,
        client: entry.client,
        product: entry.product,
        isDecimal: entry.type === 'payments',
        editingId: id, // Carry the ID to know we are editing
        customDate: entry.date, // Preserve the original transaction date
        date: entry.date // Preserve for report-detail back navigation
    });

    state.numpadValue = entry.value.toString();
    // Manual DOM update for the display
    setTimeout(() => {
        const display = document.getElementById('numpad-display');
        if (display) display.innerText = state.numpadValue;
    }, 0);
};

// --- GESTIÓN LOGIC ---
window.saveTempName = () => {
    const name = document.getElementById('new-client-name').value.trim();
    if (!name) return showToast('Ingresa un nombre', 'error');
    state.tempClient.name = name;
    navigate('add-client-route');
};

window.saveTempRoute = (id) => {
    state.tempClient.route = id;
    navigate('add-client-lists');
};

window.finalizeNewClient = async (selection) => {
    const { name, route } = state.tempClient;

    try {
        await DB.addClient(name, route);
        if (!state.clients[route].includes(name)) {
            state.clients[route].push(name);
        }
        showToast(`Cliente "${name}" añadido`);
        state.tempClient = { name: '', route: null, lists: [] };
        navigate('home');
    } catch (e) {
        showToast('Error al añadir cliente', 'error');
    }
};

window.finalizeDeleteClient = (route, clientName) => {
    if (confirm(`¿Estás seguro de que deseas eliminar de forma permanente al cliente "${clientName}"?`)) {
        // Pending DB implementation for delete function
        showToast('Funcionalidad pendiente en v2.0', 'info');
    }
};

window.savePastReturnsDate = () => {
    const dateInput = document.getElementById('past-returns-date-input').value;
    if (!dateInput) {
        showToast('Debes seleccionar una fecha', 'error');
        return;
    }

    // Check if the date is in the future
    if (new Date(dateInput) > new Date()) {
        showToast('La fecha no puede ser en el futuro', 'error');
        return;
    }

    state.viewData.customDate = dateInput;
    navigate('past-returns-route', { customDate: dateInput });
};

window.selectAnalysisDay = (day) => {
    state.selectedAnalysisDay = day;
    render();
};

/**
 * RENDER ENGINE
 */
function render() {
    const container = document.getElementById('view-container');
    const navContainer = document.getElementById('nav-container');
    const { currentView, viewData } = state;

    // Toggle Global NavBar
    if (currentView === 'home') {
        navContainer.classList.add('-translate-y-full', 'opacity-0');
        navContainer.innerHTML = '';
    } else {
        navContainer.innerHTML = Comp.NavBar();
        navContainer.classList.remove('-translate-y-full', 'opacity-0');
    }

    let html = '';

    switch (currentView) {
        case 'home':
            html = Comp.Dashboard();
            break;

        case 'route':
            html = Comp.RouteMenu(viewData);
            break;

        case 'clients':
            const rn = viewData.routeId === 1 ? 'Rubén' : 'José';
            html = Comp.ClientList(state.clients[viewData.routeId], typeNames[viewData.type], rn, viewData.type, viewData.routeId);

            // Initialize drag and drop sorting
            setTimeout(() => {
                const el = document.getElementById('client-list-container');
                if (el && window.Sortable) {
                    new Sortable(el, {
                        animation: 150,
                        delay: 200, // Manten presionado por 200ms para empezar a arrastrar en moviles
                        delayOnTouchOnly: true,
                        ghostClass: 'opacity-50', // Clase para el elemento fantasma mientras se arrastra
                        onEnd: async function () {
                            // Obtenemos el nuevo orden desde el DOM
                            const newOrder = Array.from(el.children).map(child => child.dataset.client);

                            // Guardamos en la Base de Datos
                            try {
                                await DB.updateClientOrder(viewData.routeId, newOrder);
                                state.clients[viewData.routeId] = newOrder; // Actualizamos estado local
                                showToast('Nuevo orden guardado', 'info');
                            } catch (e) {
                                showToast('Error al guardar el orden', 'error');
                            }
                        }
                    });
                }
            }, 50);
            break;

        case 'products':
            html = `
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-slate-800">Seleccionar Pan</h2>
                    <p class="text-slate-500">${viewData.client}</p>
                </div>
                <div class="grid grid-cols-2 gap-3 mb-20">
                    ${state.products.map(p => `
                        <button onclick="selectProduct('${p}', '${viewData.type}', '${viewData.client}', ${viewData.routeId})" class="h-24 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-lg font-bold text-slate-700 shadow-sm active:bg-blue-50 active:border-blue-200 p-2 text-center leading-tight">
                            ${p}
                        </button>
                    `).join('')}
                    <button onclick="addCustomProduct()" class="h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 shadow-sm active:bg-slate-100 p-2 text-center gap-1">
                        <i data-lucide="plus-circle" class="w-6 h-6"></i>
                        <span class="text-sm font-bold">Otro...</span>
                    </button>
                </div>
                ${state.tempItems.length > 0 ? `
                    <button onclick="${viewData.type === 'returns' ? 'finishReturns()' : `navigate('order-summary', { routeId: ${viewData.routeId} })`}" class="btn-touch ${viewData.type === 'returns' ? 'bg-emerald-600' : 'bg-slate-900'} text-white fixed bottom-6 left-4 right-4 max-w-[calc(448px-2rem)] mx-auto shadow-lg">
                        ${Comp.Icons.Check}
                        <span>FINALIZAR ${viewData.type === 'returns' ? 'DEVOLUCIÓN' : 'PEDIDO'}</span>
                    </button>
                ` : ''}
            `;
            break;

        case 'numpad':
            html = Comp.Numpad(viewData.title, viewData.unit, viewData.isDecimal, viewData.type);
            break;

        case 'order-summary':
            html = `
                <div class="text-center py-6 mt-4">
                    <div class="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-full mb-6">
                        ${Comp.Icons.Check}
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800 mb-2">Resumen del Pedido</h2>
                    <div class="bg-slate-50 rounded-2xl p-4 mb-8 text-left max-w-xs mx-auto">
                        ${state.tempItems.map(item => `
                            <div class="flex justify-between border-b border-slate-200 py-2 last:border-0">
                                <span class="text-slate-700 font-medium">${item.product}</span>
                                <span class="font-bold">${item.value} uds</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-700 mb-4 border-t border-slate-100 pt-6">¿Para cuándo?</h3>
                    <div class="flex flex-col gap-3">
                        <button onclick="confirmOrderDate(1)" class="btn-touch bg-emerald-600 text-white text-xl h-24 shadow-md font-bold">MAÑANA</button>
                        <button onclick="const el = document.getElementById('cal'); if(el.showPicker) el.showPicker(); else el.click();" class="btn-touch bg-white border border-slate-200 text-slate-700 shadow-sm">
                            ${Comp.Icons.Calendar}
                            <span>CALENDARIO</span>
                        </button>
                        <input type="date" id="cal" class="absolute opacity-0 pointer-events-none w-0 h-0" onchange="confirmOrderDate(this.value)">
                    </div>
                </div>
            `;
            break;

        case 'orders-history':
            // Filter only orders
            const ordersOnly = state.history.filter(h => h.type === 'orders');

            // Sort by date (ascending - closest first)
            ordersOnly.sort((a, b) => new Date(a.date) - new Date(b.date));

            const grouped = { 1: {}, 2: {} };
            ordersOnly.forEach(order => {
                const rId = state.clients[1].includes(order.client) ? 1 : (state.clients[2].includes(order.client) ? 2 : null);
                if (!rId) return;

                if (!grouped[rId][order.date]) grouped[rId][order.date] = {};
                if (!grouped[rId][order.date][order.client]) grouped[rId][order.date][order.client] = [];

                grouped[rId][order.date][order.client].push(order);
            });

            html = Comp.OrdersHistory(grouped);
            break;

        case 'daily-reports':
            html = Comp.DailyReports(state.history);
            break;

        case 'report-detail':
            const ungrouped = state.history.filter(h => h.date === viewData.date && h.type !== 'orders');
            const groupedEntries = {};
            ungrouped.forEach(entry => {
                if (!groupedEntries[entry.client]) groupedEntries[entry.client] = [];
                groupedEntries[entry.client].push(entry);
            });
            html = Comp.ReportDetail(viewData.date, groupedEntries);
            break;

        case 'admin':
            html = Comp.AdminMenu();
            break;

        case 'add-client-name':
            html = Comp.AddClientName();
            break;

        case 'add-client-route':
            html = Comp.AddClientRoute();
            break;

        case 'add-client-lists':
            html = Comp.AddClientLists();
            break;

        case 'past-returns-date':
            html = Comp.PastReturnsDate();
            break;

        case 'past-returns-route':
            html = Comp.PastReturnsRoute(viewData.customDate);
            break;

        case 'past-records-type':
            html = Comp.PastRecordsType(viewData.routeId, viewData.customDate);
            break;

        case 'del-client-route':
            html = Comp.DeleteClientRoute();
            break;

        case 'del-client-selection':
            html = Comp.DeleteClientSelection(viewData.routeId, state.clients[viewData.routeId]);
            break;

        case 'analysis':
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const dayShort = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
            const currentDay = state.selectedAnalysisDay;

            const rawData = {};
            state.history.filter(h => {
                const date = new Date(h.date);
                return h.type === 'returns' && date.getDay() === currentDay;
            }).forEach(ret => {
                if (!rawData[ret.client]) rawData[ret.client] = {};
                if (!rawData[ret.client][ret.product]) rawData[ret.client][ret.product] = [];
                rawData[ret.client][ret.product].push(ret.value);
            });

            const groupedSuggestions = {};
            Object.keys(rawData).forEach(client => {
                Object.keys(rawData[client]).forEach(product => {
                    const values = rawData[client][product];
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    const safetyMarginAvg = avg * 0.8; // Apply 80% margin
                    if (safetyMarginAvg >= 1) {
                        if (!groupedSuggestions[client]) groupedSuggestions[client] = [];
                        groupedSuggestions[client].push({
                            product,
                            reduction: Math.round(safetyMarginAvg)
                        });
                    }
                });
            });

            const clientsWithSuggestions = Object.keys(groupedSuggestions);

            html = `
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Análisis Predictivo</h2>
                    <p class="text-slate-500 font-medium">Histórico del día: <span class="capitalize text-blue-600 font-bold">${dayNames[currentDay]}</span></p>
                </div>

                <!-- Day Selector -->
                <div class="flex justify-between gap-1 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    ${[1, 2, 3, 4, 5, 6, 0].map(d => `
                        <button onclick="selectAnalysisDay(${d})" class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                            ${currentDay === d ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border border-slate-200 text-slate-400'}">
                            ${dayShort[d]}
                        </button>
                    `).join('')}
                </div>

                <div class="bg-violet-50 p-4 rounded-xl mb-8 flex items-start gap-4 border border-violet-100 shadow-sm shadow-violet-50/50">
                    <div class="bg-violet-500 p-2 rounded-lg text-white">
                        <i data-lucide="calendar-check" class="w-5 h-5"></i>
                    </div>
                    <p class="text-[13px] text-violet-800 leading-relaxed font-semibold">
                        Sugerencias calculadas analizando exclusivamente otros <span class="underline">${dayNames[currentDay]}s</span> pasados.
                    </p>
                </div>

                <div class="space-y-6 pb-24">
                    ${clientsWithSuggestions.length === 0 ? `
                        <div class="text-center py-16 opacity-40">
                            <i data-lucide="search-x" class="w-16 h-16 mx-auto mb-4"></i>
                            <p class="text-lg font-bold italic">No hay datos históricos para el ${dayNames[currentDay]}</p>
                        </div>
                    ` : clientsWithSuggestions.map(client => `
                        <div class="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm overflow-hidden relative">
                            <h4 class="font-black text-xl text-slate-900 mb-5 border-b border-slate-50 pb-3">
                                ${client.toUpperCase()}
                            </h4>
                            <div class="space-y-3">
                                ${groupedSuggestions[client].map(s => `
                                    <div class="flex items-center justify-between bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                                        <div class="flex flex-col">
                                            <span class="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mb-0.5">Sugerencia ${dayNames[currentDay]}</span>
                                            <span class="font-bold text-slate-700">${s.product}</span>
                                        </div>
                                        <div class="text-right">
                                            <span class="text-2xl font-black text-emerald-600 block leading-tight">-${s.reduction}</span>
                                            <span class="text-[10px] font-bold text-emerald-400 uppercase">unidades</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            break;

        default:
            html = `<p class="p-10 text-center text-slate-400">Pronto disponible...</p>`;
    }

    container.innerHTML = html;

    // Re-initialize icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Global state modification helpers
window.state = state;

// Initial render
render();
