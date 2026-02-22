async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  return response;
}

const adminSearchInput = document.getElementById("adminSearchInput");
const adminProductSuggestions = document.getElementById("adminProductSuggestions");
const adminProductSelect = document.getElementById("adminProductSelect");
const adminPriceInput = document.getElementById("adminPriceInput");
const adminOfferInput = document.getElementById("adminOfferInput");
const adminUnavailableInput = document.getElementById("adminUnavailableInput");
const saveAdminChangesBtn = document.getElementById("saveAdminChanges");
const resetAdminChangesBtn = document.getElementById("resetAdminChanges");
const adminStatusNote = document.getElementById("adminStatusNote");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

const adminTotalCount = document.getElementById("adminTotalCount");
const adminVisibleCount = document.getElementById("adminVisibleCount");
const adminSelectedBrand = document.getElementById("adminSelectedBrand");

const adminPreviewName = document.getElementById("adminPreviewName");
const adminPreviewCategory = document.getElementById("adminPreviewCategory");
const adminPreviewBrand = document.getElementById("adminPreviewBrand");
const adminPreviewPrice = document.getElementById("adminPreviewPrice");
const adminPreviewOffer = document.getElementById("adminPreviewOffer");
const adminPreviewStock = document.getElementById("adminPreviewStock");
const adminPreviewImage = document.getElementById("adminPreviewImage");

let allProducts = [];
let visibleProducts = [];

const IMAGE_FALLBACK = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

function expandProductSelect() {
  if (!adminProductSelect) return;
  const count = Math.max(6, Math.min(14, adminProductSelect.options.length));
  adminProductSelect.size = count;
}

function collapseProductSelect() {
  if (!adminProductSelect) return;
  adminProductSelect.size = 1;
}

function setStatus(text, isError = false) {
  if (!adminStatusNote) return;
  adminStatusNote.textContent = text;
  adminStatusNote.style.color = isError ? "#fecaca" : "#dbe5f1";
}

function getSearchRank(item, query) {
  const q = query.toLowerCase().trim();
  if (!q) return 1;

  const name = String(item.name || "").toLowerCase();
  const brand = String(item.brand || "").toLowerCase();
  const category = String(item.category || "").toLowerCase();
  const haystack = `${name} ${brand} ${category}`;

  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (brand.startsWith(q)) return 80;
  if (category.startsWith(q)) return 70;

  const words = name.split(/\s+/);
  if (words.some((w) => w.startsWith(q))) return 65;
  if (haystack.includes(q)) return 50;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => haystack.includes(token))) return 40;

  return 0;
}

function getMatchingProducts(query) {
  return allProducts
    .map((item) => ({ item, rank: getSearchRank(item, query) }))
    .filter((entry) => entry.rank > 0)
    .sort((a, b) => b.rank - a.rank || String(a.item.name).localeCompare(String(b.item.name)))
    .map((entry) => entry.item);
}

function updateStats() {
  if (adminTotalCount) adminTotalCount.textContent = String(allProducts.length);
  if (adminVisibleCount) adminVisibleCount.textContent = String(visibleProducts.length);

  const selectedId = adminProductSelect?.value;
  const selected = allProducts.find((p) => p.id === selectedId);
  if (adminSelectedBrand) adminSelectedBrand.textContent = selected?.brand || "-";
}

function updatePreview(item) {
  if (adminPreviewName) adminPreviewName.textContent = item?.name || "Select a product";
  if (adminPreviewCategory) adminPreviewCategory.textContent = item?.category || "-";
  if (adminPreviewBrand) adminPreviewBrand.textContent = item?.brand || "-";
  if (adminPreviewPrice) adminPreviewPrice.textContent = item?.price || "-";
  if (adminPreviewOffer) adminPreviewOffer.textContent = item?.offer || "No active offer";

  if (adminPreviewStock) {
    const unavailable = Boolean(item?.unavailable);
    adminPreviewStock.textContent = unavailable ? "Stock: Unavailable" : "Stock: Available";
    adminPreviewStock.style.color = unavailable ? "#fecaca" : "#86efac";
  }

  if (adminPreviewImage) {
    const imageUrl = item?.image || IMAGE_FALLBACK;
    adminPreviewImage.src = imageUrl;
    adminPreviewImage.alt = item?.name ? `${item.name} preview` : "Selected product preview";
  }
}

function fillForm() {
  if (!adminProductSelect || !adminPriceInput || !adminOfferInput || !adminUnavailableInput) return;
  const selectedId = adminProductSelect.value;
  const item = allProducts.find((p) => p.id === selectedId);
  if (!item) {
    updatePreview(null);
    updateStats();
    return;
  }

  adminPriceInput.value = item.price || "";
  adminOfferInput.value = item.offer || "";
  adminUnavailableInput.checked = Boolean(item.unavailable);
  updatePreview(item);
  updateStats();
}

