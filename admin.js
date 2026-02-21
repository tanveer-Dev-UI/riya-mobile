const loginBox = document.getElementById("adminLoginBox");
const dashboard = document.getElementById("adminDashboard");
const loginUserId = document.getElementById("loginUserId");
const loginPassword = document.getElementById("loginPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const loginNote = document.getElementById("loginNote");

const adminSearchInput = document.getElementById("adminSearchInput");
const adminProductSelect = document.getElementById("adminProductSelect");
const adminPriceInput = document.getElementById("adminPriceInput");
const adminOfferInput = document.getElementById("adminOfferInput");
const adminUnavailableInput = document.getElementById("adminUnavailableInput");
const saveAdminChangesBtn = document.getElementById("saveAdminChanges");
const resetAdminChangesBtn = document.getElementById("resetAdminChanges");
const adminStatusNote = document.getElementById("adminStatusNote");

let products = [];

function showDashboard() {
  loginBox?.classList.add("hidden");
  dashboard?.classList.remove("hidden");
}

function showLogin() {
  dashboard?.classList.add("hidden");
  loginBox?.classList.remove("hidden");
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  return res;
}

function renderProductOptions(search = "") {
  if (!adminProductSelect) return;
  const q = search.toLowerCase().trim();
  const list = products.filter((item) =>
    q === "" || `${item.name} ${item.brand} ${item.category}`.toLowerCase().includes(q)
  );

  adminProductSelect.innerHTML = list.length
    ? list.map((item) => `<option value="${item.id}">${item.name} (${item.category})</option>`).join("")
    : '<option value="">No product found</option>';
}

function fillEditForm() {
  if (!adminProductSelect || !adminPriceInput || !adminOfferInput || !adminUnavailableInput) return;
  const selectedId = adminProductSelect.value;
  const item = products.find((p) => p.id === selectedId);
  if (!item) return;

  adminPriceInput.value = item.price || "";
  adminOfferInput.value = item.offer || "";
  adminUnavailableInput.checked = Boolean(item.unavailable);
}

async function loadProducts() {
  const res = await api("/api/admin/products");
  if (!res.ok) throw new Error("Failed to load products");
  const data = await res.json();
  products = data.products || [];
  renderProductOptions(adminSearchInput?.value || "");
  fillEditForm();
}

async function saveCurrentProduct() {
  const selectedId = adminProductSelect?.value;
  if (!selectedId) return;

  const payload = {
    price: adminPriceInput?.value?.trim() || "",
    offer: adminOfferInput?.value?.trim() || "",
    unavailable: Boolean(adminUnavailableInput?.checked)
  };

  const res = await api(`/api/admin/products/${selectedId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    adminStatusNote.textContent = "Save failed. Try again.";
    return;
  }

  await loadProducts();
  adminStatusNote.textContent = "Saved successfully. Website data updated.";
}

async function resetCurrentProduct() {
  const selectedId = adminProductSelect?.value;
  if (!selectedId) return;

  const item = products.find((p) => p.id === selectedId);
  if (!item) return;

  const payload = {
    price: item.basePrice || item.price,
    offer: "",
    unavailable: false
  };

  const res = await api(`/api/admin/products/${selectedId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    adminStatusNote.textContent = "Reset failed. Try again.";
    return;
  }

  await loadProducts();
  adminStatusNote.textContent = "Product reset to available state.";
}

async function checkSession() {
  const res = await api("/api/admin/session");
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.authenticated);
}

adminLoginBtn?.addEventListener("click", async () => {
  const userId = loginUserId?.value?.trim() || "";
  const password = loginPassword?.value || "";

  let res;
  try {
    res = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ userId, password })
    });
  } catch {
    if (loginNote) loginNote.textContent = "Server connect nahi hua. Pehle server start karo.";
    return;
  }

  if (!res.ok) {
    if (res.status === 401) {
      if (loginNote) loginNote.textContent = "Invalid credentials.";
      return;
    }
    if (loginNote) loginNote.textContent = "Login API error. Server/start mode check karo.";
    return;
  }

  showDashboard();
  await loadProducts();
});

adminLogoutBtn?.addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" });
  showLogin();
});

adminSearchInput?.addEventListener("input", () => {
  renderProductOptions(adminSearchInput.value);
  fillEditForm();
});

adminProductSelect?.addEventListener("change", fillEditForm);
saveAdminChangesBtn?.addEventListener("click", saveCurrentProduct);
resetAdminChangesBtn?.addEventListener("click", resetCurrentProduct);

(async () => {
  const authenticated = await checkSession();
  if (!authenticated) {
    showLogin();
    return;
  }
  showDashboard();
  await loadProducts();
})();
