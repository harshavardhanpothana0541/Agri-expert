import React, { useState, useRef, useEffect } from "react";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

const VoiceAssistant: React.FC = () => {
  const { language } = useLanguage();
  const [listening, setListening] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return;
    const rec = new Rec();
    rec.interimResults = true;
    rec.lang = language === "te" ? "te-IN" : "en-IN";
    recognitionRef.current = rec;
  }, [language]);

  const speak = (text: string) => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = language === "te" ? "te-IN" : "en-IN";
        window.speechSynthesis.speak(u);
      }
    } catch (e) {
      console.error("Speak error:", e);
    }
  };

  const handleMicClick = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      toast.error("Voice not supported on this device");
      return;
    }

    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.lang = language === "te" ? "te-IN" : "en-IN";
        rec.onstart = () => {
          setListening(true);
          setShowPanel(true);
        };
        rec.onend = () => setListening(false);
        rec.onerror = (e: any) => {
          setListening(false);
          toast.error("Voice recognition error");
        };
        rec.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + " ";
          }

          if (event.results[event.results.length - 1].isFinal) {
            setListening(false);
            // send to backend or process locally
            const helpText =
              language === "te"
                ? "మీ ప్రశ్నను వినాను. కృపया ఒక క్షణం ఆలోచించండి."
                : "I heard your question. Let me think about that.";
            speak(helpText);
          }
        };
        rec.start();
      } catch (e) {
        console.error(e);
        setListening(false);
      }
    }
  };

  return (
    <>
      {/* Floating Microphone Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <Button
          onClick={handleMicClick}
          className={`w-16 h-16 rounded-full shadow-lg transition-all ${
            listening
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : "bg-primary hover:bg-primary/90"
          }`}
          aria-label="Voice assistant"
        >
          <Mic className="w-8 h-8 text-white" />
        </Button>
      </div>

      {/* Voice Panel */}
      {showPanel && (
        <div className="fixed bottom-24 right-8 z-40 bg-white rounded-lg shadow-xl p-4 max-w-xs border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Voice Assistant</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {listening
              ? "Listening... Speak now"
              : "Click mic to ask a question"}
          </p>
          {listening && (
            <div className="mt-3 flex gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-200" />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;
