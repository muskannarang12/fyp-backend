// // controllers/productController.js

// const Creative = require('../models/creativeModel');

// // 👇 Controller function
// const getMyCreativeProducts = async (req, res) => {
//   try {
//     // Sirf wahi products dhoondho jinke creator ka ID == logged in user ka ID
//     const products = await Creative.find({ user: req.user._id });

//     res.status(200).json(products);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to fetch your creative products' });
//   }
// };

// module.exports = { 
//   getMyCreativeProducts,
//   // baki ke controllers (jaise getAllCreativeProducts) yahan rahenge
// };
