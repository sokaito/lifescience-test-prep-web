"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Safely detects whether the app is running inside a native Capacitor wrapper (Android/iOS APK).
 * Starts with `isReady: false` during SSR/hydration so web-only APK download banners
 * never flash briefly inside the installed Android app.
 */
export function useIsNativeApp() {
  const [state, setState] = useState({ isNativeApp: false, isReady: false });

  useEffect(() => {
    let native = false;
    try {
      native = Capacitor.isNativePlatform();
    } catch {
      native = false;
    }
    setState({ isNativeApp: native, isReady: true });
  }, []);

  return state;
}
