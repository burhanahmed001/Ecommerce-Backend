const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, price, stockQuantity } = req.body;

    if (!name || !description || !category || price === undefined || stockQuantity === undefined) {
      return res.status(400).json({ message: 'All product fields are required' });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    if (Number(stockQuantity) < 0) {
      return res.status(400).json({ message: 'Stock quantity cannot be negative' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a product image' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ecommerce_products',
    });

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: Number(price),
      stockQuantity: Number(stockQuantity),
      imageUrl: result.secure_url,
      cloudinaryId: result.public_id,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, description, category, price, stockQuantity } = req.body;

    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    if (stockQuantity !== undefined && Number(stockQuantity) < 0) {
      return res.status(400).json({ message: 'Stock quantity cannot be negative' });
    }

    let imageUrl = product.imageUrl;
    let cloudinaryId = product.cloudinaryId;

    if (req.file) {
      if (product.cloudinaryId) {
        await cloudinary.uploader.destroy(product.cloudinaryId);
      }
      
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'ecommerce_products',
      });
      imageUrl = result.secure_url;
      cloudinaryId = result.public_id;
    }

    product.name = name ? name.trim() : product.name;
    product.description = description ? description.trim() : product.description;
    product.category = category ? category.trim() : product.category;
    product.price = price !== undefined ? Number(price) : product.price;
    product.stockQuantity = stockQuantity !== undefined ? Number(stockQuantity) : product.stockQuantity;
    product.imageUrl = imageUrl;
    product.cloudinaryId = cloudinaryId;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.cloudinaryId) {
      await cloudinary.uploader.destroy(product.cloudinaryId);
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};