require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const requestsRoutes = require('./routes/requests');
const listingsRoutes = require('./routes/listings');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'سرور فعاله ✅' }));

app.use('/auth', authRoutes);
app.use('/requests', requestsRoutes);
app.use('/listings', listingsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`سرور روی پورت ${PORT} اجرا شد`));
