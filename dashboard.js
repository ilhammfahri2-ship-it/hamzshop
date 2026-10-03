const APP_STATE_KEY = 'kopi-karsa-state-v1';
const MENU_ITEMS = [
  { id: 'k01', name: 'Karsa Gula Aren', price: 22000 },
  { id: 'k02', name: 'Americano Cold Brew', price: 20000 },
  { id: 'k03', name: 'Poured V60 Gayo', price: 28000 },
  { id: 'k04', name: 'Velvet Matcha Latte', price: 25000 },
  { id: 'k05', name: 'Artisan Butter Croissant', price: 18000 },
  { id: 'k06', name: 'Spanish Latte Sea Salt', price: 26000 }
];
const STATUS_LABELS = { 1: 'Diterima', 2: 'Sedang dibuat', 3: 'Siap diambil' };
let appState = {};

function loadState() {
  try {
    appState = JSON.parse(localStorage.getItem(APP_STATE_KEY) || '{}');
  } catch {
    appState = {};
  }
  if (!Array.isArray(appState.orders)) appState.orders = [];
  if (!Array.isArray(appState.cart)) appState.cart = [];
  if (!appState.inventory || typeof appState.inventory !== 'object') appState.inventory = {};
  MENU_ITEMS.forEach(item => {
    if (!Number.isInteger(appState.inventory[item.id]) || appState.inventory[item.id] < 0) {
      appState.inventory[item.id] = 20;
    }
  });
}

