// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const reportRoute = require('./routes/reportRoute');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/report', reportRoute);

app.get('/', (req, res) => {
  res.send('Inventory Report API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
