"use client";

// ============================================
// Paddle.js Helper (Overlay Checkout)
// ============================================

declare global {
  interface Window {
    Paddle?: any;
  }
}

let paddleLoading: Promise<void> | null = null;

function loadPaddleScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SSR not supported"));
  }
  if (window.Paddle) return Promise.resolve();
  if (paddleLoading) return paddleLoading;

  paddleLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      paddleLoading = null;
      reject(new Error("Failed to load Paddle.js"));
    };
    document.head.appendChild(script);
  });

  return paddleLoading;
}

export type PaddlePlan = "pro" | "business";

export async function openPaddleCheckout(
  plan: PaddlePlan,
  onSuccess?: () => void,
  onClose?: () => void,
): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("NOT_LOGGED_IN");

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const env = process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox";
  if (!clientToken) throw new Error("PADDLE_TOKEN_MISSING");

  // 1. Create Paddle transaction on backend
  const res = await fetch("http://localhost:8000/payments/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ plan }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "CHECKOUT_CREATE_FAILED");
  }
  const data = await res.json();
  const transactionId = data.transaction_id;
  if (!transactionId) throw new Error("NO_TRANSACTION_ID");

  // 2. Load Paddle.js
  await loadPaddleScript();

  // 3. Configure Paddle
  if (env === "sandbox") {
    window.Paddle.Environment.set("sandbox");
  }
  window.Paddle.Initialize({
    token: clientToken,
    eventCallback: (event: any) => {
      if (event?.name === "checkout.completed") {
        onSuccess?.();
      } else if (event?.name === "checkout.closed") {
        onClose?.();
      }
    },
  });

  // 4. Open overlay
  window.Paddle.Checkout.open({
    transactionId,
    settings: {
      displayMode: "overlay",
      theme: "dark",
      locale: "ar",
      successUrl: window.location.origin + "/payment/success",
    },
  });
}
