import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIAssistant } from "@/components/AIAssistant";
import AudioLabel from "@/components/AudioLabel";
import MoistureDashboard from "@/components/MoistureDashboard";
import { Droplets, RefreshCw, MessageSquare, AlertTriangle, CheckCircle, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface SoilReading {
  id: string;
  device_id: string;
  moisture_percentage: number;
  moisture_status: string;
  created_at: string;
}

interface AnalysisResult {
  success: boolean;
  moisture_percentage: number;
  status: string;
  analysis: string;
  recommendations: string[];
  needs_expert_consultation: boolean;
  expert_category?: string;
  expert_specialty?: string;
}

const SoilMonitor = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [deviceId, setDeviceId] = useState("");
  const [moistureValue, setMoistureValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [recentReadings, setRecentReadings] = useState<SoilReading[]>([]);

  useEffect(() => {
    loadRecentReadings();
  }, []);

  const loadRecentReadings = async () => {
    const { data, error } = await supabase
      .from('soil_moisture_readings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRecentReadings(data as SoilReading[]);
    }
  };

  const handleSubmitReading = async () => {
    if (!deviceId.trim()) {
      toast.error("Please enter a device ID");
      return;
    }

    const moisture = parseFloat(moistureValue);
    if (isNaN(moisture) || moisture < 0 || moisture > 100) {
      toast.error("Please enter a valid moisture percentage (0-100)");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await supabase.functions.invoke('soil-moisture', {
        body: {
          device_id: deviceId,
          moisture_percentage: moisture,
          farmer_id: user?.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setAnalysisResult(response.data);
      toast.success("Soil moisture analyzed successfully!");
      loadRecentReadings();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to analyze soil moisture");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectToExpert = () => {
    // Navigate to experts page with soil expert pre-selected
    navigate("/experts", {
      state: {
        autoSelectExpert: {
          id: "expert-2",
          name: "Prof. Lakshmi Devi",
          specialty: "Soil Expert",
          rating: 4.8,
          experience: "12 years",
          avatar: "LD",
          available: true
        },
        analysis: {
          expertCategory: "soil",
          expertCategoryName: "Soil Problems",
          originalInput: `Soil moisture reading: ${analysisResult?.moisture_percentage}% (${analysisResult?.status}). ${analysisResult?.analysis}`,
          diagnosis: analysisResult?.analysis
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Dry": return "text-red-500 bg-red-500/10";
      case "Low": return "text-orange-500 bg-orange-500/10";
      case "Optimal": return "text-green-500 bg-green-500/10";
      case "High": return "text-blue-500 bg-blue-500/10";
      case "Excess": return "text-purple-500 bg-purple-500/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Dry":
      case "Excess":
        return <AlertTriangle className="w-5 h-5" />;
      case "Low":
      case "High":
        return <Gauge className="w-5 h-5" />;
      case "Optimal":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Droplets className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Droplets className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Soil Moisture Monitor
          </h1>
          <p className="text-muted-foreground">
            Connect your Arduino Nano sensor to monitor soil moisture levels
          </p>
        </div>

        {/* Live Moisture Dashboard */}
        <div className="mb-8">
          <MoistureDashboard />
        </div>

        {/* Input Form */}
        <div className="glass-card rounded-2xl p-6 mb-8 max-w-xl mx-auto">
          <h2 className="font-semibold text-foreground mb-4">Submit Sensor Reading</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Device ID</label>
              <Input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="e.g., ARDUINO-NANO-001"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Moisture Percentage (0-100)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={moistureValue}
                onChange={(e) => setMoistureValue(e.target.value)}
                placeholder="e.g., 45"
              />
            </div>
            <Button 
              onClick={handleSubmitReading} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Gauge className="w-4 h-4 mr-2" />
                  Analyze Soil Moisture
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Analysis Result */}
        {analysisResult && (
          <div className="glass-card rounded-2xl p-6 mb-8 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${getStatusColor(analysisResult.status)}`}>
                {getStatusIcon(analysisResult.status)}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Moisture Level: {analysisResult.moisture_percentage}%
                </h3>
                <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(analysisResult.status)}`}>
                  {analysisResult.status}
                </span>
              </div>
            </div>
            
            {/* Audio Label for moisture reading */}
            <div className="mb-4">
              <AudioLabel 
                label="Soil Moisture" 
                value={`${analysisResult.moisture_percentage}% (${analysisResult.status})`}
              />
            </div>

            <p className="text-muted-foreground mb-4">{analysisResult.analysis}</p>
            
            <div className="mb-4">
              <h4 className="font-medium text-foreground mb-2">Recommendations:</h4>
              <ul className="space-y-2">
                {analysisResult.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {analysisResult.needs_expert_consultation && (
              <div className="border-t border-border pt-4">
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Expert consultation recommended
                </p>
                <Button onClick={handleConnectToExpert} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Connect with Soil Expert
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Recent Readings */}
        {recentReadings.length > 0 && (
          <div className="glass-card rounded-2xl p-6 max-w-xl mx-auto">
            <h2 className="font-semibold text-foreground mb-4">Recent Readings</h2>
            <div className="space-y-3">
              {recentReadings.map((reading) => (
                <div 
                  key={reading.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getStatusColor(reading.moisture_status)}`}>
                      {getStatusIcon(reading.moisture_status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {reading.moisture_percentage}% - {reading.moisture_status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Device: {reading.device_id}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(reading.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Documentation */}
        <div className="glass-card rounded-2xl p-6 mt-8 max-w-xl mx-auto">
          <h2 className="font-semibold text-foreground mb-4">Arduino Integration</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Send POST requests from your Arduino Nano to the API endpoint:
          </p>
          <code className="block bg-muted p-4 rounded-lg text-xs overflow-x-auto mb-4">
            POST https://suwmvtrlittsxilhngwm.supabase.co/functions/v1/soil-moisture
            {"\n"}Content-Type: application/json
            {"\n\n"}{"{"}"device_id": "ARDUINO-001", "moisture_percentage": 45{"}"}
          </code>
          <p className="text-xs text-muted-foreground">
            The API will analyze the moisture level and return recommendations.
          </p>
        </div>
      </main>

      <AIAssistant />
    </div>
  );
};

export default SoilMonitor;
