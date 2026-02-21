const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "riya@123";
const LEGACY_ADMIN_PASS = "riyamobile123";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours
const PRODUCT_PATH = path.join(__dirname, "data", "products.json");

const sessions = new Map();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin.html", (req, res) => {
  res.redirect("/admin");
});

app.get("/admin.hmtl", (req, res) => {
  res.redirect("/admin");
});

app.use(express.static(__dirname));

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(
    raw
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf("=");
        return [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
      })
  );
}

function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  res.append(
    "Set-Cookie",
    `admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
  );
}

function clearSession(req, res) {
  const cookies = parseCookies(req);
  if (cookies.admin_session) sessions.delete(cookies.admin_session);
  res.append("Set-Cookie", "admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
}

function authMiddleware(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies.admin_session;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: "Session expired" });
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  req.adminUser = session.userId;
  next();
}

function flattenProducts(grouped) {
  return Object.entries(grouped).flatMap(([category, items]) =>
    (items || []).map((item, index) => ({
      id: `${category}-${index + 1}`,
      category,
      ...item,
      basePrice: item.basePrice || item.price
    }))
  );
}

async function readProducts() {
  const raw = await fs.readFile(PRODUCT_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeProducts(data) {
  await fs.writeFile(PRODUCT_PATH, JSON.stringify(data, null, 2), "utf8");
}

app.get("/api/products", async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch {
    res.status(500).json({ error: "Failed to load products" });
  }
});

app.post("/api/admin/login", (req, res) => {
  const userId = String(req.body?.userId || "").trim();
  const password = String(req.body?.password || "").trim();
  const passOk = password === ADMIN_PASS || password === LEGACY_ADMIN_PASS;
  if (userId !== ADMIN_USER || !passOk) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  createSession(res, userId);
  return res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  clearSession(req, res);
  res.json({ ok: true });
});

app.get("/api/admin/session", (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies.admin_session;
  const session = token ? sessions.get(token) : null;
  const authenticated = Boolean(session && Date.now() <= session.expiresAt);
  if (!authenticated && token) sessions.delete(token);
  res.json({ authenticated });
});

app.get("/api/admin/products", authMiddleware, async (req, res) => {
  try {
    const grouped = await readProducts();
    res.json({ products: flattenProducts(grouped) });
  } catch {
    res.status(500).json({ error: "Failed to load products" });
  }
});

app.patch("/api/admin/products/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [category, indexPart] = id.split("-");
    const index = Number(indexPart) - 1;
    if (!category || Number.isNaN(index) || index < 0) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const grouped = await readProducts();
    const items = grouped[category];
    if (!items || !items[index]) return res.status(404).json({ error: "Product not found" });

    const item = items[index];
    const { price, offer, unavailable } = req.body || {};

    if (typeof price === "string" && price.trim()) item.price = price.trim();
    if (typeof offer === "string") item.offer = offer.trim();
    if (typeof unavailable === "boolean") item.unavailable = unavailable;

    if (!item.basePrice) item.basePrice = item.price;

    await writeProducts(grouped);
    res.json({ ok: true, product: item });
  } catch {
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
