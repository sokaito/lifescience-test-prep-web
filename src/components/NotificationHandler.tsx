"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { getToken, onMessage } from "firebase/messaging";
import { messaging, db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function NotificationHandler() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only proceed if user is logged in
    if (!user) return;

    const setupNotifications = async () => {
      if (Capacitor.isNativePlatform()) {
        // --- Native (Capacitor) Setup ---
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== "granted") {
          console.warn("User denied permissions for push notifications");
          return;
        }

        await PushNotifications.register();

        // On successful registration, save token
        PushNotifications.addListener("registration", async (token) => {
          console.log("Native Token:", token.value);
          await saveTokenToFirestore(token.value);
        });

        // Handle errors
        PushNotifications.addListener("registrationError", (error) => {
          console.error("FCM Registration Error:", error);
        });

        // Handle foreground notification
        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Push Received (Foreground):", notification);
          // Optional: Show a custom toast if you have one
        });

        // Handle notification click (Deep Linking)
        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          console.log("Push Action:", action);
          const data = action.notification.data;
          const route = data?.route || data?.url;
          if (route) {
            router.push(route);
          }
        });

      } else {
        // --- Web Setup ---
        if (!messaging) return;

        try {
          // Check if browser supports notifications and if they are blocked
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "denied") {
              console.warn("Push notifications are blocked by the user. Please enable them in browser settings.");
              return;
            }
          }

          // Request permission and get token
          const token = await getToken(messaging, {
            // Replace with your VAPID key from Firebase Console -> Cloud Messaging
            vapidKey: "BGQDR1HnVlmPu_uwyvZqqvNRvQGniaUuIlz4jUc7Um5YvQnLNthVu6kCIwchklletrefcfdWPipYcDVvdpcNIJc", 
          });

          if (token) {
            await saveTokenToFirestore(token);
          }

          // Listen for foreground messages
          onMessage(messaging, (payload) => {
            console.log("Web Push Received:", payload);
            if (payload.notification) {
               // Simple alert for demonstration, replace with a nice Toast component if available
               const { title, body } = payload.notification;
               const route = payload.data?.route;
               
               if (confirm(`${title}\n\n${body}\n\nClick OK to open.`)) {
                 if (route) router.push(route);
               }
            }
          });
        } catch (err) {
          console.error("Web Push Registration Error:", err);
        }
      }
    };

    const saveTokenToFirestore = async (token: string) => {
      if (!user?.email) return;
      try {
        const userRef = doc(db, "users", user.email);
        await updateDoc(userRef, {
          pushTokens: arrayUnion(token),
        });
      } catch (e) {
        console.error("Error saving token to Firestore:", e);
      }
    };

    setupNotifications();

    // Cleanup listeners on unmount
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [user, router]);

  return null; // This component doesn't render anything
}