function renderProductSelect() {
  if (!adminProductSelect) return;

  const previousId = adminProductSelect.value;
  const grouped = allProducts.reduce((acc, item) => {
    const key = String(item.category || "other").toUpperCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const html = Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b))
    .map((category) => {
      const options = grouped[category]
        .map(
          (item) =>
            `<option value="${item.id}">${item.name} | ${item.brand} | ${String(item.price || "-")}</option>`
        )
        .join("");
      return `<optgroup label="${category}">${options}</optgroup>`;
    })
    .join("");

  adminProductSelect.innerHTML = html || '<option value="">No product found</option>';

  const hasPrevious = previousId && allProducts.some((item) => item.id === previousId);
  if (hasPrevious) {
    adminProductSelect.value = previousId;
  }
  collapseProductSelect();
}

function renderSearchSuggestions() {
  if (!adminSearchInput) return;
  const query = adminSearchInput.value.trim();
  const matches = getMatchingProducts(query);
  visibleProducts = query ? matches : allProducts;

  if (adminProductSuggestions) {
    adminProductSuggestions.innerHTML = matches
      .slice(0, 12)
      .map((item) => `<option value="${item.name}">${item.brand} | ${String(item.category).toUpperCase()}</option>`)
      .join("");
  }

  updateStats();
}

function applySearchSelection() {
  if (!adminSearchInput || !adminProductSelect) return;
  const query = adminSearchInput.value.trim();
  if (!query) return;

  const matches = getMatchingProducts(query);
  if (!matches.length) return;

  adminProductSelect.value = matches[0].id;
  fillForm();
}

function flattenGroupedProducts(grouped) {
  return Object.entries(grouped || {}).flatMap(([category, items]) =>
    (items || []).map((item, index) => ({ id: `${category}-${index + 1}`, category, ...item }))
  );
}

async function loadProducts() {
  let list = [];

  const adminRes = await api("/api/admin/products");
  if (adminRes.ok) {
    const data = await adminRes.json();
    list = Array.isArray(data.products) ? data.products : [];
  } else {
    const publicRes = await api("/api/products");
    if (!publicRes.ok) throw new Error("Failed to load products");
    const grouped = await publicRes.json();
    list = flattenGroupedProducts(grouped);
  }

  allProducts = list.sort((a, b) => {
    const cat = String(a.category).localeCompare(String(b.category));
    if (cat !== 0) return cat;
    return String(a.name).localeCompare(String(b.name));
  });

  visibleProducts = [...allProducts];
  renderProductSelect();
  renderSearchSuggestions();
  fillForm();
}

async function saveCurrent() {
  if (!adminProductSelect || !adminPriceInput || !adminOfferInput || !adminUnavailableInput) return;
  const id = adminProductSelect.value;
  if (!id) return;

  const res = await api(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      price: adminPriceInput.value.trim(),
      offer: adminOfferInput.value.trim(),
      unavailable: Boolean(adminUnavailableInput.checked)
    })
  });

  if (!res.ok) throw new Error("Save failed");
  setStatus("Saved successfully.");
  await loadProducts();
}

function resetCurrent() {
  fillForm();
  setStatus("Reverted unsaved changes.");
}

async function initDashboardPage() {
  if (
    !adminSearchInput ||
    !adminProductSelect ||
    !adminPriceInput ||
    !adminOfferInput ||
    !adminUnavailableInput ||
    !saveAdminChangesBtn ||
    !resetAdminChangesBtn
  ) {
    return;
  }

  adminSearchInput.addEventListener("input", () => {
    renderSearchSuggestions();
  });

  adminSearchInput.addEventListener("change", () => {
    applySearchSelection();
  });

  adminSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applySearchSelection();
    }
  });

  adminProductSelect.addEventListener("change", () => {
    fillForm();
    collapseProductSelect();
  });
  adminProductSelect.addEventListener("focus", expandProductSelect);
  adminProductSelect.addEventListener("click", expandProductSelect);
  adminProductSelect.addEventListener("blur", collapseProductSelect);

  adminPriceInput.addEventListener("input", () => {
    if (adminPreviewPrice) adminPreviewPrice.textContent = adminPriceInput.value.trim() || "-";
  });

  adminOfferInput.addEventListener("input", () => {
    if (adminPreviewOffer) {
      adminPreviewOffer.textContent = adminOfferInput.value.trim() || "No active offer";
    }
  });

  adminUnavailableInput.addEventListener("change", () => {
    if (!adminPreviewStock) return;
    const unavailable = Boolean(adminUnavailableInput.checked);
    adminPreviewStock.textContent = unavailable ? "Stock: Unavailable" : "Stock: Available";
    adminPreviewStock.style.color = unavailable ? "#fecaca" : "#86efac";
  });

  saveAdminChangesBtn.addEventListener("click", async () => {
    try {
      await saveCurrent();
    } catch {
      setStatus("Save failed.", true);
    }
  });

  resetAdminChangesBtn.addEventListener("click", resetCurrent);

  adminLogoutBtn?.addEventListener("click", () => {
    window.location.href = "/";
  });

  try {
    await loadProducts();
    setStatus("Products loaded.");
  } catch {
    setStatus("Failed to load products.", true);
  }
}

initDashboardPage();
