const express = require("express");
const Stripe = require("stripe");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items in cart" });
    }

    // ✅ CORRECT URL FORMAT WITH https://
    const success_url = `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map(item => ({
        price_data: {
          currency: "pkr",
          product_data: { 
            name: item.title,
            description: `Quantity: ${item.qty}`
          },
          unit_amount: item.price, // Price in paisa
        },
        quantity: item.qty,
      })),
      success_url: success_url,
      cancel_url: cancel_url,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Session details route
router.get("/session/:sessionId", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json(session);
  } catch (error) {
    console.error("Error retrieving session:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;