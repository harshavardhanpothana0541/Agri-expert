import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

const VoiceMoistureButton: React.FC = () => {
  const { language } = useLanguage();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return;
    const rec = new Rec();
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    // set recognition language based on app language
    rec.lang = language === 'te' ? 'te-IN' : 'en-IN';
    recognitionRef.current = rec;
  }, [language]);

  const speak = (text: string) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      // prefer a voice that matches selected language
      const pref = voices.find(v => v.lang.startsWith(language === 'te' ? 'te' : 'en')) || voices[0];
      if (pref) utter.voice = pref;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      // fallback to alert
      // eslint-disable-next-line no-alert
      alert(text);
    }
  };

  const fetchMoisture = async (): Promise<number | null> => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/get-moisture");
      if (!res.ok) return null;
      const data = await res.json();
      if (data && typeof data.moisture === 'number') return Math.round(Math.max(0, Math.min(100, Number(data.moisture))));
      return null;
    } catch (e) {
      return null;
    }
  };

  const handleResult = async (transcript: string) => {
    const t = transcript.toLowerCase();
    const keywords = ['moisture', 'soil moisture', 'what is the soil moisture', 'what is moisture', 'తేమ'];
    const matched = keywords.some(k => t.includes(k));
    if (!matched) {
      const msg = language === 'te' ? 'క్షమించండి, దయచేసి తేమ స్థాయిల గురించి అడగండి.' : 'Sorry, please ask about the moisture levels.';
      speak(msg);
      return;
    }

    const val = await fetchMoisture();
    if (val === null) {
      const msg = language === 'te' ? 'డేటా అందుబాటులో లేదు.' : 'Data not available.';
      speak(msg);
      return;
    }

    const reply = language === 'te'
      ? `ప్రస్తుత మట్టిలో తేమ ${val} శాతం.`
      : `The current soil moisture is ${val} percent.`;
    speak(reply);
  };

  const startListening = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    try {
      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);
      rec.onerror = (ev: any) => {
        setListening(false);
        toast.error('Voice recognition error');
      };
      rec.onresult = (ev: any) => {
        const transcript = Array.from(ev.results)
          .map((r: any) => r[0].transcript)
          .join(' ');
        handleResult(transcript);
      };
      rec.start();
    } catch (e) {
      setListening(false);
    }
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    try { rec && rec.stop(); } catch (e) {}
    setListening(false);
  };

  return (
    <div>
      <Button
        onClick={() => (listening ? stopListening() : startListening())}
        className="w-full flex items-center justify-center gap-2"
        variant={listening ? 'destructive' : 'default'}
      >
        {listening ? <X className="w-4 h-4" /> : <Mic className="w-4 h-4" />} {listening ? (language === 'te' ? 'స్టాప్' : 'Stop') : (language === 'te' ? 'వాయిస్' : 'Voice')}
      </Button>
    </div>
  );
};

export default VoiceMoistureButton;
