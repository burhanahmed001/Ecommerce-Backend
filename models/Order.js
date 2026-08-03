const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String },
      orderNotes: { type: String },
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Cash on Delivery',
      enum: ['Cash on Delivery', 'Online Payment', 'Stripe', 'JazzCash', 'EasyPaisa'],
    },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);