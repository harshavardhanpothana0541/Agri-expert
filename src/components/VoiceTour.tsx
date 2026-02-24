import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface VoiceTourStep {
  text: string;
  highlightSelector?: string;
  duration?: number;
}

const VoiceTour: React.FC = () => {
  const { language } = useLanguage();
  const [isNewUser, setIsNewUser] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(
    null
  );

  const tourSteps: VoiceTourStep[] = [
    {
      text:
        language === "te"
          ? "ఎగురవేలి, AgriExpert కి స్వాగతం. నేను మీ సహాయకుడిని."
          : "Welcome to AgriExpert. I am your farming assistant.",
      duration: 3000,
    },
    {
      text:
        language === "te"
          ? "ఈ ట్రాక్టర్ చిహ్నం సরిపెట్టడానికి నొక్కండి."
          : "Tap the tractor icon to rent equipment.",
      highlightSelector: "[aria-label*='Rentals']",
      duration: 4000,
    },
    {
      text:
        language === "te"
          ? "ఈ కెమెరా చిహ్నం ఫసలు సమస్యలను సరిపెట్టడానికి నొక్కండి."
          : "Tap the camera icon to diagnose crop problems.",
      highlightSelector: "[aria-label*='Scan']",
      duration: 4000,
    },
    {
      text:
        language === "te"
          ? "మీ ప్రశ్నల కోసం ఎల్లప్పుడూ ఈ మైక్ బటన్ ఉపయోగించండి."
          : "Always use the microphone button to ask questions.",
      highlightSelector: "[aria-label*='Voice']",
      duration: 4000,
    },
  ];

  // Check if new user on mount
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("voiceTourSeen");
    if (!hasSeenTour) {
      setIsNewUser(true);
      localStorage.setItem("voiceTourSeen", "true");
      startTour();
    }
  }, []);

  const startTour = () => {
    setCurrentStep(0);
    playStep(0);
  };

  const playStep = (stepIndex: number) => {
    if (stepIndex >= tourSteps.length) {
      endTour();
      return;
    }

    const step = tourSteps[stepIndex];

    // Speak the step
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(step.text);
        u.lang = language === "te" ? "te-IN" : "en-IN";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    } catch (e) {
      console.error("Speak error:", e);
    }

    // Highlight element if selector provided
    if (step.highlightSelector) {
      setTimeout(() => {
        const elem = document.querySelector(step.highlightSelector!);
        if (elem instanceof HTMLElement) {
          setHighlightedElement(elem);
          elem.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }

    // Move to next step
    setTimeout(() => {
      setHighlightedElement(null);
      setCurrentStep(stepIndex + 1);
      playStep(stepIndex + 1);
    }, step.duration || 3000);
  };

  const endTour = () => {
    setIsNewUser(false);
    setHighlightedElement(null);
  };

  if (!isNewUser) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={endTour} />

      {/* Highlight Box */}
      {highlightedElement && (
        <div
          className="fixed z-50 border-4 border-yellow-400 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 10,
            left: highlightedElement.getBoundingClientRect().left - 10,
            width:
              highlightedElement.getBoundingClientRect().width + 20,
            height:
              highlightedElement.getBoundingClientRect().height + 20,
          }}
        />
      )}

      {/* Tour Panel */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl p-6 max-w-sm">
        <h2 className="text-xl font-bold mb-4">
          {language === "te" ? "సూచన" : "Tip"}
        </h2>
        <p className="text-base mb-6">{tourSteps[currentStep]?.text}</p>
        <Button
          onClick={endTour}
          className="w-full"
        >
          {language === "te" ? "గుర్తించండి" : "Got it"}
        </Button>
      </div>
    </>
  );
};

export default VoiceTour;
