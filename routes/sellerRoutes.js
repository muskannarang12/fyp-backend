const express = require('express');
const router = express.Router();
const { createSellerProfile } = require('../authControllers/sellerController');
const upload = require('../middleware/multerConfig'); // handles multer storage
const { authMiddleware } = require('../middleware/authMiddleware');
const Seller = require('../models/Seller');

// Route: Create Seller Profile
router.post(
  '/create',
  authMiddleware,
  upload.fields([{ name: 'profilePicture', maxCount: 1 }]),
  createSellerProfile
);

// Route: Get Seller Profile
// Route: Get Seller Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findOne({ accountEmail: req.user.email }).select(
      '-__v -createdAt -updatedAt'
    );

    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    // ✅ FIX: Convert to object and add full URL if needed
    const sellerData = seller.toObject();
    
    // Ensure sellerType is array
    if (sellerData.sellerType && !Array.isArray(sellerData.sellerType)) {
      sellerData.sellerType = [sellerData.sellerType];
    }
    
    // ✅ FIX: Add full URL to profile picture
    if (sellerData.profilePicture && !sellerData.profilePicture.startsWith('http')) {
      sellerData.profilePicture = `http://localhost:5000${sellerData.profilePicture}`;
    }

    res.json(sellerData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});// Route: Get Seller Profile by Username (Public)
// Route: Get Seller Profile by Username (Public)

// Update the profile-check endpoint
router.get('/profile-check', authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findOne({ accountEmail: req.user.email });
    res.status(200).json({ exists: !!seller });
  } catch (error) {
    res.status(500).json({ message: 'Error checking profile' });
  }
});
router.get('/profile/username/:username', async (req, res) => {
  const { username } = req.params;
  const seller = await Seller.findOne({ username }).select(
    '-__v -createdAt -updatedAt -accountEmail -phone'
  );
  if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
   const sellerData = seller.toObject();
  
  if (sellerData.profilePicture && !sellerData.profilePicture.startsWith('http')) {
    sellerData.profilePicture = `http://localhost:5000${sellerData.profilePicture}`;
  }

  res.json(sellerData);
});

// sellerRoutes.js - Add this route
// In sellerRoutes.js
router.put('/update', authMiddleware, upload.fields([{ name: 'profilePicture', maxCount: 1 }]), async (req, res) => {
  try {
    console.log('Update request received:', req.body);
    console.log('Files received:', req.files);

    const updates = req.body;
    
    // Handle file upload if present
    if (req.files?.profilePicture) {
      updates.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
      console.log('Profile picture path:', updates.profilePicture); 
    }

    // Handle FAQs if sent as string
    if (typeof updates.faqs === 'string') {
      try {
        updates.faqs = JSON.parse(updates.faqs);
      } catch (e) {
        console.error('Error parsing FAQs:', e);
        return res.status(400).json({ message: 'Invalid FAQs format' });
      }
    }

    const seller = await Seller.findOneAndUpdate(
      { accountEmail: req.user.email },
      updates,
      { 
        new: true,
        runValidators: true 
      }
    ).select('-__v -createdAt -updatedAt');

    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    // ✅ FIX: Make sure the profilePicture URL is complete with full URL
    if (seller.profilePicture && !seller.profilePicture.startsWith('http')) {
      seller.profilePicture = `http://localhost:5000${seller.profilePicture}`;
      console.log('Final profile picture URL:', seller.profilePicture);
    }

    console.log('Profile updated successfully:', seller);
    res.json(seller);
  } catch (err) {
    console.error('Update error:', err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: err.errors 
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate key error',
        field: Object.keys(err.keyPattern)[0]
      });
    }

    res.status(500).json({ 
      message: 'Server error during update',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // full URL add kar do
    const sellerData = seller.toObject();
    if (seller.profilePicture) {
      sellerData.profilePicture = `http://localhost:5000/uploads/${seller.profilePicture}`;
    }

    res.json(sellerData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add this to your sellerRoutes.js for testing
router.post('/test-upload', upload.single('profilePicture'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  res.json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

router.put('/test-update', authMiddleware, (req, res) => {
  console.log('Test update received:', req.body);
  res.json({ success: true, message: 'Test successful' });
});


module.exports = router;
