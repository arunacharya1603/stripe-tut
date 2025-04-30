require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// Explicit CORS configuration for Vercel
const allowedOrigins = [
  'https://stripe-tut-frontend.vercel.app',
  'http://localhost:3000',  // For local development
  // Add any other origins you need
];

// Configure CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Ensure OPTIONS requests work properly (preflight)
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(200).end();
});

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Server is healthy');
});

// Checkout API endpoint
app.post("/api/create-checkout-session", async(req, res) => {
    try {
        const {products} = req.body;

        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: "Invalid products data" });
        }

        const lineItems = products.map((product) => ({
            price_data: {
                currency: "inr",
                product_data: {
                    name: product.dish,
                    images: [product.imgdata]
                },
                unit_amount: product.price * 100,
            },
            quantity: product.qnty
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: "https://stripe-tut-frontend.vercel.app/success",
            cancel_url: "https://stripe-tut-frontend.vercel.app/cancel",
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error("Checkout session error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});