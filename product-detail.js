let productData = window.PRODUCT_CATALOG || {};

const pdShell = document.getElementById("pdShell");
const pdEmpty = document.getElementById("pdEmpty");
const pdMainImage = document.getElementById("pdMainImage");
const pdThumbs = document.getElementById("pdThumbs");
const pdBrand = document.getElementById("pdBrand");
const pdName = document.getElementById("pdName");
const pdDescription = document.getElementById("pdDescription");
const pdPrice = document.getElementById("pdPrice");
const pdSubprice = document.getElementById("pdSubprice");
const pdOffer = document.getElementById("pdOffer");
const pdOfferList = document.getElementById("pdOfferList");
const pdHighlights = document.getElementById("pdHighlights");
const pdSpecs = document.getElementById("pdSpecs");
const pdSimilarWrap = document.getElementById("pdSimilarWrap");
const pdSimilar = document.getElementById("pdSimilar");
const pdYouMayWrap = document.getElementById("pdYouMayWrap");
const pdYouMay = document.getElementById("pdYouMay");

const query = new URLSearchParams(window.location.search);
const productId = query.get("id") || "";

let galleryImages = [];
let activeImageIndex = 0;

function getItemById(id) {
  const [category, idx] = String(id).split("-");
  const index = Number(idx) - 1;
  if (!category || Number.isNaN(index) || index < 0) return null;
  const items = productData[category];
  if (!Array.isArray(items) || !items[index]) return null;
  return { item: items[index], category, index };
}

function extractPrice(text) {
  const match = (text || "").replace(/,/g, "").match(/\d+/g);
  if (!match) return 0;
  return Number(match.join(""));
}

function getGallery(item, category) {
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images.slice(0, 5);
  }
  const first = item.image ? [item.image] : [];
  const sameBrand = Object.values(productData)
    .flatMap((items) => items || [])
    .filter((p) => p.image && p.brand === item.brand && p.image !== item.image)
    .map((p) => p.image);
  const sameCategory = (productData[category] || [])
    .filter((p) => p.image && p.image !== item.image)
    .map((p) => p.image);

  const unique = [];
  [...first, ...sameBrand, ...sameCategory].forEach((img) => {
    if (img && !unique.includes(img)) unique.push(img);
  });
  return unique.slice(0, 5);
}

function renderGallery(images, index) {
  if (!pdMainImage || !pdThumbs || images.length === 0) return;
  activeImageIndex = Math.max(0, Math.min(index, images.length - 1));
  pdMainImage.src = images[activeImageIndex];
  pdThumbs.innerHTML = images
    .map(
      (img, i) => `
        <button type="button" class="pd-thumb ${i === activeImageIndex ? "active" : ""}" data-index="${i}" aria-label="View image ${i + 1}">
          <img src="${img}" alt="Product view ${i + 1}" loading="lazy" decoding="async" />
        </button>
      `
    )
    .join("");
}

