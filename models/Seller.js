const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  accountEmail: {
    type: String, 
    required: true, 
    unique: true 
  },
  username: { 
    type: String, 
    required: true,
    unique: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  contactEmail: { 
    type: String, 
    required: true 
  },
  phone: { type: String, required: true },
  sellerType: { 
    type: [String],  // Changed from String to [String]
    required: true,
    enum: ['Creative', 'ScrapCraft'], // Optional: limits allowed values
    default: [] 
  },
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  profilePicture: { type: String }, 
  bio: { type: String, required: true },
  facebook: { type: String },
  instagram: { type: String },
  linkedin: { type: String },
  faqs: { type: [Object], default: [] },
}, { 
  timestamps: true,
  autoIndex: false
});

// Indexes remain the same
sellerSchema.index({ userId: 1 }, { unique: true });
sellerSchema.index({ accountEmail: 1 }, { unique: true });
sellerSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('Seller', sellerSchema);