import { useCallback, useEffect, useRef, useState } from "react";

const SpeechRecognitionImpl =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

/**
 * Browser-native voice pipeline:
 *  - SpeechRecognition for mic → text (customer speaks, we transcribe)
 *  - SpeechSynthesis for text → voice (agent reply is read aloud)
 * No API key, no server round-trip for audio — runs entirely client-side. This is the "bonus"
 * voice integration; swapping in ElevenLabs/OpenAI Realtime would mean replacing this hook's
 * internals while keeping the same {listening, transcript, speak} surface the UI depends on.
 */
export function useSpeech({ onResult } = {}) {
  const supported = Boolean(SpeechRecognitionImpl) && Boolean(window.speechSynthesis);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const interimRef = useRef("");
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!SpeechRecognitionImpl) return;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += text;
        else interim += text;
      }
      setInterimTranscript(interim);
      interimRef.current = interim;
      if (final.trim()) {
        onResultRef.current?.(final.trim());
        setInterimTranscript("");
        interimRef.current = "";
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      if (interimRef.current.trim()) {
        onResultRef.current?.(interimRef.current.trim());
        setInterimTranscript("");
        interimRef.current = "";
      }
    };

    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setListening(true);
    setInterimTranscript("");
    interimRef.current = "";
    try {
      recognitionRef.current.start();
    } catch (err) {
      // ignore if already started
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    if (interimRef.current.trim()) {
      onResultRef.current?.(interimRef.current.trim());
      setInterimTranscript("");
      interimRef.current = "";
    }
  }, []);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const cancelSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { supported, listening, speaking, interimTranscript, startListening, stopListening, speak, cancelSpeaking };
}
