const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASSWD
const is_live = false


module.exports = (paymentcollection, cartcollection) => {
  router.post('/init', async (req, res) => {
    try {
      const { userEmail, items, totalAmount, Name } = req.body;

      const tran_id = new ObjectId().toString();


      await paymentcollection.insertOne({
        tran_id: tran_id,
        userEmail: userEmail,
        items: items,
        totalAmount: totalAmount,
        customer_name: Name,
        status: 'PENDING',
        created_at: new Date()
      });


      const itemIds = items.map(item => item.id).join(',');


      const data = {
        total_amount: totalAmount,
        currency: 'BDT',
        tran_id: tran_id,
        success_url: `https://deshimart-server.onrender.com/payment-success/${tran_id}`,
        fail_url: `https://deshimart-server.onrender.com/payment-fail/${tran_id}`,
        cancel_url: `https://deshimart-server.onrender.com/payment-cancel/${tran_id}`,
        ipn_url: 'https://deshimart-server.onrender.com/payment/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: Name,
        cus_email: userEmail,
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: Name,
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
      };

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

      const apiResponse = await sslcz.init(data);

      res.json({
        url: apiResponse.GatewayPageURL,
        tran_id: tran_id
      });
    } catch (err) {
      console.log("Payment Init Error:", err);
      res.status(500).json({ error: 'Server Error', details: err.message });
    }
  });



  router.post("/payment-success/:tran_id", async (req, res) => {
    try {
      const { tran_id } = req.params;


      const payment = await paymentcollection.findOne({ tran_id });

      if (!payment) {
        return res.status(404).send({ message: "Payment not found" });
      }


      await paymentcollection.updateOne(
        { tran_id },
        {
          $set: {
            status: "SUCCESS",
            paid_at: new Date()
          }
        }
      );


      await cartcollection.deleteMany({ userEmail: payment.userEmail });


      res.redirect(`https://deshimart-1451e.web.app/payment-success?tran_id=${tran_id}`);

    } catch (err) {
      console.log("Payment Success Error:", err);
      res.status(500).send({ message: err.message });
    }
  });




  router.post("/payment-cancel/:tran_id", async (req, res) => {
    const { tran_id } = req.params;
    await paymentcollection.updateOne(
      { tran_id: tran_id },
      { $set: { status: "CANCLE", created_at: new Date() } }
    )
    res.redirect("https://deshimart-1451e.web.app/payment-cancel")
  })


  router.post("/payment-fail/:tran_id", async (req, res) => {
    const { tran_id } = req.params;

    await paymentcollection.updateOne(
      { tran_id: tran_id },
      { $set: { status: "FAIL", created_at: new Date() } }
    )
    res.redirect("https://deshimart-1451e.web.app/payment-fail")
  })





  router.get("/order", async (req, res) => {
    try {
      const email = req.query.email;
      const result = await paymentcollection.find({ userEmail: email, status: "SUCCESS" }).toArray();
      res.send(result)
    }
    catch (err) {
      console.log(err)
      res.status(500).send({ message: err.message })
    }
  })



  router.get("/history", async (req, res) => {
    try {
      const email = req.query.email;
      const result = await paymentcollection.find({ userEmail: email }).toArray();
      res.send(result)
    } catch (err) {
      console.log(err)
      res.status(500).send({ message: err.message })
    }
  })





  router.get('/buyer-order', async (req, res) => {
    try {
      const sellerEmail = req.query.sellerEmail;


      if (!sellerEmail) {
        return res.status(400).send({ message: "Seller email is required" });
      }



      const result = await paymentcollection.aggregate([
        { $match: { status: "SUCCESS" } },
        { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
        { $match: { "items.sellerEmail": sellerEmail } },
        {
          $project: {
            _id: 0,
            tran_id: 1,
            customer_name: 1,
            userEmail: 1,
            paid_at: 1,
            item: "$items"
          }
        },
        { $sort: { paid_at: -1 } }
      ]).toArray();

      console.log("Seller orders fetched:", result.length);
      res.send(result);
    } catch (error) {
      console.log("Backend Error:", error);
      res.status(500).send({ message: "Failed to fetch seller items", error: error.message });
    }
  });



  router.get("/all-order-summary", async (req, res) => {
    try {
      const orders = await paymentcollection.find({ status: "SUCCESS" }).toArray();

      const monthlySummary = {};
      orders.forEach(order => {
        if (!order.paid_at || !order.items) return;

        const month = new Date(order.paid_at).toISOString().slice(0, 7);


        if (!monthlySummary[month]) {
          monthlySummary[month] = {
            totalRevenue: 0,
            totalItems: 0
          };
        }


        monthlySummary[month].totalRevenue += order.totalAmount || 0;

        const itemCount = order.items.reduce((acc, item) => {
          return acc + (item.quantity || 0);
        }, 0);

        monthlySummary[month].totalItems += itemCount;
      });

      res.send({
        monthlySummary
      });

    } catch (err) {
      console.log(err);
      res.status(500).send({ message: "server error" });
    }
  });



  router.get("/order-status-count", async (req, res) => {
    try {
      const successCount = await paymentcollection.countDocuments({ status: "SUCCESS" });
      const pendingCount = await paymentcollection.countDocuments({ status: "CANCLE" });

      res.send({
        SUCCESS: successCount,
        CANCLE: pendingCount
      });

    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  });



  router.get("/top-buyers", async (req, res) => {
    try {
      const result = await paymentcollection.aggregate([
        {
          $match: { status: "SUCCESS" } 
        },
        {
          $group: {
            _id: "$userEmail",
            customerName: { $first: "$customer_name" },
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$totalAmount" },
            totalItems: {
              $sum: {
                $sum: {
                  $map: {
                    input: "$items",
                    as: "item",
                    in: { $ifNull: ["$$item.quantity", 1] }
                  }
                }
              }
            }
          }
        },
        {
          $sort: { totalOrders: -1 } 
        },
        {
          $limit: 5
        }
      ]).toArray();

      res.send(result);

    } catch (err) {
      console.log(err);
      res.status(500).send({ message: "Failed to fetch top buyers" });
    }
  });


  return router
}