function showDashboardToast(message, type = 'info') {
  const container = document.getElementById('dashboard-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const toneClass = type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800';
  toast.className = `rounded-2xl border px-4 py-3 shadow-lg text-sm font-medium ${toneClass}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 2600);
}

function saveState() {
  try {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
  } catch {
    showDashboardToast('Data tidak dapat disimpan. Periksa ruang penyimpanan browser.', 'error');
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatCurrency(amount) {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

function orderTotal(order) {
  return Number.isFinite(order.total)
    ? order.total
    : (order.items || []).reduce((sum, item) => sum + (item.unitPrice || 0) * (item.qty || 0), 0);
}

function renderMetrics() {
  const paidOrders = appState.orders.filter(order => order.paymentStatus === 'paid');
  const revenue = paidOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const average = paidOrders.length ? revenue / paidOrders.length : 0;
  const lowStock = MENU_ITEMS.filter(item => appState.inventory[item.id] <= 5).length;

  document.getElementById('metric-revenue').textContent = formatCurrency(revenue);
  document.getElementById('metric-orders').textContent = paidOrders.length.toLocaleString('id-ID');
  document.getElementById('metric-average').textContent = formatCurrency(average);
  document.getElementById('metric-low-stock').textContent = lowStock.toLocaleString('id-ID');
  document.getElementById('sidebar-order-count').textContent = appState.orders.length.toLocaleString('id-ID');
}

function renderChart() {
  const chart = document.getElementById('sales-chart');
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return { date, total: 0 };
  });

  appState.orders.filter(order => order.paymentStatus === 'paid').forEach(order => {
    const orderDate = new Date(order.createdAt || 0);
    orderDate.setHours(0, 0, 0, 0);
    const day = days.find(entry => entry.date.getTime() === orderDate.getTime());
    if (day) day.total += orderTotal(order);
  });

  const max = Math.max(...days.map(day => day.total), 1);
  chart.innerHTML = days.map(day => {
    const height = Math.max(4, Math.round((day.total / max) * 100));
    const label = day.date.toLocaleDateString('id-ID', { weekday: 'short' });
    return `<div class="flex min-w-0 flex-1 flex-col items-center gap-2">
      <span class="max-w-full truncate text-[10px] text-stone-500">${day.total ? formatCurrency(day.total) : 'Rp 0'}</span>
      <div class="flex h-36 w-full items-end justify-center"><div class="chart-bar w-full" style="height:${height}%" title="${escapeHTML(label)}: ${formatCurrency(day.total)}"></div></div>
      <span class="text-xs text-stone-500">${escapeHTML(label)}</span>
    </div>`;
  }).join('');
}

function renderTopMenu() {
  const sold = new Map();
  appState.orders.filter(order => order.paymentStatus === 'paid').forEach(order => {
    (order.items || []).forEach(item => sold.set(item.menuId, (sold.get(item.menuId) || 0) + (item.qty || 0)));
  });
  const topItems = MENU_ITEMS.map(item => ({ ...item, qty: sold.get(item.id) || 0 }))
    .sort((first, second) => second.qty - first.qty)
    .filter(item => item.qty > 0)
    .slice(0, 3);

  document.getElementById('top-menu-list').innerHTML = topItems.length
    ? topItems.map(item => `<div class="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div class="min-w-0"><p class="truncate font-bold text-stone-900">${escapeHTML(item.name)}</p><p class="text-xs text-stone-500">${item.qty} terjual</p></div>
        <span class="shrink-0 font-bold text-brand-800">${formatCurrency(item.price * item.qty)}</span>
      </div>`).join('')
    : '<p class="rounded-xl bg-stone-50 p-4 text-sm text-stone-500">Belum ada data penjualan.</p>';
}

function renderOrders() {
  const query = document.getElementById('order-search').value.trim().toLowerCase();
  const status = document.getElementById('order-filter').value;
  const orders = [...appState.orders].sort((first, second) => (second.createdAt || 0) - (first.createdAt || 0));
  const filtered = orders.filter(order => {
    const searchable = `${order.id} ${(order.items || []).map(item => item.name).join(' ')}`.toLowerCase();
    return searchable.includes(query) && (status === 'all' || String(order.statusStep) === status);
  });

  const container = document.getElementById('orders-list');
  if (!filtered.length) {
    container.innerHTML = `<p class="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">${orders.length ? 'Tidak ada pesanan yang cocok dengan pencarian atau filter.' : 'Belum ada pesanan. Pesanan dari halaman utama akan muncul di sini.'}</p>`;
    return;
  }

  container.innerHTML = filtered.map(order => {
    const items = (order.items || []).map(item => `${item.qty}x ${escapeHTML(item.name)}`).join(', ');
    const nextStep = Math.min(Number(order.statusStep) + 1, 3);
    const action = Number(order.statusStep) < 3
      ? `<button data-order-action="advance" data-order-id="${escapeHTML(order.id)}" class="rounded-xl bg-brand-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700">${nextStep === 2 ? 'Mulai dibuat' : 'Tandai siap'}</button>`
      : '<span class="text-xs font-semibold text-emerald-700">Pesanan siap diserahkan</span>';
    const date = new Date(order.createdAt || Date.now()).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    return `<article class="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0"><p class="font-mono text-xs font-bold text-stone-500">${escapeHTML(order.id)}</p><h4 class="mt-1 font-bold text-stone-900">${escapeHTML(order.type || 'Takeaway')} <span class="font-normal text-stone-500">· ${escapeHTML(date)}</span></h4></div>
        <span class="status-pill ${order.statusStep >= 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}">${STATUS_LABELS[order.statusStep] || 'Status tidak diketahui'}</span>
      </div>
      <div class="mt-3 grid gap-2 text-sm text-stone-600 sm:grid-cols-[1fr_auto] sm:items-end"><p class="break-words">${items || 'Tidak ada rincian item'}</p><p class="font-bold text-stone-900">${formatCurrency(orderTotal(order))} <span class="text-xs font-medium text-emerald-700">· ${order.paymentStatus === 'paid' ? 'Sudah membayar' : 'Belum dibayar'}</span></p></div>
      <div class="mt-4">${action}</div>
    </article>`;
  }).join('');
}

function renderInventory() {
  document.getElementById('inventory-list').innerHTML = MENU_ITEMS.map(item => {
    const stock = appState.inventory[item.id];
    const status = stock === 0 ? 'Habis' : stock <= 5 ? 'Stok menipis' : 'Tersedia';
    const statusClass = stock === 0 ? 'text-rose-700' : stock <= 5 ? 'text-amber-700' : 'text-emerald-700';
    return `<article class="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
      <div class="min-w-0"><h4 class="truncate font-bold text-stone-900">${escapeHTML(item.name)}</h4><p class="text-xs ${statusClass}">${status}</p></div>
      <div class="flex shrink-0 items-center gap-2">
        <button type="button" data-stock-delta="-1" data-menu-id="${item.id}" aria-label="Kurangi stok ${escapeHTML(item.name)}" class="h-10 w-10 rounded-xl border border-stone-200 bg-white text-lg font-bold text-stone-700 hover:bg-stone-100">−</button>
        <span class="w-8 text-center font-bold tabular-nums text-stone-900">${stock}</span>
        <button type="button" data-stock-delta="1" data-menu-id="${item.id}" aria-label="Tambah stok ${escapeHTML(item.name)}" class="h-10 w-10 rounded-xl border border-stone-200 bg-white text-lg font-bold text-stone-700 hover:bg-stone-100">+</button>
      </div>
    </article>`;
  }).join('');
}

function renderDashboard() {
  renderMetrics();
  renderChart();
  renderTopMenu();
  renderOrders();
  renderInventory();
}

function advanceOrder(orderId) {
  const order = appState.orders.find(entry => entry.id === orderId);
  if (!order || order.statusStep >= 3) return;
  order.statusStep += 1;
  if (appState.activeOrder?.id === order.id) appState.activeOrder = order;
  saveState();
  renderDashboard();
}

function exportOrders() {
  const rows = [['Nomor Pesanan', 'Tanggal', 'Tipe', 'Status', 'Pembayaran', 'Item', 'Total']];
  appState.orders.forEach(order => rows.push([
    order.id,
    new Date(order.createdAt || Date.now()).toLocaleString('id-ID'),
    order.type || 'Takeaway',
    STATUS_LABELS[order.statusStep] || 'Tidak diketahui',
    order.paymentStatus === 'paid' ? 'Sudah membayar' : 'Belum dibayar',
    (order.items || []).map(item => `${item.qty}x ${item.name}`).join('; '),
    orderTotal(order)
  ]));
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  link.download = 'laporan-pesanan-kopi-karsa.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

document.addEventListener('DOMContentLoaded', () => {
  const adminSession = localStorage.getItem('kopi-karsa-admin');
  if (!adminSession) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const parsed = JSON.parse(adminSession);
    if (!parsed || !parsed.loggedIn) {
      window.location.href = 'login.html';
      return;
    }
  } catch {
    localStorage.removeItem('kopi-karsa-admin');
    window.location.href = 'login.html';
    return;
  }

  loadState();
  renderDashboard();
  document.getElementById('order-search').addEventListener('input', renderOrders);
  document.getElementById('order-filter').addEventListener('change', renderOrders);
  document.getElementById('export-orders').addEventListener('click', exportOrders);
  document.getElementById('logout-admin').addEventListener('click', () => {
    localStorage.removeItem('kopi-karsa-admin');
    window.location.href = 'login.html';
  });
  document.addEventListener('click', event => {
    const orderButton = event.target.closest('[data-order-action="advance"]');
    if (orderButton) advanceOrder(orderButton.dataset.orderId);

    const stockButton = event.target.closest('[data-stock-delta]');
    if (stockButton) {
      const menuId = stockButton.dataset.menuId;
      appState.inventory[menuId] = Math.max(0, Math.min(999, appState.inventory[menuId] + Number(stockButton.dataset.stockDelta)));
      saveState();
      renderDashboard();
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== APP_STATE_KEY) return;
    loadState();
    renderDashboard();
  });
});
