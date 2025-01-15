const Order = require("../models/orderModels");
const Product = require("../models/productModels");
// const ShippingAddress = require("../models/shippingAddressModels"); // Assuming this is your ShippingAddress model
const ShippingAddress = require("../models/shippingAddModels");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatchError = require("../middleware/tryCatch");
const Voucher = require("../models/voucherModels")


// Create New Order ..
exports.newOrder = tryCatchError(async (req, res, next) => {
  const { shippingInfo, orderItems, paymentInfo, itemPrice, deliveryOption } =
    req.body;

  // Validate order items
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return next(new ErrorHandler("Order items are required", 400));
  }

  // Fetch categories for each order item
  const enrichedOrderItems = await Promise.all(
    orderItems.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product) throw new ErrorHandler("Product not found", 404);

      return {
        ...item,
        category: product.category, // Assuming `category` exists in the Product model
      };
    })
  );

  // Validate shippingInfo
  const shippingAddress = await ShippingAddress.findById(shippingInfo);
  if (!shippingAddress) {
    return next(new ErrorHandler("Invalid shippingInfo ID", 400));
  }

  // Validate delivery option
  const product = await Product.findById(orderItems[0].product);
  const selectedDeliveryOption = product.deliveryOptions[deliveryOption];
  if (!selectedDeliveryOption) {
    return next(new ErrorHandler("Invalid delivery option", 400));
  }

  const shippingPrice = selectedDeliveryOption.price;
  // Calculate the total price based on item price, quantity, and shipping price
  const itemTotalPrice = orderItems.reduce((total, item) => {
    return total + item.price * item.quantity; // Calculate price per item * quantity
  }, 0);

  const totalPrice = itemTotalPrice + shippingPrice;

  // Create new order
  const order = await Order.create({
    shippingInfo: shippingAddress._id,
    orderItems,
    user: req.user._id,
    paymentInfo,
    itemPrice: itemTotalPrice,
    shippingPrice,
    deliveryOption: selectedDeliveryOption,
    totalPrice,
    paidAt: Date.now(),
  });

  res.status(201).json({
    success: true,
    order,
  });
});

// get single order
exports.getSingleOrder = tryCatchError(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (!order) {
    return next(new ErrorHandler("Order not found with this is id", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// get logged in user orders
exports.myOrders = tryCatchError(async (req, res, next) => {
  // Query the orders by user ID
  const orders = await Order.find({ user: req.user._id });

  const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  // Return the orders
  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// // get All orders -- Admin
// exports.getAllOrders = tryCatchError(async (req, res, next) => {
//   const orders = await Order.find().populate({
//     path: "shippingInfo", // Populating the shippingInfo field to fetch complete address
//     populate: {
//       path: "country", // Populating the country field within the shippingInfo
//       select: "name code", // You can choose what fields to select from the Country model (e.g., name, code)
//     },
//   });
//   let totalAmount = 0;

//   // Calculate total amount by summing up the totalPrice of each order
//   orders.forEach((order) => {
//     totalAmount += order.totalPrice;
//   });

//   res.status(200).json({
//     success: true,
//     totalAmount,
//     orders,
//   });
// });

// update Order Status -- Admin
exports.updateOrder = tryCatchError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400)); // Better error code
  }

  // Update stock for each product in the order
  for (const item of order.orderItems) {
    await updateStock(item.product, item.quantity);
  }

  // Update order status
  order.orderStatus = req.body.status; // Correct assignment

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Order updated successfully",
  });
});

// Helper function to update product stock
async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  if (!product) {
    throw new ErrorHandler("Product not found", 404);
  }
  if (product.stock < quantity) {
    throw new ErrorHandler("Insufficient stock for product", 400);
  }
  product.stock -= quantity;

  await product.save({ validateBeforeSave: false });
}

// Delete Order -- Admin
exports.deleteOrder = tryCatchError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

