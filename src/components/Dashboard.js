import React, { useState, useEffect } from "react";

// API data fetching hook
const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/kot/api/orders/`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();

      // Transform API data to match our component structure
      const transformedOrders = data.map((order) => ({
        tableNo: order.order_number,
        type: order.mode || "Dine-in", // Default to Dine-in if mode is null
        time: new Date(order.order_date).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        estimate: "15 mins", // You might want to calculate this based on your business logic
        status: order.status,
        items: order.items.map((item) => ({
          quantity: item.quantity || 1,
          name: item.name || item.product_name,
          price: parseFloat(item.price || 0),
        })),
        totalPrice: parseFloat(order.total_price || 0),
        gst: parseFloat(order.gst || 0),
        address: order.address,
        customer: order.customers?.[0], // Assuming we're interested in the first customer
      }));

      setOrders(transformedOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, error, refetch: fetchOrders };
};

const OrderCard = ({ order }) => {
  const getStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500 hover:bg-green-600";
      case "in_process":
        return "bg-amber-400 hover:bg-amber-500";
      case "ready_to_pickup":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-orange-500 hover:bg-orange-600";
    }
  };

  return (
    <div className="bg-orange-50/50 rounded-lg p-4 relative">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className="bg-orange-500 text-white w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold">
            {order.tableNo.slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              Table No. {order.tableNo}
            </div>
            <div className="text-orange-500 text-sm">{order.type}</div>
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          <div>Time: {order.time}</div>
          <div>Estimate: {order.estimate}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-3 text-sm text-gray-500">
          <div>Qty</div>
          <div>Items</div>
          <div className="text-right">Price</div>
        </div>

        {order.items.map((item, index) => (
          <div key={index} className="grid grid-cols-3 text-sm text-orange-500">
            <div>{item.quantity}</div>
            <div>{item.name}</div>
            <div className="text-right">${item.price.toFixed(2)}</div>
          </div>
        ))}

        <div className="border-t border-orange-200 pt-2 mt-2">
          <div className="grid grid-cols-3 text-sm">
            <div className="col-span-2 text-gray-600">SubTotal</div>
            <div className="text-right text-orange-500">
              ${order.totalPrice.toFixed(2)}
            </div>
          </div>
          <div className="grid grid-cols-3 text-sm">
            <div className="col-span-2 text-gray-600">GST</div>
            <div className="text-right text-orange-500">
              ${order.gst.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <button
        className={`w-full py-2.5 text-white rounded-md mt-4 font-medium ${getStatusStyles(
          order.status
        )}`}
      >
        {order.status.replace("_", " ").toUpperCase()}
      </button>
    </div>
  );
};

const Dashboard = () => {
  const { orders, loading, error, refetch } = useOrders();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-orange-500 text-xl">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
        <button
          onClick={refetch}
          className="ml-4 bg-orange-500 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-orange-50/30 min-h-screen">
      <div className="mb-6 flex items-center gap-4">
        <input
          type="date"
          className="border border-gray-200 rounded-lg px-3 py-2 bg-white"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button
          className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium"
          onClick={refetch}
        >
          Orders
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map((order, index) => (
          <OrderCard key={index} order={order} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
