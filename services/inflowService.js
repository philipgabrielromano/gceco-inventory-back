// server/services/inflowService.js
const axios = require('axios');

const BASE_URL = `https://cloudapi.inflowinventory.com/${process.env.INFLOW_COMPANY_ID}`;
const HEADERS = {
  'Authorization': `Bearer ${process.env.INFLOW_API_KEY}`,
  'Accept': 'application/json;version=2024-10-01'
};

let productCatalog = null;
let vendorCostMap = null;

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
  console.log('🧪 Sample product object:', JSON.stringify(allProducts[0], null, 2));

  for (const p of allProducts) {
    const key = p.productNumber || p.number || p.name || p.code || p.sku;
    if (key) {
      productCatalog[key] = p;
    }
  }

  console.log(`✅ Loaded ${Object.keys(productCatalog).length} products into memory.`);
}

async function loadVendorItems() {
  const allItems = [];
  let page = 1;

  while (true) {
    const res = await axios.get(`${BASE_URL}/vendorItems`, {
      headers: HEADERS,
      params: { page }
    });

    const items = res.data || [];
    allItems.push(...items);
    console.log(`📦 Retrieved ${items.length} vendor items from page ${page}`);

    if (!items.length || !res.data.next_page) break;
    page++;
  }

  vendorCostMap = {};
  console.log('🧪 Sample vendor item:', JSON.stringify(allItems[0], null, 2));

  for (const item of allItems) {
    if (item.vendorItemCode && item.cost) {
      vendorCostMap[item.vendorItemCode] = parseFloat(item.cost);
    }
  }

  console.log(`✅ Loaded ${Object.keys(vendorCostMap).length} vendor costs into memory.`);
}
}

async function fetchCostForSKU(sku) {
  if (!productCatalog) {
    await loadAllProducts();
  }
  if (!vendorCostMap) {
    await loadVendorItems();
  }

  const product = productCatalog[sku];
  if (!product) {
    console.warn(`⚠️ No product found for SKU ${sku}`);
    return vendorCostMap[sku] ?? 'missing';
  }

  
  if (vendorCostMap[sku]) {
    return vendorCostMap[sku];
  }

  return 'missing';
}

  console.log(`🧾 Cached product match for ${sku}:`, JSON.stringify(product, null, 2));

  if (product.cost?.cost) {
    return parseFloat(product.cost.cost);
  }
  if (product.defaultVendorCost?.amount) {
    return parseFloat(product.defaultVendorCost.amount);
  }
  if (product.defaultPrice?.amount) {
    return parseFloat(product.defaultPrice.amount);
  }
  if (product.vendorItems?.length && product.vendorItems[0].cost) {
    return parseFloat(product.vendorItems[0].cost);
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
