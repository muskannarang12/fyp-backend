const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  
  // Category and Classification
  category: { 
    type: String, 
    required: true,
    enum: ['Metal', 'Plastic', 'Fabric', 'Paper', 'Wood', 'Glass', 'Ceramic', 'Other']
  },
  productType: { 
    type: String, 
    required: true,
    enum: ['Creative', 'Scrapcraft'],
    default: 'Creative'
  },
  
  // Physical Attributes
  dimensions: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  color: { type: String },
  
  // Tags and Customization
  tags: { type: [String], default: [] },
  customization: { 
    type: String, 
    required: true,
    enum: ['yes', 'no'],
    default: 'no'
  },
  
  // Product Purpose
  purpose: {
    type: String,
    required: true,
    enum: ['for-sale', 'showcase'],
    default: 'for-sale'
  },
  
  // Delivery Information
  deliveryTime: { type: String, required: true },
  deliveryMethod: {
    type: String,
    required: true,
    enum: ['Standard Shipping', 'Express Delivery', 'Local Pickup', 'Custom Arrangement']
  },
  location: { type: String, required: true },
  
  // Media
  images: { type: [String], required: true },
  video: { type: String },
  
  // Seller Information - Now references Seller model
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Seller',
    required: true
  },
  
  // Timestamps
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);