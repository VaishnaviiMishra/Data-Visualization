import { Chart } from './models/chartModels.js';
import { readFileSync } from 'fs';
import connectDB from './config/db.js';
import mongoose from 'mongoose';

const jsonData = JSON.parse(readFileSync('jsondata.json', 'utf8'));

async function importData() {
  try {
    // Connect to database first
    await connectDB();
    
    // Clear existing data with timeout handling
    await Chart.deleteMany({});
    
    // Insert data in batches if array is large
    if (Array.isArray(jsonData) && jsonData.length > 1000) {
      const batchSize = 500;
      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize);
        await Chart.insertMany(batch);
        console.log(`Inserted batch ${i/batchSize + 1}`);
      }
    } else {
      const result = Array.isArray(jsonData)
        ? await Chart.insertMany(jsonData)
        : await Chart.create(jsonData);
      console.log(`✅ Imported ${Array.isArray(result) ? result.length : 1} documents`);
    }
  } catch (err) {
    console.error('❌ Import error:', err);
  } finally {
    mongoose.disconnect();
  }
}

importData();