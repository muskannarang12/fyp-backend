const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require("../middleware/authMiddleware");

// Configure multer for multiple file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/')); // Use absolute path
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|mp4|mov|avi/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image and video files are allowed!'));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper function to construct file URLs
const constructFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

// ===============================================
// Route: Upload Product (with all new fields)
// ===============================================
router.post('/upload', authMiddleware, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    // First find the seller profile
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ 
        success: false,
        error: 'Seller profile not found',
        message: 'Please complete your seller profile before uploading products'
      });
    }

    const { 
      name, price, description, category, dimensions,
      quantity, color, tags, customization, purpose,
      deliveryTime, deliveryMethod, location, productType
    } = req.body;

    // Validate required fields
    if (!name || !price || !description || !category || !dimensions || !quantity || 
        !customization || !purpose || !deliveryTime || !deliveryMethod || !location || !productType) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Validate product type
    if (!['Creative', 'Scrapcraft'].includes(productType)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid product type' 
      });
    }

    // Check if at least one image was uploaded
    if (!req.files['images'] || req.files['images'].length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'At least one product image is required' 
      });
    }

    // Process file URLs
    const images = req.files['images'].map(file => 
      constructFileUrl(req, file.filename)
    );
    const video = req.files['video'] ? 
      constructFileUrl(req, req.files['video'][0].filename) : 
      null;

    // Create new product with seller reference
    const newProduct = new Product({
      name,
      price: parseFloat(price),
      description,
      category,
      dimensions,
      quantity: parseInt(quantity),
      color: color || undefined,
      tags: tags ? JSON.parse(tags) : [],
      customization,
      purpose,
      deliveryTime,
      deliveryMethod,
      location,
      images,
      video,
      productType,
      uploadedBy: seller._id // Reference to Seller document
    });

    await newProduct.save();
    
    // Populate seller username in response
    const populatedProduct = await Product.findById(newProduct._id)
      .populate('uploadedBy', 'username');

    res.status(201).json({ 
      success: true,
      message: 'Product uploaded successfully!',
      product: populatedProduct
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ 
        success: false,
        error: 'File upload error',
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Upload failed',
      message: error.message 
    });
  }
});

