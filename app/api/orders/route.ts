import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

export async function GET(request: Request) {
  try {
    await connectDB();
    console.log('Fetching orders from database...');

    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const returnRequestsOnly = searchParams.get('returnRequests') === 'true';

    let query = {};
    
    if (returnRequestsOnly) {
      // Fetch only orders with pending return/replacement requests
      query = {
        'returnRequest.status': 'pending',
        status: 'delivered'
      };
    }

    console.log('Query:', query);
    
    const orders = await Order.find(query)
      .populate('products.productId')
      .sort({ orderDate: -1 })
      .lean();
    
    console.log(`Found ${orders.length} orders`);
    const ordersWithReturns = orders.filter(order => order.returnRequest);
    console.log('Orders with return requests:', ordersWithReturns);
    
    return NextResponse.json(returnRequestsOnly ? ordersWithReturns : orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const orderData = await request.json();
    
    const order = await Order.create(orderData);
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 