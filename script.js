﻿const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const navSearchBtn = document.getElementById("navSearchBtn");
const globalSearchInput = document.getElementById("globalSearch");

const searchDrawer = document.getElementById("productSearch");
const topbar = document.querySelector(".topbar");
const productToolsSection = document.querySelector(".product-tools");

function syncProductStickyTop() {
  if (!topbar) return;
  const headerHeight = topbar.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--product-sticky-top", `${Math.round(headerHeight)}px`);
}

function syncMenuAnchorTop() {
  if (!mobileMenu) return;
  document.documentElement.style.setProperty("--mobile-menu-anchor-top", `${Math.round(mobileMenu.offsetTop)}px`);
}

function isPopularCurrentlySticky() {
  if (!productToolsSection || !topbar) return false;
  const topbarHeight = topbar.getBoundingClientRect().height;
  return productToolsSection.getBoundingClientRect().top <= topbarHeight + 1;
}

function updateMenuOverlapState() {
  const isOpen = Boolean(mobileMenu?.classList.contains("open"));
  const shouldOverlap = isOpen && !isPopularCurrentlySticky();
  document.body.classList.toggle("menu-overlap-popular", shouldOverlap);
}

function scheduleStickySync() {
  // Using a single timeout is more efficient than multiple staggered ones.
  // It waits for the next event loop tick, allowing the DOM to update
  // before we read its dimensions for syncing sticky positions.
  setTimeout(() => {
    syncProductStickyTop();
    syncMenuAnchorTop();
    updateMenuOverlapState();
  }, 0);
}

function updateMobileLogoState() {
  if (!topbar) return;
  const isMobile = window.matchMedia("(max-width: 899px)").matches;
  if (!isMobile) {
    topbar.classList.remove("logo-center-mobile");
    return;
  }
  const searchOpen = searchDrawer?.classList.contains("open");
  const headerHeight = topbar.getBoundingClientRect().height;
  const sectionReached = productToolsSection
    ? productToolsSection.getBoundingClientRect().top <= headerHeight + 2
    : false;
  topbar.classList.toggle("logo-center-mobile", Boolean(searchOpen || sectionReached));
}

function closeSearchDrawer() {
  if (!searchDrawer || !searchDrawer.classList.contains("open")) return;
  searchDrawer.classList.remove("open");
  navSearchBtn?.setAttribute("aria-expanded", "false");
  updateMobileLogoState();
  scheduleStickySync();
}

function stabilizeViewportAfterMenuToggle(previousTopbarHeight, previousScrollY) {
  window.requestAnimationFrame(() => {
    const currentTopbarHeight = topbar?.getBoundingClientRect().height ?? previousTopbarHeight;
    const delta = currentTopbarHeight - previousTopbarHeight;
    if (delta !== 0) {
      window.scrollTo(0, previousScrollY + delta);
    }
  });
}

function lockOverlapDuringCloseIfNeeded(isOpenAfterToggle) {
  if (isOpenAfterToggle) return;
  const wasOverlap = document.body.classList.contains("menu-overlap-popular");
  if (!wasOverlap) return;
  document.body.classList.add("menu-overlap-transition");
  window.setTimeout(() => {
    document.body.classList.remove("menu-overlap-transition");
  }, 240);
}

navSearchBtn?.addEventListener("click", () => {
  if (!searchDrawer) return;
  const willOpen = !searchDrawer.classList.contains("open");
  if (willOpen && mobileMenu?.classList.contains("open")) {
    mobileMenu.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
  }
  searchDrawer.classList.toggle("open", willOpen);
  navSearchBtn.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) {
    window.setTimeout(() => globalSearchInput?.focus(), 150);
  }
  updateMobileLogoState();
  scheduleStickySync();
});

menuBtn?.addEventListener("click", () => {
  closeSearchDrawer();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (searchDrawer?.classList.contains("open") && !searchDrawer.contains(target) && !navSearchBtn?.contains(target)) {
    closeSearchDrawer();
  }
});

