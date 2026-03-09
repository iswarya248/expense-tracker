import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat');

const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const Expense = require('./models/Expense');

const app = express();
const Tesseract = require("tesseract.js");
const multer = require("multer");
const cors = require("cors");

app.use(cors({
  origin: [
    "https://expense-tracker-sigma-beige.vercel.app",
    "https://expense-tracker-izqtltpuq-iswarya248s-projects.vercel.app"
  ],
  credentials: true
}));

// configure image upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });


/* ---------------- Security Middleware ---------------- */

app.use(helmet());

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

/* ---------------- Rate Limiting ---------------- */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many chat requests' }
});

app.use('/api/', limiter);
app.use('/api/chat', chatLimiter);

/* ---------------- General Middleware ---------------- */

app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

/* ---------------- API Routes ---------------- */

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

/* ---------------- Export CSV ---------------- */
// OCR receipt scanner
app.post("/api/receipt-scan", upload.single("receipt"), async (req, res) => {

  try {

    const result = await Tesseract.recognize(
      req.file.path,
      "eng"
    );

    const text = result.data.text;

    // simple extraction
    const amountMatch = text.match(/\$?\d+(\.\d{2})?/);
    const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);

    const extractedData = {
      merchant: text.split("\n")[0],
      amount: amountMatch ? amountMatch[0] : null,
      date: dateMatch ? dateMatch[0] : null,
      raw_text: text
    };

    res.json(extractedData);

  } catch (error) {
    res.status(500).json({ error: "OCR failed" });
  }

});

app.get('/api/export/csv', async (req, res) => {
  try {

    const expenses = await Expense.find();

    const fields = [
      'merchant',
      'description',
      'amount',
      'category',
      'payment_method',
      'date'
    ];

    const parser = new Parser({ fields });

    const csv = parser.parse(expenses);

    res.header('Content-Type', 'text/csv');
    res.attachment('expenses.csv');
    res.send(csv);

  } catch (error) {
    res.status(500).json({ error: 'CSV export failed' });
  }
});

/* ---------------- Export PDF ---------------- */

app.get('/api/export/pdf', async (req, res) => {
  try {

    const expenses = await Expense.find().lean();

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.pdf');

    doc.pipe(res);

    doc.fontSize(22).text('Expense Report', { align: 'center' });

    doc.moveDown();

    expenses.forEach(exp => {

      doc.fontSize(12).text(`Merchant: ${exp.merchant || 'N/A'}`);
      doc.text(`Description: ${exp.description || 'N/A'}`);
      doc.text(`Amount: $${exp.amount}`);
      doc.text(`Category: ${exp.category}`);
      doc.text(`Payment Method: ${exp.payment_method || 'N/A'}`);
      doc.text(`Date: ${new Date(exp.date).toDateString()}`);

      doc.moveDown();

    });

    doc.end();

  } catch (error) {
    res.status(500).json({ error: 'PDF export failed' });
  }
});

/* ---------------- Health Route ---------------- */

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date()
  });
});

/* ---------------- Root Route ---------------- */

app.get('/', (req, res) => {
  res.send('🚀 Expense Tracker API is running');
});

app.get('/favicon.ico', (req, res) => res.status(204));

/* ---------------- Error Handler ---------------- */

app.use((err, req, res, next) => {

  console.error(err.stack);

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
  });

});

/* ---------------- Database + Server ---------------- */

const PORT = process.env.PORT || 5000;
const API_URL = "https://expense-tracker-ai-l9b7.onrender.com/api";

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {

    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  })
  .catch((err) => {

    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);

  });