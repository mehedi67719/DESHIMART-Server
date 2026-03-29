const express = require('express');
const verifyToken = require('./middleware/verifyToken');
const router = express.Router();

module.exports = (productscollection, paymentcollection, usercollection) => {

  router.get("/all-total", verifyToken, async (req, res) => {
    try {
      const useremail = req.decoded_email;

      const finduser = await usercollection.findOne({ email: useremail });



      if (!finduser) {
        return res.status(404).send({ message: "user not found" })
      }

      else {
        if (finduser.role == "admin") {
          const totalOrders = await paymentcollection.countDocuments({
            status: "SUCCESS"
          });


          const totalUsers = await usercollection.countDocuments();

          const totalProducts = await productscollection.countDocuments({
            status: "approved"
          });

          res.send({
            totalOrders,
            totalUsers,
            totalProducts
          });
        }
      }



    } catch (err) {
      console.log(err);
      res.status(500).send({ message: "Failed to fetch totals" });
    }
  });

  return router;
};