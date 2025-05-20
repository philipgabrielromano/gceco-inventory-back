// server/services/inflowService.js
const axios = require('axios');

const BASE_URL = `https://cloudapi.inflowinventory.com/${process.env.INFLOW_COMPANY_ID}`;
const HEADERS = {
  'Authorization': `Bearer ${process.env.INFLOW_API_KEY}`,
  'Accept': 'application/json;version=2024-10-01'
};

async function fetchCostForSKU(sku) {
  try {
    const res = await axios.get(`${BASE_URL}/products`, {
      headers: HEADERS,
      params: {
        'filter[smart]': sku
      }
    });

    const products = res.data;
    if (products.length) {
      const product = products[0];
      if (product.defaultVendorCost?.amount) {
        return parseFloat(product.defaultVendorCost.amount);
      }
      if (product.defaultPrice?.amount) {
        return parseFloat(product.defaultPrice.amount);
      }
    }
  } catch (err) {
    console.error(`Error fetching cost for SKU ${sku}:`, err.response?.data || err.message);
  }
  return null;
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