searchDrawer?.addEventListener("transitionend", scheduleStickySync);
mobileMenu?.addEventListener("transitionend", scheduleStickySync);

if (typeof ResizeObserver !== "undefined" && topbar) {
  const topbarResizeObserver = new ResizeObserver(() => {
    scheduleStickySync();
    updateMobileLogoState();
    updateMenuOverlapState();
  });
  topbarResizeObserver.observe(topbar);
}

if (typeof ResizeObserver !== "undefined" && productToolsSection) {
  const toolsResizeObserver = new ResizeObserver(() => {
    scheduleStickySync();
    updateMenuOverlapState();
  });
  toolsResizeObserver.observe(productToolsSection);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSearchDrawer();
  }
});

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    const previousTopbarHeight = topbar?.getBoundingClientRect().height ?? 0;
    const previousScrollY = window.scrollY;
    const isOpen = mobileMenu.classList.toggle("open");
    lockOverlapDuringCloseIfNeeded(isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    scheduleStickySync();
    updateMenuOverlapState();
    stabilizeViewportAfterMenuToggle(previousTopbarHeight, previousScrollY);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!mobileMenu.classList.contains("open")) return;
    if (mobileMenu.contains(target) || menuBtn.contains(target)) return;

    const previousTopbarHeight = topbar?.getBoundingClientRect().height ?? 0;
    const previousScrollY = window.scrollY;
    lockOverlapDuringCloseIfNeeded(false);
    mobileMenu.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    scheduleStickySync();
    updateMenuOverlapState();
    stabilizeViewportAfterMenuToggle(previousTopbarHeight, previousScrollY);
  });
}

const slidesTrack = document.getElementById("slides");
const dotsWrap = document.getElementById("sliderDots");
const prevBtn = document.getElementById("prevSlide");
const nextBtn = document.getElementById("nextSlide");

if (slidesTrack && dotsWrap && prevBtn && nextBtn) {
  const slideItems = Array.from(slidesTrack.children);
  let currentIndex = 0;
  let autoTimer;

  slideItems.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dot.addEventListener("click", () => goToSlide(index));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.children);

  function renderSlide() {
    slidesTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, index) => dot.classList.toggle("active", index === currentIndex));
  }

  function goToSlide(index) {
    currentIndex = (index + slideItems.length) % slideItems.length;
    renderSlide();
  }

  function startAuto() {
    autoTimer = window.setInterval(() => goToSlide(currentIndex + 1), 3200);
  }

  function resetAuto() {
    window.clearInterval(autoTimer);
    startAuto();
  }

  prevBtn.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
    resetAuto();
  });

  nextBtn.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
    resetAuto();
  });

  slidesTrack.addEventListener("mouseenter", () => window.clearInterval(autoTimer));
  slidesTrack.addEventListener("mouseleave", startAuto);

  renderSlide();
  startAuto();
}

const phoneRevealSection = document.getElementById("phoneReveal");
const cinemaStage = phoneRevealSection?.querySelector(".cinema-stage");

function updateRevealProgress() {
  if (!phoneRevealSection || !cinemaStage) return;
  const rect = phoneRevealSection.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const start = vh * 0.9;
  const end = vh * 0.15;
  const raw = (start - rect.top) / (start - end);
  const progress = Math.max(0, Math.min(1, raw));
  cinemaStage.style.setProperty("--reveal-progress", progress.toFixed(3));
}

// --- Unified Event Handlers for Performance ---
let isScrollTicking = false;

function onScroll() {
  if (isScrollTicking) return;
  isScrollTicking = true;
  window.requestAnimationFrame(() => {
    updateMobileLogoState();
    updateMenuOverlapState();
    updateRevealProgress();
    isScrollTicking = false;
  });
}

function onResize() {
  updateMobileLogoState();
  scheduleStickySync();
  updateRevealProgress();
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onResize);

// Initial calls
updateMobileLogoState();
scheduleStickySync();
updateRevealProgress();

