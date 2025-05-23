import mongoose from 'mongoose';

const returnRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['return', 'replacement'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'picked', 'completed'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  adminResponse: {
    type: String
  },
  pickedDate: {
    type: Date
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
  },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: [
      'pending',
      'processing',
      'delivered',
      'cancelled',
      'returned',
      'replaced',
      'return_approved',
      'replacement_approved',
      'return_in_progress',
      'replacement_in_progress',
      'return_pending',
      'replacement_pending'
    ],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  deliveryDate: {
    type: Date
  },
  returnRequest: returnRequestSchema
});

// Delete the existing model to force schema update
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order = mongoose.model('Order', orderSchema);

export default Order; 