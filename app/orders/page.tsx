"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface OrderProduct {
  productId: string
  name: string
  price: number
  quantity: number
}

interface ReturnRequest {
  type: 'return' | 'replacement'
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requestDate: string
  adminResponse?: string
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
  status: 'pending' | 'processing' | 'delivered' | 'cancelled' | 'returned' | 'replaced'
  orderDate: string
  deliveryDate?: string
  returnRequest?: ReturnRequest
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'return' | 'replacement'>('return')
  const [reason, setReason] = useState('')

  useEffect(() => {
    // Check if user is logged in
    const userDataStr = localStorage.getItem('user')
    if (!userDataStr) {
      router.push('/login')
      return
    }

    fetchOrders()
  }, [router])

  const fetchOrders = async () => {
    try {
      const userDataStr = localStorage.getItem('user')
      if (!userDataStr) return

      const userData = JSON.parse(userDataStr)

      const response = await fetch('/api/orders')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const allOrders = await response.json()
      
      // Filter orders for current user
      const userOrders = allOrders.filter(
        (order: Order) => order.user.email === userData.email
      )
      
      setOrders(userOrders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const canCancelOrder = (orderDate: string) => {
    const orderTime = new Date(orderDate).getTime();
    const now = new Date().getTime();
    const hoursDifference = (now - orderTime) / (1000 * 60 * 60);
    return hoursDifference <= 24;
  }

  const getRemainingDays = (type: 'return' | 'replacement', deliveryDate?: string) => {
    if (!deliveryDate) return 0;
    
    const deliveryTime = new Date(deliveryDate).getTime();
    const now = new Date().getTime();
    const daysSinceDelivery = Math.floor((now - deliveryTime) / (1000 * 60 * 60 * 24));
    const limit = type === 'return' ? 14 : 30;
    
    // For testing/demo purposes
    if (deliveryTime > now) {
      return limit;
    }
    
    return Math.max(0, limit - daysSinceDelivery);
  }

  const canReturnOrder = (deliveryDate?: string) => {
    return getRemainingDays('return', deliveryDate) > 0;
  }

  const canReplaceOrder = (deliveryDate?: string) => {
    return getRemainingDays('replacement', deliveryDate) > 0;
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      toast.success('Order cancelled successfully');
      fetchOrders(); // Refresh orders list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  }

  const handleReturnRequest = async (orderId: string) => {
    try {
      if (!reason) {
        toast.error('Please provide a reason');
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      toast.success(data.message);
      fetchOrders(); // Refresh orders list
      setReason(''); // Reset form
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit request');
    }
  }

  if (loading) {
    return <div className="text-center p-4">Loading your orders...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>
  }

  if (orders.length === 0) {
    return <div className="text-center p-4">You haven't placed any orders yet.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell className="font-mono">{order._id}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.products.map((product, index) => (
                      <div key={index}>
                        {product.quantity}x {product.name}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>₹{order.totalAmount}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'returned' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'replaced' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                  {order.returnRequest && (
                    <span className="ml-2 text-xs">
                      ({order.returnRequest.type} request {order.returnRequest.status})
                    </span>
                  )}
                </TableCell>
                <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {order.deliveryDate ? 
                    new Date(order.deliveryDate).toLocaleDateString() : 
                    '-'
                  }
                </TableCell>
                <TableCell>
                  {order.status === 'pending' && canCancelOrder(order.orderDate) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelOrder(order._id)}
                      className="mb-2"
                    >
                      Cancel Order
                    </Button>
                  )}
                  {order.status === 'delivered' && !order.returnRequest && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mb-2"
                            disabled={!canReturnOrder(order.deliveryDate) && !canReplaceOrder(order.deliveryDate)}
                          >
                            Return/Replace
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Return or Replace Order</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label>Type</label>
                              <Select
                                value={selectedType}
                                onValueChange={(value: 'return' | 'replacement') => setSelectedType(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    value="return"
                                    disabled={!canReturnOrder(order.deliveryDate)}
                                  >
                                    Return (within {getRemainingDays('return', order.deliveryDate)} days)
                                  </SelectItem>
                                  <SelectItem
                                    value="replacement"
                                    disabled={!canReplaceOrder(order.deliveryDate)}
                                  >
                                    Replacement (within {getRemainingDays('replacement', order.deliveryDate)} days)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label>Reason</label>
                              <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Please provide a detailed reason..."
                                rows={4}
                              />
                            </div>
                            <Button
                              onClick={() => handleReturnRequest(order._id)}
                              className="w-full"
                            >
                              Submit Request
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <div className="text-xs text-gray-500 mt-1">
                        {canReturnOrder(order.deliveryDate) && (
                          <div>Return available for {getRemainingDays('return', order.deliveryDate)} more days</div>
                        )}
                        {canReplaceOrder(order.deliveryDate) && (
                          <div>Replacement available for {getRemainingDays('replacement', order.deliveryDate)} more days</div>
                        )}
                      </div>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
