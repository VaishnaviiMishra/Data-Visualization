// models/dataService.js
import { Chart } from './chartModels.js';

export async function getAllData(query = {}, projection = {}, limit = 0) {
  try {
    let queryBuilder = Chart.find(query).select(projection);
    if (limit > 0) queryBuilder = queryBuilder.limit(limit);
    return await queryBuilder.exec();
  } catch (err) {
    console.error('Error fetching data:', err);
    throw err;
  }
}

export async function getPaginatedData(page = 1, pageSize = 10, query = {}) {
  try {
    const skip = (page - 1) * pageSize;
    
    const [data, totalCount] = await Promise.all([
      Chart.find(query).skip(skip).limit(pageSize).exec(),
      Chart.countDocuments(query)
    ]);
    
    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    };
  } catch (err) {
    console.error('Error fetching paginated data:', err);
    throw err;
  }
}