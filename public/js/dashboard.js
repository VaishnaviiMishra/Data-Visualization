// Global chart references
let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize form
  document.getElementById('filterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    updateDashboard();
  });
  
  // Initialize intensity range display
  document.getElementById('min_intensity').addEventListener('input', updateIntensityDisplay);
  document.getElementById('max_intensity').addEventListener('input', updateIntensityDisplay);
  
  // Initial load
  await updateDashboard();
});

function updateIntensityDisplay() {
  const min = document.getElementById('min_intensity').value;
  const max = document.getElementById('max_intensity').value;
  document.getElementById('intensityValue').textContent = `${min} - ${max}`;
}

async function updateDashboard() {
  const formData = new FormData(document.getElementById('filterForm'));
  const params = new URLSearchParams(formData);
  
  // Show loading state
  document.querySelectorAll('.chart-container canvas').forEach(canvas => {
    canvas.style.display = 'none';
    canvas.parentElement.insertAdjacentHTML('beforeend', '<div class="loading">Loading...</div>');
  });
  
  try {
    // Fetch data with current filters
    const response = await fetch(`/api/data?${params.toString()}`);
    const data = await response.json();
    
    // Remove loading states
    document.querySelectorAll('.loading').forEach(el => el.remove());
    document.querySelectorAll('.chart-container canvas').forEach(canvas => {
      canvas.style.display = 'block';
    });
    
    // Process data for charts
    const processedData = processData(data);
    
    // Render/update charts
    renderIntensityChart(processedData);
    renderLikelihoodChart(processedData);
    renderRelevanceChart(processedData);
    renderCountryChart(processedData);
    renderRegionChart(processedData);
    renderWordCloud(processedData);
    
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Error loading data. Please check console for details.');
  }
}

function processData(data) {
  // Group data by different dimensions
  const byYear = groupData(data, 'end_year');
  const byCountry = groupData(data, 'country');
  const byRegion = groupData(data, 'region');
  const byTopic = groupData(data, 'topic');
  
  return {
    raw: data,
    byYear,
    byCountry,
    byRegion,
    byTopic
  };
}

function groupData(data, field) {
  const groups = {};
  
  data.forEach(item => {
    const key = item[field] || 'Unknown';
    if (!groups[key]) {
      groups[key] = {
        count: 0,
        totalIntensity: 0,
        totalLikelihood: 0,
        totalRelevance: 0,
        items: []
      };
    }
    
    groups[key].count++;
    groups[key].totalIntensity += item.intensity || 0;
    groups[key].totalLikelihood += item.likelihood || 0;
    groups[key].totalRelevance += item.relevance || 0;
    groups[key].items.push(item);
  });
  
  // Convert to array and calculate averages
  return Object.entries(groups).map(([key, group]) => ({
    key,
    count: group.count,
    avgIntensity: group.totalIntensity / group.count,
    avgLikelihood: group.totalLikelihood / group.count,
    avgRelevance: group.totalRelevance / group.count,
    items: group.items
  })).sort((a, b) => b.count - a.count);
}

// Chart configuration constants
const CHART_COLORS = {
  primary: '#4361ee',
  secondary: '#3f37c9',
  success: '#4cc9f0',
  warning: '#f8961e',
  danger: '#f72585',
  palette: [
    '#4361ee', '#3f37c9', '#4cc9f0', '#4895ef',
    '#7209b7', '#f72585', '#b5179e', '#560bad',
    '#480ca8', '#3a0ca3'
  ]
};

const CHART_FONTS = {
  family: "'Segoe UI', system-ui, -apple-system, sans-serif",
  size: 12,
  titleSize: 14
};

function getGradient(ctx, color, opacity = 1) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  // Convert hex color to rgba format for proper opacity handling
  const rgbaColor = hexToRgba(color, opacity);
  gradient.addColorStop(0, rgbaColor);
  gradient.addColorStop(1, hexToRgba(color, 0)); // Fully transparent at bottom
  return gradient;
}

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


