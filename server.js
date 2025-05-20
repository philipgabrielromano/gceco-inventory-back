const express = require('express');
const cors = require('cors');
const reportRoute = require('./routes/reportRoute');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Enable CORS for your frontend domain
app.use(cors({
  origin: 'https://gceco-inventory-front.onrender.com'
}));

app.use(express.json());
app.use('/api/report', reportRoute);

app.get('/', (req, res) => {
  res.send('Inventory Report API is running');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
