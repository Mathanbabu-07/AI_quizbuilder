"use client";

import { useEffect, useRef, useState } from "react";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: {
    transcript: string;
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
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
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
      let nextFinal = "";
      let nextInterim = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0].transcript.trim();

        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          nextFinal += `${transcript} `;
        } else {
          nextInterim += `${transcript} `;
        }
      }

      if (nextFinal) {
        setFinalTranscript((current) => `${current}${nextFinal}`.trim());
      }

      setInterimTranscript(nextInterim.trim());
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || isListening) {
      return;
    }

    setError(null);
    setFinalTranscript("");
    setInterimTranscript("");
    recognitionRef.current.start();
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
