import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Get start and end date for the selected month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    console.log('Query parameters:', { month, year });
    console.log('Date range:', { startDate, endDate });

    // Get only delivered orders for the selected month with populated product details
    const orders = await Order.find({
      status: 'delivered',
      orderDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate({
      path: 'products.productId',
      select: 'name price category'
    });

    console.log('Found orders:', orders.length);
    console.log('Sample order:', orders[0]);

    // Calculate statistics
    const statistics = {
      totalDeliveredOrders: orders.length,
      totalRevenue: 0,
      monthlySales: {}
    };

    // Process each order
    orders.forEach(order => {
      order.products.forEach(item => {
        if (item.productId) {
          const productName = item.name || item.productId.name;
          const price = item.price || item.productId.price;

          if (!statistics.monthlySales[productName]) {
            statistics.monthlySales[productName] = {
              quantity: 0,
              revenue: 0
            };
          }

          statistics.monthlySales[productName].quantity += item.quantity;
          statistics.monthlySales[productName].revenue += item.quantity * price;
          statistics.totalRevenue += item.quantity * price;
        }
      });
    });

    // Convert monthlySales to array format for the chart
    const salesData = Object.entries(statistics.monthlySales).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      revenue: data.revenue
    })).sort((a, b) => b.quantity - a.quantity);

    console.log('Processed sales data:', salesData);

    const response = {
      ...statistics,
      monthlySales: salesData
    };

    console.log('Final response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 