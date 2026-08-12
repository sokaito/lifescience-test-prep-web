import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { amount, planId } = await req.json(); // amount in INR

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      // Mock for development if keys aren't set
      return NextResponse.json({ 
        orderId: `mock_order_${Date.now()}`, 
        amount: amount * 100,
        currency: "INR",
        isMock: true
      }); 
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        planId
      }
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      isMock: false
    });
  } catch (error: any) {
    console.error("Razorpay init error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
