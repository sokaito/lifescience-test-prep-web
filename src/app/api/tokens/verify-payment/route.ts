import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, tokensToAdd, amountPaid, isMock } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!isMock && secret) {
      const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature !== razorpay_signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else if (isMock) {
      // In mock mode (no secret), just accept it
      if (!razorpay_order_id || !razorpay_payment_id) {
         return NextResponse.json({ error: "Invalid mock payment" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 500 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Firebase admin not initialized" }, { status: 500 });
    }

    const userRef = adminDb!.collection("users").doc(userId);

    // Grant tokens securely
    const newBalance = await adminDb!.runTransaction(async (t: any) => {
      const doc = await t.get(userRef);
      const data = doc.exists ? doc.data() : { tokens: 50 };
      const currentTokens = data?.tokens ?? 50;

      const balance = currentTokens + tokensToAdd;
      t.update(userRef, { tokens: balance });

      // Log the purchase
      const transactionRef = adminDb!.collection("tokenTransactions").doc(razorpay_payment_id);
      t.set(transactionRef, {
        userId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        tokensAdded: tokensToAdd,
        amountPaid,
        status: "success",
        timestamp: new Date()
      });
      
      const logRef = adminDb!.collection("tokenLogs").doc();
      t.set(logRef, {
        userId,
        type: "earn",
        amount: tokensToAdd,
        detail: "Purchase",
        timestamp: new Date()
      });

      return balance;
    });

    return NextResponse.json({ success: true, newBalance });
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
