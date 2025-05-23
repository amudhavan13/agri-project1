"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

interface SaleData {
  name: string;
  quantity: number;
  revenue: number;
}

interface Statistics {
  totalDeliveredOrders: number;
  totalRevenue: number;
  monthlySales: SaleData[];
}

export default function AdminStatistics() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  // Get current year and create array of years from 2023 to current year + 1
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2022 }, (_, i) => 2023 + i)

  useEffect(() => {
    fetchStatistics()
  }, [selectedMonth, selectedYear])

  const fetchStatistics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/statistics?month=${selectedMonth}&year=${selectedYear}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch statistics')
      }

      const data = await response.json()
      console.log('Fetched statistics:', data)
      
      if (!data.monthlySales || !Array.isArray(data.monthlySales)) {
        throw new Error('Invalid data format received')
      }

      setStatistics(data)
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-lg font-medium">Loading statistics...</div>
          <div className="text-sm text-muted-foreground">This may take a few moments</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-lg font-medium text-red-500">Error loading statistics</div>
          <div className="text-sm text-muted-foreground">{error}</div>
        </div>
      </div>
    )
  }

  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {statistics && statistics.monthlySales && statistics.monthlySales.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview - {selectedMonthName} {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivered Orders</p>
                    <p className="text-2xl font-bold">{statistics.totalDeliveredOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(statistics.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Sales - {selectedMonthName} {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={statistics.monthlySales} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                    barSize={40}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      interval={0} 
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="quantity"
                      orientation="left"
                      label={{ value: 'Quantity Sold', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'Revenue') return formatCurrency(value)
                        return value
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="quantity"
                      dataKey="quantity" 
                      fill="#8884d8" 
                      name="Quantity Sold" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-lg font-medium">No sales data available</div>
            <div className="text-sm text-muted-foreground">
              for {selectedMonthName} {selectedYear}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 