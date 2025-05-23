"use client"

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

interface OrderProduct {
  productId: string
  name: string
  price: number
  quantity: number
}

interface ReturnRequest {
  type: 'return' | 'replacement'
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'picked' | 'completed'
  requestDate: string
  adminResponse?: string
  pickedDate?: string
  _id?: string
}

interface Order {
  _id: string
  user: {
    name: string
    email: string
    address: string
  }
  products: OrderProduct[]
  totalAmount: number
  status: string
  orderDate: string
  returnRequest?: ReturnRequest
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const data = await response.json()
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      // Refresh orders after update
      fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status')
    }
  }

  const handleAcceptRequest = async (orderId: string) => {
    try {
      console.log('Starting accept request for order:', orderId);
      const response = await fetch(`/api/orders/${orderId}/return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          adminResponse: 'Request approved',
        }),
      });

      const data = await response.json();
      console.log('Response from server:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept request');
      }

      toast.success(data.message || 'Request accepted successfully');
      fetchOrders();
    } catch (err) {
      console.error('Detailed error in handleAcceptRequest:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to accept request');
    }
  };

  const handlePickedRequest = async (orderId: string) => {
    try {
      console.log('Marking request as picked for order:', orderId);
      const response = await fetch(`/api/orders/${orderId}/return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'picked',
          pickedDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as picked');
      }

      toast.success('Request marked as picked successfully');
      fetchOrders();
    } catch (err) {
      console.error('Error marking request as picked:', err);
      toast.error('Failed to mark as picked');
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading orders...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Order Management</h2>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Return/Replacement</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id}>
              <TableCell className="font-mono">{order._id}</TableCell>
              <TableCell>
                <div>{order.user.name}</div>
                <div className="text-sm text-gray-500">{order.user.email}</div>
                <div className="text-sm text-gray-500">{order.user.address}</div>
              </TableCell>
              <TableCell>
                {order.products.map((product, index) => (
                  <div key={index} className="mb-1">
                    {product.quantity}x {product.name}
                  </div>
                ))}
              </TableCell>
              <TableCell>₹{order.totalAmount}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  order.status.includes('return') || order.status.includes('replacement') ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status}
                </span>
              </TableCell>
              <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
              <TableCell>
                {order.returnRequest && (
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className={`font-medium ${
                        order.returnRequest.type === 'return' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {order.returnRequest.type.charAt(0).toUpperCase() + order.returnRequest.type.slice(1)}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        order.returnRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.returnRequest.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        order.returnRequest.status === 'picked' ? 'bg-green-100 text-green-800' :
                        order.returnRequest.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.returnRequest.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Reason: {order.returnRequest.reason}
                    </div>
                    {order.returnRequest.adminResponse && (
                      <div className="text-sm text-gray-500">
                        Response: {order.returnRequest.adminResponse}
                      </div>
                    )}
                    {order.returnRequest.pickedDate && (
                      <div className="text-sm text-gray-500">
                        Picked: {new Date(order.returnRequest.pickedDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateOrderStatus(order._id, 'processing')}
                    >
                      Mark Processing
                    </Button>
                  )}
                  {order.status === 'processing' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateOrderStatus(order._id, 'delivered')}
                    >
                      Mark Delivered
                    </Button>
                  )}
                  {order.status === 'delivered' && order.returnRequest?.status === 'pending' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAcceptRequest(order._id)}
                    >
                      Accept {order.returnRequest.type}
                    </Button>
                  )}
                  {order.returnRequest?.status === 'approved' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handlePickedRequest(order._id)}
                    >
                      Mark as Picked
                    </Button>
                  )}
                  {order.returnRequest?.status === 'picked' && (
                    <div className="text-sm text-green-600 font-medium text-center">
                      Picked on {new Date(order.returnRequest.pickedDate!).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
