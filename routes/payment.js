const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASSWD
const is_live = false


module.exports = (paymentcollection) => {
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
      success_url: `http://localhost:3000/payment/payment-success/${tran_id}`,
      fail_url: `http://localhost:3000/payment/payment-fail/${tran_id}`,
      cancel_url: `http://localhost:3000/payment/payment-cancel/${tran_id}`,
      ipn_url: 'http://localhost:3000/payment/ipn',
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


  
   router.post("/payment-success/:tran_id", async(req,res)=>{
    const { tran_id } = req.params;
    // console.log(tran_id )
    res.redirect(`http://localhost:5173/payment-success/?tran_id=${tran_id}`);
    
  
   });


   router.post("/payment-cancel/:tran_id",async(req,res)=>{
    res.redirect("http://localhost:5173/payment-cancel")
   })


   router.post("/payment-fail/:tran_id",async(req,res)=>{
    res.redirect("http://localhost:5173/payment-fail")
   })



    return router
}