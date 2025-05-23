import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

export async function POST(request: Request) {
  try {
    await connectDB();
    console.log('Connected to MongoDB successfully');

    const productData = await request.json();
    console.log('Received product data:', productData);

    // Create new product in MongoDB
    const product = await Product.create(productData);
    console.log('Product created successfully:', product);

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    console.log('Connected to MongoDB successfully');

    const products = await Product.find({}).lean();
    console.log(`Found ${products.length} products`);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    console.log('Connected to MongoDB successfully');

    const productData = await request.json();
    const { _id, ...updateData } = productData;

    if (!_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('Product updated successfully:', updatedProduct);
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
} 