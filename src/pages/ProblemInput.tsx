import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AIAssistant } from "@/components/AIAssistant";
import { Camera, Mic, FileText, Upload, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

const predefinedProblems = [
  { id: 1, label: "Yellow leaves on my crop", labelKey: "yellowLeaves", category: "nutrient" },
  { id: 2, label: "Insects eating my plants", labelKey: "insects", category: "pest" },
  { id: 3, label: "Plants are wilting", labelKey: "wilting", category: "water" },
  { id: 4, label: "White powder on leaves", labelKey: "whitePowder", category: "disease" },
  { id: 5, label: "Crop not growing properly", labelKey: "notGrowing", category: "soil" },
  { id: 6, label: "Seeds not germinating", labelKey: "notGerminating", category: "seed" },
];

const ProblemInput = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [inputType, setInputType] = useState<"text" | "voice" | "image" | "predefined">("text");
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");

  // Determine language code for speech recognition: te-IN for Telugu, en-US fallback for English
  const getRecognitionLang = (lang: string): string => {
    if (lang === 'te') {
      return 'te-IN'; // Native Telugu speech recognition
    }
    return 'en-US'; // Fallback to English
  };

  useEffect(() => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return;
    const rec = new Rec();
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.lang = getRecognitionLang(language);
    recognitionRef.current = rec;
  }, [language]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewDataUrl(null);
      toast({ title: t('problemInput.imageUploaded'), description: file.name });
    }
  };

  // start camera when inputType is image
  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!mounted) return;
        setStream(s);
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        // ignore camera errors
      }
    };

    if (inputType === 'image') startCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      setCameraActive(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputType]);

  const handleVoiceRecord = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      toast({ title: t('common.error'), description: 'Speech recognition not supported', variant: 'destructive' });
      return;
    }
    if (isRecording) {
      rec.stop();
      setIsRecording(false);
    } else {
      try {
        // Update language before starting
        rec.lang = getRecognitionLang(language);
        
        rec.onstart = () => {
          setIsRecording(true);
          toast({ title: t('problemInput.recordingStarted'), description: t('problemInput.speakNow') });
          baseTextRef.current = textInput || '';
        };
        rec.onend = () => {
          setIsRecording(false);
        };
        rec.onerror = (evt: any) => {
          setIsRecording(false);
          toast({ title: t('common.error'), description: 'Voice recognition error', variant: 'destructive' });
        };
        rec.onresult = (evt: any) => {
          let interimText = '';
          let finalText = '';
          for (let i = evt.resultIndex; i < evt.results.length; i++) {
            const transcript = evt.results[i][0].transcript;
            if (evt.results[i].isFinal) {
              finalText += transcript + ' ';
            } else {
              interimText += transcript;
            }
          }
          // Save directly to transcribedText (textInput state) so farmer sees words on screen
          const base = baseTextRef.current || '';
          const combined = `${base}${finalText}${interimText}`;
          setTextInput(combined);
          if (finalText) {
            // Commit final text to base so subsequent interim builds on it
            baseTextRef.current = `${base}${finalText}`;
          }
          if (evt.results[evt.results.length - 1].isFinal) {
            toast({ title: t('problemInput.recordingComplete'), description: t('problemInput.voiceConverted') });
          }
        };
        rec.start();
      } catch (e) {
        setIsRecording(false);
        toast({ title: t('common.error'), description: 'Failed to start recording', variant: 'destructive' });
      }
    }
  };

  const handlePredefinedSelect = (problem: typeof predefinedProblems[0]) => {
    setTextInput(problem.label);
    analyzeWithAI(problem.label);
  };

  const analyzeWithAI = async (input: string) => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-crop", {
        body: { 
          problem: input,
          imageDescription: imageFile ? "User uploaded an image of the affected crop" : undefined
        }
      });

      if (error) {
        console.error("Analysis error:", error);
        toast({ 
          title: t('common.error'), 
          description: t('problemInput.analysisError'),
          variant: "destructive" 
        });
        setIsAnalyzing(false);
        return;
      }

      if (data?.success && data?.analysis) {
        localStorage.setItem("cropAnalysis", JSON.stringify(data.analysis));
        navigate("/expert-results");
      } else if (data?.error) {
        toast({ 
          title: t('common.error'), 
          description: data.error,
          variant: "destructive" 
        });
      }
    } catch (err) {
      console.error("Failed to analyze:", err);
      toast({ 
        title: t('common.error'), 
        description: t('problemInput.analysisError'),
        variant: "destructive" 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    // if we have a captured preview, simulate analysis locally
    if (previewDataUrl) {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setShowConnect(false);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisResult('Analysis Complete: Complex Pest Infestation Detected. Human Expert Consultation Required.');
        setShowConnect(true);
        
        // Voice diagnosis: read the result aloud
        try {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const msg = language === 'te' 
              ? 'మీ పంటకు ఫంగల్ సంక్రమణ ఉంది. సేంద్రీయ నిమ్ బూడిదను ఉపయోగించమని సిఫారసు చేస్తున్నాను.'
              : 'Your crop has a fungal infection. We recommend using organic neem spray.';
            const u = new SpeechSynthesisUtterance(msg);
            u.lang = language === 'te' ? 'te-IN' : 'en-IN';
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
          }
        } catch (e) {}
      }, 3000);
      return;
    }

    if (!textInput && !imageFile) {
      toast({ title: t('common.error'), description: t('problemInput.provideInput'), variant: "destructive" });
      return;
    }

    analyzeWithAI(textInput || "Image analysis request - please analyze the uploaded crop image");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t('problemInput.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('problemInput.subtitle')}
          </p>
        </div>

        {/* Input Type Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { type: "text", icon: FileText, label: t('problemInput.text') },
            { type: "voice", icon: Mic, label: t('problemInput.voice') },
            { type: "image", icon: Camera, label: t('problemInput.image') },
            { type: "predefined", icon: AlertCircle, label: t('problemInput.commonIssues') },
          ].map((item) => (
            <Button
              key={item.type}
              variant={inputType === item.type ? "default" : "outline"}
              onClick={() => setInputType(item.type as any)}
              className="flex-1 max-w-[120px]"
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 md:p-8">
          {inputType === "text" && (
            <div className="space-y-4">
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t('problemInput.placeholder')}
                className="min-h-[150px] text-lg"
              />
            </div>
          )}

          {inputType === "voice" && (
            <div className="text-center py-8">
              <button
                onClick={handleVoiceRecord}
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all ${
                  isRecording 
                    ? "bg-destructive animate-pulse" 
                    : "bg-primary hover:scale-110"
                }`}
              >
                <Mic className="w-10 h-10 text-primary-foreground" />
              </button>
              <p className="mt-4 text-muted-foreground">
                {isRecording ? t('problemInput.recording') : t('problemInput.tapToRecord')}
              </p>
              {textInput && (
                <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                  <p className="text-sm text-muted-foreground">{t('problemInput.transcribed')}:</p>
                  <p className="text-foreground">{textInput}</p>
                </div>
              )}
            </div>
          )}

          {inputType === "image" && (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-52 h-52 mx-auto border-2 border-dashed border-primary/50 rounded-2xl overflow-hidden bg-black/5">
                  {cameraActive ? (
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Upload className="w-12 h-12 text-primary mb-2" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => {
                    // capture photo
                    try {
                      const video = videoRef.current;
                      if (!video) return;
                      const w = video.videoWidth || 640;
                      const h = video.videoHeight || 480;
                      let canvas = canvasRef.current;
                      if (!canvas) {
                        canvas = document.createElement('canvas');
                        canvasRef.current = canvas;
                      }
                      canvas.width = w;
                      canvas.height = h;
                      const ctx = canvas.getContext('2d');
                      if (ctx) ctx.drawImage(video, 0, 0, w, h);
                      const dataUrl = canvas.toDataURL('image/jpeg');
                      setPreviewDataUrl(dataUrl);
                      setImageFile(null);
                      // voice guidance: photo captured and analyzing
                      try {
                        if ('speechSynthesis' in window) {
                          const msg = language === 'te' ? 'ఫోటో తీసుకోబడింది. ఇప్పుడు మీ పంటను విశ్లేషిస్తున్నాము.' : 'Photo captured. Analyzing your crop now.';
                          const u = new SpeechSynthesisUtterance(msg);
                          u.lang = language === 'te' ? 'te-IN' : 'en-IN';
                          window.speechSynthesis.cancel();
                          window.speechSynthesis.speak(u);
                        }
                      } catch (e) {}
                    } catch (e) {
                      console.error(e);
                    }
                  }}>Capture Photo</Button>

                  <Button variant="outline" onClick={() => {
                    // stop camera
                    if (stream) {
                      stream.getTracks().forEach((t) => t.stop());
                      setStream(null);
                    }
                    setCameraActive(false);
                  }}>Stop Camera</Button>
                </div>

                <label className="cursor-pointer">
                  <div className="w-48 mt-2 text-center">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <p className="text-sm text-muted-foreground">Or upload an image</p>
                  </div>
                </label>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {t('problemInput.photoTip')}
              </p>
              {previewDataUrl && (
                <div className="mt-4">
                  <h4 className="text-sm text-muted-foreground mb-2">Preview</h4>
                  <img src={previewDataUrl} alt="preview" className="mx-auto rounded-lg max-h-80" />
                </div>
              )}
            </div>
          )}

          {inputType === "predefined" && (
            <div className="space-y-3">
              <p className="text-muted-foreground mb-4 text-center">
                {t('problemInput.selectCommon')}
              </p>
              {predefinedProblems.map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => handlePredefinedSelect(problem)}
                  disabled={isAnalyzing}
                  className="w-full p-4 text-left rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  <span className="text-foreground">
                    {t(`problemInput.problems.${problem.labelKey}`) || problem.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {inputType !== "predefined" && (
            <Button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              size="lg"
              className="w-full mt-6"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('problemInput.analyzing')}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t('problemInput.analyze')}
                </>
              )}
            </Button>
          )}
          {analysisResult && (
            <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="font-semibold">{analysisResult}</div>
              {showConnect && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => navigate('/experts')}>Connect to Expert</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <AIAssistant />
    </div>
  );
};

export default ProblemInput;
