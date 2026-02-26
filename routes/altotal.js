const express = require('express');
const router = express.Router();

module.exports = (productscollection, paymentcollection, usercollection) => {

  router.get("/all-total", async (req, res) => {
    try {

      // 1️⃣ Total Successful Orders
      const totalOrders = await paymentcollection.countDocuments({
        status: "SUCCESS"
      });

      // 2️⃣ Total Users
      const totalUsers = await usercollection.countDocuments();

      // 3️⃣ Total Approved Products
      const totalProducts = await productscollection.countDocuments({
        status: "approved"
      });

      res.send({
        totalOrders,
        totalUsers,
        totalProducts
      });

    } catch (err) {
      console.log(err);
      res.status(500).send({ message: "Failed to fetch totals" });
    }
  });

  return router;
};