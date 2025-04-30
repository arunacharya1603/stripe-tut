// app.js
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// CRITICAL: Handle OPTIONS requests directly with Express
// This must be before any other middleware
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://stripe-tut-frontend.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).send();
});

// Basic CORS for non-OPTIONS requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://stripe-tut-frontend.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
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