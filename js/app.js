// GOOGLE SHEETS API CONFIGURATION
const GSHEET_API_URL = "https://script.google.com/macros/s/AKfycbwmsMfcIs95PMlrg2FUsodkGmmW76XmkdAFWcNK4rMQHv_qTH0vG95W8gFd4Hjl-wtwpg/exec";

// AUTHENTICATION CONFIG & LOGIC
const ALLOWED_PASSWORDS = ["Okg@2026", "Okg@2026."];
const AUTH_STORAGE_KEY = "pantau_lpg_auth";

function checkAuthentication() {
  const isAuthLocal = localStorage.getItem(AUTH_STORAGE_KEY) === "authorized";
  const isAuthSession = sessionStorage.getItem(AUTH_STORAGE_KEY) === "authorized";
  return isAuthLocal || isAuthSession;
}

function initAuth() {
  const loginScreen = document.getElementById('loginScreen');
  const appContainer = document.getElementById('appContainer');

  if (checkAuthentication()) {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
    initData();
  } else {
    if (loginScreen) {
      loginScreen.classList.remove('hidden');
      const passInput = document.getElementById('loginPasswordInput');
      if (passInput) setTimeout(() => passInput.focus(), 250);
    }
    if (appContainer) {
      appContainer.classList.add('hidden');
    }
  }
}

function handleLoginSubmit(event) {
  if (event) event.preventDefault();
  const inputEl = document.getElementById('loginPasswordInput');
  const errorEl = document.getElementById('loginErrorMessage');
  const loginCard = document.getElementById('loginCard');
  const rememberCheckbox = document.getElementById('rememberMeCheckbox');
  const enteredPass = inputEl ? inputEl.value.trim() : '';

  if (ALLOWED_PASSWORDS.includes(enteredPass)) {
    if (errorEl) errorEl.classList.add('hidden');

    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem(AUTH_STORAGE_KEY, "authorized");
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, "authorized");
    }

    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');

    if (loginScreen) {
      loginScreen.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => {
        loginScreen.classList.add('hidden');
        loginScreen.classList.remove('opacity-0', 'pointer-events-none');
      }, 300);
    }

    if (appContainer) {
      appContainer.classList.remove('hidden');
    }

    initData();
    showToast("Akses berhasil dibuka. Selamat datang!");
    if (window.lucide) lucide.createIcons();
  } else {
    if (errorEl) {
      errorEl.classList.remove('hidden');
    }
    if (loginCard) {
      loginCard.classList.remove('animate-shake');
      void loginCard.offsetWidth; // re-trigger animation
      loginCard.classList.add('animate-shake');
    }
    if (inputEl) {
      inputEl.classList.add('border-rose-400', 'bg-rose-50/40');
      inputEl.focus();
      inputEl.select();
    }
  }
}

function clearLoginError() {
  const errorEl = document.getElementById('loginErrorMessage');
  const inputEl = document.getElementById('loginPasswordInput');
  if (errorEl) errorEl.classList.add('hidden');
  if (inputEl) inputEl.classList.remove('border-rose-400', 'bg-rose-50/40');
}

function togglePasswordVisibility() {
  const inputEl = document.getElementById('loginPasswordInput');
  const iconEl = document.getElementById('passwordToggleIcon');
  if (!inputEl) return;

  if (inputEl.type === 'password') {
    inputEl.type = 'text';
    if (iconEl) iconEl.setAttribute('data-lucide', 'eye-off');
  } else {
    inputEl.type = 'password';
    if (iconEl) iconEl.setAttribute('data-lucide', 'eye');
  }
  if (window.lucide) lucide.createIcons();
}

function handleLogout() {
  if (confirm("Kunci aplikasi dan keluar dari sistem?")) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.reload();
  }
}

// STATE MANAGEMENT
let appState = {
  customers: [],
  transactions: [],
  currentCustomerId: null
};

// PAGINATION STATE
let paginationState = {
  currentPage: 1,
  rowsPerPage: 10
};

// TOAST NOTIFICATION UTILITY
function showToast(message, isError = false) {
  let toast = document.getElementById('pantauToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pantauToast';
    toast.className = 'fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none';
    document.body.appendChild(toast);
  }

  if (isError) {
    toast.className = 'fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 bg-rose-600 text-white';
    toast.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i><span>${message}</span>`;
  } else {
    toast.className = 'fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 bg-slate-900 text-white';
    toast.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 shrink-0 text-emerald-400"></i><span>${message}</span>`;
  }
  if (window.lucide) lucide.createIcons();

  clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-10', 'opacity-0');
  }, 3200);
}

