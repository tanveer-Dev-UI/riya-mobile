async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  return response;
}

async function initLoginPage() {
  const form = document.getElementById("adminLoginForm");
  if (!form) return;

  const userInput = document.getElementById("adminUserId");
  const passInput = document.getElementById("adminPassword");
  const status = document.getElementById("adminLoginStatus");

  try {
    const sessionRes = await api("/api/admin/session");
    const session = await sessionRes.json();
    if (session?.authenticated) {
      window.location.href = "/admin.html";
      return;
    }
  } catch {
    // ignore
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!userInput || !passInput || !status) return;
    status.textContent = "";

    try {
      const res = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          userId: userInput.value.trim(),
          password: passInput.value.trim()
        })
      });
      if (!res.ok) {
        status.textContent = "Invalid credentials.";
        return;
      }
      window.location.href = "/admin.html";
    } catch {
      status.textContent = "Login failed. Try again.";
    }
  });
}

async function initDashboardPage() {
  const adminSearchInput = document.getElementById("adminSearchInput");
  const adminProductSelect = document.getElementById("adminProductSelect");
  const adminPriceInput = document.getElementById("adminPriceInput");
  const adminOfferInput = document.getElementById("adminOfferInput");
  const adminUnavailableInput = document.getElementById("adminUnavailableInput");
  const saveAdminChangesBtn = document.getElementById("saveAdminChanges");
  const resetAdminChangesBtn = document.getElementById("resetAdminChanges");
  const adminStatusNote = document.getElementById("adminStatusNote");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");

  if (
    !adminSearchInput ||
    !adminProductSelect ||
    !adminPriceInput ||
    !adminOfferInput ||
    !adminUnavailableInput ||
    !saveAdminChangesBtn ||
    !resetAdminChangesBtn ||
    !adminStatusNote
  ) return;

  try {
    const sessionRes = await api("/api/admin/session");
    const session = await sessionRes.json();
    if (!session?.authenticated) {
      window.location.href = "/admin";
      return;
    }
  } catch {
    window.location.href = "/admin";
    return;
  }

  let allProducts = [];
  let visibleProducts = [];

  function setStatus(text, isError = false) {
    adminStatusNote.textContent = text;
    adminStatusNote.style.color = isError ? "#b91c1c" : "#475569";
  }

  function fillForm() {
    const selectedId = adminProductSelect.value;
    const item = allProducts.find((p) => p.id === selectedId);
    if (!item) return;
    adminPriceInput.value = item.price || "";
    adminOfferInput.value = item.offer || "";
    adminUnavailableInput.checked = Boolean(item.unavailable);
  }

  function renderOptions() {
    const q = adminSearchInput.value.toLowerCase().trim();
    visibleProducts = allProducts.filter((item) =>
      q === "" || `${item.name} ${item.brand} ${item.category}`.toLowerCase().includes(q)
    );

    adminProductSelect.innerHTML = visibleProducts.length
      ? visibleProducts
          .map((item) => `<option value="${item.id}">${item.name} (${item.category})</option>`)
          .join("")
      : '<option value="">No product found</option>';
    fillForm();
  }

  async function loadProducts() {
    try {
      const res = await api("/api/admin/products");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin";
          return;
        }
        setStatus("Failed to load products.", true);
        return;
      }
      const data = await res.json();
      allProducts = Array.isArray(data.products) ? data.products : [];
      renderOptions();
      setStatus("Products loaded.");
    } catch {
      setStatus("Failed to load products.", true);
    }
  }

  async function saveCurrent() {
    const id = adminProductSelect.value;
    if (!id) return;

    try {
      const res = await api(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          price: adminPriceInput.value.trim(),
          offer: adminOfferInput.value.trim(),
          unavailable: Boolean(adminUnavailableInput.checked)
        })
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin";
          return;
        }
        setStatus("Save failed.", true);
        return;
      }
      setStatus("Saved successfully.");
      await loadProducts();
    } catch {
      setStatus("Save failed.", true);
    }
  }

  function resetCurrent() {
    const id = adminProductSelect.value;
    const item = allProducts.find((p) => p.id === id);
    if (!item) return;
    adminPriceInput.value = item.price || "";
    adminOfferInput.value = item.offer || "";
    adminUnavailableInput.checked = Boolean(item.unavailable);
    setStatus("Reverted unsaved changes.");
  }

  adminSearchInput.addEventListener("input", renderOptions);
  adminProductSelect.addEventListener("change", fillForm);
  saveAdminChangesBtn.addEventListener("click", saveCurrent);
  resetAdminChangesBtn.addEventListener("click", resetCurrent);

  adminLogoutBtn?.addEventListener("click", async () => {
    try {
      await api("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin";
    }
  });

  await loadProducts();
}

initLoginPage();
initDashboardPage();
