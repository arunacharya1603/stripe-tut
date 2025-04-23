require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// Simplified CORS configuration
const corsOptions = {
    origin: true, // Allow all origins (temporarily for testing)
    credentials: true,
    optionsSuccessStatus: 200
};

// Apply CORS middleware first
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle ALL OPTIONS requests

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