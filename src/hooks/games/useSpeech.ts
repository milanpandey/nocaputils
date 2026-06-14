"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function getKidFriendlyVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Preference order: warm, clear English female voices
  const preferred = [
    "Google UK English Female",
    "Google US English",
    "Microsoft Zira",
    "Samantha",
    "Karen",
    "Moira",
    "Fiona",
  ];

  for (const name of preferred) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }

  // Fallback: any English female voice
  const englishFemale = voices.find(
    (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
  );
  if (englishFemale) return englishFemale;

  // Fallback: any English voice
  const english = voices.find((v) => v.lang.startsWith("en"));
  if (english) return english;

  return voices[0] || null;
}

export function useSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const enabledRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSupported(true);

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voiceRef.current = getKidFriendlyVoice(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const speak = useCallback(
    (text: string, rate = 0.85, pitch = 1.1): Promise<void> => {
      return new Promise((resolve) => {
        if (!isSupported || !enabledRef.current) return resolve();

        const synth = window.speechSynthesis;
        synth.cancel(); // stop any current speech

        const utterance = new SpeechSynthesisUtterance(text);
        if (voiceRef.current) {
          utterance.voice = voiceRef.current;
        }
        utterance.rate = rate;
        utterance.pitch = pitch;

        let hasResolved = false;
        const complete = () => {
          if (!hasResolved) {
            hasResolved = true;
            setIsSpeaking(false);
            resolve();
          }
        };

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = complete;
        utterance.onerror = complete;

        synth.speak(utterance);

        // Fallback timeout in case onend never fires (common browser bug)
        setTimeout(complete, text.length * 100 + 3000);
      });
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    if (!enabled) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking, isSupported, setEnabled };
}