// CLOUD SYNC BADGE INDICATOR
function updateSyncStatus(status, text) {
  const badge = document.getElementById('cloudSyncStatus');
  if (!badge) return;

  if (status === 'syncing') {
    badge.className = 'hidden lg:flex items-center gap-1.5 text-[11px] text-blue-700 font-medium bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full transition';
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span><span>${text || 'Menyimpan...'}</span>`;
  } else if (status === 'synced') {
    badge.className = 'hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full transition';
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>${text || 'GSheet Terhubung'}</span>`;
  } else if (status === 'error') {
    badge.className = 'hidden lg:flex items-center gap-1.5 text-[11px] text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full transition';
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span>${text || 'Mode Offline'}</span>`;
  }
}

// FETCH DATA DARI GOOGLE APPS SCRIPT WEB APP
async function fetchFromGoogleSheets(isManual = false) {
  const refreshIcon = document.querySelector('button[title*="Google Sheet"] i');
  if (refreshIcon) refreshIcon.classList.add('animate-spin');
  updateSyncStatus('syncing', 'Memuat data GSheet...');

  try {
    const res = await fetch(GSHEET_API_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    if (data && data.status === 'success') {
      appState.customers = (data.customers || []).map(c => ({
        id: String(c.id || ''),
        name: String(c.name || ''),
        notes: String(c.notes || '')
      }));

      appState.transactions = (data.transactions || []).map(t => ({
        id: String(t.id || ''),
        customerId: String(t.customerId || ''),
        date: String(t.date || '').slice(0, 10),
        noSJ: String(t.noSJ || ''),
        sent: Number(t.sent || 0),
        returned: Number(t.returned || 0),
        note: String(t.note || '')
      }));

      saveToLocalStorage();
      populateCustomerDropdown();
      renderAll();

      if (appState.currentCustomerId) {
        viewCustomerDetail(appState.currentCustomerId);
      }

      updateSyncStatus('synced', 'GSheet Terhubung');
      if (isManual) showToast('Data berhasil diperbarui dari Google Sheet!');
    } else {
      throw new Error(data.message || 'Format respon tidak sesuai');
    }
  } catch (err) {
    console.warn("GSheet sync error:", err);
    updateSyncStatus('error', 'Mode Offline');
    if (isManual) showToast('Gagal terhubung ke Google Sheet. Menampilkan data lokal.', true);
  } finally {
    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
  }
}

// ASYNC POST ACTIONS KE GOOGLE APPS SCRIPT
async function sendActionToGoogleSheets(action, payload) {
  updateSyncStatus('syncing', 'Menyimpan ke GSheet...');
  try {
    const res = await fetch(GSHEET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({ action, ...payload })
    });
    const result = await res.json();
    if (result && result.status === 'success') {
      updateSyncStatus('synced', 'GSheet Terhubung');
      return true;
    } else {
      console.warn("GSheet warning:", result);
      updateSyncStatus('synced', 'Tersimpan (Lokal)');
      return false;
    }
  } catch (err) {
    console.warn("GSheet network save warning:", err);
    updateSyncStatus('error', 'Gagal kirim ke Cloud');
    return false;
  }
}


// Load from Local Storage, lalu otomatis sinkron dengan GSheet
function initData() {
  const saved = localStorage.getItem('pinjam_barang_db');
  if (saved) {
    try {
      appState = JSON.parse(saved);
    } catch (e) {
      appState = { customers: [], transactions: [], currentCustomerId: null };
    }
  } else {
    // Mulai bersih, biarkan Google Sheet yang mengisi
    appState = { customers: [], transactions: [], currentCustomerId: null };
  }
  populateCustomerDropdown();
  renderAll();

  // Ambil data terbaru langsung dari Google Sheet saat aplikasi dibuka
  fetchFromGoogleSheets(false);
}

function saveToLocalStorage() {
  localStorage.setItem('pinjam_barang_db', JSON.stringify(appState));
}

// DATE FORMATTER (DD-MMM-YY / e.g. 10-May-24)
function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
}

// STATS CALCULATIONS FOR A CUSTOMER
function calculateCustomerStats(customerId) {
  const txs = appState.transactions.filter(t => t.customerId === customerId);

  let totalSent = 0;
  let totalReturned = 0;
  let lastDate = "";

  // Sort by date chronologically
  txs.sort((a, b) => new Date(a.date) - new Date(b.date));

  txs.forEach(t => {
    totalSent += Number(t.sent || 0);
    totalReturned += Number(t.returned || 0);
    if (t.date) lastDate = t.date;
  });

  const balance = totalSent - totalReturned;
  return { totalSent, totalReturned, balance, lastDate, count: txs.length };
}

// RENDER TOP 4 GLOBAL STATS (PERSIS SCREENSHOT)
function renderGlobalStats() {
  let gSent = 0;
  let gReturned = 0;

  appState.transactions.forEach(t => {
    gSent += Number(t.sent || 0);
    gReturned += Number(t.returned || 0);
  });

  const gBalance = gSent - gReturned;

  const elCust = document.getElementById('statTotalCustomer');
  const elSent = document.getElementById('statTotalSent');
  const elRet = document.getElementById('statTotalReturned');
  const elBal = document.getElementById('statTotalBalance');

  if (elCust) elCust.innerText = appState.customers.length;
  if (elSent) elSent.innerText = gSent.toLocaleString();
  if (elRet) elRet.innerText = gReturned.toLocaleString();
  if (elBal) elBal.innerText = gBalance.toLocaleString();
}

// RENDER CUSTOMER LIST (DESKTOP TABLE & MOBILE CARDS FEED DENGAN PAGINASI)
function renderCustomerList() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('statusFilter')?.value || 'all';
  const tbody = document.getElementById('customerTableBody');
  const mobileList = document.getElementById('customerMobileList');

  if (tbody) tbody.innerHTML = '';
  if (mobileList) mobileList.innerHTML = '';

  // Filter customers based on search and status
  let filtered = appState.customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search) || (c.notes || '').toLowerCase().includes(search);
    if (!matchSearch) return false;

    const stats = calculateCustomerStats(c.id);
    if (statusFilter === 'has_balance') return stats.balance !== 0;
    if (statusFilter === 'settled') return stats.balance === 0;
    return true;
  });

  // Jika data kosong, tampilkan baris/pesan bersih
  if (filtered.length === 0) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-5 py-8 text-center text-xs text-slate-400">
            Belum ada data customer
          </td>
        </tr>
      `;
    }
    if (mobileList) {
      mobileList.innerHTML = `
        <div class="px-4 py-8 text-center text-xs text-slate-400">
          Belum ada data customer
        </div>
      `;
    }
    renderPaginationControls(0, 0, 0, 1);
    return;
  }

  // Pagination calculation
  const totalItems = filtered.length;
  const rowsPerPage = paginationState.rowsPerPage === 'all' ? totalItems : parseInt(paginationState.rowsPerPage, 10);
  const totalPages = rowsPerPage > 0 ? Math.ceil(totalItems / rowsPerPage) || 1 : 1;

  if (paginationState.currentPage > totalPages) {
    paginationState.currentPage = totalPages;
  }
  if (paginationState.currentPage < 1) {
    paginationState.currentPage = 1;
  }

  const startIndex = (paginationState.currentPage - 1) * rowsPerPage;
  const endIndex = paginationState.rowsPerPage === 'all' ? totalItems : Math.min(startIndex + rowsPerPage, totalItems);
  const paginatedData = filtered.slice(startIndex, endIndex);

  // Render rows
  paginatedData.forEach((cust) => {
    const stats = calculateCustomerStats(cust.id);

    // Badge sisa styling (0 = abu-abu pill, > 0 = kuning/amber pill)
    let sisaBadgeHtml = "";
    if (stats.balance === 0) {
      sisaBadgeHtml = `<span class="inline-flex items-center justify-center min-w-[28px] h-6 px-2.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-500">0</span>`;
    } else if (stats.balance > 0) {
      sisaBadgeHtml = `<span class="inline-flex items-center justify-center min-w-[28px] h-6 px-2.5 text-xs font-bold rounded-full bg-[#fef3c7] text-[#d97706]">${stats.balance}</span>`;
    } else {
      sisaBadgeHtml = `<span class="inline-flex items-center justify-center min-w-[28px] h-6 px-2.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700">${stats.balance}</span>`;
    }

    // 1. Tampilan Desktop Table
    if (tbody) {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50/70 transition border-b border-slate-100 group";
      tr.innerHTML = `
        <td class="px-5 py-3.5">
          <button onclick="viewCustomerDetail('${cust.id}')" class="font-bold text-blue-600 hover:text-blue-700 hover:underline text-left text-xs uppercase tracking-tight">
            ${cust.name}
          </button>
        </td>
        <td class="px-5 py-3.5 text-center text-slate-600 text-xs font-normal">
          ${formatDate(stats.lastDate)}
        </td>
        <td class="px-5 py-3.5 text-center font-bold text-slate-900 text-xs">
          ${stats.totalSent}
        </td>
        <td class="px-5 py-3.5 text-center font-medium text-slate-700 text-xs">
          ${stats.totalReturned}
        </td>
        <td class="px-5 py-3.5 text-center">
          ${sisaBadgeHtml}
        </td>
        <td class="px-5 py-3.5 text-xs text-slate-400">
          ${cust.notes || '-'}
        </td>
        <td class="px-5 py-3.5 text-right whitespace-nowrap">
          <button onclick="printCustomerReport('${cust.id}')" class="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition inline-flex items-center mr-1" title="Cetak Rekap / PDF">
            <i data-lucide="printer" class="w-4 h-4"></i>
          </button>
          <button onclick="viewCustomerDetail('${cust.id}')" class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition inline-flex items-center gap-1 mr-1">
            Buka Transaksi &rarr;
          </button>
          <button onclick="deleteCustomer('${cust.id}')" class="delete-btn p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition inline-flex items-center" title="Hapus Customer">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    // 2. Tampilan Khusus Layar HP (Mobile Card Feed)
    if (mobileList) {
      const card = document.createElement('div');
      card.className = "p-3.5 hover:bg-slate-50/70 transition space-y-2.5";
      card.innerHTML = `
        <div class="flex items-start justify-between gap-2.5">
          <div class="min-w-0 flex-1">
            <button onclick="viewCustomerDetail('${cust.id}')" class="font-bold text-slate-900 hover:text-blue-600 text-left text-sm tracking-tight truncate block w-full">
              ${cust.name}
            </button>
            <p class="text-[11px] text-slate-400 mt-0.5 truncate">${cust.notes || 'Tidak ada catatan'}</p>
          </div>
          <div class="shrink-0 flex items-center gap-1.5">
            <span class="text-[10px] text-slate-400 font-medium">Sisa:</span>
            ${sisaBadgeHtml}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-slate-50/90 border border-slate-100 text-center">
          <div>
            <span class="text-[9px] font-semibold text-slate-400 block uppercase tracking-wider">Kirim</span>
            <span class="text-xs font-bold text-slate-900 mt-0.5 block">${stats.totalSent}</span>
          </div>
          <div class="border-x border-slate-200/70">
            <span class="text-[9px] font-semibold text-slate-400 block uppercase tracking-wider">Kembali</span>
            <span class="text-xs font-semibold text-slate-700 mt-0.5 block">${stats.totalReturned}</span>
          </div>
          <div>
            <span class="text-[9px] font-semibold text-slate-400 block uppercase tracking-wider">Terakhir</span>
            <span class="text-[10px] font-medium text-slate-600 mt-0.5 block truncate">${formatDate(stats.lastDate)}</span>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2 pt-0.5">
          <button onclick="viewCustomerDetail('${cust.id}')" class="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 transition">
            <span>Buka Transaksi </span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
          <div class="flex items-center gap-1 shrink-0">
            <button onclick="printCustomerReport('${cust.id}')" class="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition" title="Cetak Rekap">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteCustomer('${cust.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition" title="Hapus Customer">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
      mobileList.appendChild(card);
    }
  });

  // Update Pagination UI
  renderPaginationControls(totalItems, startIndex, endIndex, totalPages);

  if (window.lucide) {
    lucide.createIcons();
  }
}

