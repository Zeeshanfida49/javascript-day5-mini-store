"use strict";

// ==========================================
// Shared helpers
// ==========================================

const get = (id) => document.getElementById(id);

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);

const toCents = (price) => Math.round(price * 100);

function element(tag, className, text) {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
}

function message(id, text, isError = false) {
  get(id).textContent = text;
  get(id).classList.toggle("error", isError);
}

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function categoryLabel(category) {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Safely render API and saved data without inserting HTML.
function createImageBox(source, title, className) {
  const box = element("div", className);

  let validSource = "";

  try {
    const url = new URL(source);

    if (url.protocol === "https:") {
      validSource = url.href;
    }
  } catch {
    // Invalid image URLs use the fallback below.
  }

  const showFallback = () => {
    box.replaceChildren(
      element("span", "image-fallback", "Image unavailable")
    );
  };

  if (!validSource) {
    showFallback();
    return box;
  }

  const image = element("img", "product-image");
  image.alt = title;
  image.loading = "lazy";
  image.decoding = "async";

  image.addEventListener("error", showFallback, { once: true });
  image.src = validSource;

  box.append(image);
  return box;
}

// ==========================================
// Hamburger navigation
// ==========================================

const menuButton = get("menu-toggle");
const navigation = get("main-navigation");

function setMenuOpen(open) {
  navigation.classList.toggle("is-open", open);
  menuButton.setAttribute("aria-expanded", String(open));

  menuButton.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation"
  );
}

