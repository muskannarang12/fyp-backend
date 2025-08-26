const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { sendEmail } = require("../utils/mailer");

// Place order
router.post("/", async (req, res) => {
  try {
    const { email, shipping, paymentMethod, items, pricing } = req.body;

    // Save order to DB
    const newOrder = await Order.create({
      email,
      shipping,
      paymentMethod,
      items,
      pricing,
    });

    // Send email to buyer
    await sendEmail({
      to: email,
      subject: "Order Placed Successfully",
      html: `
        <h2>Thank you for your order, ${shipping.firstName} ${shipping.lastName}!</h2>
        <p>Your order has been placed successfully.</p>
        <p><b>Items:</b></p>
        <ul>
          ${items
            .map(
              (i) =>
                `<li>${i.title} (Qty: ${i.qty}) - Rs.${i.price * i.qty}</li>`
            )
            .join("")}
        </ul>
        <p><b>Total:</b> Rs.${pricing.total}</p>
      `,
    });

    // Send email to each seller
    const sellers = [...new Set(items.map((i) => i.sellerEmail))];
    for (const sellerEmail of sellers) {
      const sellerItems = items.filter((i) => i.sellerEmail === sellerEmail);
      await sendEmail({
        to: sellerEmail,
        subject: "New Order Received",
        html: `
          <h2>You have a new order!</h2>
          <p><b>Buyer:</b> ${shipping.firstName} ${shipping.lastName} (${email})</p>
          <p><b>Shipping Address:</b> ${shipping.address1}, ${shipping.city}, ${shipping.province}, ${shipping.country}</p>
          <p><b>Items:</b></p>
          <ul>
            ${sellerItems
              .map(
                (i) =>
                  `<li>${i.title} (Qty: ${i.qty}) - Rs.${i.price * i.qty}</li>`
              )
              .join("")}
          </ul>
          <p><b>Total for you:</b> Rs.${sellerItems.reduce(
            (sum, i) => sum + i.price * i.qty,
            0
          )}</p>
        `,
      });
    }

    res.json({ success: true, orderId: newOrder._id });
  } catch (error) {
    console.error("❌ Order placement failed:", error);
    res.status(500).json({ success: false, error: "Failed to place order" });
  }
});

module.exports = router;