// RENDER PAGINATION FOOTER
function renderPaginationControls(totalItems, startIndex, endIndex, totalPages) {
  const startEl = document.getElementById('paginationStart');
  const endEl = document.getElementById('paginationEnd');
  const totalEl = document.getElementById('paginationTotal');
  const controlsEl = document.getElementById('paginationControls');

  if (startEl) {
    startEl.innerText = totalItems === 0 ? "0" : (startIndex + 1).toLocaleString();
  }
  if (endEl) {
    endEl.innerText = totalItems === 0 ? "0" : endIndex.toLocaleString();
  }
  if (totalEl) {
    totalEl.innerText = totalItems.toLocaleString();
  }

  if (!controlsEl) return;
  controlsEl.innerHTML = '';

  if (totalPages <= 1) {
    return;
  }

  // Prev Button
  const prevBtn = document.createElement('button');
  prevBtn.disabled = paginationState.currentPage === 1;
  prevBtn.className = `p-1.5 rounded-md border border-slate-200 transition ${paginationState.currentPage === 1
    ? 'text-slate-300 border-slate-100 cursor-not-allowed'
    : 'text-slate-600 hover:bg-slate-50 cursor-pointer'
    }`;
  prevBtn.innerHTML = `<i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>`;
  prevBtn.onclick = () => {
    if (paginationState.currentPage > 1) {
      paginationState.currentPage--;
      renderCustomerList();
    }
  };
  controlsEl.appendChild(prevBtn);

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    // Show first, last, and around current page
    if (i === 1 || i === totalPages || (i >= paginationState.currentPage - 1 && i <= paginationState.currentPage + 1)) {
      const pageBtn = document.createElement('button');
      const isActive = i === paginationState.currentPage;
      pageBtn.className = `min-w-[32px] h-8 px-2 text-xs rounded-md border font-medium transition ${isActive
        ? 'bg-white border-slate-300 text-slate-900 font-bold shadow-xs'
        : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100'
        }`;
      pageBtn.innerText = i;
      pageBtn.onclick = () => {
        paginationState.currentPage = i;
        renderCustomerList();
      };
      controlsEl.appendChild(pageBtn);
    } else if (
      (i === 2 && paginationState.currentPage > 3) ||
      (i === totalPages - 1 && paginationState.currentPage < totalPages - 2)
    ) {
      const ellipsis = document.createElement('span');
      ellipsis.className = "px-1 text-slate-400 text-xs";
      ellipsis.innerText = "...";
      controlsEl.appendChild(ellipsis);
    }
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.disabled = paginationState.currentPage === totalPages;
  nextBtn.className = `p-1.5 rounded-md border border-slate-200 transition ${paginationState.currentPage === totalPages
    ? 'text-slate-300 border-slate-100 cursor-not-allowed'
    : 'text-slate-600 hover:bg-slate-50 cursor-pointer'
    }`;
  nextBtn.innerHTML = `<i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`;
  nextBtn.onclick = () => {
    if (paginationState.currentPage < totalPages) {
      paginationState.currentPage++;
      renderCustomerList();
    }
  };
  controlsEl.appendChild(nextBtn);
}