menuButton.addEventListener("click", () => {
  setMenuOpen(
    menuButton.getAttribute("aria-expanded") !== "true"
  );
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("click", (event) => {
  if (
    !navigation.contains(event.target) &&
    !menuButton.contains(event.target)
  ) {
    setMenuOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton.getAttribute("aria-expanded") === "true"
  ) {
    setMenuOpen(false);
    menuButton.focus();
  }
});

window.matchMedia("(max-width: 760px)")
  .addEventListener("change", () => setMenuOpen(false));

// ==========================================
// Task 1: Async Basics
// ==========================================

// Return a Promise that resolves after the requested delay.
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fakeLogin(shouldSucceed) {
  await wait(2000);

  if (!shouldSucceed) {
    throw new Error("Login failed. Please try again.");
  }

  return "Login successful! Welcome to your Day 5 workspace.";
}

get("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = get("login-button");
  const resultSelect = get("login-result");

  if (button.disabled) {
    return;
  }

  const shouldSucceed = resultSelect.value === "success";

  button.disabled = true;
  resultSelect.disabled = true;
  button.textContent = "Please wait...";
  get("login-form").setAttribute("aria-busy", "true");

  message("login-message", "Logging in...");

  try {
    const result = await fakeLogin(shouldSucceed);
    message("login-message", result);
  } catch (error) {
    message("login-message", error.message, true);
  } finally {
    button.disabled = false;
    resultSelect.disabled = false;
    button.textContent = "Start fake login →";
    get("login-form").setAttribute("aria-busy", "false");
  }
});

// ==========================================
// Task 2: Products Page
// ==========================================

let products = [];
let loadingProducts = false;
let catalogReady = false;

// Use limit=0 to fetch the complete catalog.
const PRODUCTS_URL = "https://dummyjson.com/products?limit=0";

function setFiltersDisabled(disabled) {
  [
    "search-input",
    "category-filter",
    "price-sort",
    "reset-filters"
  ].forEach((id) => {
    get(id).disabled = disabled;
  });
}

function populateCategories() {
  const select = get("category-filter");
  const previous = select.value;

  const categories = [...new Set(
    products.map((product) => product.category)
  )].sort();

  select.replaceChildren();

  const allOption = element("option", "", "All categories");
  allOption.value = "all";
  select.append(allOption);

  categories.forEach((category) => {
    const option = element(
      "option",
      "",
      categoryLabel(category)
    );

    option.value = category;
    select.append(option);
  });

  select.value = categories.includes(previous)
    ? previous
    : "all";
}

async function loadProducts() {
  if (loadingProducts) {
    return;
  }

  loadingProducts = true;
  catalogReady = false;

  get("loading-state").hidden = false;
  get("error-state").hidden = true;
  get("empty-products").hidden = true;
  get("product-grid").replaceChildren();
  get("product-grid").setAttribute("aria-busy", "true");
  get("product-count").textContent = "";
  message("catalog-message", "");

  setFiltersDisabled(true);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(PRODUCTS_URL, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}.`);
    }

    const data = await response.json();

    if (!Array.isArray(data.products)) {
      throw new Error("The API returned an unexpected response.");
    }

    products = data.products.filter((product) =>
      Number.isSafeInteger(product.id) &&
      product.id > 0 &&
      typeof product.title === "string" &&
      typeof product.category === "string" &&
      Number.isFinite(product.price) &&
      product.price >= 0
    );

    catalogReady = true;
    populateCategories();
    renderProducts();
  } catch (error) {
    products = [];

    get("error-state").hidden = false;
    get("product-count").textContent = "Catalog unavailable";

    get("product-error").textContent =
      error.name === "AbortError"
        ? "The request timed out. Check your internet connection and retry."
        : `Unable to fetch products. ${error.message}`;
  } finally {
    clearTimeout(timeout);
    loadingProducts = false;

    get("loading-state").hidden = true;
    get("product-grid").setAttribute("aria-busy", "false");

    setFiltersDisabled(!catalogReady);
  }
}

function renderProducts() {
  if (!catalogReady) {
    return;
  }

  const search = get("search-input").value.trim().toLowerCase();
  const category = get("category-filter").value;
  const sort = get("price-sort").value;

  const visibleProducts = products.filter((product) => {
    const matchesTitle =
      product.title.toLowerCase().includes(search);

    const matchesCategory =
      category === "all" || product.category === category;

    return matchesTitle && matchesCategory;
  });

  // The filtered array is separate from the original catalog.
  if (sort === "low") {
    visibleProducts.sort((a, b) => a.price - b.price);
  } else if (sort === "high") {
    visibleProducts.sort((a, b) => b.price - a.price);
  }

  get("product-count").textContent =
    `${visibleProducts.length} of ${products.length} products`;

  get("empty-products").hidden = visibleProducts.length !== 0;

  const grid = get("product-grid");
  grid.replaceChildren();

  const fragment = document.createDocumentFragment();

  visibleProducts.forEach((product) => {
    const card = element("article", "product-card");

    const imageBox = createImageBox(
      product.thumbnail,
      product.title,
      "image-box"
    );

    const body = element("div", "product-body");

    const categoryText = element(
      "p",
      "product-category",
      categoryLabel(product.category)
    );

    const title = element("h3", "product-title", product.title);
    const price = element("p", "product-price", money(product.price));

    const button = element("button", "button", "Add to cart +");
    button.type = "button";

    button.setAttribute(
      "aria-label",
      `Add ${product.title} to cart`
    );

    button.addEventListener("click", () => addToCart(product));

    body.append(categoryText, title, price, button);
    card.append(imageBox, body);
    fragment.append(card);
  });

  grid.append(fragment);
}

get("search-input").addEventListener("input", renderProducts);
get("category-filter").addEventListener("change", renderProducts);
get("price-sort").addEventListener("change", renderProducts);

get("reset-filters").addEventListener("click", () => {
  get("search-input").value = "";
  get("category-filter").value = "all";
  get("price-sort").value = "default";
  renderProducts();
});

get("retry-products").addEventListener("click", loadProducts);

// ==========================================
// Task 3: Mini Store Cart
// ==========================================

const CART_KEY = "zeeshan-day5-cart";
const MAX_QUANTITY = 99;

function loadCart() {
  const saved = readStorage(CART_KEY);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const usedIds = new Set();

    return parsed.filter((item) => {
      const valid =
        item !== null &&
        typeof item === "object" &&
        Number.isSafeInteger(item.id) &&
        item.id > 0 &&
        !usedIds.has(item.id) &&
        typeof item.title === "string" &&
        item.title.trim().length > 0 &&
        typeof item.thumbnail === "string" &&
        Number.isFinite(item.price) &&
        item.price >= 0 &&
        item.price <= 100000000 &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= MAX_QUANTITY;

      if (valid) {
        usedIds.add(item.id);
      }

      return valid;
    });
  } catch {
    return [];
  }
}

let cart = loadCart();

function saveAndRenderCart(text) {
  const saved = writeStorage(CART_KEY, JSON.stringify(cart));

  renderCart();

  const feedback = saved
    ? text
    : `${text} Browser storage is unavailable; changes may reset after refresh.`;

  message("cart-message", feedback, !saved);
  return { saved, feedback };
}

function addToCart(product) {
  const existing = cart.find((item) => item.id === product.id);

  if (existing && existing.quantity >= MAX_QUANTITY) {
    message(
      "catalog-message",
      `Maximum quantity is ${MAX_QUANTITY} per product.`,
      true
    );
    return;
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail || "",
      quantity: 1
    });
  }

  const result = saveAndRenderCart(
    `${product.title} added to cart.`
  );

  message("catalog-message", result.feedback, !result.saved);
}

function changeQuantity(id, change) {
  const item = cart.find((entry) => entry.id === id);

  if (!item) {
    return;
  }

  const nextQuantity = item.quantity + change;

  // Quantity stays between 1 and 99. Use Remove to delete an item.
  if (nextQuantity < 1 || nextQuantity > MAX_QUANTITY) {
    return;
  }

  item.quantity = nextQuantity;
  saveAndRenderCart("Cart quantity updated.");

  const focusButton = get(
    `${change > 0 ? "plus" : "minus"}-${id}`
  );

  if (focusButton && !focusButton.disabled) {
    focusButton.focus();
  } else {
    get(`remove-${id}`)?.focus();
  }
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveAndRenderCart("Item removed from cart.");

  const remainingButton =
    get("cart-list").querySelector("button");

  if (remainingButton) {
    remainingButton.focus();
  } else {
    get("empty-cart").querySelector("a").focus();
  }
}

function renderCart() {
  const list = get("cart-list");
  list.replaceChildren();

  let totalQuantity = 0;
  let totalCents = 0;

  cart.forEach((item) => {
    totalQuantity += item.quantity;

    // Calculate in integer cents to avoid floating-point totals.
    const itemTotalCents = toCents(item.price) * item.quantity;
    totalCents += itemTotalCents;

    const row = element("li", "cart-item");

    const imageBox = createImageBox(
      item.thumbnail,
      item.title,
      "cart-image-box"
    );

    const content = element("div", "cart-content");
    const title = element("h3", "", item.title);

    const price = element(
      "p",
      "cart-unit-price",
      `${money(item.price)} each`
    );

    const controls = element("div", "cart-controls");
    const quantityControls = element("div", "quantity-controls");

    const minus = element("button", "", "−");
    minus.id = `minus-${item.id}`;
    minus.type = "button";
    minus.disabled = item.quantity === 1;

    minus.setAttribute(
      "aria-label",
      `Decrease quantity of ${item.title}`
    );

    minus.addEventListener("click", () =>
      changeQuantity(item.id, -1)
    );

    const quantity = element("span", "", String(item.quantity));

    quantity.setAttribute(
      "aria-label",
      `Quantity: ${item.quantity}`
    );

    const plus = element("button", "", "+");
    plus.id = `plus-${item.id}`;
    plus.type = "button";
    plus.disabled = item.quantity >= MAX_QUANTITY;

    plus.setAttribute(
      "aria-label",
      `Increase quantity of ${item.title}`
    );

    plus.addEventListener("click", () =>
      changeQuantity(item.id, 1)
    );

    quantityControls.append(minus, quantity, plus);

    const remove = element("button", "remove-button", "Remove");
    remove.id = `remove-${item.id}`;
    remove.type = "button";

    remove.setAttribute(
      "aria-label",
      `Remove ${item.title} from cart`
    );

    remove.addEventListener("click", () => removeFromCart(item.id));

    const lineTotal = element(
      "strong",
      "line-total",
      money(itemTotalCents / 100)
    );

    controls.append(quantityControls, remove, lineTotal);
    content.append(title, price, controls);
    row.append(imageBox, content);
    list.append(row);
  });

  get("empty-cart").hidden = cart.length > 0;
  get("clear-cart").disabled = cart.length === 0;

  get("cart-types").textContent = cart.length;
  get("cart-quantity").textContent = totalQuantity;
  get("cart-total").textContent = money(totalCents / 100);
  get("cart-badge").textContent = totalQuantity;

  get("cart-badge").setAttribute(
    "aria-label",
    `${totalQuantity} items in cart`
  );
}

get("clear-cart").addEventListener("click", () => {
  cart = [];
  saveAndRenderCart("Cart cleared.");
  get("empty-cart").querySelector("a").focus();
});

// ==========================================
// Initial rendering
// ==========================================

renderCart();
loadProducts();