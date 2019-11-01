const fs = require('fs');

const inputJsonPath = 'data/yellow_restaurants.json';
const outputJsonPath = 'data/yellow_restaurants_clean.json';
const output = {};
let restaurants;

// READ EXISTING
if (fs.existsSync(inputJsonPath)) {
  const data = fs.readFileSync(inputJsonPath);
  restaurants = JSON.parse(data);
}

for (const [key, value] of Object.entries(restaurants)) {
  delete value.google_map_info;
  output[key] = value;
}

fs.writeFile(outputJsonPath, JSON.stringify(output, null, 2), (err) => {
  if (err) throw err;
  console.log('*********** Data written to file');
});