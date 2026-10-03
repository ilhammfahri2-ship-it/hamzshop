tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#fcf8f2',
              100: '#f5ebdc',
              200: '#e9d5bc',
              300: '#da79',
              400: '#ca9752',
              500: '#b87d3b',
              600: '#9b622f',
              700: '#7e4b29',
              800: '#673e27',
              900: '#543323',
              950: '#2d1910',
            }
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            serif: ['"Playfair Display"', 'serif'],
          }
        }
      }
    }

// DATA MENU KOPI KARSA
    const MENU_DATA = [
      {
        id: 'k01',
        name: 'Karsa Gula Aren',
        category: 'espresso',
        price: 22000,
        caffeine: 'Tinggi',
        rating: 4.9,
        desc: 'Espresso ganda racikan kopi lokal, gula aren murni, dan susu gurih.',
        image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
        flavor: ['Karamel', 'Nuts', 'Creamy']
      },
      {
        id: 'k02',
        name: 'Americano Cold Brew',
        category: 'espresso',
        price: 20000,
        caffeine: 'Sangat Tinggi',
        rating: 4.7,
        desc: 'Pengestrakan dingin 12 jam, menghasilkan rasa jernih tanpa rasa asam tinggi.',
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
        flavor: ['Dark Chocolate', 'Clean', 'Bold']
      },
      {
        id: 'k03',
        name: 'Poured V60 Gayo',
        category: 'manual',
        price: 28000,
        caffeine: 'Sedang',
        rating: 4.8,
        desc: 'Manual brew single origin Aceh Gayo dengan keharuman fruity khas.',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
        flavor: ['Citrus', 'Jasmine', 'Light']
      },
      {
        id: 'k04',
        name: 'Velvet Matcha Latte',
        category: 'noncoffee',
        price: 25000,
        caffeine: 'Bebas Kafein',
        rating: 4.8,
        desc: 'Bubuk Matcha premium Uji Kyoto diseduh dengan susu segar yang lembut.',
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
        flavor: ['Umami', 'Sweet', 'Smooth']
      },
      {
        id: 'k05',
        name: 'Artisan Butter Croissant',
        category: 'pastry',
        price: 18000,
        caffeine: 'Bebas Kafein',
        rating: 4.9,
        desc: 'Pastry renyah berlapis dengan mentega Prancis asli, hangat dari oven.',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
        flavor: ['Butter', 'Flaky', 'Warm']
      },
      {
        id: 'k06',
        name: 'Spanish Latte Sea Salt',
        category: 'espresso',
        price: 26000,
        caffeine: 'Tinggi',
        rating: 4.9,
        desc: 'Espresso dengan condensed milk dan sentuhan busa cream sea salt gurih.',
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
        flavor: ['Salty-Sweet', 'Rich', 'Espresso']
      }
    ];

    // STATE APLIKASI
    const APP_STATE_KEY = 'kopi-karsa-state-v1';
    let currentCategory = 'all';
    let cart = [];
    let inventory = Object.fromEntries(MENU_DATA.map(item => [item.id, 20]));
    let selectedMenuItem = null;
    let modalQuantity = 1;
    let appliedDiscount = 0;
    let orderType = 'Takeaway';
    let activeOrder = null;
    let orderHistory = [];
    let quizAnswers = {};
    let favoriteMenuIds = [];
    let currentSort = 'popular';
    let lastFocusedElement = null;

    function showToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      const iconMap = {
        success: { icon: 'fa-check', label: 'Berhasil' },
        error: { icon: 'fa-xmark', label: 'Perhatian' },
        info: { icon: 'fa-info', label: 'Info' }
      };
      const chosen = iconMap[type] || iconMap.info;

      toast.className = `toast-notification ${type}`;
      toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid ${chosen.icon}"></i></div>
        <div class="flex-1">
          <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">${chosen.label}</p>
          <p class="mt-1 text-sm font-medium text-stone-800">${message}</p>
        </div>
      `;

      container.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 2600);
    }

    function safeStorageGet(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    function safeStorageSet(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        return false;
      }
      return true;
    }

    function restoreCartItems(items) {
      if (!Array.isArray(items)) return [];

      return items.flatMap((item, index) => {
        const menuItem = MENU_DATA.find(menu => menu.id === item?.menuId);
        if (!menuItem || !Number.isFinite(item.unitPrice) || item.unitPrice < 0 || !Number.isInteger(item.qty) || item.qty < 1) return [];

        return [{
          cartId: Number.isFinite(item.cartId) ? item.cartId : Date.now() + index,
          menuId: menuItem.id,
          name: menuItem.name,
          unitPrice: item.unitPrice,
          qty: item.qty,
          size: typeof item.size === 'string' ? item.size : 'Reguler',
          ice: typeof item.ice === 'string' ? item.ice : 'Normal Ice',
          sugar: typeof item.sugar === 'string' ? item.sugar : '100% Sweet',
          addons: Array.isArray(item.addons) ? item.addons.filter(addon => typeof addon === 'string') : []
        }];
      });
    }

    function syncAdminLinks() {
      const links = document.querySelectorAll('[data-admin-link]');
      if (!links.length) return;

      let loggedIn = false;
      try {
        const session = JSON.parse(safeStorageGet('kopi-karsa-admin') || 'null');
        loggedIn = !!(session && session.loggedIn);
      } catch {
        loggedIn = false;
      }

      links.forEach(link => {
        const icon = link.querySelector('i');
        if (loggedIn) {
          link.href = 'dashboard.html';
          link.classList.remove('bg-brand-50', 'text-brand-800', 'border-brand-200', 'bg-brand-400/10', 'text-brand-100', 'border-brand-400/40');
          link.classList.add('bg-brand-800', 'text-white', 'border-brand-700');
          if (icon) {
            icon.className = 'fa-solid fa-table-columns';
          }
          link.innerHTML = '<i class="fa-solid fa-table-columns"></i> Dashboard';
        } else {
          link.href = 'login.html';
          link.classList.remove('bg-brand-800', 'text-white', 'border-brand-700');
          link.classList.add('bg-brand-50', 'text-brand-800', 'border-brand-200');
          if (icon) {
            icon.className = 'fa-solid fa-right-to-bracket';
          }
          link.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login Admin';
        }
      });
    }

    function restoreAppState() {
      try {
        const savedState = JSON.parse(safeStorageGet(APP_STATE_KEY) || 'null');
        if (!savedState || typeof savedState !== 'object') return;

        cart = restoreCartItems(savedState.cart);
        inventory = Object.fromEntries(MENU_DATA.map(item => {
          const stock = savedState.inventory?.[item.id];
          return [item.id, Number.isInteger(stock) && stock >= 0 ? stock : 20];
        }));
        appliedDiscount = savedState.appliedDiscount === 0.2 ? 0.2 : 0;
        orderType = savedState.orderType === 'Dine-in' ? 'Dine-in' : 'Takeaway';
        favoriteMenuIds = Array.isArray(savedState.favorites)
          ? savedState.favorites.filter(id => typeof id === 'string' && MENU_DATA.some(item => item.id === id))
          : [];
        orderHistory = Array.isArray(savedState.orders)
          ? savedState.orders.flatMap(savedOrder => {
            const items = restoreCartItems(savedOrder?.items);
            if (!items.length || typeof savedOrder.id !== 'string' || ![1, 2, 3].includes(savedOrder.statusStep)) return [];
            return [{
              id: savedOrder.id,
              items,
              type: savedOrder.type === 'Dine-in' ? 'Dine-in' : 'Takeaway',
              statusStep: savedOrder.statusStep,
              total: Number.isFinite(savedOrder.total) ? savedOrder.total : items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
              paymentStatus: savedOrder.paymentStatus === 'paid' ? 'paid' : 'unpaid',
              createdAt: Number.isFinite(savedOrder.createdAt) ? savedOrder.createdAt : Date.now()
            }];
          })
          : [];

        const savedOrder = savedState.activeOrder;
        if (savedOrder && typeof savedOrder.id === 'string' && [1, 2, 3].includes(savedOrder.statusStep)) {
          const items = restoreCartItems(savedOrder.items);
          activeOrder = items.length ? {
            id: savedOrder.id,
            items,
            type: savedOrder.type === 'Dine-in' ? 'Dine-in' : 'Takeaway',
            statusStep: savedOrder.statusStep,
            total: Number.isFinite(savedOrder.total) ? savedOrder.total : items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
            paymentStatus: savedOrder.paymentStatus === 'paid' ? 'paid' : 'unpaid',
            createdAt: Number.isFinite(savedOrder.createdAt) ? savedOrder.createdAt : Date.now()
          } : null;
        }

        if (activeOrder) {
          const historyOrder = orderHistory.find(order => order.id === activeOrder.id);
          if (historyOrder) activeOrder = historyOrder;
          else orderHistory.unshift(activeOrder);
        }
        orderHistory = orderHistory.slice(0, 100);
      } catch {
        cart = [];
        appliedDiscount = 0;
        orderType = 'Takeaway';
        activeOrder = null;
        orderHistory = [];
      }
    }

    function persistAppState() {
      const payload = JSON.stringify({ cart, inventory, appliedDiscount, orderType, activeOrder, orders: orderHistory, favorites: favoriteMenuIds });
      safeStorageSet(APP_STATE_KEY, payload);
    }

    // INITIALIZATION
    document.addEventListener('DOMContentLoaded', () => {
      syncAdminLinks();
      restoreAppState();
      renderMenu();
      updateCartBadge();
      renderCartItems();
      setOrderType(orderType);
      updateActiveNav();
      if (activeOrder) renderTracker();

      window.addEventListener('storage', event => {
        if (event.key === 'kopi-karsa-admin') {
          syncAdminLinks();
        }
      });

      document.addEventListener('click', handleAppClick);
      document.addEventListener('input', event => {
        if (event.target.id === 'menu-search-input') renderMenu();
      });
      document.addEventListener('change', event => {
        if (event.target.id === 'menu-sort-select') {
          currentSort = event.target.value;
          renderMenu();
        }
        if (event.target.matches('input[name="opt-size"], #addon-shot, #addon-oat')) updateModalPrice();
      });
      const clearFiltersBtn = document.getElementById('clear-menu-filters');
      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
          document.getElementById('menu-search-input').value = '';
          currentSort = 'popular';
          const sortSelect = document.getElementById('menu-sort-select');
          if (sortSelect) sortSelect.value = 'popular';
          setCategory('all');
        });
      }
      document.querySelectorAll('#site-navigation a').forEach(link => {
        link.addEventListener('click', () => toggleMobileNav(false));
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) toggleMobileNav(false);
      });
      window.addEventListener('storage', event => {
        if (event.key !== APP_STATE_KEY) return;
        restoreAppState();
        renderMenu();
        updateCartBadge();
        renderCartItems();
        if (activeOrder) renderTracker();
      });
      window.addEventListener('scroll', updateActiveNav, { passive: true });
      document.addEventListener('keydown', handleAccessibleKeydown);
    });

    function updateActiveNav() {
      const navLinks = document.querySelectorAll('.nav-item');
      const sections = [...document.querySelectorAll('section[id]')];
      let currentId = 'home';

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 140 && rect.bottom >= 140) {
          currentId = section.id;
          break;
        }
      }

      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${currentId}`;
        link.classList.toggle('active', isActive);
      });
    }

    function handleAppClick(event) {
      const actionElement = event.target.closest('[data-action]');
      if (!actionElement) return;

      switch (actionElement.dataset.action) {
        case 'scroll-top':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'toggle-mobile-nav':
          toggleMobileNav();
          break;
        case 'toggle-cart':
          toggleCartModal();
          break;
        case 'copy-promo':
          copyPromoCode(actionElement.dataset.code);
          break;
        case 'toggle-favorite':
          toggleFavorite(actionElement.dataset.menuId);
          break;
        case 'set-category':
          setCategory(actionElement.dataset.category);
          break;
        case 'quiz-answer':
          selectQuizAnswer(Number(actionElement.dataset.step), actionElement.dataset.answer);
          break;
        case 'add-recommendation':
          addRecommendedToCart();
          break;
        case 'reset-quiz':
          resetQuiz();
          break;
        case 'open-custom':
          openCustomModal(actionElement.dataset.menuId);
          break;
        case 'close-custom':
          closeCustomModal();
          break;
        case 'change-modal-qty':
          changeModalQty(Number(actionElement.dataset.delta));
          break;
        case 'confirm-add-to-cart':
          confirmAddToCart();
          break;
        case 'remove-cart-item':
          removeCartItem(Number(actionElement.dataset.cartId));
          break;
        case 'change-cart-qty':
          updateCartQty(Number(actionElement.dataset.cartId), Number(actionElement.dataset.delta));
          break;
        case 'set-order-type':
          setOrderType(actionElement.dataset.orderType);
          break;
        case 'apply-voucher':
          applyVoucher();
          break;
        case 'open-payment':
          openPaymentModal();
          break;
        case 'close-payment':
          closePaymentModal();
          break;
        case 'simulate-payment-success':
          simulatePaymentSuccess();
          break;
      }
    }

    function toggleMobileNav(forceOpen) {
      const nav = document.getElementById('site-navigation');
      const toggle = document.getElementById('mobile-nav-toggle');
      const icon = toggle.querySelector('i');
      const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : nav.classList.contains('hidden');

      nav.classList.toggle('hidden', !shouldOpen);
      nav.classList.toggle('flex', shouldOpen);
      toggle.setAttribute('aria-expanded', String(shouldOpen));
      toggle.setAttribute('aria-label', shouldOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
      icon.classList.toggle('fa-bars', !shouldOpen);
      icon.classList.toggle('fa-xmark', shouldOpen);
    }

    function openAccessibleDialog(modal) {
      lastFocusedElement = document.activeElement;
      modal.classList.remove('hidden');
      modal.querySelector('[role="dialog"]').focus();
    }

    function closeAccessibleDialog(modal) {
      if (modal.classList.contains('hidden')) return;

      modal.classList.add('hidden');
      const returnTarget = lastFocusedElement;
      lastFocusedElement = null;
      if (returnTarget?.isConnected) returnTarget.focus();
    }

    function handleAccessibleKeydown(event) {
      const modalIds = ['payment-modal', 'custom-modal', 'cart-drawer'];
      const activeModal = modalIds
        .map(id => document.getElementById(id))
        .find(modal => !modal.classList.contains('hidden'));

      if (activeModal) {
        const dialog = activeModal.querySelector('[role="dialog"]');
        if (event.key === 'Escape') {
          event.preventDefault();
          if (activeModal.id === 'payment-modal') closePaymentModal();
          else if (activeModal.id === 'custom-modal') closeCustomModal();
          else toggleCartModal();
          return;
        }

        if (event.key === 'Tab') {
          const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')]
            .filter(element => element.offsetParent !== null);
          if (!focusable.length) {
            event.preventDefault();
            dialog.focus();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
            event.preventDefault();
            first.focus();
          }
        }
      } else if (event.key === 'Escape' && !document.getElementById('site-navigation').classList.contains('hidden')) {
        toggleMobileNav(false);
      }
    }

    // RENDER MENU
    function renderMenu() {
      const grid = document.getElementById('menu-grid');
      const searchQuery = document.getElementById('menu-search-input').value.toLowerCase();

      let filtered = MENU_DATA.filter(item => {
        const matchesFavorites = currentCategory !== 'favorites' || favoriteMenuIds.includes(item.id);
        const matchesCat = currentCategory === 'all' || currentCategory === 'favorites' ? matchesFavorites : item.category === currentCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery) || item.desc.toLowerCase().includes(searchQuery);
        return matchesCat && matchesSearch && matchesFavorites;
      });

      filtered = [...filtered].sort((a, b) => {
        switch (currentSort) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'name-asc':
            return a.name.localeCompare(b.name, 'id-ID');
          case 'popular':
          default:
            return b.rating - a.rating;
        }
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full text-center py-12 text-stone-400">
            <i class="fa-solid fa-mug-hot text-4xl mb-3"></i>
            <p class="font-bold text-stone-600">Menu tidak ditemukan</p>
            <p class="text-xs">Coba kata kunci pencarian lain atau pilih kategori berbeda.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = filtered.map(item => `
        ${''}
        <div class="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group">
          <div>
            <div class="relative h-48 overflow-hidden bg-stone-100">
              <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
              <button
                type="button"
                data-action="toggle-favorite"
                data-menu-id="${item.id}"
                aria-label="${favoriteMenuIds.includes(item.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}"
                class="absolute top-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/85 text-base shadow-sm transition hover:scale-105 ${favoriteMenuIds.includes(item.id) ? 'text-rose-500' : 'text-stone-500'}"
              >
                <i class="${favoriteMenuIds.includes(item.id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
              </button>
              <span class="absolute top-3 right-3 bg-stone-900/80 text-amber-300 backdrop-blur-md text-[11px] font-bold px-2.5 py-1 rounded-lg">
                <i class="fa-solid fa-star text-amber-400 mr-1"></i>${item.rating}
              </span>
            </div>
            <div class="p-5">
              <div class="flex items-center gap-1.5 mb-2">
                ${item.flavor.map(f => `<span class="text-[10px] font-medium px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md">${f}</span>`).join('')}
              </div>
              <h3 class="font-serif font-bold text-lg text-stone-900 group-hover:text-brand-700 transition">${item.name}</h3>
              <p class="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">${item.desc}</p>
            </div>
          </div>

          <div class="p-5 pt-0 flex items-center justify-between border-t border-stone-100 mt-2">
            <div>
              <p class="text-[10px] uppercase text-stone-400 font-bold">${inventory[item.id] > 0 ? `Stok ${inventory[item.id]}` : 'Habis'}</p>
              <p class="font-bold text-brand-800 text-base">Rp ${item.price.toLocaleString('id-ID')}</p>
            </div>
            <button data-action="open-custom" data-menu-id="${item.id}" ${inventory[item.id] < 1 ? 'disabled' : ''} class="px-4 py-2 bg-brand-800 hover:bg-brand-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid fa-plus"></i> Pesan
            </button>
          </div>
        </div>
      `).join('');
    }

    // CATEGORY TAB SWITCH
    function setCategory(cat) {
      currentCategory = cat;
      document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('bg-brand-800', 'text-white');
        btn.classList.add('bg-white', 'text-stone-600', 'border', 'border-stone-200');
      });

      const activeBtn = document.getElementById(`cat-btn-${cat}`);
      if (activeBtn) {
        activeBtn.classList.remove('bg-white', 'text-stone-600', 'border', 'border-stone-200');
        activeBtn.classList.add('bg-brand-800', 'text-white');
      }

      renderMenu();
    }

    function toggleFavorite(menuId) {
      if (favoriteMenuIds.includes(menuId)) {
        favoriteMenuIds = favoriteMenuIds.filter(id => id !== menuId);
        showToast('Menu dihapus dari favorit.', 'info');
      } else {
        favoriteMenuIds = [...favoriteMenuIds, menuId];
        showToast('Menu ditambahkan ke favorit.', 'success');
      }
      persistAppState();
      renderMenu();
    }

    // MODAL CUSTOMIZATION
    function openCustomModal(itemId) {
      selectedMenuItem = MENU_DATA.find(i => i.id === itemId);
      if (!selectedMenuItem) return;

      modalQuantity = 1;
      document.getElementById('modal-item-title').innerText = selectedMenuItem.name;
      document.getElementById('modal-item-price-base').innerText = `Rp ${selectedMenuItem.price.toLocaleString('id-ID')}`;
      document.getElementById('modal-qty').innerText = modalQuantity;

      const isPastry = selectedMenuItem.category === 'pastry';
      document.getElementById('group-ice').style.display = isPastry ? 'none' : 'block';
      document.getElementById('group-sugar').style.display = isPastry ? 'none' : 'block';

      document.querySelectorAll('input[name="opt-size"]').forEach(input => {
        input.checked = input.value === 'Reguler';
      });
      document.querySelectorAll('input[name="opt-ice"]').forEach(input => {
        input.checked = input.value === 'Normal Ice';
      });
      document.querySelectorAll('input[name="opt-sugar"]').forEach(input => {
        input.checked = input.value === '100% Sweet';
      });
      document.getElementById('addon-shot').checked = false;
      document.getElementById('addon-oat').checked = false;

      updateModalPrice();
      openAccessibleDialog(document.getElementById('custom-modal'));
    }

    function closeCustomModal() {
      closeAccessibleDialog(document.getElementById('custom-modal'));
    }

    function changeModalQty(delta) {
      modalQuantity = Math.max(1, modalQuantity + delta);
      document.getElementById('modal-qty').innerText = modalQuantity;
      updateModalPrice();
    }

    function updateModalPrice() {
      if (!selectedMenuItem) return;

      let extra = 0;
      const sizeSelected = document.querySelector('input[name="opt-size"]:checked');
      if (sizeSelected) extra += parseInt(sizeSelected.dataset.extra || 0);

      if (document.getElementById('addon-shot').checked) extra += 4000;
      if (document.getElementById('addon-oat').checked) extra += 6000;

      const totalPerItem = selectedMenuItem.price + extra;
      const grandModalTotal = totalPerItem * modalQuantity;

      document.getElementById('modal-total-price').innerText = `Rp ${grandModalTotal.toLocaleString('id-ID')}`;
    }

    function confirmAddToCart() {
      if (!selectedMenuItem) return;
      const availableStock = inventory[selectedMenuItem.id] ?? 0;
      const inCart = cart.filter(item => item.menuId === selectedMenuItem.id).reduce((sum, item) => sum + item.qty, 0);
      if (inCart + modalQuantity > availableStock) {
        showToast(`Stok ${selectedMenuItem.name} tersisa ${availableStock} item.`, 'error');
        return;
      }

      const size = document.querySelector('input[name="opt-size"]:checked')?.value || 'Reguler';
      const ice = document.querySelector('input[name="opt-ice"]:checked')?.value || 'Normal Ice';
      const sugar = document.querySelector('input[name="opt-sugar"]:checked')?.value || '100% Sweet';

      const addons = [];
      if (document.getElementById('addon-shot').checked) addons.push('Extra Shot');
      if (document.getElementById('addon-oat').checked) addons.push('Oat Milk');

      let extraPrice = 0;
      if (size === 'Large') extraPrice += 5000;
      if (addons.includes('Extra Shot')) extraPrice += 4000;
      if (addons.includes('Oat Milk')) extraPrice += 6000;

      const cartItem = {
        cartId: Date.now(),
        menuId: selectedMenuItem.id,
        name: selectedMenuItem.name,
        unitPrice: selectedMenuItem.price + extraPrice,
        qty: modalQuantity,
        size,
        ice: selectedMenuItem.category === 'pastry' ? '-' : ice,
        sugar: selectedMenuItem.category === 'pastry' ? '-' : sugar,
        addons
      };

      cart.push(cartItem);
      updateCartBadge();
      closeCustomModal();
      renderCartItems();
      showToast(`${selectedMenuItem.name} berhasil ditambahkan ke keranjang.`, 'success');
      toggleCartModal();
    }

    // CART DRAWER LOGIC
    function toggleCartModal() {
      const drawer = document.getElementById('cart-drawer');
      const isHidden = drawer.classList.contains('hidden');
      if (isHidden) {
        renderCartItems();
        openAccessibleDialog(drawer);
      } else {
        closeAccessibleDialog(drawer);
      }
    }

    function renderCartItems() {
      const container = document.getElementById('cart-items-container');
      if (cart.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12 text-stone-400">
            <i class="fa-solid fa-basket-shopping text-4xl mb-2"></i>
            <p class="font-bold text-stone-600">Keranjang Masih Kosong</p>
            <p class="text-xs">Silakan tambah menu favorit Anda terlebih dahulu.</p>
          </div>
        `;
        updateCartTotals();
        return;
      }

      container.innerHTML = cart.map(item => `
        <div class="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start justify-between gap-3">
          <div class="space-y-1">
            <p class="font-bold text-sm text-stone-900">${item.name}</p>
            <p class="text-[11px] text-stone-500">
              ${item.size} • ${item.ice} • ${item.sugar}
              ${item.addons.length ? `<br><span class="text-brand-700 font-semibold">+ ${item.addons.join(', ')}</span>` : ''}
            </p>
            <p class="text-xs font-bold text-brand-800 pt-1">Rp ${(item.unitPrice * item.qty).toLocaleString('id-ID')}</p>
          </div>

          <div class="flex flex-col items-end justify-between h-full gap-2">
            <button data-action="remove-cart-item" data-cart-id="${item.cartId}" aria-label="Hapus ${item.name} dari keranjang" class="text-stone-400 hover:text-rose-500 text-xs">
              <i class="fa-solid fa-trash"></i>
            </button>
            <div class="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
              <button data-action="change-cart-qty" data-cart-id="${item.cartId}" data-delta="-1" aria-label="Kurangi jumlah ${item.name}" class="w-6 h-6 flex items-center justify-center text-xs font-bold text-stone-600 hover:bg-stone-100">-</button>
              <span class="w-6 text-center text-xs font-bold">${item.qty}</span>
              <button data-action="change-cart-qty" data-cart-id="${item.cartId}" data-delta="1" aria-label="Tambah jumlah ${item.name}" class="w-6 h-6 flex items-center justify-center text-xs font-bold text-stone-600 hover:bg-stone-100">+</button>
            </div>
          </div>
        </div>
      `).join('');

      updateCartTotals();
    }

    function updateCartQty(cartId, delta) {
      const item = cart.find(i => i.cartId === cartId);
      if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
          cart = cart.filter(i => i.cartId !== cartId);
        }
      }
      renderCartItems();
      updateCartBadge();
    }

    function removeCartItem(cartId) {
      cart = cart.filter(i => i.cartId !== cartId);
      renderCartItems();
      updateCartBadge();
    }

    function updateCartBadge() {
      const count = cart.reduce((acc, curr) => acc + curr.qty, 0);
      const subtotal = cart.reduce((acc, curr) => acc + curr.unitPrice * curr.qty, 0);
      document.getElementById('cart-count-badge').innerText = count;
      const mobileSummary = document.getElementById('mobile-cart-summary');
      if (mobileSummary) mobileSummary.innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
      persistAppState();
    }

    function updateCartTotals() {
      const subtotal = cart.reduce((acc, curr) => acc + (curr.unitPrice * curr.qty), 0);
      const discountAmount = Math.round(subtotal * appliedDiscount);
      const grandTotal = Math.max(0, subtotal - discountAmount);

      document.getElementById('cart-subtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
      
      const discountRow = document.getElementById('row-discount');
      if (appliedDiscount > 0) {
        discountRow.classList.remove('hidden');
        document.getElementById('cart-discount').innerText = `-Rp ${discountAmount.toLocaleString('id-ID')}`;
      } else {
        discountRow.classList.add('hidden');
      }

      document.getElementById('cart-grand-total').innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    }

    function setOrderType(type) {
      orderType = type;
      const btnTakeaway = document.getElementById('btn-type-takeaway');
      const btnDinein = document.getElementById('btn-type-dinein');

      if (type === 'Takeaway') {
        btnTakeaway.className = "py-2 px-3 rounded-lg border border-brand-600 bg-brand-50 text-brand-800 font-bold text-center";
        btnDinein.className = "py-2 px-3 rounded-lg border border-stone-200 text-stone-600 font-medium text-center hover:bg-stone-100";
      } else {
        btnDinein.className = "py-2 px-3 rounded-lg border border-brand-600 bg-brand-50 text-brand-800 font-bold text-center";
        btnTakeaway.className = "py-2 px-3 rounded-lg border border-stone-200 text-stone-600 font-medium text-center hover:bg-stone-100";
      }
      persistAppState();
    }

    function applyVoucher() {
      const code = document.getElementById('voucher-input').value.trim().toUpperCase();
      if (code === 'KARSABARU20') {
        appliedDiscount = 0.20;
        showToast('Voucher berhasil digunakan! Diskon 20% diterapkan.', 'success');
      } else if (code === '') {
        appliedDiscount = 0;
        showToast('Kode voucher dibatalkan.', 'info');
      } else {
        appliedDiscount = 0;
        showToast('Kode voucher tidak valid.', 'error');
      }
      updateCartTotals();
      persistAppState();
    }

    function copyPromoCode(code) {
      const copyText = async () => {
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(code);
            showToast(`Kode promo ${code} tersalin!`, 'success');
            return;
          }

          const tempInput = document.createElement('textarea');
          tempInput.value = code;
          tempInput.setAttribute('readonly', '');
          tempInput.style.position = 'fixed';
          tempInput.style.opacity = '0';
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          showToast(`Kode promo ${code} tersalin!`, 'success');
        } catch {
          showToast(`Kode promo: ${code}. Salin secara manual.`, 'info');
        }
      };

      copyText();
    }

    // PAYMENT & TRACKER
    function openPaymentModal() {
      if (cart.length === 0) {
        showToast('Keranjang Anda masih kosong.', 'error');
        return;
      }

      const subtotal = cart.reduce((acc, curr) => acc + (curr.unitPrice * curr.qty), 0);
      const grandTotal = Math.max(0, subtotal - (subtotal * appliedDiscount));

      document.getElementById('qris-total-amount').innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
      openAccessibleDialog(document.getElementById('payment-modal'));
    }

    function closePaymentModal() {
      closeAccessibleDialog(document.getElementById('payment-modal'));
    }

    function simulatePaymentSuccess() {
      const itemCounts = cart.reduce((counts, item) => {
        counts[item.menuId] = (counts[item.menuId] || 0) + item.qty;
        return counts;
      }, {});
      const unavailableItem = Object.entries(itemCounts).find(([menuId, qty]) => inventory[menuId] < qty);
      if (unavailableItem) {
        const item = MENU_DATA.find(menuItem => menuItem.id === unavailableItem[0]);
        showToast(`Stok ${item?.name || 'menu'} berubah. Perbarui keranjang sebelum checkout.`, 'error');
        return;
      }

      const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
      const total = Math.max(0, Math.round(subtotal * (1 - appliedDiscount)));
      closePaymentModal();
      toggleCartModal();

      const toast = document.createElement('div');
      toast.id = 'payment-success-toast';
      toast.className = 'fixed bottom-5 right-5 z-[60] max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-xl';
      toast.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="mt-0.5 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <i class="fa-solid fa-check"></i>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Sudah membayar</p>
            <p class="text-sm font-medium text-emerald-900 mt-1">Pembayaran berhasil dan pesanan Anda sedang diproses.</p>
          </div>
        </div>
      `;

      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 3000);

      showToast('Pembayaran berhasil dan pesanan Anda sedang diproses.', 'success');

      // Create Active Order
      activeOrder = {
        id: '#KRS-' + Math.floor(10000 + Math.random() * 90000),
        items: [...cart],
        type: orderType,
        statusStep: 1,
        total,
        paymentStatus: 'paid',
        createdAt: Date.now()
      };
      orderHistory = [activeOrder, ...orderHistory.filter(order => order.id !== activeOrder.id)].slice(0, 100);
      Object.entries(itemCounts).forEach(([menuId, qty]) => {
        inventory[menuId] = Math.max(0, inventory[menuId] - qty);
      });

      cart = [];
      appliedDiscount = 0;
      updateCartBadge();

      renderTracker();
      
      // Auto Scroll to Tracker
      document.getElementById('tracker-section').scrollIntoView({ behavior: 'smooth' });
    }

    function renderTracker() {
      if (!activeOrder) return;

      document.getElementById('no-active-order').classList.add('hidden');
      document.getElementById('active-order-content').classList.remove('hidden');

      document.getElementById('order-id-display').innerText = activeOrder.id;
      document.getElementById('order-type-display').innerText = activeOrder.type;

      const progressBar = document.getElementById('tracker-progress-bar');
      const desc = document.getElementById('tracker-status-desc');

      if (activeOrder.statusStep === 1) {
        progressBar.style.width = '33%';
        desc.innerText = 'Pesanan diterima & dikonfirmasi oleh kasir.';
      } else if (activeOrder.statusStep === 2) {
        progressBar.style.width = '66%';
        desc.innerText = 'Barista sedang meracik & menyeduh kopi Anda dengan cermat.';
      } else if (activeOrder.statusStep === 3) {
        progressBar.style.width = '100%';
        desc.innerText = 'Pesanan Selesai! Silakan ambil di konter penyerahan.';
      }

      const itemsList = document.getElementById('tracker-items-list');
      itemsList.innerHTML = activeOrder.items.map(i => `
        <div class="flex justify-between border-b border-stone-100 pb-1">
          <span>${i.qty}x ${i.name} (${i.size})</span>
          <span class="font-bold">Rp ${(i.unitPrice * i.qty).toLocaleString('id-ID')}</span>
        </div>
      `).join('');
    }

    // QUIZ LOGIC
    function selectQuizAnswer(step, answer) {
      quizAnswers[step] = answer;

      if (step === 1) {
        document.getElementById('quiz-step-1').classList.add('hidden');
        document.getElementById('quiz-step-2').classList.remove('hidden');
      } else if (step === 2) {
        document.getElementById('quiz-step-2').classList.add('hidden');
        document.getElementById('quiz-step-3').classList.remove('hidden');
      } else if (step === 3) {
        document.getElementById('quiz-step-3').classList.add('hidden');
        calculateQuizRecommendation();
      }
    }

    function calculateQuizRecommendation() {
      const resContainer = document.getElementById('quiz-result');
      const title = document.getElementById('quiz-rec-title');
      const desc = document.getElementById('quiz-rec-desc');

      const profiles = [
        { menuId: 'k02', matches: { 1: ['strong'], 2: ['none', 'medium'], 3: ['work', 'refresh'] } },
        { menuId: 'k01', matches: { 1: ['balanced'], 2: ['sweet'], 3: ['chill'] } },
        { menuId: 'k03', matches: { 1: ['light'], 2: ['none', 'medium'], 3: ['chill'] } },
        { menuId: 'k04', matches: { 1: ['light'], 2: ['sweet'], 3: ['refresh', 'chill'] } },
        { menuId: 'k06', matches: { 1: ['balanced'], 2: ['medium', 'sweet'], 3: ['chill', 'refresh'] } }
      ];
      const recommendation = profiles
        .map(profile => ({
          item: MENU_DATA.find(menuItem => menuItem.id === profile.menuId),
          score: Object.entries(profile.matches).reduce((total, [step, answers]) => (
            total + (answers.includes(quizAnswers[step]) ? 1 : 0)
          ), 0)
        }))
        .sort((first, second) => second.score - first.score)[0].item;

      const answerLabels = {
        strong: 'rasa kuat', balanced: 'rasa seimbang', light: 'rasa ringan',
        none: 'tanpa gula', medium: 'kemanisan sedang', sweet: 'rasa manis',
        work: 'fokus kerja', chill: 'nongkrong santai', refresh: 'butuh kesegaran'
      };
      const preferences = Object.values(quizAnswers).map(answer => answerLabels[answer]);
      title.innerText = recommendation.name;
      desc.innerText = `${recommendation.desc} Dipilih untuk ${preferences.join(', ')}.`;

      resContainer.classList.remove('hidden');
    }

    function addRecommendedToCart() {
      const recTitle = document.getElementById('quiz-rec-title').innerText;
      const found = MENU_DATA.find(m => m.name.toLowerCase().includes(recTitle.toLowerCase()));
      if (found) {
        openCustomModal(found.id);
      }
    }

    function resetQuiz() {
      quizAnswers = {};
      document.getElementById('quiz-result').classList.add('hidden');
      document.getElementById('quiz-step-1').classList.remove('hidden');
      document.getElementById('quiz-step-2').classList.add('hidden');
      document.getElementById('quiz-step-3').classList.add('hidden');
    }