function handleRowsPerPageChange(value) {
  paginationState.rowsPerPage = value;
  paginationState.currentPage = 1;
  renderCustomerList();
}

// RENDER DETAIL RIWAYAT TRANSAKSI (MUTASI CUSTOMER)
function viewCustomerDetail(customerId) {
  appState.currentCustomerId = customerId;
  const cust = appState.customers.find(c => c.id === customerId);
  if (!cust) return;

  const nameEl = document.getElementById('detailCustomerName');
  const noteEl = document.getElementById('detailCustomerNote');
  if (nameEl) nameEl.innerText = cust.name;
  if (noteEl) noteEl.innerText = cust.notes ? `Catatan: ${cust.notes}` : "Tidak ada catatan khusus.";

  const stats = calculateCustomerStats(customerId);
  const miniLastDate = document.getElementById('detailMiniLastDate');
  const miniSent = document.getElementById('detailMiniSent');
  const miniReturned = document.getElementById('detailMiniReturned');
  const miniBalance = document.getElementById('detailMiniBalance');

  if (miniLastDate) miniLastDate.innerText = formatDate(stats.lastDate);
  if (miniSent) miniSent.innerText = stats.totalSent;
  if (miniReturned) miniReturned.innerText = stats.totalReturned;
  if (miniBalance) miniBalance.innerText = stats.balance;

  const badge = document.getElementById('detailBadgeStatus');
  if (badge) {
    if (stats.balance === 0) {
      badge.className = "px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80";
      badge.innerText = "Lunas / Tidak Ada Sisa Pinjaman";
    } else {
      badge.className = "px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80";
      badge.innerText = `Ada Sisa: ${stats.balance} item`;
    }
  }

  // Ambil transaksi customer ini dan urutkan tanggal
  const txs = appState.transactions.filter(t => t.customerId === customerId);
  txs.sort((a, b) => new Date(a.date) - new Date(b.date));

  const tbody = document.getElementById('detailMutationTableBody');
  const mobileList = document.getElementById('detailMutationMobileList');

  if (tbody) tbody.innerHTML = '';
  if (mobileList) mobileList.innerHTML = '';

  if (txs.length === 0) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-5 py-8 text-center text-xs text-slate-400">
            Belum ada riwayat transaksi
          </td>
        </tr>
      `;
    }
    if (mobileList) {
      mobileList.innerHTML = `
        <div class="px-4 py-8 text-center text-xs text-slate-400">
          Belum ada riwayat transaksi untuk pelanggan ini.
        </div>
      `;
    }
    return;
  }

  let runningBalance = 0;
  txs.forEach((tx) => {
    const sent = Number(tx.sent || 0);
    const returned = Number(tx.returned || 0);
    runningBalance += (sent - returned);

    // 1. Tampilan Desktop Table
    if (tbody) {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50/60 transition border-b border-slate-100";
      tr.innerHTML = `
        <td class="px-5 py-3 text-slate-600 whitespace-nowrap text-xs">
          ${formatDate(tx.date)}
        </td>
        <td class="px-5 py-3 font-mono font-medium text-slate-800 text-xs">
          ${tx.noSJ ? tx.noSJ : '<span class="text-slate-300">-</span>'}
        </td>
        <td class="px-5 py-3 text-center text-slate-900 font-bold text-xs">
          ${sent > 0 ? sent : '-'}
        </td>
        <td class="px-5 py-3 text-center text-slate-600 font-medium text-xs">
          ${returned > 0 ? returned : '-'}
        </td>
        <td class="px-5 py-3 text-center font-bold text-xs">
          <span class="inline-flex items-center justify-center min-w-[26px] px-2 py-0.5 rounded-full ${runningBalance === 0 ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'
        }">${runningBalance}</span>
        </td>
        <td class="px-5 py-3 text-xs text-slate-400">
          ${tx.note || '-'}
        </td>
        <td class="px-5 py-3 text-center">
          <button onclick="deleteTransaction('${tx.id}')" class="text-slate-400 hover:text-rose-600 transition p-1 rounded-md" title="Hapus Mutasi">
            <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    // 2. Tampilan Khusus Layar HP (Mobile Timeline Card)
    if (mobileList) {
      const card = document.createElement('div');
      card.className = "p-3.5 hover:bg-slate-50/60 transition space-y-2";
      card.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-900">${formatDate(tx.date)}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${tx.noSJ ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'text-slate-400'}">
              ${tx.noSJ ? 'SJ: ' + tx.noSJ : 'Tanpa SJ'}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 text-xs font-bold rounded-full ${runningBalance === 0 ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800'}">
              Sisa: ${runningBalance}
            </span>
            <button onclick="deleteTransaction('${tx.id}')" class="p-1 text-slate-400 hover:text-rose-600 rounded-md transition" title="Hapus Mutasi">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs pt-0.5">
          <div class="flex items-center gap-1 font-semibold ${sent > 0 ? 'text-blue-600' : 'text-slate-400'}">
            <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
            <span>Kirim: ${sent > 0 ? sent : '0'}</span>
          </div>
          <div class="flex items-center gap-1 font-semibold ${returned > 0 ? 'text-slate-700' : 'text-slate-400'}">
            <i data-lucide="corner-down-left" class="w-3.5 h-3.5"></i>
            <span>Kembali: ${returned > 0 ? returned : '0'}</span>
          </div>
          ${tx.note ? `<span class="text-[11px] text-slate-400 truncate ml-auto">${tx.note}</span>` : ''}
        </div>
      `;
      mobileList.appendChild(card);
    }
  });

  // Switch view
  document.getElementById('viewSummary')?.classList.add('hidden');
  document.getElementById('viewDetail')?.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) {
    lucide.createIcons();
  }
}

function navigateToList() {
  appState.currentCustomerId = null;
  document.getElementById('viewDetail')?.classList.add('hidden');
  document.getElementById('viewSummary')?.classList.remove('hidden');
  renderAll();
}

// SEARCH HANDLERS
function handleSearch() {
  paginationState.currentPage = 1;
  renderCustomerList();
}

function handleGlobalSearch(query) {
  const tableSearchInput = document.getElementById('searchInput');
  if (tableSearchInput) {
    tableSearchInput.value = query;
  }
  // If in detail view, switch back to list view on search
  if (appState.currentCustomerId) {
    navigateToList();
  } else {
    handleSearch();
  }
}

// KEYBOARD SHORTCUT (⌘ K / Ctrl + K)
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const globalSearch = document.getElementById('globalSearchInput');
    const tableSearch = document.getElementById('searchInput');
    if (globalSearch && window.innerWidth >= 768) {
      globalSearch.focus();
      globalSearch.select();
    } else if (tableSearch) {
      tableSearch.focus();
      tableSearch.select();
    }
  }
});

// MODAL CONTROLS
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  if (id === 'modalAddTransaction') {
    const dateInput = document.getElementById('txDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    if (appState.currentCustomerId) {
      const custSelect = document.getElementById('txCustomerId');
      if (custSelect) {
        custSelect.value = appState.currentCustomerId;
      }
    }
    const sentEl = document.getElementById('txSent');
    const retEl = document.getElementById('txReturned');
    if (sentEl) sentEl.value = '0';
    if (retEl) retEl.value = '0';
    updateTxBalancePreview();
  }
}

function updateTxBalancePreview() {
  const sent = parseInt(document.getElementById('txSent')?.value, 10) || 0;
  const returned = parseInt(document.getElementById('txReturned')?.value, 10) || 0;
  const diff = sent - returned;
  const previewEl = document.getElementById('txBalancePreviewText');
  if (!previewEl) return;

  if (sent === 0 && returned === 0) {
    previewEl.className = "font-bold text-slate-400";
    previewEl.innerText = "0 Tabung (Belum ada perubahan)";
  } else if (diff === 0) {
    previewEl.className = "font-bold text-blue-600";
    previewEl.innerText = "0 Tabung (Tukar Seimbang / Impas)";
  } else if (diff > 0) {
    previewEl.className = "font-bold text-amber-600";
    if (returned === 0) {
      previewEl.innerText = `+${diff} Tabung (Pinjam Saja)`;
    } else {
      previewEl.innerText = `+${diff} Tabung (Sisa Bertambah)`;
    }
  } else {
    previewEl.className = "font-bold text-emerald-600";
    if (sent === 0) {
      previewEl.innerText = `${diff} Tabung (Pengembalian Saja)`;
    } else {
      previewEl.innerText = `${diff} Tabung (Sisa Berkurang)`;
    }
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function openQuickAddMutationModal() {
  openModal('modalAddTransaction');
}

function populateCustomerDropdown() {
  const select = document.getElementById('txCustomerId');
  if (!select) return;
  select.innerHTML = '<option value="">-- Pilih Customer --</option>';
  appState.customers.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.innerText = c.name;
    select.appendChild(opt);
  });
}

// FORM HANDLERS
function handleSaveCustomer(e) {
  e.preventDefault();
  const nameInput = document.getElementById('custNameInput');
  const noteInput = document.getElementById('custNoteInput');
  const name = nameInput?.value.trim();
  const notes = noteInput?.value.trim() || '';
  if (!name) return;

  const newCust = {
    id: "c_" + Date.now(),
    name: name,
    notes: notes
  };

  // Optimistic UI Update
  appState.customers.unshift(newCust);
  saveToLocalStorage();
  populateCustomerDropdown();
  closeModal('modalAddCustomer');
  if (nameInput) nameInput.value = '';
  if (noteInput) noteInput.value = '';
  paginationState.currentPage = 1;
  renderAll();
  showToast(`Customer "${name}" berhasil ditambahkan!`);

  // Sinkronkan ke Google Sheet di latar belakang
  sendActionToGoogleSheets('addCustomer', { customer: newCust });
}

function handleSaveTransaction(e) {
  e.preventDefault();
  const customerId = document.getElementById('txCustomerId')?.value;
  const date = document.getElementById('txDate')?.value;
  const noSJ = document.getElementById('txNoSJ')?.value.trim();
  const sent = parseInt(document.getElementById('txSent')?.value, 10) || 0;
  const returned = parseInt(document.getElementById('txReturned')?.value, 10) || 0;
  const note = document.getElementById('txNote')?.value.trim() || '';

  if (!customerId || !date) {
    alert("Mohon pilih customer dan tanggal transaksi!");
    return;
  }

  if (sent <= 0 && returned <= 0) {
    alert("Mohon isi minimal salah satu jumlah tabung (Dikirim atau Kembali) lebih dari 0!");
    return;
  }

  const newTx = {
    id: "t_" + Date.now(),
    customerId: customerId,
    date: date,
    noSJ: noSJ,
    sent: sent,
    returned: returned,
    note: note
  };

  // Optimistic UI Update
  appState.transactions.push(newTx);
  saveToLocalStorage();
  closeModal('modalAddTransaction');

  const sjInput = document.getElementById('txNoSJ');
  const sentInput = document.getElementById('txSent');
  const retInput = document.getElementById('txReturned');
  const noteEl = document.getElementById('txNote');
  if (sjInput) sjInput.value = '';
  if (sentInput) sentInput.value = '0';
  if (retInput) retInput.value = '0';
  if (noteEl) noteEl.value = '';

  if (appState.currentCustomerId === customerId) {
    viewCustomerDetail(customerId);
  }
  renderAll();
  showToast('Transaksi berhasil dicatat!');

  // Sinkronkan ke Google Sheet di latar belakang
  sendActionToGoogleSheets('addTransaction', { transaction: newTx });
}

function deleteCustomer(customerId) {
  const cust = appState.customers.find(c => c.id === customerId);
  const name = cust ? cust.name : "Customer";

  const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus customer "${name}" beserta seluruh riwayat mutasinya?`);
  if (!confirmed) return;

  // Optimistic UI Update
  appState.customers = appState.customers.filter(c => c.id !== customerId);
  appState.transactions = appState.transactions.filter(t => t.customerId !== customerId);
  saveToLocalStorage();
  populateCustomerDropdown();

  if (appState.currentCustomerId === customerId) {
    navigateToList();
  } else {
    renderAll();
  }
  showToast(`Customer "${name}" dihapus`);

  // Sinkronkan ke Google Sheet di latar belakang
  sendActionToGoogleSheets('deleteCustomer', { customerId: customerId });
}

