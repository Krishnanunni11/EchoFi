let chart;
const chartLabels = [];
const chartData = [];

async function loadData() {
  try {
    const res = await fetch('/data');
    const csv = await res.text();
    const lines = csv.trim().split('\n');
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';

    chartLabels.length = 0;
    chartData.length = 0;

    lines.slice(1).slice(-100).forEach(line => {
      const [time, ssid, rssi, location] = line.split(',');

      
      const timeLabel = time;

      chartLabels.push(timeLabel);
      chartData.push(parseInt(rssi));

      const row = document.createElement('tr');
      row.innerHTML = `<td>${timeLabel}</td><td>${ssid}</td><td>${rssi}</td><td>${location}</td>`;
      tableBody.appendChild(row);
    });

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById('rssiChart'), {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'RSSI (dBm)',
          data: chartData,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88, 166, 255, 0.1)',
          pointBackgroundColor: '#00ff99',
          pointBorderColor: '#ffffff',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              label: (ctx) => `RSSI: ${ctx.parsed.y} dBm`
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'RSSI (dBm)', color: '#c9d1d9' },
            ticks: { color: '#c9d1d9' }
          },
          x: {
            title: { display: true, text: 'Time', color: '#c9d1d9' },
            ticks: { color: '#c9d1d9' }
          }
        }
      }
    });

  } catch (err) {
    console.error("Error loading data:", err);
  }
}

document.getElementById('toggleTableBtn').addEventListener('click', () => {
  const table = document.getElementById('tableContainer');
  table.classList.toggle('show');
});

loadData();
setInterval(loadData, 10000);

let currentLocation = "Lab1";

document.getElementById('updateLocationBtn').addEventListener('click', async () => {
  const locInput = document.getElementById('locationInput');
  const statusSpan = document.getElementById('locationStatus');
  const newLocation = locInput.value.trim();

  if (newLocation === "") {
    statusSpan.style.color = "red";
    statusSpan.textContent = "Location cannot be empty";
    return;
  }

  try {
    const res = await fetch('/update-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: newLocation }),
    });

    if (res.ok) {
      currentLocation = newLocation;
      statusSpan.style.color = '#00ff99';
      statusSpan.textContent = `Location updated to "${newLocation}"`;
      locInput.value = '';
    } else {
      throw new Error('Failed to update');
    }
  } catch (err) {
    statusSpan.style.color = "red";
    statusSpan.textContent = "Error updating location";
    console.error(err);
  }
});

async function loadCurrentLocation() {
  try {
    const res = await fetch('/current-location');
    const data = await res.text(); 
    document.getElementById('currentLocation').textContent = data;
  } catch (e) {
    document.getElementById('currentLocation').textContent = 'Error loading location';
  }
}
document.getElementById('downloadCsvBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = '/data';
  link.download = 'data.csv';
  link.click();
});


loadCurrentLocation();
setInterval(loadCurrentLocation, 10000);