let productData = window.PRODUCT_CATALOG || {};

function applyLocalAppleCatalog(targetCatalog) {
  const target = targetCatalog && typeof targetCatalog === "object" ? targetCatalog : {};
  const local = window.PRODUCT_CATALOG && typeof window.PRODUCT_CATALOG === "object"
    ? window.PRODUCT_CATALOG
    : {};

  const localAppleMobiles = (local.mobiles || []).filter((item) => item.brand === "Apple");
  if (localAppleMobiles.length > 0) {
    target.mobiles = [
      ...((target.mobiles || []).filter((item) => item.brand !== "Apple")),
      ...localAppleMobiles
    ];
  }

  const localAppleDeals = (local.deals || []).filter((item) => item.brand === "Apple");
  if (localAppleDeals.length > 0) {
    target.deals = [
      ...((target.deals || []).filter((item) => item.brand !== "Apple")),
      ...localAppleDeals
    ];
  } else if (Array.isArray(target.deals)) {
    target.deals = target.deals.filter((item) => item.brand !== "Apple");
  }

  return target;
}

function ensureBasePrice() {
  Object.values(productData).forEach((items) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (!item.basePrice) item.basePrice = item.price;
      if (typeof item.offer !== "string") item.offer = "";
      if (typeof item.unavailable !== "boolean") item.unavailable = Boolean(item.unavailable);
    });
  });
}

function extractPrice(text) {
  const match = (text || "").replace(/,/g, "").match(/\d+/g);
  if (!match) return 0;
  return Number(match.join(""));
}

function detectBrand(text) {
  const knownBrands = [
    "Samsung", "OnePlus", "Apple", "Xiaomi", "Vivo", "Oppo", "Motorola", "Nothing", "Google",
    "Realme", "iQOO", "ASUS", "boAt", "JBL", "Sony", "Anker", "Spigen", "Portronics", "SanDisk",
    "Baseus", "Noise", "Fire-Boltt"
  ];
  return knownBrands.find((brand) => text.includes(brand)) || "Other";
}

const BRAND_LOGOS = {
  Apple: "assets/phones/apple-11.svg",
  Samsung: "assets/phones/samsung-8.svg",
  OnePlus: "assets/phones/oneplus-2.svg",
  Xiaomi: "assets/phones/xiaomi-1.svg",
  Vivo: "assets/phones/vivo-2.svg",
  Oppo: "assets/phones/oppo-2022-1.svg",
  Motorola: "assets/phones/motorola-new-logo.svg",
  Realme: "assets/phones/realme-1.svg",
  Google: "assets/phones/google-pixel-smartphone-logo.svg"
};

function renderProducts() {
  const mainGrid = document.querySelector("#deals-products .product-grid");
  if (!mainGrid) return;

  const orderedCategories = ["mobiles", "deals", "audio", "accessories"];
  const items = orderedCategories.flatMap((category) =>
    (productData[category] || []).map((item, index) => ({
      ...item,
      id: `${category}-${index + 1}`,
      category,
      offer: item.offer || "",
      unavailable: Boolean(item.unavailable)
    }))
  );

  mainGrid.innerHTML = items
    .map(
      (item) => `
      <article class="product-card ${item.unavailable ? "is-unavailable" : ""}" data-id="${item.id}" data-base-price="${item.price}" data-category="${item.category}">
        <span class="product-rating">${item.trending ? "4.7" : "4.5"}</span>
        <button type="button" class="product-fav" aria-label="Add to wishlist">♡</button>
        <img src="${item.image}"
             srcset="${item.image.replace("w=1200&q=90", "w=420&q=85")} 420w, ${item.image.replace("w=1200&q=90", "w=840&q=88")} 840w, ${item.image} 1200w"
             sizes="(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 23vw"
             loading="lazy"
             decoding="async"
             alt="${item.name}" />
        <span class="brand-chip">${item.brand}</span>
        ${Array.isArray(item.variants) && item.variants.length > 0 ? `<span class="variant-chip">${item.variants.length} Variants</span>` : ""}
        ${item.trending ? '<span class="trend-chip">Trending</span>' : ""}
        ${item.onSale ? '<span class="sale-chip">On Sale</span>' : ""}
        ${item.unavailable ? '<span class="unavailable-chip">Unavailable</span>' : ""}
        <h4>${item.name}</h4>
        <p class="product-desc">${item.detail}</p>
        <div class="product-meta">
          <span class="price-line">${item.unavailable ? "Unavailable" : item.price}</span>
          <button type="button" class="add-btn" ${item.unavailable ? "disabled" : ""}>Add</button>
        </div>
      </article>
    `
    )
    .join("");
}

