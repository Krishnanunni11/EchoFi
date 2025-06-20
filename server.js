const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

const csvFile = path.join(__dirname, 'data.csv');

if (!fs.existsSync(csvFile)) {
  fs.writeFileSync(csvFile, 'timestamp,ssid,rssi,location\n');
}


app.post('/log', (req, res) => {
  const { ssid, rssi, location } = req.body;
  const now = new Date();
  const timestamp = now.toTimeString().split(' ')[0]; 


  const row = `${timestamp},${ssid},${rssi},${location}\n`;
  fs.appendFile(csvFile, row, (err) => {
    if (err) return res.status(500).send('Error writing to file');
    res.send('Logged successfully');
  });
});


app.get('/data', (req, res) => {
  fs.readFile(csvFile, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading file');
    res.send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
let currentLocation = "Lab1";  


app.post('/log', (req, res) => {
  let { ssid, rssi, location } = req.body;
  if (!location) location = currentLocation;

  const timestamp = new Date().toISOString();
  const row = `${timestamp},${ssid},${rssi},${location}\n`;

  fs.appendFile(csvFile, row, (err) => {
    if (err) return res.status(500).send('Error writing to file');
    res.send('Logged successfully');
  });
});


app.post('/update-location', (req, res) => {
  const { location } = req.body;
  if (!location || typeof location !== 'string' || location.trim() === '') {
    return res.status(400).send('Invalid location');
  }
  currentLocation = location.trim();
  res.send(`Location updated to ${currentLocation}`);
});
app.get('/current-location', (req, res) => {
  res.send(currentLocation);
});
