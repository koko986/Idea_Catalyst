"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pyanthit-install-dismissed";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
}

export function PwaInstall() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || window.localStorage.getItem(DISMISS_KEY)) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setShowIosHelp(ios);
    setVisible(ios);

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setVisible(true);
    }

    function onInstalled() {
      setVisible(false);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setPromptEvent(null);
  }

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="install-card" aria-label="Install PyanThit mobile app">
      <div className="install-icon" aria-hidden="true">PT</div>
      <div className="install-copy">
        <strong>Get the PyanThit app</strong>
        {showIosHelp ? (
          <span><Share size={14}/> Tap Share, then “Add to Home Screen”.</span>
        ) : (
          <span>Install for quick, full-screen access.</span>
        )}
      </div>
      {promptEvent && (
        <button className="btn btn-primary install-action" type="button" onClick={install}>
          <Download size={16}/> Install
        </button>
      )}
      <button className="install-close" type="button" aria-label="Dismiss install suggestion" onClick={dismiss}>
        <X size={18}/>
      </button>
    </aside>
  );
}
