const multer = require('multer');
const path = require('path');
const Seller = require('../models/Seller');
const User = require('../models/User');

const createSellerProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { _id: userId, email } = req.user;

    const existingSeller = await Seller.findOne({
      $or: [{ userId }, { accountEmail: email }],
    });

    if (existingSeller) {
      return res.status(400).json({
        message: existingSeller.userId.equals(userId)
          ? 'You already have a seller profile.'
          : 'This email is already associated with another seller account.',
      });
    }

    const requiredFields = ['username', 'fullName', 'phone', 'sellerType'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    let profilePictureUrl = '';
    if (req.files && req.files.profilePicture && req.files.profilePicture[0]) {
      profilePictureUrl = `/uploads/${req.files.profilePicture[0].filename}`;
    }

    const newSeller = new Seller({
      userId,
      accountEmail: email,
      username: req.body.username,
      fullName: req.body.fullName,
      contactEmail: req.body.contactEmail || email,
      phone: req.body.phone,
      sellerType: req.body.sellerType,
      address: req.body.address || '',
      city: req.body.city || '',
      country: req.body.country || '',
      bio: req.body.bio || '',
      facebook: req.body.facebook || '',
      instagram: req.body.instagram || '',
      linkedin: req.body.linkedin || '',
      profilePicture: profilePictureUrl,
      faqs: req.body.faqs || [],
    });

    await newSeller.save();
    await User.findByIdAndUpdate(userId, { role: 'seller' });

    // ✅ FIX: Add full URL to profile picture before sending response
    let finalProfilePicture = newSeller.profilePicture;
    if (finalProfilePicture && !finalProfilePicture.startsWith('http')) {
      finalProfilePicture = `http://localhost:5000${finalProfilePicture}`;
    }

    return res.status(201).json({
      success: true,
      message: 'Seller profile created successfully!',
      seller: {
        id: newSeller._id,
        username: newSeller.username,
        email: newSeller.accountEmail,
        profilePicture: finalProfilePicture, // ✅ Now with full URL
      },
    });
  } catch (error) {
    console.error('Error creating seller profile:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message:
          field === 'username'
            ? 'Username already taken'
            : 'Email already associated with another account',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = { createSellerProfile };