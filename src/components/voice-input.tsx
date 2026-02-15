"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VoiceInputProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

export function VoiceInput({
  onTranscript,
  disabled,
  className,
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<{ start: () => void; stop: () => void; abort: () => void } | null>(null);

  useEffect(() => {
    const w = typeof window !== "undefined" ? (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }) : null;
    const API = w && (w.SpeechRecognition || w.webkitSpeechRecognition);
    setSupported(!!API);
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const start = () => {
    if (!supported || disabled) return;
    const w = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const API = (w.SpeechRecognition || w.webkitSpeechRecognition) as new () => {
      start: () => void;
      stop: () => void;
      abort: () => void;
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: (e: unknown) => void;
      onerror: () => void;
      onend: () => void;
    };
    if (!API) return;
    const rec = new API();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: unknown) => {
      const ev = e as { results?: { length: number; [i: number]: { isFinal?: boolean; length?: number; [j: number]: { transcript?: string } } } };
      const results = ev?.results;
      if (!results?.length) return;
      const last = results[results.length - 1];
      if (last?.isFinal) {
        const parts: string[] = [];
        const len = last.length ?? 0;
        for (let i = 0; i < len; i++) {
          const r = (last as { [j: number]: { transcript?: string } })[i];
          if (r?.transcript) parts.push(r.transcript);
        }
        const text = parts.join(" ").trim();
        if (text) onTranscript(text);
      }
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    try {
      rec.start();
      recognitionRef.current = rec;
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const stop = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggle = () => {
    if (isRecording) stop();
    else start();
  };

  if (supported === false) {
    return (
      <Button
        size="icon"
        variant="ghost"
        className={cn("h-8 w-8 cursor-not-allowed opacity-50", className)}
        disabled
        title="Voice input is not supported in this browser"
        aria-label="Voice input not supported"
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      title={isRecording ? "Stop recording" : "Voice input"}
      className={cn(
        "h-8 w-8",
        isRecording && "text-red-400 bg-red-500/10",
        className
      )}
      onClick={toggle}
      disabled={disabled}
      aria-label={isRecording ? "Stop recording" : "Start voice input"}
    >
      {isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
