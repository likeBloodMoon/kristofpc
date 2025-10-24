// components/MessengerShim.tsx
"use client";

import { useEffect } from "react";

/**
 * No-op shim that safely runs only on the client.
 * You can expand it later to handle Messenger/IG in-app browser quirks.
 */
export default function MessengerShim() {
  useEffect(() => {
    // Example: tag HTML if opened inside Facebook/Messenger/Instagram in-app browsers.
    const ua = navigator.userAgent || "";
    const isFB = /FBAN|FBAV/i.test(ua);
    const isIG = /Instagram/i.test(ua);
    const isMessenger = /Messenger/i.test(ua);

    if (isFB || isIG || isMessenger) {
      document.documentElement.classList.add("in-app-browser");
    }
  }, []);

  return null;
}
