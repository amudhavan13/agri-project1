import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    await connectDB();
    const { orderId } = params;
    const { status } = await request.json();

    // If status is being set to delivered, add delivery date
    const updateData = {
      status,
      ...(status === 'delivered' ? { deliveryDate: new Date() } : {})
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate('products.productId');

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    await connectDB();
    const { orderId } = params;

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order status is pending
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending orders can be cancelled' },
        { status: 400 }
      );
    }

    // Check if order is within 24 hours
    const orderDate = new Date(order.orderDate);
    const now = new Date();
    const hoursDifference = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);

    if (hoursDifference > 24) {
      return NextResponse.json(
        { error: 'Orders can only be cancelled within 24 hours of placing' },
        { status: 400 }
      );
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    await order.save();

    return NextResponse.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
} 