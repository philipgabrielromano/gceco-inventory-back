const axios = require('axios');

const API_URL = 'https://rpt-api.solutionsitw.com/rest/v2/dgr/sales-line';
const HEADERS = {
  'API-KEY': process.env.POS_API_KEY,
  'DEVICE-ID': process.env.POS_DEVICE_ID,
  'Authorization': `Bearer ${process.env.POS_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function fetchSalesData(dateFrom, dateTo) {
  const storeIds = [228, 226, 227, 229, 230, 231, 232, 233, 234, 236, 239, 240, 243, 244, 245, 248, 267, 268, 270, 275, 277, 281, 283, 284, 285, 286, 287, 289, 290, 288, 291];
  let allRecords = [];

  for (const storeId of storeIds) {
    let page = 1;
    while (true) {
      const url = `${API_URL}?filter[]=ts>${dateFrom}&filter[]=ts<${dateTo}&filter[]=StoreId=${storeId}&page=${page}`;
      console.log(`📡 Fetching store ${storeId}, page ${page}`);
      console.log(`🔗 URL: ${url}`);

      try {
        const res = await axios.get(url, { headers: HEADERS });
        const records = res.data?.data?.records || [];

        console.log(`📥 Received ${records.length} records for store ${storeId}`);

        if (!records.length) break;

        allRecords.push(...records);

        if (!res.data.next_page) break;
        page++;
      } catch (err) {
        console.error(`❌ Error fetching data for store ${storeId}:`, err.response?.data || err.message);
        break;
      }
    }
  }

  return allRecords;
}

module.exports = { fetchSalesData };