// get Income Statistics..
exports.getIncomeStatistics = tryCatchError(async (req, res, next) => {
  const { year, month, day } = req.query;

  if (!year) {
    return next(new ErrorHandler("Year is required to fetch income", 400));
  }

  const yearFilter = parseInt(year);
  const monthFilter = month ? parseInt(month) - 1 : null; // Convert to 0-indexed
  const dayFilter = day ? parseInt(day) : null;

  // Prepare date ranges for each level of granularity
  const startDateYear = new Date(yearFilter, 0, 1);
  const endDateYear = new Date(yearFilter + 1, 0, 1);

  const startDateMonth = new Date(yearFilter, monthFilter ?? 0, 1);
  const endDateMonth = new Date(yearFilter, monthFilter + 1 ?? 12, 1);

  const startDateDay = new Date(yearFilter, monthFilter ?? 0, dayFilter ?? 1);
  const endDateDay = new Date(yearFilter, monthFilter ?? 0, dayFilter + 1 ?? 2);

  // Aggregation pipeline for Yearly, Monthly, and Daily income
  const yearlyIncome = await Order.aggregate([
    {
      $match: {
        orderStatus: "Delivered",
        createdAt: { $gte: startDateYear, $lt: endDateYear },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$totalPrice" },
        averageIncome: { $avg: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const monthlyIncome = await Order.aggregate([
    {
      $match: {
        orderStatus: "Delivered",
        createdAt: { $gte: startDateMonth, $lt: endDateMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$totalPrice" },
        averageIncome: { $avg: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const dailyIncome = await Order.aggregate([
    {
      $match: {
        orderStatus: "Delivered",
        createdAt: { $gte: startDateDay, $lt: endDateDay },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$totalPrice" },
        averageIncome: { $avg: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    income: {
      yearlyIncome: yearlyIncome[0] || {
        totalIncome: 0,
        averageIncome: 0,
        orderCount: 0,
      },
      monthlyIncome: monthlyIncome[0] || {
        totalIncome: 0,
        averageIncome: 0,
        orderCount: 0,
      },
      dailyIncome: dailyIncome[0] || {
        totalIncome: 0,
        averageIncome: 0,
        orderCount: 0,
      },
    },
  });
});

//  Fetch Order History by Categories (MyActivity)..
exports.getOrderHistoryByCategory = tryCatchError(async (req, res, next) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return next(
      new ErrorHandler(
        "Year and month are required to fetch order history",
        400
      )
    );
  }

  // Convert month to 0-indexed (i.e., January is 0, December is 11)
  const startDate = new Date(year, month - 1, 1); // Start of the month
  const endDate = new Date(year, month, 0); // End of the month

  // Query orders for the selected month and year
  const orders = await Order.find({
    user: req.user._id,
    createdAt: {
      $gte: startDate,
      $lt: endDate,
    },
  });

  if (!orders.length) {
    return res
      .status(404)
      .json({ message: `No orders found for ${month}/${year}` });
  }

  const categorySummary = {};
  let totalAmount = 0;
  let totalOrders = 0;
  let totalProcessingOrders = 0;

  // Group items by category
  orders.forEach((order) => {
    totalOrders++;
    if (order.orderStatus === "Processing") {
      totalProcessingOrders++;
    }

    order.orderItems.forEach((item) => {
      const { category, price, quantity } = item;

      if (!categorySummary[category]) {
        categorySummary[category] = {
          totalAmount: 0,
          totalCount: 0,
        };
      }

      categorySummary[category].totalAmount += price * quantity;
      categorySummary[category].totalCount += quantity;
    });

    // Accumulate total price
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    categories: categorySummary,
    orderStatusSummary: {
      Delivered: orders.filter((order) => order.orderStatus === "Delivered")
        .length,
      Processing: totalProcessingOrders,
      totalOrders: totalOrders,
    },
    totalPrice: totalAmount,
  });
});


// apply Voucher..
exports.applyVoucher = tryCatchError(async (req, res, next) => {
  // Step 1: Fetch user's past orders
  const orders = await Order.find({ user: req.user._id });

  const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  const { voucherId } = req.body; // Input from frontend

  // Step 2: Validate voucher existence
  const voucher = await Voucher.findById(voucherId);

  if (!voucher) {
    return next(new ErrorHandler("Voucher not found", 404));
  }

  // Step 3: Check voucher validity
  if (voucher.status !== "Available" || voucher.expiryDate < Date.now()) {
    return next(new ErrorHandler("Voucher is expired or unavailable", 400));
  }

  // Step 4: Calculate discount
  const discountAmount = (totalAmount * voucher.discount) / 100; // Voucher discount percentage
  const finalAmount = totalAmount - discountAmount;

  // Step 5: Update orders with discount
  await Promise.all(
    orders.map(async (order) => {
      order.discountAmount = (order.totalPrice / totalAmount) * discountAmount; // Pro-rate discount per order
      order.voucher = voucher._id; // Save the applied voucher ID
      await order.save(); // Save updated order
    })
  );

  // Step 6: Return response
  res.status(200).json({
    success: true,
    message: "Voucher applied successfully",
    totalAmount,
    discountAmount,
    finalAmount,
  });
});

// get All orders and total income -- Admin..
exports.getAllOrders = tryCatchError(async (req, res, next) => {
  const orders = await Order.find().populate({
    path: "shippingInfo",
    populate: {
      path: "country",
      select: "name code",
    },
  });

  let grossAmount = 0; // Total amount before discounts
  let netAmount = 0;   // Total amount after discounts

  orders.forEach((order) => {
    const orderTotal = order.itemPrice + order.shippingPrice; // Order total before discount
    const discount = order.discountAmount || 0;              // Ensure discountAmount is accounted for

    grossAmount += orderTotal;          // Add to gross total
    netAmount += (orderTotal - discount); // Add discounted total to netAmount
  });

  res.status(200).json({
    success: true,
    grossAmount, // Total amount before discounts
    netAmount,   // Total amount after discounts
    orders,
  });
});

