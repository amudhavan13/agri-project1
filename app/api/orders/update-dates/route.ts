import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { orderId } = await request.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Set current date as order date
    order.orderDate = new Date();
    
    // If order is delivered and doesn't have delivery date, set it
    if (order.status === 'delivered' && !order.deliveryDate) {
      order.deliveryDate = new Date();
    }

    await order.save();

    return NextResponse.json({ 
      message: 'Order dates updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order dates:', error);
    return NextResponse.json(
      { error: 'Failed to update order dates' },
      { status: 500 }
    );
  }
} 