function buildAppleRows() {
  const mobiles = Array.isArray(productData.mobiles) ? productData.mobiles : [];
  const rows = [];

  mobiles.forEach((item, index) => {
    if (item.brand !== "Apple") return;
    const id = `mobiles-${index + 1}`;
    const modelName = item.specs?.Model || item.name || "iPhone";
    const variantList = Array.isArray(item.variants) && item.variants.length > 0
      ? item.variants
      : [{ storage: item.specs?.Storage || "Standard", color: item.specs?.Color || "Default", price: item.price }];

    variantList.forEach((variant) => {
      const variantImage = (item.variantImageMap && variant.color && item.variantImageMap[variant.color])
        || variant.image
        || item.image;
      const displayColor = String(variant.color || "Default").replace(/^17-|^16-|^15-|^14-|^13P-|^13-/, "");
      rows.push({
        id,
        image: variantImage,
        title: `${modelName} (${variant.storage}, ${displayColor})`,
        detail: `${item.specs?.Display || ""} | ${item.specs?.Chipset || ""}`.replace(/^\s*\|\s*|\s*\|\s*$/g, ""),
        price: variant.price || item.price
      });
    });
  });

  return rows;
}

function renderAppleListing() {
  const appleListingSection = document.getElementById("appleListingSection");
  const appleListBody = document.getElementById("appleListBody");
  if (!appleListingSection || !appleListBody) return;

  const rows = buildAppleRows();
  if (rows.length === 0) {
    appleListingSection.classList.add("hidden");
    appleListBody.innerHTML = "";
    return;
  }

  appleListingSection.classList.remove("hidden");
  appleListBody.innerHTML = rows
    .map(
      (row) => `
        <article class="apple-row" data-id="${row.id}">
          <div class="apple-row-media">
            <img src="${row.image}" alt="${row.title}" loading="lazy" decoding="async" />
          </div>
          <div class="apple-row-info">
            <h4 class="apple-row-title">${row.title}</h4>
            <span class="apple-row-rating">4.6 ★</span>
            <p class="apple-row-meta">${row.detail}</p>
          </div>
          <div class="apple-row-price">
            <strong>${row.price}</strong>
          </div>
        </article>
      `
    )
    .join("");
}

ensureBasePrice();
renderProducts();

async function loadServerCatalog() {
  try {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (!data || typeof data !== "object") return;
    const maybeEnrich = typeof window.enrichCatalogData === "function" ? window.enrichCatalogData : null;
    const enrichedData = maybeEnrich ? maybeEnrich(data) : data;
    productData = applyLocalAppleCatalog(enrichedData);
    ensureBasePrice();
    renderProducts();
    window.__refreshProductFilters?.();
  } catch {
    // fallback to bundled catalog
  }
}

loadServerCatalog();

document.querySelectorAll(".product-showcase").forEach((section) => {
  section.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".add-btn") || target.closest(".product-fav")) return;
    const card = target.closest(".product-card");
    if (!(card instanceof HTMLElement)) return;
    if (card.classList.contains("is-hidden")) return;
    const id = card.dataset.id;
    if (!id) return;
    window.location.href = `product.html?id=${encodeURIComponent(id)}`;
  });
});

