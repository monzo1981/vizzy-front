"use client";

import React, { useState, useEffect } from "react";
import sentences from "@/constants/placeholderSentences";

type TypewriterPlaceholderProps = {
  fontSize: string;
  isDarkMode: boolean;
};

const TypewriterPlaceholder: React.FC<TypewriterPlaceholderProps> = ({ fontSize, isDarkMode }) => {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const typingSpeed = 30; // Faster typing
    const deletingSpeed = 30; // Faster deleting

    const handleTyping = () => {
      const i = sentenceIndex % sentences.length;
      const fullText = sentences[i];

      setDisplayedText(
        isDeleting
          ? fullText.substring(0, displayedText.length - 1)
          : fullText.substring(0, displayedText.length + 1)
      );

      if (!isDeleting && displayedText === fullText) {
        // Pause before deleting
        setTimeout(() => setIsDeleting(true), 1500); // 1.5 second pause
      } else if (isDeleting && displayedText === "") {
        setIsDeleting(false);
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * sentences.length);
        } while (nextIndex === sentenceIndex);
        setSentenceIndex(nextIndex);
      }
    };

    const timer = setTimeout(
      handleTyping,
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, sentenceIndex]);

  const currentSentence = sentences[sentenceIndex];
  const isArabic = /[\u0600-\u06FF]/.test(currentSentence);

  const style: React.CSSProperties = {
    color: "#C3BFE6",
    fontSize: fontSize,
    fontWeight: "200",
    paddingTop: "0px",
    textAlign: isArabic ? "right" : "left",
    direction: isArabic ? "rtl" : "ltr",
    width: "100%",
    ...(isArabic ? { fontFamily: "Noto Sans Arabic" } : {}),
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex items-start">
      <div style={style}>{displayedText}</div>
    </div>
  );
};

export default TypewriterPlaceholder;