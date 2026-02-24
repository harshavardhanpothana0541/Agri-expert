import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { AIAssistant } from "@/components/AIAssistant";
import { 
  MessageSquare, Users, Clock, CheckCircle, AlertCircle, 
  Sprout, Droplets, ArrowRight, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface FarmerConsultation {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  issue_category: string | null;
  issue_description: string | null;
  status: string | null;
  source_type: string | null;
  consultation_completed: boolean | null;
  created_at: string;
  updated_at: string;
}

const ExpertDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<FarmerConsultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "waiting" | "active" | "completed">("all");

  useEffect(() => {
    loadConsultations();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('expert-consultations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expert_conversations'
        },
        () => {
          loadConsultations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConsultations = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("expert_conversations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading consultations:", error);
      toast.error("Failed to load consultations");
    } else if (data) {
      // Fetch profile names for each consultation
      const consultationsWithNames = await Promise.all(
        data.map(async (consultation) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", consultation.farmer_id)
            .single();
          
          return {
            ...consultation,
            farmer_name: profile?.full_name || "Anonymous Farmer"
          };
        })
      );
      
      setConsultations(consultationsWithNames);
    }
    
    setIsLoading(false);
  };

  const getFilteredConsultations = () => {
    switch (activeFilter) {
      case "waiting":
        return consultations.filter(c => c.status === "active" && !c.consultation_completed);
      case "active":
        return consultations.filter(c => c.status === "active");
      case "completed":
        return consultations.filter(c => c.consultation_completed);
      default:
        return consultations;
    }
  };

  const handleJoinChat = async (consultation: FarmerConsultation) => {
    // Update status to show expert has joined
    await supabase
      .from("expert_conversations")
      .update({ status: "in_progress" })
      .eq("id", consultation.id);

    // Navigate to expert chat interface
    navigate(`/experts/chat/${consultation.id}`, {
      state: { consultation }
    });
  };

  const markAsCompleted = async (consultationId: string) => {
    const { error } = await supabase
      .from("expert_conversations")
      .update({ 
        consultation_completed: true,
        status: "completed"
      })
      .eq("id", consultationId);

    if (error) {
      toast.error("Failed to mark as completed");
    } else {
      toast.success("Consultation marked as completed");
      loadConsultations();
    }
  };

  const getStatusBadge = (status: string | null, completed?: boolean) => {
    if (completed) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    }
    
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-600">
            <Clock className="w-3 h-3" />
            Waiting
          </span>
        );
      case "in_progress":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-600">
            <MessageSquare className="w-3 h-3" />
            In Chat
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            {status || "Unknown"}
          </span>
        );
    }
  };

  const getIssueIcon = (category: string | null, sourceType: string) => {
    if (sourceType === "soil_sensor") {
      return <Droplets className="w-5 h-5 text-blue-500" />;
    }
    return <Sprout className="w-5 h-5 text-primary" />;
  };

  const stats = {
    total: consultations.length,
    waiting: consultations.filter(c => c.status === "active" && !c.consultation_completed).length,
    inProgress: consultations.filter(c => c.status === "in_progress").length,
    completed: consultations.filter(c => c.consultation_completed).length
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Expert Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage farmer consultations and provide expert advice
            </p>
          </div>
          <Button onClick={loadConsultations} variant="outline" className="mt-4 md:mt-0">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 rounded-xl">
            <Users className="w-8 h-8 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Consultations</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <Clock className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.waiting}</p>
            <p className="text-sm text-muted-foreground">Waiting</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <MessageSquare className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All" },
            { key: "waiting", label: "Waiting" },
            { key: "active", label: "Active" },
            { key: "completed", label: "Completed" }
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.key as any)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Consultations List */}
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading consultations...</p>
          </div>
        ) : getFilteredConsultations().length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No consultations found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredConsultations().map((consultation) => (
              <div 
                key={consultation.id}
                className="glass-card rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {getIssueIcon(consultation.issue_category, consultation.source_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {consultation.farmer_name}
                        </h3>
                        {getStatusBadge(consultation.status, consultation.consultation_completed)}
                        {consultation.source_type === "soil_sensor" && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-600">
                            Sensor Data
                          </span>
                        )}
                      </div>
                      <p className="text-primary text-sm font-medium">
                        {consultation.issue_category || "General Inquiry"}
                      </p>
                      <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                        {consultation.issue_description || "No description provided"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(consultation.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-16 md:ml-0">
                    {!consultation.consultation_completed && (
                      <>
                        <Button 
                          onClick={() => handleJoinChat(consultation)}
                          size="sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {consultation.status === "in_progress" ? "Continue" : "Join Chat"}
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => markAsCompleted(consultation.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      </>
                    )}
                    {consultation.consultation_completed && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/experts/chat/${consultation.id}`, { state: { consultation } })}
                      >
                        View History
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AIAssistant />
    </div>
  );
};

export default ExpertDashboard;
