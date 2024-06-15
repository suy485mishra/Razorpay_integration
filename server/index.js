import express from "express";
import Razorpay from "razorpay";
import cors from 'cors';
import crypto from 'crypto';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors()); // Call cors middleware function


app.post("/order", async (req, res) => {
    try {
        console.log("Creating Razorpay order with options:", req.body);
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_SECRET,
        });

        const options = {
            amount: req.body.amount,
            currency: req.body.currency,
            receipt: req.body.receipt,
        };
        
    const order = await razorpay.orders.create(options);
    if (!order) {
        console.error("Failed to create order");
        return res.status(500).send("Error creating order");
    }
    
    console.log("Order created:", order);
    res.json(order);
} catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).send("Server Error");
}
});

app.post("/order/validate", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    try {
        console.log("Validating payment with:", req.body);
        const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
        sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = sha.digest("hex");
        
        if (digest !== razorpay_signature) {
            console.error("Validation failed");
            return res.status(400).json({ msg: "Transaction is not legit!" });
        }
        
        console.log("Validation succeeded");
        res.json({
            msg: "Success",
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
        });
    } catch (error) {
        console.error("Error validating payment:", error);
        return res.status(500).send("Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Listening at port ${PORT}`);
});