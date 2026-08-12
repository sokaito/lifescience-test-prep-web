import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ENABLE_TOKEN_SYSTEM } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    if (!ENABLE_TOKEN_SYSTEM) {
      return NextResponse.json({ success: true, newBalance: 0, disabled: true });
    }
    const { userId, cost, testId, testType } = await req.json();

    if (!userId || cost === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (!adminDb) {
      console.warn("[MOCK MODE] Firebase admin not initialized. By-passing DB deduction for test.");
      return NextResponse.json({ success: true, newBalance: cost > 0 ? 50 - cost : 50, isMock: true });
    }

    const userRef = adminDb!.collection("users").doc(userId);

    // Run a transaction to safely deduct tokens
    const result = await adminDb!.runTransaction(async (t: any) => {
      const doc = await t.get(userRef);
      if (!doc.exists) {
        throw new Error("User does not exist!");
      }
      const data = doc.data();
      const currentTokens = data?.tokens ?? 50;

      if (currentTokens < cost) {
        throw new Error("Insufficient tokens");
      }

      const newBalance = currentTokens - cost;
      t.update(userRef, { tokens: newBalance });

      // Log the transaction
      const logRef = adminDb!.collection("tokenLogs").doc();
      t.set(logRef, {
        userId,
        type: "spend",
        amount: cost,
        testId: testId || "unknown",
        testType: testType || "Unknown Test",
        timestamp: new Date()
      });

      return newBalance;
    });

    return NextResponse.json({ success: true, newBalance: result });
  } catch (error: any) {
    console.error("Token deduction failed:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
