const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));


app.listen(5001, () => {
  console.log('Server running on port 5001');
});
