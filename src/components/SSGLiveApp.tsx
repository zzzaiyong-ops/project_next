"use client";

import { useEffect, useRef } from "react";

// Import the legacy HTML body as raw string
import bodyHtml from "@/app/legacy/body.html";
// Import the legacy JS as raw string
import appJs from "@/app/legacy/app.js";

export default function SSGLiveApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Inject the legacy HTML
    if (containerRef.current) {
      containerRef.current.innerHTML = bodyHtml;
    }

    // Execute the legacy JavaScript
    const script = document.createElement("script");
    script.textContent = appJs;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return <div ref={containerRef} id="ssglive-root" />;
}
