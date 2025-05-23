"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Edit, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  colors: string[];
  images: string[];
  stock: number;
  topSelling?: boolean;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableCategories = [
    "Cultivators",
    "Tillers",
    "Seeders",
    "Harvesters",
    "Irrigation",
    "Fertilizers",
    "Sprayers",
  ]

  const availableColors = ["Red", "Blue", "Green", "Yellow", "Black", "White"]

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    }
  }

  const handleUpdateProduct = async () => {
    if (!editProduct) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editProduct),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      const updatedProduct = await response.json()
      setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p))
      setEditProduct(null)
    } catch (err) {
      console.error('Error updating product:', err)
      setError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Manage Products</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product) => (
            <TableRow key={product._id}>
              <TableCell>
                <div className="relative w-12 h-12 rounded-md overflow-hidden">
                  <Image
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>₹{product.price.toLocaleString()}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell className="text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setEditProduct(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Product</DialogTitle>
                      <DialogDescription>Update product details.</DialogDescription>
                    </DialogHeader>
                    {editProduct && (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-name">Product Name</Label>
                          <Input
                            id="edit-name"
                            value={editProduct.name}
                            onChange={(e) =>
                              setEditProduct({
                                ...editProduct,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={editProduct.description}
                            onChange={(e) =>
                              setEditProduct({
                                ...editProduct,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-price">Price</Label>
                          <Input
                            id="edit-price"
                            type="number"
                            value={editProduct.price}
                            onChange={(e) =>
                              setEditProduct({
                                ...editProduct,
                                price: Number(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-category">Category</Label>
                          <select
                            id="edit-category"
                            value={editProduct.category}
                            onChange={(e) =>
                              setEditProduct({
                                ...editProduct,
                                category: e.target.value,
                              })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {availableCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Colors</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {availableColors.map((color) => (
                              <div key={color} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`color-${color}`}
                                  checked={editProduct.colors.includes(color)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setEditProduct({
                                        ...editProduct,
                                        colors: [...editProduct.colors, color],
                                      })
                                    } else {
                                      setEditProduct({
                                        ...editProduct,
                                        colors: editProduct.colors.filter((c) => c !== color),
                                      })
                                    }
                                  }}
                                />
                                <Label htmlFor={`color-${color}`}>{color}</Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label>Images</Label>
                          <div className="space-y-2">
                            {editProduct.images.map((image, index) => (
                              <Input
                                key={index}
                                placeholder={`Image URL ${index + 1}`}
                                value={image}
                                onChange={(e) => {
                                  const newImages = [...editProduct.images]
                                  newImages[index] = e.target.value
                                  setEditProduct({
                                    ...editProduct,
                                    images: newImages,
                                  })
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="topSelling"
                            checked={editProduct.topSelling}
                            onCheckedChange={(checked) =>
                              setEditProduct({
                                ...editProduct,
                                topSelling: checked as boolean,
                              })
                            }
                          />
                          <Label htmlFor="topSelling">Mark as Top Selling</Label>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditProduct(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateProduct} disabled={loading}>
                        {loading ? 'Updating...' : 'Update Product'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
