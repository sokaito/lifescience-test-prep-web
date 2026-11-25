/**
 * Translates Firebase Auth and native Capacitor Google Sign-In errors
 * into clear, user-friendly messages.
 */
export function getFriendlyAuthError(err: any): string {
  const code = String(err?.code || "");
  const rawMessage = String(err?.message || "");
  const host = typeof window !== "undefined" ? window.location.hostname : "";

  if (
    code === "auth/unauthorized-domain" ||
    rawMessage.includes("auth/unauthorized-domain")
  ) {
    return host
      ? `This domain (${host}) is not authorized in Firebase Auth. Please add "${host}" in Firebase Console -> Authentication -> Settings -> Authorized domains, or sign in with Email & Password.`
      : "This domain is not authorized in Firebase Auth. Please add it in Firebase Console -> Authorized domains.";
  }

  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  ) {
    return "Google sign-in popup was closed before completing login. Please try again.";
  }

  if (code === "auth/popup-blocked") {
    return "Sign-in popup was blocked by your browser. Please allow popups or try again.";
  }

  if (code === "auth/email-already-in-use") {
    return "This email is already registered. Please sign in instead or use Google Sign-In.";
  }

  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found"
  ) {
    return "Invalid email or password. If you originally registered with Google, please click 'Google Account' to sign in.";
  }

  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }

  if (code === "auth/weak-password") {
    return "Password should be at least 6 characters long.";
  }

  if (code === "auth/too-many-requests") {
    return "Too many failed attempts. Please wait a few minutes and try again.";
  }

  if (
    code === "auth/network-request-failed" ||
    rawMessage.toLowerCase().includes("network")
  ) {
    return "Network error while contacting Firebase. Please check your internet connection and try again.";
  }

  if (code === "auth/operation-not-allowed") {
    return "This sign-in method is currently disabled in Firebase Console. Please contact support.";
  }

  if (code === "auth/account-exists-with-different-credential") {
    return "An account already exists with this email using a different sign-in method.";
  }

  // Native Android Google Sign-In ApiException codes
  if (code === "10" || rawMessage.includes("10:") || rawMessage.includes("DEVELOPER_ERROR")) {
    return "Android Google Sign-In configuration error (Code 10). Check SHA-1 fingerprint and Web Client ID in Firebase Console.";
  }

  if (code === "12500") {
    return "Google Sign-In failed on this device (Code 12500). Please check Google Play Services and OAuth consent settings.";
  }

  if (code === "7") {
    return "Network error during Google Sign-In. Please check your internet connection.";
  }

  return rawMessage || "Authentication failed. Please try again.";
}
