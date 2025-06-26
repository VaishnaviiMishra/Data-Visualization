// server.js
import express from 'express';
import connectDB from './config/db.js';
import { getAllData, getPaginatedData } from './models/dataService.js';
//import { engine } from 'express-handlebars';
import { Chart } from './models/chartModels.js';
import { create } from 'express-handlebars'; 
import { helpers } from './utils/helper.js';  // Changed import
// Initialize connection
await connectDB();

const app = express();
const PORT = 3000;

const hbs = create({
  helpers: helpers,
  extname: '.handlebars'
});
// Routes remain the same but now use Mongoose models
// Unified API endpoint in server.js
app.get('/api/data', async (req, res) => {
  try {
    // If no query parameters, use the simple getAllData()
    if (Object.keys(req.query).length === 0) {
      const data = await getAllData(); // Your original simple version
      return res.json(data);
    }

    // Otherwise use enhanced filtering
    const query = {};
    
    // Your existing filters
    if (req.query.name) query.name = { $regex: req.query.name, $options: 'i' };
    if (req.query.age) query.age = parseInt(req.query.age);
    
    // New dashboard filters
    if (req.query.year) query.end_year = parseInt(req.query.year);
    if (req.query.sector) query.sector = req.query.sector;
    if (req.query.region) query.region = req.query.region;
    if (req.query.country) query.country = req.query.country;
    if (req.query.min_intensity || req.query.max_intensity) {
      query.intensity = {};
      if (req.query.min_intensity) query.intensity.$gte = parseInt(req.query.min_intensity);
      if (req.query.max_intensity) query.intensity.$lte = parseInt(req.query.max_intensity);
    }

    // Use either getAllData() with filters or direct Model.find()
    const data = await Chart.find(query).limit(1000);
    res.json(data);
    
  } catch (err) {
    res.status(500).json({ 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static('public'));

app.get('/dashboard', async (req, res) => {
  const filters = {
    year: req.query.year || '',
    sector: req.query.sector || '',
    region: req.query.region || '',
    country: req.query.country || '',
    min_intensity: req.query.min_intensity || 0,
    max_intensity: req.query.max_intensity || 100
  };

  // Get filter options for dropdowns
  const filterOptions = {
    years: await Chart.distinct('end_year').sort(),
    sectors: await Chart.distinct('sector'),
    regions: await Chart.distinct('region'),
    countries: await Chart.distinct('country')
  };

  res.render('dashboard', { filters, filterOptions });
});