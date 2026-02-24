import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { AIAssistant } from "@/components/AIAssistant";
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Star, 
  Clock, 
  MessageSquare,
  Leaf,
  Bug,
  Droplets,
  Sprout,
  FlaskConical
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExpertType {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  avatar: string;
  available: boolean;
  expertise: string[];
}

const allExperts: ExpertType[] = [
  { id: "expert-1", name: "Dr. Rajesh Kumar", specialty: "Plant Pathologist", rating: 4.9, experience: "15 years", avatar: "RK", available: true, expertise: ["plant_pathologist", "leaf_disease"] },
  { id: "expert-2", name: "Prof. Lakshmi Devi", specialty: "Soil Expert", rating: 4.8, experience: "12 years", avatar: "LD", available: true, expertise: ["soil", "nutrition"] },
  { id: "expert-3", name: "Dr. Anil Sharma", specialty: "Pest Control Specialist", rating: 4.7, experience: "10 years", avatar: "AS", available: true, expertise: ["pest_control"] },
  { id: "expert-4", name: "Dr. Meera Patel", specialty: "Crop Nutrition Expert", rating: 4.9, experience: "18 years", avatar: "MP", available: true, expertise: ["nutrition", "soil"] },
  { id: "expert-5", name: "Dr. Suresh Reddy", specialty: "Leaf Disease Specialist", rating: 4.8, experience: "14 years", avatar: "SR", available: false, expertise: ["leaf_disease", "plant_pathologist"] },
  { id: "expert-6", name: "Dr. Priya Nair", specialty: "Water Management Expert", rating: 4.6, experience: "8 years", avatar: "PN", available: true, expertise: ["water_management"] },
  { id: "expert-7", name: "Dr. Vikram Singh", specialty: "Integrated Pest Management", rating: 4.8, experience: "16 years", avatar: "VS", available: true, expertise: ["pest_control", "plant_pathologist"] },
  { id: "expert-8", name: "Dr. Anjali Gupta", specialty: "Plant Pathology & Diseases", rating: 4.7, experience: "11 years", avatar: "AG", available: false, expertise: ["plant_pathologist", "leaf_disease"] },
];

const categoryIcons: Record<string, React.ReactNode> = {
  leaf_disease: <Leaf className="w-6 h-6" />,
  pest_control: <Bug className="w-6 h-6" />,
  water_management: <Droplets className="w-6 h-6" />,
  soil: <Sprout className="w-6 h-6" />,
  nutrition: <FlaskConical className="w-6 h-6" />,
  plant_pathologist: <Sprout className="w-6 h-6" />,
};

const ExpertResults = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [analysis, setAnalysis] = useState<any>(null);
  const [filteredExperts, setFilteredExperts] = useState<ExpertType[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("cropAnalysis");
    if (data) {
      const parsed = JSON.parse(data);
      setAnalysis(parsed);
      
      // Filter experts by category
      const category = parsed.expertCategory;
      const relevant = allExperts.filter(e => e.expertise.includes(category));
      setFilteredExperts(relevant.length > 0 ? relevant : allExperts.slice(0, 3));
    } else {
      navigate("/problem-input");
    }
  }, [navigate]);

  const handleSelectExpert = (expertId: string) => {
    setSelectedExpert(expertId);
  };

  const handleStartChat = () => {
    if (!selectedExpert || !analysis) return;
    
    const expert = filteredExperts.find(e => e.id === selectedExpert);
    if (expert) {
      // Store selected expert and analysis for the chat
      localStorage.setItem("selectedExpertForChat", JSON.stringify({
        expert,
        analysis
      }));
      navigate("/experts", { state: { autoSelectExpert: expert, analysis } });
    }
  };

  if (!analysis) return null;

  const availableCount = filteredExperts.filter(e => e.available).length;
  const severityColors = {
    low: "text-primary bg-primary/10 border-primary/20",
    moderate: "text-amber-600 bg-amber-50 border-amber-200",
    high: "text-destructive bg-destructive/10 border-destructive/20",
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-5xl mx-auto">
        <button
          onClick={() => navigate("/problem-input")}
          className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> {t('common.back')}
        </button>

        {/* Analysis Summary Card */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                {categoryIcons[analysis.expertCategory] || <Sprout className="w-6 h-6" />}
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">
                  {t('expertResults.analysisComplete')}
                </h1>
                <p className="text-muted-foreground text-sm">{analysis.expertCategoryName}</p>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize border ${severityColors[analysis.severity as keyof typeof severityColors]}`}>
              {analysis.severity} {t('expertResults.severity')}
            </span>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 mb-4">
            <h3 className="font-medium text-foreground mb-2">{t('expertResults.diagnosis')}</h3>
            <p className="text-muted-foreground">{analysis.diagnosis}</p>
          </div>

          {analysis.symptoms && analysis.symptoms.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-foreground mb-2">{t('expertResults.identifiedSymptoms')}</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.symptoms.map((symptom: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground mb-2">{t('expertResults.recommendations')}</h3>
              <div className="space-y-2">
                {analysis.recommendations.slice(0, 3).map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expert Availability Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {analysis.expertCategoryName}s {t('expertResults.available')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {availableCount} {t('expertResults.expertsReady')}
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-primary/10 rounded-lg">
            <span className="text-primary font-bold text-lg">{availableCount}</span>
            <span className="text-primary/70 text-sm ml-1">{t('expertResults.online')}</span>
          </div>
        </div>

        {/* Expert Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {filteredExperts.map((expert) => (
            <div 
              key={expert.id} 
              onClick={() => expert.available && handleSelectExpert(expert.id)}
              className={`glass-card rounded-2xl p-5 transition-all cursor-pointer ${
                !expert.available 
                  ? "opacity-60 cursor-not-allowed" 
                  : selectedExpert === expert.id 
                    ? "ring-2 ring-primary border-primary shadow-lg scale-[1.02]" 
                    : "hover:border-primary/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
                  expert.available ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {expert.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{expert.name}</h3>
                    {selectedExpert === expert.id && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <p className="text-primary text-sm font-medium mb-2">{expert.specialty}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" /> {expert.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {expert.experience}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  expert.available 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {expert.available ? t('experts.available') : t('experts.busy')}
                </span>
                {expert.available && (
                  <span className="text-xs text-muted-foreground">
                    {t('expertResults.clickToSelect')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Start Chat Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border md:relative md:bg-transparent md:border-0 md:backdrop-blur-none">
          <div className="max-w-5xl mx-auto">
            <Button 
              onClick={handleStartChat}
              disabled={!selectedExpert}
              size="lg" 
              className="w-full md:w-auto md:min-w-[300px] md:mx-auto md:flex"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {selectedExpert 
                ? `${t('expertResults.startChatWith')} ${filteredExperts.find(e => e.id === selectedExpert)?.name.split(' ')[0]}`
                : t('expertResults.selectExpert')
              }
            </Button>
          </div>
        </div>
      </main>

      <AIAssistant />
    </div>
  );
};

export default ExpertResults;
