/**
 * UI Components for Brasal 1502
 */

export const Icons = {
    Home: '<i data-lucide="home" class="w-6 h-6"></i>',
    Ruta1: '<i data-lucide="truck" class="w-8 h-8"></i>',
    Ruta2: '<i data-lucide="truck" class="w-8 h-8"></i>',
    Gestion: '<i data-lucide="settings" class="w-8 h-8"></i>',
    Analisis: '<i data-lucide="trending-down" class="w-8 h-8"></i>',
    Returns: '<i data-lucide="arrow-left-circle" class="w-8 h-8"></i>',
    Orders: '<i data-lucide="shopping-cart" class="w-8 h-8"></i>',
    Payments: '<i data-lucide="euro" class="w-8 h-8"></i>',
    Back: '<i data-lucide="chevron-left" class="w-6 h-6"></i>',
    Check: '<i data-lucide="check-circle" class="w-6 h-6"></i>',
    Calendar: '<i data-lucide="calendar" class="w-8 h-8"></i>',
};

export const NavBar = () => `
    <nav class="glass flex items-center justify-between px-4 py-3 shadow-sm border-b border-slate-100">
        <button onclick="goBack()" class="p-3 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 dark:text-slate-300 flex items-center gap-1 font-medium">
            ${Icons.Back}
            <span class="text-sm">Atrás</span>
        </button>
        <button onclick="navigate('home')" class="p-3 -mr-2 rounded-full hover:bg-slate-100 text-slate-600 dark:text-slate-300 flex items-center gap-2 font-medium">
            <span class="text-sm">Inicio</span>
            ${Icons.Home}
        </button>
    </nav>
`;

export const Dashboard = () => `
    <div class="grid grid-cols-2 gap-4 pb-10 pt-4">
        <button onclick="navigate('route', {id: 1, name: 'RUBÉN'})" class="card-touch bg-ruta1">
            ${Icons.Ruta1}
            <span class="font-bold text-xl uppercase leading-tight">Ruta 1<br><small class="text-blue-100 font-normal">Rubén</small></span>
        </button>
        <button onclick="navigate('route', {id: 2, name: 'JOSÉ'})" class="card-touch bg-ruta2">
            ${Icons.Ruta2}
            <span class="font-bold text-xl uppercase leading-tight">Ruta 2<br><small class="text-emerald-100 font-normal">José</small></span>
        </button>
        
        <!-- NEW SECTIONS -->
        <button onclick="navigate('orders-history')" class="card-touch bg-slate-800 text-white">
            <i data-lucide="clipboard-list" class="w-8 h-8"></i>
            <span class="font-bold text-lg uppercase leading-tight">Pedidos<br>Registrados</span>
        </button>
        <button onclick="navigate('daily-reports')" class="card-touch bg-teal-600 text-white">
            <i data-lucide="file-text" class="w-8 h-8"></i>
            <span class="font-bold text-lg uppercase leading-tight">Informes<br>Diarios</span>
        </button>

        <button onclick="navigate('admin')" class="card-touch bg-gestion">
            ${Icons.Gestion}
            <span class="font-bold text-xl uppercase">Configuración</span>
        </button>
        <button onclick="navigate('analysis')" class="card-touch bg-analisis">
            ${Icons.Analisis}
            <span class="font-bold text-xl uppercase font-bold text-white">Análisis</span>
        </button>
    </div>
`;

