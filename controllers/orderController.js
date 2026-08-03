const Order = require('../models/Order');
const Product = require('../models/Product'); 

exports.createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, totalAmount } = req.body;
 
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Your shopping cart is empty' });
    }
 
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping details are required' });
    }

    const { fullName, email, phoneNumber, address, city } = shippingAddress;

    if (!fullName || !email || !phoneNumber || !address || !city) {
      return res.status(400).json({ message: 'Full Name, Email, Phone, Address, and City are required' });
    }

    if (phoneNumber.trim().length < 10) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }

    if (Number(totalAmount) <= 0) {
      return res.status(400).json({ message: 'Invalid total amount' });
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      totalAmount,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.password });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const oldStatus = order.status;
    console.log(`--- ORDER STATUS UPDATE ---`);
    console.log(`Order ID: ${order._id} | Old Status: ${oldStatus} -> New Status: ${status}`);

    if (status === 'Delivered' && oldStatus !== 'Delivered') {
      for (const item of order.orderItems) {
        const prodId = item.product || item.productId || item._id;
        
        if (prodId) {
          const product = await Product.findById(prodId);
          if (product) {
            const currentStock = Number(product.stockQuantity) || 0;
           
            const orderedQty = Number(item.quantity) || 1; 
            
            console.log('Found product: ${product.name} | Current Stock: ${currentStock} | Ordered Qty: ${orderedQty}');
            
            product.stockQuantity = Math.max(0, currentStock - orderedQty);
            await product.save();
            
            console.log(' SUCCESS! New stockQuantity: ${product.stockQuantity}');
          } else {
            console.log("❌ Product database mein nahi mila is ID par:", prodId);
          }
        }
      }
    }

    if (status === 'Cancelled' && oldStatus === 'Delivered') {
      for (const item of order.orderItems) {
        const prodId = item.product || item.productId || item._id;
        if (prodId) {
          const product = await Product.findById(prodId);
          if (product) {
            const currentStock = Number(product.stockQuantity) || 0;
            const orderedQty = Number(item.quantity) || 1;
            
            product.stockQuantity = currentStock + orderedQty;
            await product.save();
            console.log(' Restored stock for ${product.name}, New Stock: ${product.stockQuantity}');
          }
        }
      }
    }

    order.status = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    res.status(500).json({ message: error.message });
  }
};