function titleCase(text) {
  const raw = String(text || "");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildHighlights(item, category, priceValue) {
  if (Array.isArray(item.highlights) && item.highlights.length > 0) {
    return item.highlights.slice(0, 6);
  }
  const fromDetail = String(item.detail || "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
  const defaults = {
    mobiles: [
      "Comfortable one-hand and long session usage",
      "Powerful app and multitasking performance",
      "Built for reliable daily calling and streaming"
    ],
    deals: [
      "Special value pricing with limited-time benefits",
      "Suitable for gifting or primary upgrade",
      "Top seller in current promotional range"
    ],
    audio: [
      "Clear voice quality and strong bass response",
      "Low-latency mode for gaming and video",
      "Comfort fit for everyday listening"
    ],
    accessories: [
      "Long-lasting material and fit",
      "Quick setup and universal compatibility",
      "Ideal for travel and everyday carry"
    ]
  };
  const priceNote = priceValue > 50000
    ? "Premium segment product finish and quality"
    : "High value product in its segment";
  return [...fromDetail, ...(defaults[category] || defaults.mobiles), priceNote].slice(0, 5);
}

function buildSpecs(item, category, priceValue) {
  if (Array.isArray(item.specs) && item.specs.length > 0) {
    return item.specs.slice(0, 8);
  }
  if (item.specs && typeof item.specs === "object") {
    return Object.entries(item.specs).slice(0, 8);
  }

  const specs = [
    ["Brand", item.brand || "Generic"],
    ["Category", titleCase(category)],
    ["Model", item.name || "N/A"],
    ["Price", item.price || "N/A"],
    ["Availability", item.unavailable ? "Currently Unavailable" : "In Stock"],
    ["Warranty", "1 Year Seller Warranty"]
  ];

  if (category === "mobiles" || category === "deals") {
    specs.splice(4, 0, ["Network", "5G Ready"]);
    specs.splice(5, 0, ["Display", priceValue >= 50000 ? "Premium AMOLED Panel" : "FHD+ Panel"]);
  } else if (category === "audio") {
    specs.splice(4, 0, ["Connectivity", "Bluetooth 5.2"]);
    specs.splice(5, 0, ["Playback", priceValue >= 5000 ? "Up to 40 Hours" : "Up to 24 Hours"]);
  } else {
    specs.splice(4, 0, ["Build", "Durable Daily Use Material"]);
    specs.splice(5, 0, ["Compatibility", "Wide Device Compatibility"]);
  }
  return specs;
}

function renderRecommendations(container, items) {
  if (!container) return;
  container.innerHTML = items
    .map(
      (p) => `
      <a class="pd-item" href="product.html?id=${encodeURIComponent(p.id)}">
        <img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async" />
        <h4>${p.name}</h4>
        <p>${p.detail}</p>
        <span>${p.unavailable ? "Unavailable" : p.price}</span>
      </a>
    `
    )
    .join("");
}

function renderProductPage() {
  const found = getItemById(productId);
  if (!found) {
    pdEmpty?.classList.remove("hidden");
    return;
  }

  const { item, category, index } = found;
  const priceValue = extractPrice(item.price || "");
  galleryImages = getGallery(item, category);

  if (pdShell) pdShell.classList.remove("hidden");
  pdBrand.textContent = `${item.brand || "Brand"} | ${titleCase(category)}`;
  pdName.textContent = item.name || "Product";
  pdDescription.textContent = item.description || `${item.name} offers ${item.detail}. Built for dependable performance and smooth daily use.`;
  pdPrice.textContent = item.unavailable ? "Currently Unavailable" : (item.price || "Price unavailable");
  pdSubprice.textContent = item.unavailable
    ? "This item is currently out of stock."
    : "Inclusive of all taxes | Delivery typically in 2-4 days";
  pdOffer.textContent = Array.isArray(item.offers) && item.offers.length > 0
    ? `Special Offer: ${item.offers[0]}`
    : (item.offer ? `Special Offer: ${item.offer}` : "Bank offers and exchange deals may apply.");

  const offerLines = Array.isArray(item.offers) && item.offers.length > 0
    ? item.offers.slice(0, 5)
    : [
      "10% instant discount on selected bank cards",
      "Extra exchange bonus for old device trade-in",
      "No-cost EMI options available on checkout"
    ];
  pdOfferList.innerHTML = offerLines.map((x) => `<li>${x}</li>`).join("");

  pdHighlights.innerHTML = buildHighlights(item, category, priceValue)
    .map((x) => `<li>${x}</li>`)
    .join("");
  pdSpecs.innerHTML = buildSpecs(item, category, priceValue)
    .map(([k, v]) => `<div class="pd-spec-row"><span>${k}</span><span>${v}</span></div>`)
    .join("");

  renderGallery(galleryImages, 0);

  const similar = (productData[category] || [])
    .map((p, i) => ({ ...p, id: `${category}-${i + 1}` }))
    .filter((p, i) => i !== index && p.brand === item.brand)
    .slice(0, 5);

  const youMay = Object.entries(productData)
    .flatMap(([cat, items]) => (items || []).map((p, i) => ({ ...p, id: `${cat}-${i + 1}`, category: cat })))
    .filter((p) => p.id !== productId && p.brand !== item.brand)
    .slice(0, 10);

  if (similar.length > 0) {
    pdSimilarWrap?.classList.remove("hidden");
    renderRecommendations(pdSimilar, similar);
  }

  if (youMay.length > 0) {
    pdYouMayWrap?.classList.remove("hidden");
    renderRecommendations(pdYouMay, youMay);
  }
}

pdThumbs?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const thumb = target.closest(".pd-thumb");
  if (!(thumb instanceof HTMLButtonElement)) return;
  const index = Number(thumb.dataset.index);
  if (Number.isNaN(index)) return;
  renderGallery(galleryImages, index);
});

async function loadServerCatalog() {
  try {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (!data || typeof data !== "object") return;
    const maybeEnrich = typeof window.enrichCatalogData === "function" ? window.enrichCatalogData : null;
    productData = maybeEnrich ? maybeEnrich(data) : data;
  } catch {
    // fallback to bundled catalog
  }
}

loadServerCatalog().finally(renderProductPage);