const filterPills = document.getElementById("filterPills");
const filterNote = document.getElementById("filterNote");
const searchForm = document.getElementById("productSearch");
const searchInput = document.getElementById("globalSearch");
const brandFilter = document.getElementById("brandFilter");
const companyPills = document.getElementById("companyPills");
const priceFilter = document.getElementById("priceFilter");
const sortFilter = document.getElementById("sortFilter");
const clearFiltersBtn = document.getElementById("clearFilters");
const mainProductGrid = document.querySelector("#deals-products .product-grid");
const productToolsPanel = document.querySelector(".product-tools");
const sortToggleBtn = document.querySelector(".sort-toggle");

if (productToolsPanel && sortToggleBtn) {
  sortToggleBtn.setAttribute("aria-expanded", "false");
  sortToggleBtn.addEventListener("click", () => {
    const openNow = !productToolsPanel.classList.contains("filters-open");
    productToolsPanel.classList.toggle("filters-open", openNow);
    sortToggleBtn.setAttribute("aria-expanded", String(openNow));
  });
}

if (filterPills && searchInput && mainProductGrid) {
  let activeFilter = "all";
  let query = "";
  let activeBrand = "all";
  let activePrice = "all";
  let activeSort = "default";


  function inPriceRange(price, range) {
    if (range === "all") return true;
    const [min, max] = range.split("-").map(Number);
    return price >= min && price <= max;
  }

  function renderBrandPills(brands) {
    if (!companyPills) return;
    companyPills.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "company-card";
    allBtn.dataset.brand = "all";
    allBtn.innerHTML = `
      <span class="company-name-lg">All Companies</span>
    `;
    companyPills.appendChild(allBtn);

    brands.forEach((brand) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "company-card";
      btn.dataset.brand = brand;
      const logoPath = BRAND_LOGOS[brand];
      btn.innerHTML = logoPath
        ? `<img class="brand-logo" src="${logoPath}" alt="${brand}" loading="lazy" decoding="async" />`
        : `<span class="company-name-lg">${brand}</span>`;
      companyPills.appendChild(btn);
    });

    companyPills.querySelectorAll(".company-card").forEach((pill) => {
      pill.classList.toggle("active", (pill.dataset.brand || "all") === activeBrand);
    });
  }

  function renderBrandSelect(brands) {
    if (!brandFilter) return;

    const previousBrand = activeBrand;
    brandFilter.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All Brands";
    brandFilter.appendChild(allOption);

    brands.forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand;
      option.textContent = brand;
      brandFilter.appendChild(option);
    });

    activeBrand = brands.includes(previousBrand) ? previousBrand : "all";
    brandFilter.value = activeBrand;
  }

  function refreshCardMetadata() {
    const brandSet = new Set();

    mainProductGrid.querySelectorAll(".product-card").forEach((card) => {
      const title = card.querySelector("h4")?.textContent || "";
      const desc = card.querySelector("p")?.textContent || "";
      const priceText = card.querySelector(".price-line")?.textContent || "";
      const fallbackPriceText = card.dataset.basePrice || "";
      const effectivePriceText = /unavailable/i.test(priceText) ? fallbackPriceText : priceText;
      const brandText = card.querySelector(".brand-chip")?.textContent?.trim() || "";
      const detectedBrand = brandText || detectBrand(title);

      card.dataset.search = `${title} ${desc} ${effectivePriceText}`.toLowerCase();
      card.dataset.price = String(extractPrice(effectivePriceText));
      card.dataset.brand = detectedBrand;
      card.dataset.title = title.toLowerCase();
      if (detectedBrand) brandSet.add(detectedBrand);
    });

    const brands = Array.from(brandSet).sort((a, b) => a.localeCompare(b));
    renderBrandSelect(brands);
    renderBrandPills(brands);
  }
  window.__refreshProductFilters = () => {
    refreshCardMetadata();
    applyFilters();
  };

  function applyFilters() {
    const q = query.toLowerCase().trim();
    let visibleCards = 0;
    const cards = Array.from(mainProductGrid.querySelectorAll(".product-card"));
    const sortedCards = [...cards];

    if (activeSort === "price-asc") {
      sortedCards.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    } else if (activeSort === "price-desc") {
      sortedCards.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
    } else if (activeSort === "name-asc") {
      sortedCards.sort((a, b) => (a.dataset.title || "").localeCompare(b.dataset.title || ""));
    }

    sortedCards.forEach((card) => mainProductGrid.appendChild(card));

    sortedCards.forEach((card) => {
      const searchMatch = q === "" || (card.dataset.search || "").includes(q);
      const brandMatch = activeBrand === "all" || (card.dataset.brand || "") === activeBrand;
      const rangeMatch = inPriceRange(Number(card.dataset.price || "0"), activePrice);
      const categoryMatch = activeFilter === "all" || (card.dataset.category || "") === activeFilter;
      const showCard = categoryMatch && searchMatch && brandMatch && rangeMatch;
      card.classList.toggle("is-hidden", !showCard);
      if (showCard) visibleCards += 1;
    });

    if (filterNote) {
      const filterLabel = activeFilter === "all" ? "all categories" : activeFilter;
      const brandLabel = activeBrand === "all" ? "all brands" : activeBrand;
      const priceLabel = activePrice === "all" ? "all prices" : activePrice.replace("-", " to ");
      filterNote.textContent = `Showing ${visibleCards} products | ${filterLabel} | ${brandLabel} | ${priceLabel}`;
    }
  }

  filterPills.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const filter = target.dataset.filter;
    if (!filter) return;

    activeFilter = filter;
    filterPills.querySelectorAll(".pill").forEach((pill) => {
      pill.classList.toggle("active", pill === target);
    });
    applyFilters();
  });

  searchInput.addEventListener("input", () => {
    query = searchInput.value;
    applyFilters();
  });

  brandFilter?.addEventListener("change", () => {
    activeBrand = brandFilter.value;
    companyPills?.querySelectorAll(".company-card").forEach((pill) => {
      pill.classList.toggle("active", (pill.dataset.brand || "all") === activeBrand);
    });
    applyFilters();
  });

  companyPills?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const cardButton = target.closest(".company-card");
    if (!(cardButton instanceof HTMLButtonElement)) return;

    const selectedBrand = cardButton.dataset.brand;
    if (!selectedBrand) return;

    activeBrand = selectedBrand;
    activeFilter = "all";
    if (brandFilter) brandFilter.value = activeBrand;
    filterPills.querySelectorAll(".pill").forEach((pill) => {
      pill.classList.toggle("active", pill.dataset.filter === "all");
    });
    companyPills.querySelectorAll(".company-card").forEach((pill) => {
      pill.classList.toggle("active", pill === cardButton);
    });
    applyFilters();
  });

  priceFilter?.addEventListener("change", () => {
    activePrice = priceFilter.value;
    applyFilters();
  });

  sortFilter?.addEventListener("change", () => {
    activeSort = sortFilter.value;
    applyFilters();
  });

  clearFiltersBtn?.addEventListener("click", () => {
    activeFilter = "all";
    activeBrand = "all";
    activePrice = "all";
    activeSort = "default";
    query = "";
    searchInput.value = "";
    if (brandFilter) brandFilter.value = "all";
    companyPills?.querySelectorAll(".company-card").forEach((pill) => {
      pill.classList.toggle("active", (pill.dataset.brand || "all") === "all");
    });
    if (priceFilter) priceFilter.value = "all";
    if (sortFilter) sortFilter.value = "default";
    filterPills.querySelectorAll(".pill").forEach((pill) => {
      pill.classList.toggle("active", pill.dataset.filter === "all");
    });
    applyFilters();
  });

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      query = searchInput.value;
      applyFilters();
      const firstVisible = document.querySelector(".product-card:not(.is-hidden)");
      firstVisible?.scrollIntoView({ behavior: "smooth", block: "center" });
      updateMobileLogoState();
    });
  }

  refreshCardMetadata();
  applyFilters();
}
