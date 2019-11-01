/* eslint-disable no-console */
require('dotenv').config();
const xlsx = require('xlsx');
// const address_resolver = require('hk-address-parser-lib') ;
const fs = require('fs');
const crypto = require('crypto');

const colMap = {
  name: 'A',
  type: 'B',
  cuisine: 'C',
  district: 'D',
  address: 'E',
  context: 'F',
  ref: 'G',
};

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

const jsonPath = 'data/yellow_restaurants.json';
let restaurants = {};

// READ EXISTING
if (fs.existsSync(jsonPath)) {
  const data = fs.readFileSync(jsonPath);
  restaurants = JSON.parse(data);
}

// IMPORT
const workbook = xlsx.readFile('data/黃藍飲食商店 v18.xlsx');
const worksheet = workbook.Sheets.Yellow;

const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_API_KEY,
  Promise,
});

const results = [];

(async function doImport() {
  let row = 2;

  while (worksheet[`A${row}`]) {
    const entry = Object.fromEntries(Object.entries(colMap).map(
      // eslint-disable-next-line no-loop-func
      ([k, v]) => [k, (worksheet[v + row] || {}).v],
    ));

    if (entry.type === '飲食') {
      const hash = sha256(entry.name);
      restaurants[hash] = {
        ...restaurants[hash],
        ...entry,
      };

      if (restaurants[hash].lat === undefined || restaurants[hash].lng === undefined) {
        const geocodeResult = googleMapsClient.geocode({
          address: entry.address,
        })
          .asPromise()
          // eslint-disable-next-line no-loop-func
          .then((response) => {
            if (response.json.results.length > 0) {
              const { lat, lng } = response.json.results[0].geometry.location;

              restaurants[hash].lat = lat;
              restaurants[hash].lng = lng;
              restaurants[hash].google_map_info = { ...response.json.results[0] };
              console.log('restaurant', restaurants[hash]);
            }
          })
          .catch((err) => {
            console.log(`${entry.name} ERR`, entry);
            console.log(err);
          });
        results.push(geocodeResult);
      }
    }
    row += 1;
  }
}());

Promise.all(results).then(() => {
  fs.writeFile(jsonPath, JSON.stringify(restaurants, null, 2), (err) => {
    if (err) throw err;
    console.log('*********** Data written to file');
  });
});
