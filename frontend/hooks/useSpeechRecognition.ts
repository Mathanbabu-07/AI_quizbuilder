"use client";

import { useEffect, useRef, useState } from "react";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: {
    transcript: string;
    confidence?: number;
  };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: null | (() => void);
  onend: null | (() => void);
  onerror: null | ((event: { error: string }) => void);
  onresult: null | ((event: SpeechRecognitionEventLike) => void);
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalSegmentsRef = useRef<string[]>([]);
  const interimRef = useRef("");
  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setSupported(false);
      return;
    }

    setSupported(true);

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setError(null);
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript("");

      if (event.error === "not-allowed") {
        setError("Microphone permission is blocked. Allow microphone access to use voice prompting.");
        return;
      }

      if (event.error === "no-speech") {
        setError("No speech detected. Try speaking a little closer to the microphone.");
        return;
      }

      setError("Voice input was interrupted. Please try again.");
    };

    recognition.onresult = (event) => {
      const nextFinalSegments: string[] = [];
      let nextInterim = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = cleanupTranscript(result[0].transcript);
        const confidence = result[0].confidence ?? 1;

        if (!transcript || confidence < 0.35) {
          continue;
        }

        if (result.isFinal) {
          nextFinalSegments.push(transcript);
        } else {
          nextInterim = mergeTranscript(nextInterim, transcript);
        }
      }

      if (nextFinalSegments.length > 0) {
        for (const segment of nextFinalSegments) {
          const previous = finalSegmentsRef.current.at(-1) ?? "";
          const merged = mergeTranscript(previous, segment);

          if (merged === previous) {
            continue;
          }

          if (merged !== segment && previous) {
            finalSegmentsRef.current[finalSegmentsRef.current.length - 1] = merged;
          } else {
            finalSegmentsRef.current.push(segment);
          }
        }

        setFinalTranscript(cleanupTranscript(finalSegmentsRef.current.join(" ")));
      }

      if (nextInterim !== interimRef.current) {
        interimRef.current = nextInterim;
        window.requestAnimationFrame(() => setInterimTranscript(nextInterim));
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort?.();
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || isListening) {
      return;
    }

    setError(null);
    finalSegmentsRef.current = [];
    interimRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
    try {
      recognitionRef.current.start();
    } catch {
      setError("Voice input is already starting. Try again in a moment.");
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  return {
    supported,
    isListening,
    finalTranscript,
    interimTranscript,
    error,
    startListening,
    stopListening
  };
}

function cleanupTranscript(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([?.!,])/g, "$1")
    .trim();
}

function mergeTranscript(base: string, addition: string): string {
  const cleanBase = cleanupTranscript(base);
  const cleanAddition = cleanupTranscript(addition);

  if (!cleanBase) {
    return cleanAddition;
  }
  if (!cleanAddition) {
    return cleanBase;
  }

  const baseWords = cleanBase.split(" ");
  const additionWords = cleanAddition.split(" ");
  const maxOverlap = Math.min(baseWords.length, additionWords.length, 8);

  for (let size = maxOverlap; size > 0; size -= 1) {
    const baseTail = baseWords.slice(-size).join(" ").toLowerCase();
    const additionHead = additionWords.slice(0, size).join(" ").toLowerCase();

    if (baseTail === additionHead) {
      return cleanupTranscript([...baseWords, ...additionWords.slice(size)].join(" "));
    }
  }

  if (cleanBase.toLowerCase().endsWith(cleanAddition.toLowerCase())) {
    return cleanBase;
  }

  return cleanupTranscript(`${cleanBase} ${cleanAddition}`);
}
