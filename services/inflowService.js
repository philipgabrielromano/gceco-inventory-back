// server/services/inflowService.js
const axios = require('axios');

const BASE_URL = `https://cloudapi.inflowinventory.com/${process.env.INFLOW_COMPANY_ID}`;
const HEADERS = {
  'Authorization': `Bearer ${process.env.INFLOW_API_KEY}`,
  'Accept': 'application/json;version=2024-10-01'
};

let productCatalog = null;

async function loadAllProducts() {
  const allProducts = [];
  let page = 1;

  while (true) {
    const res = await axios.get(`${BASE_URL}/products`, {
      headers: HEADERS,
      params: { page }
    });

    const products = res.data || [];
    allProducts.push(...products);

    console.log(`📄 Retrieved ${products.length} products from page ${page}`);

    if (!products.length || !res.data.next_page) break;
    page++;
  }

  productCatalog = {};
  for (const p of allProducts) {
    if (p.productNumber) {
      productCatalog[p.productNumber] = p;
    }
  }

  console.log(`✅ Loaded ${Object.keys(productCatalog).length} products into memory.`);
}

async function fetchCostForSKU(sku) {
  if (!productCatalog) {
    await loadAllProducts();
  }

  const product = productCatalog[sku];
  if (!product) {
    console.warn(`⚠️ No product found for SKU ${sku}`);
    return 'missing';
  }

  console.log(`🧾 Cached product match for ${sku}:`, JSON.stringify(product, null, 2));

  if (product.defaultVendorCost?.amount) {
    return parseFloat(product.defaultVendorCost.amount);
  }
  if (product.defaultPrice?.amount) {
    return parseFloat(product.defaultPrice.amount);
  }

  return 'missing';
}

async function fetchOrderedQuantity(sku, dateFrom, dateTo) {
  try {
    const res = await axios.get(`${BASE_URL}/salesOrders`, {
      headers: HEADERS,
      params: {
        'filter[productNumber]': sku,
        'filter[date]': `>${dateFrom}`,
        'filter[date]': `<${dateTo}`
      }
    });

    let totalOrdered = 0;
    const orders = res.data || [];

    for (const order of orders) {
      if (order.orderLines) {
        for (const line of order.orderLines) {
          if (line.productNumber === sku) {
            totalOrdered += line.quantity;
          }
        }
      }
    }

    return totalOrdered;
  } catch (err) {
    console.error(`Error fetching salesOrders for SKU ${sku}:`, err.response?.data || err.message);
    return null;
  }
}

module.exports = { fetchCostForSKU, fetchOrderedQuantity };
