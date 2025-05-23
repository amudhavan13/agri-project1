import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    await connectDB();
    const { orderId } = params;
    const { type, reason } = await request.json();

    console.log('Processing return request:', { orderId, type, reason });

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      console.log('Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      console.log('Order not delivered:', order.status);
      return NextResponse.json(
        { error: 'Only delivered orders can be returned or replaced' },
        { status: 400 }
      );
    }

    // Check if there's already a return request
    if (order.returnRequest) {
      console.log('Return request already exists:', order.returnRequest);
      return NextResponse.json(
        { error: 'A return/replacement request already exists for this order' },
        { status: 400 }
      );
    }

    // Check time limits
    const deliveryDate = new Date(order.deliveryDate);
    const now = new Date();
    const daysSinceDelivery = (now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);

    if (type === 'return' && daysSinceDelivery > 14) {
      console.log('Return time limit exceeded:', daysSinceDelivery);
      return NextResponse.json(
        { error: 'Return requests must be made within 14 days of delivery' },
        { status: 400 }
      );
    }

    if (type === 'replacement' && daysSinceDelivery > 30) {
      console.log('Replacement time limit exceeded:', daysSinceDelivery);
      return NextResponse.json(
        { error: 'Replacement requests must be made within 30 days of delivery' },
        { status: 400 }
      );
    }

    // Create return request
    order.returnRequest = {
      type,
      reason,
      status: 'pending',
      requestDate: new Date()
    };

    await order.save();
    console.log('Return request created:', order.returnRequest);

    return NextResponse.json({
      message: `${type === 'return' ? 'Return' : 'Replacement'} request submitted successfully`
    });
  } catch (error) {
    console.error('Error processing return/replacement request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Endpoint for admin to handle return/replacement requests
export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    console.log('Starting PATCH request for order return');
    await connectDB();
    const { orderId } = params;
    const body = await request.json();
    const { status, adminResponse, pickedDate } = body;

    console.log('Request details:', {
      orderId,
      body,
      status,
      adminResponse,
      pickedDate
    });

    if (!orderId) {
      console.error('No orderId provided');
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      console.error('No status provided');
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    console.log('Found order:', order);

    if (!order) {
      console.error('Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.returnRequest) {
      console.error('No return request found for order:', orderId);
      return NextResponse.json(
        { error: 'No return request found for this order' },
        { status: 404 }
      );
    }

    // Update return request status
    order.returnRequest.status = status;

    // Handle different status updates
    switch (status) {
      case 'approved':
        order.returnRequest.adminResponse = adminResponse || 'Request approved';
        order.status = `${order.returnRequest.type}_approved`;
        break;
      
      case 'picked':
        order.returnRequest.pickedDate = pickedDate || new Date();
        order.status = `${order.returnRequest.type}_in_progress`;
        break;
      
      case 'completed':
        order.status = order.returnRequest.type === 'return' ? 'returned' : 'replaced';
        if (order.returnRequest.type === 'return') {
          order.paymentStatus = 'refunded';
        }
        break;
      
      case 'rejected':
        order.returnRequest.adminResponse = adminResponse || 'Request rejected';
        order.status = 'delivered';
        break;

      default:
        console.error('Invalid status provided:', status);
        return NextResponse.json(
          { error: 'Invalid status provided' },
          { status: 400 }
        );
    }

    console.log('Saving updated order:', {
      returnRequestStatus: order.returnRequest.status,
      orderStatus: order.status
    });

    await order.save();
    console.log('Order saved successfully');

    return NextResponse.json({
      message: `Return/replacement request ${status} successfully`,
      order: {
        id: order._id,
        status: order.status,
        returnRequest: {
          status: order.returnRequest.status,
          type: order.returnRequest.type
        }
      }
    });
  } catch (error) {
    console.error('Detailed error in PATCH /api/orders/[orderId]/return:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update request' },
      { status: 500 }
    );
  }
} 