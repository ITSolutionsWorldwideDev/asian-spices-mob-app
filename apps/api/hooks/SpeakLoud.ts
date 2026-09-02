"use client";
import { useState } from "react";

interface ReadAloudParams {
  ID: string;
}

export function useReadAloud() {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const handleReadAloud = ({ ID }: ReadAloudParams): void => {
    if (isSpeaking) {
      // e.preventDefault();
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const element = document.getElementById(ID);
    const textToRead = element?.innerText || "Your fallback text here";

    const utterance = new SpeechSynthesisUtterance(textToRead);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return { isSpeaking, handleReadAloud };
}
