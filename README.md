# JavaScript Day 5 Mini Store

An interactive project created by **Zeeshan Fida** for the **Tech SG Studio internship** using HTML, CSS, and JavaScript.

## Tasks

### 1. Async Login Simulation

- Use a Promise-based `wait(ms)` function.
- Simulate login success or failure after two seconds.
- Display “Logging in...” while waiting.
- Handle results using async/await and try/catch.
- Disable controls during the simulation.

This is a fake login exercise and does not authenticate real accounts.

### 2. Product Explorer

- Fetch products from the DummyJSON API.
- Display product images, titles, prices, and categories.
- Search products by title.
- Filter products by category.
- Sort prices from low to high or high to low.
- Reset all filters.
- Display loading, error, and no-results states.
- Retry failed requests.

Sample prices are displayed in USD.

### 3. Mini Store Cart

- Add products to the cart.
- Increase quantity when the same product is added again.
- Display a cart quantity badge.
- Adjust quantities using + and − buttons.
- Remove individual products.
- Clear the entire cart.
- Calculate item totals and the overall price.
- Save and restore cart data using localStorage.

Quantity ranges from 1 to 99 per product. Use Remove to delete an item.

## Interface Features

- Responsive desktop, tablet, and mobile layouts
- Mobile hamburger navigation
- Product cards and order summary
- Accessible labels and keyboard controls
- Image fallback messages
- Separate HTML, CSS, and JavaScript files
- No frameworks or external dependencies

## Project Files

- `index.html` — Page structure and navigation
- `style.css` — Styling and responsive layouts
- `script.js` — Async logic, API requests, filters, and cart
- `README.md` — Project documentation

## Run Locally

1. Download or clone the repository.
2. Open the project folder in VS Code.
3. Open `index.html` using Live Server.

Internet access is required to fetch products and their images.

No package installation or build command is required.

## API

Products are fetched from:

https://dummyjson.com/products?limit=0

Search, category filtering, and price sorting are performed locally on the fetched catalog.

## Local Storage

Cart data is saved in the current browser.

It does not sync across browsers or devices. Clearing browser storage removes the saved cart. If storage is unavailable, the project displays a warning.

## Manual Checks

- Try both successful and failed login simulations.
- Search for a product by title.
- Combine search with a category filter.
- Try both price sorting options.
- Search for an unmatched title to see the no-results state.
- Add the same product twice and check its quantity.
- Increase and decrease cart quantities.
- Remove an item and clear the cart.
- Refresh the page to check cart persistence.
- Check navigation and layouts at mobile widths.

## Scope

This is an educational frontend project. It does not create real accounts, process payments, or place orders.

## Author

**Zeeshan Fida**

Tech SG Studio — Day 5 JavaScript Practice
