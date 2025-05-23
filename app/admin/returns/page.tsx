"use client"

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"

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
    phone: string
  }
  products: OrderProduct[]
  totalAmount: number
  status: string
  orderDate: string
  deliveryDate?: string
  returnRequest?: ReturnRequest
}

export default function AdminReturnsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching return requests...');
      
      const response = await fetch('/api/orders?returnRequests=true')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const orders = await response.json()
      console.log('Fetched orders with returns:', orders);
      setOrders(orders)
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleReturnRequest = async (orderId: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'rejected' && !adminResponse.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }

      console.log('Updating request:', { orderId, status, adminResponse });

      const response = await fetch(`/api/orders/${orderId}/return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminResponse: adminResponse.trim() || 'Request approved',
        }),
      });

      const data = await response.json();
      console.log('Update response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update request');
      }

      toast.success(data.message);
      setAdminResponse('');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      console.error('Error updating request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update request');
    }
  }

  const handleAcceptRequest = async (orderId: string) => {
    try {
      console.log('Accepting request for order:', orderId);
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

      if (!response.ok) {
        throw new Error('Failed to accept request');
      }

      toast.success('Request accepted successfully');
      fetchOrders();
    } catch (err) {
      console.error('Error accepting request:', err);
      toast.error('Failed to accept request');
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
    return <div className="text-center p-4">Loading return requests...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Return & Replacement Requests</h1>
        <Card className="p-8 text-center text-gray-500">
          No pending return/replacement requests.
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Return & Replacement Requests</h1>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Request Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell className="font-mono">{order._id}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{order.user.name}</div>
                    <div className="text-sm text-gray-500">{order.user.email}</div>
                    <div className="text-sm text-gray-500">{order.user.phone}</div>
                    <div className="text-sm text-gray-500">{order.user.address}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.products.map((product, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span>{product.quantity}x</span>
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-gray-500">₹{product.price}</span>
                      </div>
                    ))}
                    <div className="text-sm font-medium text-gray-500">
                      Total: ₹{order.totalAmount}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    order.returnRequest?.type === 'return' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.returnRequest?.type}
                  </span>
                </TableCell>
                <TableCell>
                  <p className="whitespace-pre-wrap">{order.returnRequest?.reason}</p>
                </TableCell>
                <TableCell>
                  {order.returnRequest?.requestDate && 
                    new Date(order.returnRequest.requestDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {order.returnRequest?.status === 'pending' && (
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        console.log('Selected order for review:', order);
                        setSelectedOrder(order);
                        setAdminResponse('');
                      }}
                    >
                      Review Details
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review {selectedOrder?.returnRequest?.type} Request</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?._id} - {selectedOrder?.user.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Customer's Reason:</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                {selectedOrder?.returnRequest?.reason}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Your Response:</h3>
              <Textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder={`Provide a response ${selectedOrder?.returnRequest?.type === 'return' ? '(required for rejection)' : ''}`}
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => selectedOrder && handleReturnRequest(selectedOrder._id, 'approved')}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => selectedOrder && handleReturnRequest(selectedOrder._id, 'rejected')}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 