const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!mobileMenu.classList.contains("open")) return;
    if (mobileMenu.contains(target) || menuBtn.contains(target)) return;

    mobileMenu.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
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

let productData = window.PRODUCT_CATALOG || {};

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

function renderProducts() {
  const sectionMap = {
    deals: document.querySelector("#deals-products .product-grid"),
    mobiles: document.querySelector("#mobiles-products .product-grid"),
    audio: document.querySelector("#audio-products .product-grid"),
    accessories: document.querySelector("#acc-products .product-grid")
  };
  Object.entries(sectionMap).forEach(([key, grid]) => {
    if (!grid) return;
    const items = (productData[key] || []).map((item, index) => {
      return {
        ...item,
        id: `${key}-${index + 1}`,
        offer: item.offer || "",
        unavailable: Boolean(item.unavailable)
      };
    });

    grid.innerHTML = items
      .map(
        (item) => `
      <article class="product-card ${item.unavailable ? "is-unavailable" : ""}" data-id="${item.id}" data-base-price="${item.price}">
        <img src="${item.image}"
             srcset="${item.image.replace("w=1200&q=90", "w=420&q=85")} 420w, ${item.image.replace("w=1200&q=90", "w=840&q=88")} 840w, ${item.image} 1200w"
             sizes="(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 23vw"
             loading="lazy"
             decoding="async"
             alt="${item.name}" />
        <span class="brand-chip">${item.brand}</span>
        ${item.unavailable ? '<span class="unavailable-chip">Unavailable</span>' : ""}
        <h4>${item.name}</h4>
        <p>${item.detail}</p>
        ${item.offer ? `<p class="offer-line">${item.offer}</p>` : ""}
        <span class="price-line">${item.unavailable ? "Currently Unavailable" : item.price}</span>
      </article>
    `
      )
      .join("");
  });
}

renderProducts();

async function loadServerCatalog() {
  try {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (!data || typeof data !== "object") return;
    productData = data;
    renderProducts();
    window.__refreshProductFilters?.();
  } catch {
    // fallback to bundled catalog
  }
}

loadServerCatalog();

const filterPills = document.getElementById("filterPills");
const filterNote = document.getElementById("filterNote");
const searchForm = document.getElementById("productSearch");
const searchInput = document.getElementById("globalSearch");
const brandFilter = document.getElementById("brandFilter");
const priceFilter = document.getElementById("priceFilter");
const sortFilter = document.getElementById("sortFilter");
const clearFiltersBtn = document.getElementById("clearFilters");
const showcaseSections = Array.from(document.querySelectorAll(".product-showcase"));

if (filterPills && searchInput && showcaseSections.length > 0) {
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

  function refreshCardMetadata() {
    showcaseSections.forEach((section) => {
      section.querySelectorAll(".product-card").forEach((card) => {
        const title = card.querySelector("h4")?.textContent || "";
        const desc = card.querySelector("p")?.textContent || "";
        const priceText = card.querySelector(".price-line")?.textContent || "";
        const fallbackPriceText = card.dataset.basePrice || "";
        const effectivePriceText = /unavailable/i.test(priceText) ? fallbackPriceText : priceText;
        const offerText = card.querySelector(".offer-line")?.textContent || "";

        card.dataset.search = `${title} ${desc} ${offerText} ${effectivePriceText}`.toLowerCase();
        card.dataset.price = String(extractPrice(effectivePriceText));
        card.dataset.brand = detectBrand(title);
        card.dataset.title = title.toLowerCase();
      });
    });
  }
  window.__refreshProductFilters = () => {
    refreshCardMetadata();
    applyFilters();
  };

  function applyFilters() {
    const q = query.toLowerCase().trim();
    let visibleCards = 0;

    showcaseSections.forEach((section) => {
      const sectionCategory = section.dataset.category || "";
      const cards = Array.from(section.querySelectorAll(".product-card"));
      const sectionAllowed = activeFilter === "all" || sectionCategory === activeFilter;
      const sortedCards = [...cards];

      if (activeSort === "price-asc") {
        sortedCards.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
      } else if (activeSort === "price-desc") {
        sortedCards.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
      } else if (activeSort === "name-asc") {
        sortedCards.sort((a, b) => (a.dataset.title || "").localeCompare(b.dataset.title || ""));
      }

      const grid = section.querySelector(".product-grid");
      sortedCards.forEach((card) => grid?.appendChild(card));

      let sectionVisible = 0;
      sortedCards.forEach((card) => {
        const searchMatch = q === "" || (card.dataset.search || "").includes(q);
        const brandMatch = activeBrand === "all" || (card.dataset.brand || "") === activeBrand;
        const rangeMatch = inPriceRange(Number(card.dataset.price || "0"), activePrice);
        const showCard = sectionAllowed && searchMatch && brandMatch && rangeMatch;
        card.classList.toggle("is-hidden", !showCard);
        if (showCard) {
          sectionVisible += 1;
          visibleCards += 1;
        }
      });

      section.classList.toggle("is-hidden", sectionVisible === 0);
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
    });
  }

  refreshCardMetadata();
  applyFilters();
}