// recent product API - FIXED
router.get('/recent', async (req, res) => {
  try {
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 }) // Latest first
      .limit(8) // Last 8 products
      .populate('uploadedBy', 'username profilePicture') // ✅ Seller info - CORRECT FIELD NAME
      .select('name price images category uploadedBy createdAt'); // ✅ Use 'name' instead of 'title'

    res.json(recentProducts);
  } catch (error) {
    console.error('Error fetching recent products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// category wise recent products - FIXED
router.get('/recent/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const recentProducts = await Product.find({ 
      productType: category.charAt(0).toUpperCase() + category.slice(1) // ✅ Correct field filtering
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('uploadedBy', 'username profilePicture') // ✅ Correct field name
      .select('name price images category uploadedBy createdAt'); // ✅ Use 'name' instead of 'title'

    res.json(recentProducts);
  } catch (error) {
    console.error('Error fetching recent products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================================
// Route: Get My Creative Products (Seller's Own)
// ===============================================
router.get('/items/creative', authMiddleware, async (req, res) => {
  try {
    // Find seller profile first
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const myCreativeProducts = await Product.find({
      productType: 'Creative',
      uploadedBy: seller._id
    }).populate({
      path: 'uploadedBy',
      select: 'username',
      model: 'Seller'
    });

    // Ensure image URLs are properly constructed
    const productsWithUrls = myCreativeProducts.map(product => ({
      ...product.toObject(),
      images: product.images.map(image => {
        if (image.startsWith('http')) return image;
        return constructFileUrl(req, image);
      }),
      video: product.video && !product.video.startsWith('http') 
        ? constructFileUrl(req, product.video) 
        : product.video
    }));

    res.status(200).json(productsWithUrls);
  } catch (error) {
    console.error('Error fetching my creative products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ===============================================
// Route: Get My Scrapcraft Products (Seller's Own)
// ===============================================
router.get('/items/scrapcraft', authMiddleware, async (req, res) => {
  try {
    // Find seller profile first
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const myScrapcraftProducts = await Product.find({
      productType: 'Scrapcraft',
      uploadedBy: seller._id
    }).populate({
      path: 'uploadedBy',
      select: 'username',
      model: 'Seller'
    });

    // Ensure image URLs are properly constructed
    const productsWithUrls = myScrapcraftProducts.map(product => ({
      ...product.toObject(),
      images: product.images.map(image => {
        if (image.startsWith('http')) return image;
        return constructFileUrl(req, image);
      }),
      video: product.video && !product.video.startsWith('http') 
        ? constructFileUrl(req, product.video) 
        : product.video
    }));

    res.status(200).json(productsWithUrls);
  } catch (error) {
    console.error('Error fetching my scrapcraft products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ===============================================
// Route: Get Single Product by ID
// ===============================================
router.get('/id/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId)
      .populate('uploadedBy', 'username');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Ensure URLs are properly constructed
    const productWithUrls = {
      ...product.toObject(),
      images: product.images.map(image => {
        if (image.startsWith('http')) return image;
        return constructFileUrl(req, image);
      }),
      video: product.video && !product.video.startsWith('http') 
        ? constructFileUrl(req, product.video) 
        : product.video
    };
    
    res.status(200).json(productWithUrls);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// ===============================================
// Route: Fetch All Products by Category (Public)
// ===============================================
router.get('/:category', async (req, res) => {
  try {
    const category = req.params.category;

    const products = await Product.find({ 
      productType: category.charAt(0).toUpperCase() + category.slice(1)
    }).populate({
      path: 'uploadedBy',
      select: 'username',
    });

    const productsWithUrls = products.map(product => {
      const updatedProduct = product.toObject();

      updatedProduct.images = product.images.map(image =>
        image.startsWith('http') ? image : constructFileUrl(req, image)
      );

      if (product.video && !product.video.startsWith('http')) {
        updatedProduct.video = constructFileUrl(req, product.video);
      }

      return updatedProduct;
    });

    res.json(productsWithUrls);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// ===============================================
// Route: Update Product
// ===============================================
router.put('/:id', authMiddleware, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Find the product first
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if the current user owns this product
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller || !product.uploadedBy.equals(seller._id)) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }
    
    const { 
      name, price, description, category, dimensions,
      quantity, color, tags, customization, purpose,
      deliveryTime, deliveryMethod, location, imagesToDelete
    } = req.body;
    
    // Update product fields
    product.name = name;
    product.price = parseFloat(price);
    product.description = description;
    product.category = category;
    product.dimensions = dimensions;
    product.quantity = parseInt(quantity);
    product.color = color || undefined;
    product.tags = tags ? JSON.parse(tags) : [];
    product.customization = customization;
    product.purpose = purpose;
    product.deliveryTime = deliveryTime;
    product.deliveryMethod = deliveryMethod;
    product.location = location;
    
    // Handle image deletion
    if (imagesToDelete) {
      const imagesToDeleteArray = JSON.parse(imagesToDelete);
      product.images = product.images.filter(image => !imagesToDeleteArray.includes(image));
    }
    
    // Process new images if any
    if (req.files && req.files['images']) {
      const newImages = req.files['images'].map(file => 
        constructFileUrl(req, file.filename)
      );
      product.images = [...product.images, ...newImages];
    }
    
    // Process new video if any
    if (req.files && req.files['video']) {
      product.video = constructFileUrl(req, req.files['video'][0].filename);
    }
    
    await product.save();
    
    // Populate seller info for response
    const updatedProduct = await Product.findById(productId)
      .populate('uploadedBy', 'username');
    
    res.status(200).json({ 
      success: true,
      message: 'Product updated successfully!',
      product: updatedProduct
    });
    
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Update failed',
      message: error.message 
    });
  }
});

// ===============================================
// Route: Delete Product
// ===============================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Find the product first
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if the current user owns this product
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller || !product.uploadedBy.equals(seller._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }
    
    // Delete the product
    await Product.findByIdAndDelete(productId);
    
    res.status(200).json({ 
      success: true,
      message: 'Product deleted successfully!'
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Delete failed',
      message: error.message 
    });
  }
});



module.exports = router;