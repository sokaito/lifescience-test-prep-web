"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

// Define Pricing Plans
const plans = [
  { id: "plan_1", tokens: 1, price: 1, title: "Quick Top-up" },
  { id: "plan_10", tokens: 10, price: 10, title: "Standard" },
  { id: "plan_50", tokens: 50, price: 49, title: "Combo", discount: "2% OFF" },
  { id: "plan_110", tokens: 110, price: 100, title: "Best Value", discount: "Popular" },
];

export default function BuyTokens() {
  const { user, userData, updateProfileData, isGuest } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePurchase = async (plan: typeof plans[0]) => {
    setLoadingPlan(plan.id);
    try {
      if (!user) throw new Error("User not logged in");

      // 1. Create Order
      const res = await fetch("/api/tokens/init-razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: plan.price, planId: plan.id }),
      });
      const orderData = await res.json();
      
      if (!res.ok) throw new Error(orderData.error || "Failed to create order");

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.isMock ? "" : undefined, // Will be ignored if mock
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Test Prep Tokens",
        description: `Purchase ${plan.tokens} Tokens`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. Verify Payment
          try {
            const verifyRes = await fetch("/api/tokens/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id || `mock_payment_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || "mock_signature",
                userId: user.uid || user.email,
                tokensToAdd: plan.tokens,
                amountPaid: plan.price,
                isMock: orderData.isMock
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");

            // Success! Update local user data
            await updateProfileData({ tokens: verifyData.newBalance });
            alert(`Success! ${plan.tokens} tokens have been added to your account.`);
          } catch (err: any) {
             alert(err.message);
          }
        },
        prefill: {
          name: userData?.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#0d9488", // Tailwind Teal 600
        },
      };

      if (orderData.isMock) {
         // Bypass UI and straight to handler, simulating successful payment click
         const confirmMock = window.confirm(`[MOCK MODE] Pay ₹${plan.price} for ${plan.tokens} tokens?`);
         if (confirmMock) {
            options.handler({ razorpay_payment_id: "mock_payment_" + Date.now(), razorpay_order_id: orderData.orderId, razorpay_signature: "mock_sig" });
         } else {
            console.log("Mock Payment Cancelled");
         }
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any){
           alert("Payment Failed: " + response.error.description);
        });
        rzp.open();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoadingPlan(null);
  };

  if (isGuest || !user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-bg-card rounded-[2.5rem] border border-border-subtle shadow-xl">
        <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-3xl flex items-center justify-center mb-6 border border-teal-100 dark:border-teal-800">
           <Zap className="w-10 h-10 text-teal-500" />
        </div>
        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-2">Sign in to Purchase Tokens</h2>
        <p className="text-text-secondary font-medium mb-8 max-w-sm mx-auto">
          The token system is exclusive to registered users. Sign in through the sidebar to start your preparation journey.
        </p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"))}
          className="px-10 py-4 bg-text-primary text-bg-card rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
        >
          Open Sign In
        </button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-text-secondary bg-bg-main p-4 rounded-2xl border border-border-subtle">
        <ShieldCheck className="w-5 h-5 text-emerald-500" />
        <p className="text-sm font-medium">Secure payments via Razorpay. Tokens are added instantly.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative flex flex-col p-6 rounded-[2rem] border-2 transition-all group overflow-hidden ${plan.discount === "Popular" ? 'border-accent-main bg-teal-50 dark:bg-teal-900/20 shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30' : 'border-border-subtle bg-bg-card hover:border-text-secondary'}`}
          >
            {plan.discount && (
               <div className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${plan.discount === "Popular" ? 'bg-accent-main text-white' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/50'}`}>
                 {plan.discount}
               </div>
            )}
            
            <h3 className="text-text-secondary font-bold uppercase tracking-widest text-xs mb-2">{plan.title}</h3>
            
            <div className="flex items-end space-x-2 mb-6">
              <span className="text-4xl font-black text-text-primary leading-none">{plan.tokens}</span>
              <span className="text-text-secondary font-bold text-sm mb-1 uppercase tracking-widest">Tokens</span>
            </div>

            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-subtle/50">
                 <span className="text-text-secondary font-medium">Amount to Pay</span>
                 <span className="text-xl font-black text-text-primary">₹ {plan.price}</span>
              </div>
              <button 
                onClick={() => handlePurchase(plan)}
                disabled={loadingPlan !== null}
                className={`w-full flex items-center justify-center py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-sm ${plan.discount === "Popular" ? 'bg-accent-main text-white hover:scale-[1.02] active:scale-95' : 'bg-bg-main text-text-primary border border-border-subtle hover:bg-text-primary hover:text-bg-card'}`}
              >
                {loadingPlan === plan.id ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing</>
                ) : (
                  <>Buy Now <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
