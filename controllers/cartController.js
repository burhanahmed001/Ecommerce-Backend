const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;
    const qtyToAdd = quantity || 1;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // stockQuantity check karein
    const currentStock = product.stockQuantity !== undefined ? product.stockQuantity : 0;

    if (currentStock < qtyToAdd) {
      return res.status(400).json({ message: 'Not enough stock available!' });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        cartItems: [{ product: productId, quantity: qtyToAdd }],
      });
    } else {
      const itemIndex = cart.cartItems.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.cartItems[itemIndex].quantity += qtyToAdd;
      } else {
        cart.cartItems.push({ product: productId, quantity: qtyToAdd });
      }

      await cart.save();
    }

    // stockQuantity mein se minus karke save karein
    product.stockQuantity -= qtyToAdd;
    await product.save();

    const updatedCart = await Cart.findOne({ user: userId }).populate('cartItems.product');
    res.status(200).json({ message: 'Item added to cart', cart: updatedCart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('cartItems.product');

    if (!cart) {
      return res.status(200).json({ cartItems: [] });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      const itemToRemove = cart.cartItems.find(
        (item) => item.product.toString() === productId
      );

      if (itemToRemove) {
        const restoredQuantity = itemToRemove.quantity;

        // Product ka stockQuantity wapas plus kar dein
        const product = await Product.findById(productId);
        if (product) {
          product.stockQuantity += restoredQuantity;
          await product.save();
        }
      }

      cart.cartItems = cart.cartItems.filter(
        (item) => item.product.toString() !== productId
      );
      await cart.save();
      
      const updatedCart = await Cart.findOne({ user: userId }).populate('cartItems.product');
      return res.status(200).json({ message: 'Item removed and stock restored', cart: updatedCart });
    }

    res.status(404).json({ message: 'Cart not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    await Cart.findOneAndDelete({ user: userId });
    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};