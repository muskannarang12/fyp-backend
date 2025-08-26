const express = require("express");
const fetch = require("node-fetch"); // 👈 yahi use karna
const router = express.Router();

router.get("/images", async (req, res) => {
  const { query } = req.query;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=6`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    const data = await response.json();
    console.log("Unsplash API raw response:", data);

    const images = data.results?.map(img => img.urls.small) || [];
    res.json({ images });
  } catch (error) {
    console.error("Unsplash API error:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

module.exports = router;