function renderIntensityChart(data) {
  const ctx = document.getElementById('intensityChart').getContext('2d');
  const years = data.byYear.map(d => d.key).sort();
  
  if (charts.intensityChart) {
    charts.intensityChart.destroy();
  }
  
  charts.intensityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Average Intensity',
        data: years.map(year => {
          const yearData = data.byYear.find(d => d.key === year);
          return yearData ? yearData.avgIntensity : 0;
        }),
        borderColor: CHART_COLORS.primary,
        backgroundColor: getGradient(ctx, CHART_COLORS.primary),
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Intensity Trends Over Time' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderLikelihoodChart(data) {
  const ctx = document.getElementById('likelihoodChart').getContext('2d');
  const topCountries = data.byCountry.slice(0, 8);
  
  if (charts.likelihoodChart) charts.likelihoodChart.destroy();
  
  charts.likelihoodChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: topCountries.map(d => d.key),
      datasets: [{
        data: topCountries.map(d => d.avgLikelihood),
        backgroundColor: CHART_COLORS.palette,
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { 
          position: 'right',
          labels: {
            padding: 20,
            font: { family: CHART_FONTS.family },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        title: { 
          display: true, 
          text: 'LIKELIHOOD DISTRIBUTION',
          font: { size: CHART_FONTS.titleSize, weight: 'bold' },
          padding: { bottom: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          bodyFont: { size: CHART_FONTS.size },
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderRelevanceChart(data) {
  const ctx = document.getElementById('relevanceChart').getContext('2d');
  const topTopics = data.byTopic.slice(0, 8);
  
  if (charts.relevanceChart) charts.relevanceChart.destroy();
  
  charts.relevanceChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topTopics.map(d => d.key),
      datasets: [{
        label: 'Average Relevance',
        data: topTopics.map(d => d.avgRelevance),
        backgroundColor: CHART_COLORS.palette.map(color => `${color}cc`),
        borderColor: CHART_COLORS.palette,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: CHART_COLORS.palette
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { 
          display: true, 
          text: 'RELEVANCE BY TOPIC',
          font: { size: CHART_FONTS.titleSize, weight: 'bold' },
          padding: { bottom: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          bodyFont: { size: CHART_FONTS.size },
          padding: 12
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { family: CHART_FONTS.family } }
        },
        x: {
          grid: { display: false },
          ticks: { 
            font: { family: CHART_FONTS.family },
            callback: function(value) {
              return this.getLabelForValue(value).length > 10 
                ? this.getLabelForValue(value).substring(0, 10) + '...' 
                : this.getLabelForValue(value);
            }
          }
        }
      }
    }
  });
}

function renderCountryChart(data) {
  const ctx = document.getElementById('countryChart').getContext('2d');
  const topCountries = data.byCountry.slice(0, 6);
  
  if (charts.countryChart) charts.countryChart.destroy();
  
  charts.countryChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: topCountries.map(d => d.key),
      datasets: [
        {
          label: 'Intensity',
          data: topCountries.map(d => d.avgIntensity),
          backgroundColor: `${CHART_COLORS.primary}33`,
          borderColor: CHART_COLORS.primary,
          borderWidth: 2,
          pointBackgroundColor: CHART_COLORS.primary,
          pointRadius: 4
        },
        {
          label: 'Likelihood',
          data: topCountries.map(d => d.avgLikelihood),
          backgroundColor: `${CHART_COLORS.secondary}33`,
          borderColor: CHART_COLORS.secondary,
          borderWidth: 2,
          pointBackgroundColor: CHART_COLORS.secondary,
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { 
          display: true, 
          text: 'COUNTRY COMPARISON',
          font: { size: CHART_FONTS.titleSize, weight: 'bold' },
          padding: { bottom: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          bodyFont: { size: CHART_FONTS.size },
          padding: 12
        }
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(0,0,0,0.1)' },
          grid: { color: 'rgba(0,0,0,0.05)' },
          pointLabels: { font: { family: CHART_FONTS.family } },
          ticks: { display: false }
        }
      },
      elements: {
        line: { tension: 0.1 }
      }
    }
  });
}

function renderRegionChart(data) {
  const ctx = document.getElementById('regionChart').getContext('2d');
  
  if (charts.regionChart) charts.regionChart.destroy();
  
  charts.regionChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.byRegion.map(d => d.key),
      datasets: [{
        data: data.byRegion.map(d => d.count),
        backgroundColor: CHART_COLORS.palette,
        borderWidth: 0,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'right',
          labels: {
            padding: 20,
            font: { family: CHART_FONTS.family },
            usePointStyle: true
          }
        },
        title: { 
          display: true, 
          text: 'REGION DISTRIBUTION',
          font: { size: CHART_FONTS.titleSize, weight: 'bold' },
          padding: { bottom: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          bodyFont: { size: CHART_FONTS.size },
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderWordCloud(data) {
  const container = document.getElementById('wordcloud');
  container.innerHTML = '';
  
  const topics = data.byTopic.slice(0, 20);
  const maxCount = Math.max(...topics.map(t => t.count));
  
  // Create word cloud elements
  topics.forEach(topic => {
    const size = 12 + (topic.count / maxCount * 36);
    const hue = Math.floor((topics.indexOf(topic) / topics.length) * 360);
    const color = `hsl(${hue}, 70%, 50%)`;
    
    const element = document.createElement('div');
    element.textContent = topic.key;
    element.style.fontSize = `${size}px`;
    element.style.color = color;
    element.style.margin = '0 8px 8px 0';
    element.style.display = 'inline-block';
    element.style.padding = '4px 8px';
    element.style.transition = 'all 0.3s ease';
    element.style.opacity = '0.9';
    
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'scale(1.1)';
      element.style.opacity = '1';
      element.style.textShadow = `0 0 8px ${color}80`;
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
      element.style.opacity = '0.9';
      element.style.textShadow = 'none';
    });
    
    container.appendChild(element);
  });
}