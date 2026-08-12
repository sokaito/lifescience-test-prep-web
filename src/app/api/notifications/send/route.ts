import { NextResponse } from "next/server";
import { adminMessaging, adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { title, body, route, target = "all" } = await req.json();

    if (!adminMessaging || !adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized. Check your service account key." },
        { status: 500 }
      );
    }

    // 1. Fetch tokens from Firestore
    let tokens: string[] = [];
    
    if (target === "all") {
      const usersSnap = await adminDb.collection("users").get();
      usersSnap.forEach((doc) => {
        const userData = doc.data();
        if (userData.pushTokens && Array.isArray(userData.pushTokens)) {
          tokens.push(...userData.pushTokens);
        }
      });
    } else {
      // target is expected to be a single email or array of emails
      const email = target;
      const userDoc = await adminDb.collection("users").doc(email).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.pushTokens) {
          tokens = userData.pushTokens;
        }
      }
    }

    // Remove duplicates
    tokens = Array.from(new Set(tokens)).filter(t => t && typeof t === 'string' && t.length > 0);

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: "No tokens found to send to." });
    }

    // 2. Prepare message
    // Note: Multicast is limited to 500 tokens per call.
    // For a larger number of users, use a loop or topics.
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        route, // Custom data for deep linking
      },
      tokens: tokens.slice(0, 500), // Standard multicast batch limit
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    return NextResponse.json({
      success: true,
      sentCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
