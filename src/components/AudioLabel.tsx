import React from "react";
import { Volume2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AudioLabelProps {
  label: string;
  value: string | number;
  ariaLabel?: string;
}

const AudioLabel: React.FC<AudioLabelProps> = ({ label, value, ariaLabel }) => {
  const { language } = useLanguage();

  const handleSpeak = () => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const text = `${label}: ${value}`;
        const u = new SpeechSynthesisUtterance(text);
        u.lang = language === "te" ? "te-IN" : "en-IN";
        window.speechSynthesis.speak(u);
      }
    } catch (e) {
      console.error("Audio speak error:", e);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
      <button
        onClick={handleSpeak}
        className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
        aria-label={ariaLabel || `Read ${label} aloud`}
        title={`Read ${label} aloud`}
      >
        <Volume2 className="w-5 h-5 text-primary" />
      </button>
    </div>
  );
};

export default AudioLabel;
