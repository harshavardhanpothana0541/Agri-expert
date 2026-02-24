import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { AIAssistant } from "@/components/AIAssistant";
import { AlertTriangle, CheckCircle, Sprout, MessageSquare, ShoppingBag, ArrowLeft } from "lucide-react";

const AnalysisReport = () => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("analysisResult");
    if (data) {
      setAnalysis(JSON.parse(data));
    } else {
      navigate("/problem-input");
    }
  }, [navigate]);

  if (!analysis) return null;

  const severityColors = {
    low: "text-primary bg-primary/10",
    moderate: "text-amber-600 bg-amber-100",
    high: "text-destructive bg-destructive/10",
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/problem-input")}
          className="flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Problem Input
        </button>

        <div className="glass-card rounded-2xl p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                AI Analysis Report
              </h1>
              <p className="text-muted-foreground">Based on your input</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${severityColors[analysis.severity as keyof typeof severityColors]}`}>
              {analysis.severity} severity
            </span>
          </div>

          {/* Problem Summary */}
          <div className="bg-muted rounded-xl p-4 mb-6">
            <h3 className="font-medium text-foreground mb-2">Your Problem</h3>
            <p className="text-muted-foreground">{analysis.input}</p>
          </div>

          {/* Identified Issue */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-border">
              <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-medium text-foreground">Issue Category</h3>
              <p className="text-primary capitalize font-semibold text-lg">{analysis.category} Problem</p>
            </div>
            <div className="p-4 rounded-xl border border-border">
              <Sprout className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-medium text-foreground">Recommended Expert</h3>
              <p className="text-primary font-semibold text-lg">{analysis.expertType}</p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-8">
            <h3 className="font-semibold text-foreground mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {analysis.recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-foreground">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => navigate("/experts")} size="lg" className="flex-1">
              <MessageSquare className="w-5 h-5 mr-2" />
              Connect to {analysis.expertType}
            </Button>
            <Button onClick={() => navigate("/marketplace")} variant="outline" size="lg" className="flex-1">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Buy Solutions
            </Button>
          </div>
        </div>
      </main>

      <AIAssistant />
    </div>
  );
};

export default AnalysisReport;
