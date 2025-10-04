import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VehicleSearch, Listing, VehicleRequest } from './lib/VehicleSearch.js';

const app = express();
const PORT = 3000;

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const listingsPath = path.join(__dirname, '../listings.json');
const listings: Listing[] = JSON.parse(fs.readFileSync(listingsPath, 'utf-8'));
const vehicleSearch = new VehicleSearch(listings);

app.post('/', (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${JSON.stringify(req.body)}`);

  const requests = req.body;

  if (
    !Array.isArray(requests) ||
    requests.some(
      (r) =>
        typeof r.length !== 'number' ||
        typeof r.quantity !== 'number' ||
        r.length < 0 ||
        r.quantity < 0
    )
  ) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  try {
    const results = vehicleSearch.find(requests);
    res.json(results);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
