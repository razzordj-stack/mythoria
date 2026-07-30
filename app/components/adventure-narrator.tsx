"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type NarrationState = "idle" | "speaking" | "paused";

export function AdventureNarrator({
  text,
  narrationId,
}: {
  text: string;
  narrationId: string;
}) {
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<NarrationState>("idle");
  const [autoRead, setAutoRead] = useState(false);
  const initialNarration = useRef(true);

  useEffect(() => {
    const available =
      "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    const timer = window.setTimeout(() => {
      setSupported(available);
      setAutoRead(
        available &&
          window.localStorage.getItem("mythoria-narration-autoplay") === "true",
      );
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (available) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(() => {
    if (!supported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find((voice) => voice.lang.toLowerCase() === "de-de") ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("de")) ??
      null;
    utterance.lang = "de-DE";
    utterance.rate = 0.95;
    utterance.pitch = 0.92;
    utterance.onstart = () => setState("speaking");
    utterance.onpause = () => setState("paused");
    utterance.onresume = () => setState("speaking");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    window.speechSynthesis.speak(utterance);
  }, [supported, text]);

  useEffect(() => {
    if (!narrationId) return;
    if (initialNarration.current) {
      initialNarration.current = false;
      return;
    }
    if (autoRead) speak();
  }, [autoRead, narrationId, speak]);

  function togglePause() {
    if (state === "speaking") {
      window.speechSynthesis.pause();
      setState("paused");
    } else if (state === "paused") {
      window.speechSynthesis.resume();
      setState("speaking");
    }
  }

  function stop() {
    window.speechSynthesis.cancel();
    setState("idle");
  }

  function changeAutoRead(enabled: boolean) {
    setAutoRead(enabled);
    window.localStorage.setItem(
      "mythoria-narration-autoplay",
      String(enabled),
    );
  }

  if (!text) return null;

  return (
    <section
      className="mt-2 flex flex-col gap-2 rounded-xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Vorleser für die aktuelle Chronik"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span aria-hidden="true" className="text-[var(--mythoria-green-bright)]">
          ◖
        </span>
        <p className="truncate text-xs text-[var(--mythoria-text-muted)]">
          {supported
            ? state === "speaking"
              ? "Szene wird vorgelesen"
              : state === "paused"
                ? "Vorlesen pausiert"
                : "Chronik vorlesen"
            : "Vorlesen nicht unterstützt"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="mr-1 flex cursor-pointer items-center gap-1.5 text-xs text-[var(--mythoria-text-secondary)]">
          <input
            type="checkbox"
            checked={autoRead}
            disabled={!supported}
            onChange={(event) => changeAutoRead(event.target.checked)}
            className="h-4 w-4 accent-[var(--mythoria-green-bright)]"
          />
          Auto
        </label>
        <button
          type="button"
          onClick={speak}
          disabled={!supported || state === "speaking"}
          className="mythoria-button-primary min-h-0 px-3 py-1.5 text-xs"
        >
          {state === "paused" ? "Neu" : "▶ Vorlesen"}
        </button>
        <button
          type="button"
          onClick={togglePause}
          disabled={!supported || state === "idle"}
          className="mythoria-button-secondary min-h-0 px-3 py-1.5 text-xs"
        >
          {state === "paused" ? "▶ Weiter" : "Ⅱ Pause"}
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={!supported || state === "idle"}
          className="mythoria-button-secondary min-h-0 px-3 py-1.5 text-xs"
        >
          ■ Stopp
        </button>
      </div>
    </section>
  );
}
