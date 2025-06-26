// models/chartModel.js
import { Schema, model } from 'mongoose';

const chartSchema = new Schema({
  end_year: Number,
  intensity: Number,
  sector: String,
  topic: String,
  insight: String,
  url: String,
  region: String,
  start_year: String,
  impact: String,
  added: String,
  published: String,
  country: String,
  reclamation: Number
}, {
  timestamps: false,
  strict: false // Allows flexible schema if your JSON fields vary
});

export const Chart = model('Chart', chartSchema);