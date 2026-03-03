const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCT_PATH = path.join(__dirname, "data", "products.json");

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use(express.static(__dirname));

async function readProducts() {
  const raw = await fs.readFile(PRODUCT_PATH, "utf8");
  return JSON.parse(raw);
}

app.get("/api/products", async (req, res) => {
  try {
    const products = await readProducts();
    return res.json(products);
  } catch {
    return res.status(500).json({ error: "Failed to load products" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