export const OrdersHistory = (groupedOrders) => {
    const renderRouteSection = (routeName, dates) => {
        const sortedDates = Object.keys(dates).sort((a, b) => new Date(a) - new Date(b));

        return `
            <div class="mb-10">
                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b pb-2 flex items-center gap-2">
                    <i data-lucide="truck" class="w-4 h-4"></i> ${routeName}
                </h3>
                <div class="space-y-8">
                    ${sortedDates.length > 0 ? sortedDates.map(date => `
                        <div class="space-y-3">
                            <h4 class="text-xs font-bold text-slate-400 flex items-center gap-2 px-1">
                                <i data-lucide="calendar" class="w-3 h-3"></i> 
                                ${date.split('-').reverse().join('/')}
                            </h4>
                            <div class="space-y-3">
                                ${Object.keys(dates[date]).map(clientName => `
                                    <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm">
                                        <div class="mb-3 border-b border-slate-50 pb-2">
                                            <p class="font-bold text-slate-800 dark:text-white text-lg">${clientName}</p>
                                        </div>
                                        <div class="space-y-2">
                                            ${dates[date][clientName].map(item => `
                                                <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg">
                                                    <span class="text-sm font-medium text-slate-600 dark:text-slate-300">${item.product}</span>
                                                    <span class="font-bold text-slate-800 dark:text-white">${item.value} uds</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('') : '<p class="text-slate-400 text-sm italic py-2 text-center">No hay pedidos registrados</p>'}
                </div>
            </div>
        `;
    };

    return `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Pedidos Registrados</h2>
            <p class="text-slate-500 dark:text-slate-400">Agrupados por cliente y fecha de entrega</p>
        </div>
        <div class="pb-24">
            ${renderRouteSection('Ruta 1 (Rubén)', groupedOrders[1] || {})}
            ${renderRouteSection('Ruta 2 (José)', groupedOrders[2] || {})}
        </div>
    `;
};

export const DailyReports = (history) => {
    const uniqueDates = [...new Set(history.map(h => h.date))].sort((a, b) => new Date(b) - new Date(a));

    return `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Informes Diarios</h2>
            <p class="text-slate-500 dark:text-slate-400">Historial por fechas y exportación</p>
        </div>
        
        <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-8 flex flex-col gap-4">
            <div class="flex items-center justify-between">
                 <span class="text-indigo-800 font-bold">Exportar Todo (CSV/EXCEL)</span>
                 <div class="flex gap-2">
                    <button onclick="exportData('csv')" class="p-2 bg-indigo-600 text-white rounded-lg">${Icons.Check}</button>
                    <button onclick="exportData('xlsx')" class="p-2 bg-emerald-600 text-white rounded-lg">${Icons.Check}</button>
                 </div>
            </div>
        </div>

        <div class="space-y-3 pb-20">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Días con registros</h3>
            ${uniqueDates.length === 0 ? '<p class="text-center py-10 text-slate-400">No hay informes registrados aún.</p>' :
            uniqueDates.map(date => {
                const dayEntries = history.filter(h => h.date === date && h.type !== 'orders');
                const totals = dayEntries.reduce((acc, curr) => {
                    acc[curr.type] = (acc[curr.type] || 0) + curr.value;
                    return acc;
                }, { returns: 0, payments: 0 });

                // If no returns or payments, don't show the date in the reports list
                if (totals.returns === 0 && totals.payments === 0) return '';

                return `
                    <button onclick="navigate('report-detail', { date: '${date}' })" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-5 rounded-2xl shadow-sm text-left active:bg-slate-50 dark:bg-slate-900">
                        <div class="flex justify-between items-center mb-3">
                            <span class="font-bold text-slate-800 dark:text-white text-lg">${date.split('-').reverse().join('/')}</span>
                            <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300"></i>
                        </div>
                        <div class="flex gap-4 text-xs font-bold uppercase">
                            <span class="text-blue-500">Devol: ${totals.returns || 0}</span>
                            <span class="text-amber-500">Cobro: ${totals.payments.toFixed(2)}€</span>
                        </div>
                    </button>
                `;
            }).join('')}
        </div>
    `;
};

export const RouteMenu = (route) => `
    <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Ruta: ${route.name}</h2>
        <p class="text-slate-500 dark:text-slate-400">Selecciona una acción</p>
    </div>
    <div class="flex flex-col gap-4">
        <button onclick="navigate('clients', {routeId: ${route.id}, type: 'returns'})" class="btn-touch bg-blue-100 text-blue-700 border-2 border-blue-200">
            ${Icons.Returns}
            <span>DEVOLUCIONES</span>
        </button>
        <button onclick="navigate('clients', {routeId: ${route.id}, type: 'orders'})" class="btn-touch bg-emerald-100 text-emerald-700 border-2 border-emerald-200">
            ${Icons.Orders}
            <span>PEDIDOS</span>
        </button>
        <button onclick="navigate('clients', {routeId: ${route.id}, type: 'payments'})" class="btn-touch bg-amber-100 text-amber-700 border-2 border-amber-200">
            ${Icons.Payments}
            <span>COBROS</span>
        </button>
    </div>
`;

export const ClientList = (clients, typeLabel, routeName, originalType, routeId) => `
    <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white capitalize">${typeLabel}</h2>
        <p class="text-slate-500 dark:text-slate-400">Cliente en Ruta ${routeName}</p>
        <div class="mt-3 bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-start gap-3">
            <i data-lucide="mouse-pointer-click" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"></i>
            <p class="text-xs text-blue-800 font-medium leading-relaxed">
                <strong class="block mb-1">Organiza tu ruta</strong>
                Mantén presionado cualquier cliente y arrástralo para cambiar su orden en la lista. Se guardará automáticamente.
            </p>
        </div>
    </div>
    <div class="grid grid-cols-1 gap-2 pb-10" id="client-list-container">
        ${clients.map(client => `
            <div data-client="${client}" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm text-left active:bg-slate-50 dark:bg-slate-900 transition-colors flex items-center justify-between overflow-hidden">
                <div class="flex items-center gap-3 p-4 flex-1" onclick="selectClient('${client}', '${originalType}', ${routeId})">
                    <i data-lucide="grip-vertical" class="w-5 h-5 text-slate-300 shrink-0 cursor-grab touch-none opacity-50"></i>
                    <span class="text-lg font-bold text-slate-700 dark:text-slate-200 truncate select-none">${client}</span>
                </div>
                <button onclick="selectClient('${client}', '${originalType}', ${routeId})" class="p-4 bg-slate-50 dark:bg-slate-900 border-l border-slate-100 hover:bg-slate-100 transition-colors h-full">
                    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-400"></i>
                </button>
            </div>
        `).join('')}
    </div>
`;

export const Numpad = (title, unit = '', isDecimal = false, type = 'orders') => `
    <div class="flex flex-col h-full">
        <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white">${title}</h2>
            <div class="mt-4 p-6 bg-slate-100 rounded-2xl">
                <span id="numpad-display" class="text-5xl font-mono font-bold tracking-tight">0</span>
                <span class="text-2xl text-slate-500 dark:text-slate-400 ml-2">${unit}</span>
            </div>
        </div>
        
        <div class="grid grid-cols-3 gap-3 flex-1 pb-10">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button onclick="numpadPress('${n}')" class="h-20 text-3xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm active:bg-slate-50 dark:bg-slate-900">${n}</button>`).join('')}
            ${type === 'payments' ? `<button onclick="numpadPress('.')" class="h-20 text-3xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm active:bg-slate-50 dark:bg-slate-900">.</button>`
        : `<button onclick="numpadPress('.5')" class="h-20 text-2xl font-bold bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl shadow-sm active:bg-blue-100">+ &frac12;</button>`}
            <button onclick="numpadPress('0')" class="h-20 text-3xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm active:bg-slate-50 dark:bg-slate-900">0</button>
            <button onclick="numpadPress('DEL')" class="h-20 text-xl font-bold bg-red-50 text-red-500 border border-red-100 rounded-2xl shadow-sm active:bg-red-100">BORRAR</button>
        </div>
        
        <button onclick="numpadConfirm()" class="btn-touch bg-slate-900 text-white shadow-xl shadow-slate-200 mb-6">
            ${Icons.Check}
            <span>ACEPTAR</span>
        </button>
    </div>
`;
// --- GESTIÓN / ADMIN ---

export const AdminMenu = () => {
    const isDark = document.documentElement.classList.contains('dark');
    return `
    <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Configuración</h2>
        <p class="text-slate-500 dark:text-slate-400 font-medium">Administración general y tema</p>
    </div>
    <div class="grid grid-cols-1 gap-4">
        <button onclick="toggleTheme()" class="btn-touch bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 shadow-sm border-2 border-slate-800 dark:border-slate-100 mb-2">
            ${isDark ? '<i data-lucide="sun" class="w-6 h-6"></i>' : '<i data-lucide="moon" class="w-6 h-6"></i>'}
            <span class="font-bold">Tema ${isDark ? 'Claro' : 'Oscuro'}</span>
        </button>
        <hr class="border-slate-200 dark:border-slate-600 mb-2">
        <button onclick="navigate('add-client-name')" class="btn-touch bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white shadow-sm">
            <i data-lucide="user-plus" class="w-6 h-6 text-blue-500"></i>
            <span class="font-bold">Añadir Nuevo Cliente</span>
        </button>
        <button onclick="navigate('del-client-route')" class="btn-touch bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 text-red-500 shadow-sm">
            <i data-lucide="user-minus" class="w-6 h-6 text-red-500"></i>
            <span class="font-bold">Eliminar Cliente Existente</span>
        </button>
        <button onclick="navigate('past-returns-date')" class="btn-touch bg-white dark:bg-slate-800 border-2 border-teal-200 text-teal-700 shadow-sm mt-2">
            <i data-lucide="calendar-clock" class="w-6 h-6 text-teal-600"></i>
            <span class="font-bold">Añadir Reg. Pasados</span>
        </button>
    </div>
`;
}

export const PastReturnsDate = () => `
    <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Fecha Pasada</h2>
        <p class="text-slate-500 dark:text-slate-400">Selecciona el día que quieres registrar (ej: devoluciones de ayer)</p>
    </div>
    <div class="space-y-6">
        <input type="date" id="past-returns-date-input" 
               class="w-full h-16 px-6 text-xl border-2 border-slate-200 dark:border-slate-600 rounded-2xl focus:border-teal-500 outline-none">
        
        <button onclick="savePastReturnsDate()" class="btn-touch bg-teal-700 text-white shadow-lg">
            ${Icons.Check}
            <span>SIGUIENTE: ELEGIR RUTA</span>
        </button>
    </div>
`;

export const PastReturnsRoute = (customDate) => `
    <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Asignar Ruta</h2>
        <p class="text-slate-500 dark:text-slate-400">¿Para qué ruta registrarás datos el ${customDate.split('-').reverse().join('/')}?</p>
    </div>
    <div class="grid grid-cols-1 gap-4">
        <button onclick="navigate('past-records-type', { routeId: 1, customDate: '${customDate}' })" class="btn-touch bg-ruta1 text-white">
            ${Icons.Ruta1}
            <span>RUTA 1 (RUBÉN)</span>
        </button>
        <button onclick="navigate('past-records-type', { routeId: 2, customDate: '${customDate}' })" class="btn-touch bg-ruta2 text-white">
            ${Icons.Ruta2}
            <span>RUTA 2 (JOSÉ)</span>
        </button>
    </div>
`;

export const PastRecordsType = (routeId, customDate) => `
    <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Tipo de Registro</h2>
        <p class="text-slate-500 dark:text-slate-400">¿Qué deseas registrar para el ${customDate.split('-').reverse().join('/')}?</p>
    </div>
    <div class="grid grid-cols-1 gap-4">
        <button onclick="navigate('clients', { routeId: ${routeId}, type: 'returns', customDate: '${customDate}' })" class="btn-touch bg-blue-100 text-blue-700 border-2 border-blue-200">
            ${Icons.Returns}
            <span>DEVOLUCIONES</span>
        </button>
        <button onclick="navigate('clients', { routeId: ${routeId}, type: 'payments', customDate: '${customDate}' })" class="btn-touch bg-amber-100 text-amber-700 border-2 border-amber-200">
            ${Icons.Payments}
            <span>COBROS</span>
        </button>
    </div>
`;

export const AddClientName = () => `
    <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Nombre del Cliente</h2>
        <p class="text-slate-500 dark:text-slate-400">Ingresa el nombre comercial</p>
    </div>
    <div class="space-y-6">
        <input type="text" id="new-client-name" placeholder="Ej: Panadería El Sol" 
               class="w-full h-16 px-6 text-xl border-2 border-slate-200 dark:border-slate-600 rounded-2xl focus:border-blue-500 outline-none">
        
        <button onclick="saveTempName()" class="btn-touch bg-slate-900 text-white shadow-lg">
            ${Icons.Check}
            <span>SIGUIENTE: ELEGIR RUTA</span>
        </button>
    </div>
`;

export const AddClientRoute = () => `
    <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Asignar Ruta</h2>
        <p class="text-slate-500 dark:text-slate-400">¿A qué zona pertenece este cliente?</p>
    </div>
    <div class="grid grid-cols-1 gap-4">
        <button onclick="saveTempRoute(1)" class="btn-touch bg-ruta1 text-white">
            ${Icons.Ruta1}
            <span>RUTA 1 (RUBÉN)</span>
        </button>
        <button onclick="saveTempRoute(2)" class="btn-touch bg-ruta2 text-white">
            ${Icons.Ruta2}
            <span>RUTA 2 (JOSÉ)</span>
        </button>
    </div>
`;

export const AddClientLists = () => `
    <div class="mb-8 text-center">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Listas del Cliente</h2>
        <p class="text-slate-500 dark:text-slate-400">¿En qué apartados debe aparecer?</p>
    </div>
    <div class="grid grid-cols-1 gap-3">
        <button onclick="finalizeNewClient('pedidos')" class="btn-touch bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
            ${Icons.Orders}
            <span>LISTA DE PEDIDOS</span>
        </button>
        <button onclick="finalizeNewClient('devoluciones')" class="btn-touch bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
            ${Icons.Returns}
            <span>LISTA DE DEVOLUCIONES</span>
        </button>
        <button onclick="finalizeNewClient('cobros')" class="btn-touch bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
            ${Icons.Payments}
            <span>LISTA DE COBROS</span>
        </button>
        <div class="h-2"></div>
        <button onclick="finalizeNewClient('todas')" class="btn-touch bg-slate-900 text-white shadow-xl">
            ${Icons.Check}
            <span>TODAS LAS LISTAS</span>
        </button>
    </div>
`;

export const ReportDetail = (date, groupedEntries) => {
    const typeColors = {
        'returns': 'text-blue-600 bg-blue-50',
        'orders': 'text-emerald-600 bg-emerald-50',
        'payments': 'text-amber-600 bg-amber-50'
    };
    const typeLabels = {
        'returns': 'Devolución',
        'orders': 'Pedido',
        'payments': 'Cobro'
    };

    const clientNames = Object.keys(groupedEntries);

    return `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Informe: ${date.split('-').reverse().join('/')}</h2>
            <p class="text-slate-500 dark:text-slate-400">Registros agrupados por cliente</p>
        </div>

        <div class="space-y-6 pb-24">
            ${clientNames.length === 0 ? '<p class="text-center py-10 text-slate-400 italic">No hay registros administrativos para este día.</p>' :
            clientNames.map(client => `
                <div class="bg-white dark:bg-slate-800 border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
                    <h4 class="font-bold text-slate-900 dark:text-slate-100 text-lg mb-4 border-b border-slate-50 pb-2">${client}</h4>
                    <div class="space-y-3">
                        ${groupedEntries[client].map(entry => `
                            <div class="flex justify-between items-center">
                                <div>
                                    <span class="text-[9px] uppercase font-black px-2 py-0.5 rounded ${typeColors[entry.type]} mb-1 inline-block">
                                        ${typeLabels[entry.type]}
                                    </span>
                                    <p class="text-xs font-bold text-slate-500 dark:text-slate-400">${entry.product || (entry.type === 'payments' ? 'Cobro en efectivo' : '')}</p>
                                </div>
                                <div class="text-right flex items-center gap-3">
                                    <p class="font-black text-slate-800 dark:text-white">${entry.value}${entry.type === 'payments' ? '€' : ' uds'}</p>
                                    <div class="flex gap-1">
                                        <button onclick="editEntry(${entry.id})" class="p-2 bg-slate-100 text-slate-400 rounded-lg">
                                            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                                        </button>
                                        <button onclick="deleteEntry(${entry.id})" class="p-2 bg-red-50 text-red-400 rounded-lg">
                                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100">
            <div class="max-w-md mx-auto flex gap-3">
                <button onclick="exportData('pdf', 'TODO', '${date}')" class="flex-1 btn-touch bg-blue-600 text-white shadow-lg">
                    <i data-lucide="file-text" class="w-5 h-5"></i>
                    <span>PDF COMPLETO</span>
                </button>
            </div>
        </div>
    `;
};

export const DeleteClientRoute = () => `
    <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Eliminar Cliente</h2>
        <p class="text-slate-500 dark:text-slate-400">¿De qué ruta deseas eliminar?</p>
    </div>
    <div class="grid grid-cols-1 gap-4">
        <button onclick="navigate('del-client-selection', {routeId: 1})" class="btn-touch bg-ruta1 text-white">
            ${Icons.Ruta1}
            <span>RUTA 1 (RUBÉN)</span>
        </button>
        <button onclick="navigate('del-client-selection', {routeId: 2})" class="btn-touch bg-ruta2 text-white">
            ${Icons.Ruta2}
            <span>RUTA 2 (JOSÉ)</span>
        </button>
    </div>
`;

export const DeleteClientSelection = (routeId, clients) => `
    <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Seleccionar Cliente</h2>
        <p class="text-slate-500 dark:text-slate-400">Ruta ${routeId === 1 ? 'Rubén' : 'José'}</p>
    </div>
    <div class="grid grid-cols-1 gap-2 pb-10">
        ${clients.map(client => `
            <button onclick="finalizeDeleteClient(${routeId}, '${client}')" 
                    class="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-red-100 rounded-xl hover:border-red-400 text-left cursor-pointer">
                <span class="text-lg font-medium text-slate-700 dark:text-slate-200">${client}</span>
                <i data-lucide="trash-2" class="w-5 h-5 text-red-300"></i>
            </button>
        `).join('')}
    </div>
`;