function deleteTransaction(txId) {
  const confirmed = window.confirm("Hapus baris transaksi surat jalan ini?");
  if (!confirmed) return;

  // Optimistic UI Update
  appState.transactions = appState.transactions.filter(t => t.id !== txId);
  saveToLocalStorage();

  if (appState.currentCustomerId) {
    viewCustomerDetail(appState.currentCustomerId);
  }
  renderAll();
  showToast('Transaksi dihapus');

  // Sinkronkan ke Google Sheet di latar belakang
  sendActionToGoogleSheets('deleteTransaction', { transactionId: txId });
}

function renderAll() {
  renderGlobalStats();
  renderCustomerList();
}

// CSV & JSON BACKUP UTILITIES
// PRINT / CETAK REKAP MUTASI PINJAMAN PER CUSTOMER
function printCustomerReport(customerId) {
  const targetId = customerId || appState.currentCustomerId;
  if (!targetId) {
    alert("Silakan pilih customer terlebih dahulu.");
    return;
  }

  const cust = appState.customers.find(c => c.id === targetId);
  if (!cust) return;

  const stats = calculateCustomerStats(targetId);
  const txs = appState.transactions.filter(t => t.customerId === targetId);
  txs.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Populate nama customer
  const nameEl = document.getElementById('printCustomerName');
  if (nameEl) nameEl.innerText = cust.name;

  // Tanggal cetak format DD/MM/YYYY (persis gambar: Tanggal Cetak: 16/10/2026)
  const dateEl = document.getElementById('printDate');
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  if (dateEl) dateEl.innerText = `${day}/${month}/${year}`;

  const tbody = document.getElementById('printTableBody');
  const tfoot = document.getElementById('printTableFoot');

  // Render baris tabel cetak
  if (tbody) {
    tbody.innerHTML = '';
    let runningBalance = 0;

    if (txs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-3 py-6 text-center text-slate-400 italic">Belum ada riwayat transaksi mutasi untuk pelanggan ini.</td></tr>`;
    } else {
      txs.forEach((tx, idx) => {
        const sent = Number(tx.sent || 0);
        const returned = Number(tx.returned || 0);
        runningBalance += (sent - returned);

        const tr = document.createElement('tr');
        tr.className = idx % 2 === 1 ? "bg-slate-50/80" : "bg-white";
        tr.innerHTML = `
          <td class="px-3 py-2 text-center text-slate-600">${idx + 1}</td>
          <td class="px-3 py-2 text-center text-slate-700">${formatDate(tx.date)}</td>
          <td class="px-3 py-2 font-mono text-slate-800">${tx.noSJ ? tx.noSJ : '-'}</td>
          <td class="px-3 py-2 text-center font-bold text-slate-900">${sent > 0 ? sent : '-'}</td>
          <td class="px-3 py-2 text-center text-slate-700">${returned > 0 ? returned : '-'}</td>
          <td class="px-3 py-2 text-center font-bold text-slate-900">${runningBalance}</td>
          <td class="px-3 py-2 text-slate-600">${tx.note || '-'}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  // Render tfoot summary
  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="3" class="px-3 py-2 text-right uppercase tracking-wider text-slate-700">Total Mutasi & Sisa Akhir:</td>
        <td class="px-3 py-2 text-center font-bold text-slate-900">${stats.totalSent}</td>
        <td class="px-3 py-2 text-center font-bold text-slate-900">${stats.totalReturned}</td>
        <td class="px-3 py-2 text-center font-black text-blue-700 bg-blue-50">${stats.balance}</td>
        <td class="px-3 py-2 text-slate-500 font-normal">Sisa Pinjaman Aktif</td>
      </tr>
    `;
  }

  // Buka dialog print browser
  setTimeout(() => {
    window.print();
  }, 100);
}

// ON LOAD INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  initAuth();
  if (window.lucide) {
    lucide.createIcons();
  }
});
