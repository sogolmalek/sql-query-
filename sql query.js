const axios = require('axios');
const excel = require('exceljs');

const options = {
  method: 'POST',
  url: 'https://api.chainbase.online/v1/dw/query',
  headers: {
    accept: 'application/json',
    'x-api-key': 'your api key',
    'content-type': 'application/json',
  },
  data: {
    task_id: 'xxxxxxx',
    page: 1,
    query: 'your sql'
  },
};

const workbook = new excel.Workbook();
const worksheet = workbook.addWorksheet('Data');

// Add headers
worksheet.addRow(['Block Number', 'Block Timestamp', 'From Address', 'To Address', 'ETH', 'Input']);

async function fetchData(page) {
  options.data.page = page;

  try {
    const response = await axios.request(options);

    if (response.data && response.data.data && Array.isArray(response.data.data.result)) {
      const data = response.data.data.result;

      for (const row of data) {
        worksheet.addRow([
          row.block_number,
          row.block_timestamp,
          row.from_address,
          row.to_address,
          row.ETH,
          row.input,
        ]);
      }

      if (response.data.data.meta && response.data.data.meta.next_page) {
        const nextPage = response.data.data.meta.next_page;
        return fetchData(nextPage); // Return the promise to ensure sequential fetching
      } else {
        return true; // Indicate that all pages have been fetched
      }
    } else {
      console.error('Invalid response data:', response.data);
      return false; // Indicate an error occurred
    }
  } catch (error) {
    console.error(error);
    return false; // Indicate an error occurred
  }
}

async function fetchAllData() {
  let currentPage = 1;
  const totalPages = 3; // Set the total number of pages to fetch

  while (currentPage <= totalPages) {
    const success = await fetchData(currentPage);
    if (!success) {
      console.error('Error occurred while fetching data. Terminating.');
      return;
    }
    currentPage++;
  }

  await workbook.xlsx.writeFile('chainbaseData.xlsx');
  console.log('Excel file created successfully.');
}

fetchAllData();