import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIAssistant } from "@/components/AIAssistant";
import { MessageSquare, Star, Clock, Send, ArrowLeft, Tag, Phone, Video, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const experts = [
  { id: "expert-1", name: "Dr. Rajesh Kumar", specialty: "Plant Pathologist", rating: 4.9, experience: "15 years", avatar: "RK", available: true },
  { id: "expert-2", name: "Prof. Lakshmi Devi", specialty: "Soil Expert", rating: 4.8, experience: "12 years", avatar: "LD", available: true },
  { id: "expert-3", name: "Dr. Anil Sharma", specialty: "Pest Control Specialist", rating: 4.7, experience: "10 years", avatar: "AS", available: false },
  { id: "expert-4", name: "Dr. Meera Patel", specialty: "Crop Nutrition Expert", rating: 4.9, experience: "18 years", avatar: "MP", available: true },
  { id: "expert-5", name: "Dr. Suresh Reddy", specialty: "Leaf Disease Specialist", rating: 4.8, experience: "14 years", avatar: "SR", available: false },
  { id: "expert-6", name: "Dr. Priya Nair", specialty: "Water Management Expert", rating: 4.6, experience: "8 years", avatar: "PN", available: true },
  { id: "expert-7", name: "Dr. Vikram Singh", specialty: "Integrated Pest Management", rating: 4.8, experience: "16 years", avatar: "VS", available: true },
  { id: "expert-8", name: "Dr. Anjali Gupta", specialty: "Plant Pathology & Diseases", rating: 4.7, experience: "11 years", avatar: "AG", available: false },
];

interface Message {
  id?: string;
  from: "user" | "expert";
  text: string;
  senderName: string;
}

interface Conversation {
  id: string;
  expert_id: string;
  expert_name: string;
  issue_category: string | null;
  issue_description: string | null;
  status: string | null;
  created_at: string;
}

const Experts = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedExpert, setSelectedExpert] = useState<typeof experts[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [issueCategory, setIssueCategory] = useState<string>("");
  const [issueDescription, setIssueDescription] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [previousConversations, setPreviousConversations] = useState<Conversation[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);

  const issueCategories = [
    { key: "pestInfestation", value: "Pest Infestation" },
    { key: "diseaseInfection", value: "Disease/Infection" },
    { key: "nutrientDeficiency", value: "Nutrient Deficiency" },
    { key: "soilProblems", value: "Soil Problems" },
    { key: "waterManagement", value: "Water Management" },
    { key: "weatherDamage", value: "Weather Damage" },
    { key: "other", value: "Other" },
  ];

  // Check for auto-select expert from navigation state (from ExpertResults page)
  useEffect(() => {
    const state = location.state as { autoSelectExpert?: typeof experts[0]; analysis?: any } | null;
    if (state?.autoSelectExpert && state?.analysis) {
      // Find the expert in our list
      const expertToSelect = experts.find(e => e.id === state.autoSelectExpert?.id) || state.autoSelectExpert;
      setSelectedExpert(expertToSelect as typeof experts[0]);
      
      // Pre-fill issue form with AI analysis
      if (state.analysis.expertCategoryName) {
        const matchingCategory = issueCategories.find(c => 
          state.analysis.expertCategoryName.toLowerCase().includes(c.key.toLowerCase()) ||
          c.value.toLowerCase().includes(state.analysis.expertCategory?.toLowerCase())
        );
        if (matchingCategory) {
          setIssueCategory(matchingCategory.value);
        } else {
          setIssueCategory(issueCategories[0].value);
        }
      }
      if (state.analysis.originalInput || state.analysis.diagnosis) {
        setIssueDescription(state.analysis.originalInput || state.analysis.diagnosis);
      }
      
      // Clear the location state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // Load previous conversations when expert is selected
  useEffect(() => {
    if (selectedExpert) {
      loadPreviousConversations();
    }
  }, [selectedExpert]);

  // Load existing conversation messages
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  const loadPreviousConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedExpert) return;

    const { data, error } = await supabase
      .from("expert_conversations")
      .select("*")
      .eq("farmer_id", user.id)
      .eq("expert_id", selectedExpert.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPreviousConversations(data);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    if (data) {
      setMessages(
        data.map((msg) => ({
          id: msg.id,
          from: msg.sender_type as "user" | "expert",
          text: msg.content,
          senderName: msg.sender_name,
        }))
      );
    }
  };

  const continueConversation = (conv: Conversation) => {
    setConversationId(conv.id);
    setIssueCategory(conv.issue_category || "");
    setIssueDescription(conv.issue_description || "");
    setShowIssueForm(false);
  };

  const startConversation = async () => {
    if (!selectedExpert || !issueCategory || !issueDescription.trim()) {
      toast.error(t('experts.selectCategory'));
      return;
    }

    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error(t('common.loginRequired'));
      toast.info("Redirecting to login...");
      setTimeout(() => navigate("/auth"), 1500);
      setIsLoading(false);
      return;
    }

    const { data: conversation, error } = await supabase
      .from("expert_conversations")
      .insert({
        expert_id: selectedExpert.id,
        expert_name: selectedExpert.name,
        farmer_id: user.id,
        issue_category: issueCategory,
        issue_description: issueDescription,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      toast.error(t('common.error'));
      setIsLoading(false);
      return;
    }

    setConversationId(conversation.id);
    setShowIssueForm(false);
    toast.success(t('experts.conversationStarted'));

    // Generate expert welcome message based on the issue
    const welcomeMessages: Record<string, string> = {
      "Pest Infestation": `Hello! I'm ${selectedExpert.name}, and I specialize in ${selectedExpert.specialty}. I understand you're dealing with a pest infestation issue. Based on your description: "${issueDescription}", I'd like to help you identify the pest and recommend effective treatment options. Can you tell me which crop is affected and when you first noticed the problem?`,
      "Disease/Infection": `Hello! I'm ${selectedExpert.name}, your ${selectedExpert.specialty}. I see you're facing a disease/infection issue. From what you've described: "${issueDescription}", this could be a fungal, bacterial, or viral infection. Could you share any photos of the affected plants? Also, have you noticed any patterns in where the infection appears?`,
      "Nutrient Deficiency": `Hello! I'm ${selectedExpert.name}, and I'll help you with your crop nutrition concerns. Based on your description: "${issueDescription}", we should first identify which nutrients your plants are lacking. What symptoms are you seeing - yellowing leaves, stunted growth, or something else? When did you last apply fertilizer?`,
      "Soil Problems": `Hello! I'm ${selectedExpert.name}, your soil expert. I understand you're experiencing soil-related issues: "${issueDescription}". Soil health is fundamental to crop success. Have you done a recent soil test? What's the texture of your soil - sandy, clay, or loamy?`,
      "Water Management": `Hello! I'm ${selectedExpert.name}, specializing in water management. You mentioned: "${issueDescription}". Proper irrigation is crucial for healthy crops. What's your current irrigation method? Are you seeing signs of overwatering or underwatering?`,
      "Weather Damage": `Hello! I'm ${selectedExpert.name}. I see your crops have been affected by weather: "${issueDescription}". Weather damage can be challenging, but there are steps we can take to help your plants recover. What type of weather event caused the damage, and how extensive is it?`,
      "Other": `Hello! I'm ${selectedExpert.name}, ${selectedExpert.specialty} with ${selectedExpert.experience} of experience. Thank you for reaching out about: "${issueDescription}". I'm here to help! Could you provide more details about the issue, including which crops are affected and any visible symptoms?`,
    };

    const expertWelcome = welcomeMessages[issueCategory] || welcomeMessages["Other"];

    // Save expert welcome message to database
    await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversation.id,
        content: expertWelcome,
        sender_type: "expert",
        sender_name: selectedExpert.name,
      });

    // Display the welcome message
    setMessages([{
      from: "expert",
      text: expertWelcome,
      senderName: selectedExpert.name,
    }]);

    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !selectedExpert) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t('common.loginRequired'));
      return;
    }

    const { error: msgError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        content: newMessage,
        sender_type: "user",
        sender_name: t('common.farmer'),
      });

    if (msgError) {
      console.error("Error saving message:", msgError);
      toast.error(t('common.error'));
      return;
    }

    const userMsg = newMessage;
    setMessages((prev) => [...prev, { from: "user", text: userMsg, senderName: t('common.farmer') }]);
    setNewMessage("");

    // Simulate expert response with solution and thank-you message
    setTimeout(async () => {
      // Generate a contextual expert response based on the issue
      const solutionResponses: Record<string, string> = {
        "Pest Infestation": `Based on your description, this appears to be a common pest issue. I recommend:\n\n1. **Identification**: First, closely examine the affected plants to identify the pest type\n2. **Immediate Action**: Remove heavily infested leaves and dispose of them properly\n3. **Treatment**: Apply neem oil spray (mix 2ml per liter of water) in the early morning or evening\n4. **Prevention**: Introduce beneficial insects like ladybugs, and practice crop rotation\n\nMonitor your plants daily for the next week and let me know if you see any changes.`,
        "Disease/Infection": `From what you've described, this could be a fungal or bacterial infection. Here's my recommendation:\n\n1. **Isolation**: Separate affected plants from healthy ones immediately\n2. **Sanitation**: Remove all infected plant parts and destroy them (don't compost)\n3. **Treatment**: Apply copper-based fungicide following the package instructions\n4. **Air Circulation**: Ensure proper spacing between plants for better airflow\n\nAvoid overhead watering to prevent spread. Continue monitoring for 10-14 days.`,
        "Nutrient Deficiency": `Based on the symptoms you've described, here's my analysis and solution:\n\n1. **Soil Testing**: Get a soil test done to confirm which nutrients are lacking\n2. **Immediate Relief**: Apply a balanced NPK fertilizer (10-10-10) at recommended rates\n3. **Organic Option**: Add compost or well-rotted manure to improve soil health\n4. **Foliar Feeding**: For quick results, use a foliar spray with micronutrients\n\nMost deficiency symptoms should improve within 2-3 weeks of treatment.`,
        "Soil Problems": `I understand you're facing soil-related challenges. Here's a comprehensive solution:\n\n1. **Soil Assessment**: Check soil texture, drainage, and pH levels\n2. **Drainage**: If waterlogged, create proper drainage channels\n3. **Amendment**: Add organic matter (compost, leaf mold) to improve soil structure\n4. **pH Correction**: Use lime for acidic soil or sulfur for alkaline soil\n\nHealthy soil is the foundation of healthy crops. These improvements take time but are lasting.`,
        "Water Management": `For your irrigation concerns, here's what I suggest:\n\n1. **Assessment**: Check if plants show wilting or root rot symptoms\n2. **Scheduling**: Water early morning, allowing 1-2 inches per week\n3. **Method**: Consider drip irrigation for efficient water use\n4. **Mulching**: Apply 2-3 inches of organic mulch to retain moisture\n\nMonitor soil moisture at 2-3 inch depth - it should feel moist but not soggy.`,
        "Weather Damage": `I'm sorry to hear about the weather damage. Here's how to help your plants recover:\n\n1. **Assessment**: Document the damage for insurance if applicable\n2. **Cleanup**: Remove broken branches with clean cuts\n3. **Support**: Stake damaged but salvageable plants\n4. **Recovery**: Apply seaweed extract to boost plant immunity and recovery\n\nBe patient - many plants have remarkable recovery abilities with proper care.`,
        "Other": `Thank you for sharing the details of your concern. Based on my assessment:\n\n1. **Observation**: Continue monitoring the symptoms you've described\n2. **Documentation**: Take photos daily to track any changes\n3. **Basic Care**: Ensure proper watering, sunlight, and air circulation\n4. **Follow-up**: If symptoms persist or worsen, we can explore more specific treatments\n\nFeel free to share more details or photos for a more targeted recommendation.`,
      };

      const expertSolution = solutionResponses[issueCategory] || solutionResponses["Other"];
      
      await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          content: expertSolution,
          sender_type: "expert",
          sender_name: selectedExpert.name,
        });

      setMessages((prev) => [...prev, { 
        from: "expert", 
        text: expertSolution,
        senderName: selectedExpert.name,
      }]);

      // Save to knowledge base
      await supabase
        .from("knowledge_base")
        .insert({
          conversation_id: conversationId,
          issue_category: issueCategory,
          symptoms: issueDescription,
          solution: expertSolution,
          expert_name: selectedExpert.name,
        });

      // After solution, add a thank-you message
      setTimeout(async () => {
        const thankYouMessage = `🙏 Thank you for consulting Agri Advise Now!\n\nI hope the advice provided will help you achieve a healthy crop and good yield. Remember:\n\n✅ Follow the recommended treatment plan\n✅ Monitor your plants regularly\n✅ Don't hesitate to reach out if you have more questions\n\nWishing you a bountiful harvest! 🌾🌱\n\n— ${selectedExpert.name}, ${selectedExpert.specialty}`;
        
        await supabase
          .from("chat_messages")
          .insert({
            conversation_id: conversationId,
            content: thankYouMessage,
            sender_type: "expert",
            sender_name: selectedExpert.name,
          });

        setMessages((prev) => [...prev, { 
          from: "expert", 
          text: thankYouMessage,
          senderName: selectedExpert.name,
        }]);

        // Mark consultation as completed
        await supabase
          .from("expert_conversations")
          .update({ consultation_completed: true })
          .eq("id", conversationId);

      }, 3000);
    }, 1500);
  };

  const handleStartCall = (type: "audio" | "video") => {
    setCallType(type);
    setIsInCall(true);
    toast.success(`${type === "video" ? t('experts.videoCall') : t('experts.startCall')} ${t('experts.calling')}`);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setCallType(null);
    toast.info(t('experts.endCall'));
  };

  const handleBackToList = () => {
    setSelectedExpert(null);
    setMessages([]);
    setConversationId(null);
    setIssueCategory("");
    setIssueDescription("");
    setShowIssueForm(true);
    setPreviousConversations([]);
    setIsInCall(false);
    setCallType(null);
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setShowIssueForm(true);
    setIssueCategory("");
    setIssueDescription("");
  };

  if (selectedExpert) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <Navbar />
        
        <main className="flex-1 pt-20 flex flex-col max-w-4xl mx-auto w-full">
          {/* Chat Header */}
          <div className="bg-card border-b border-border p-4 flex items-center gap-4">
            <button onClick={handleBackToList} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
              {selectedExpert.avatar}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">{selectedExpert.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedExpert.specialty}</p>
            </div>
            
            {/* Call Buttons */}
            <div className="flex items-center gap-2">
              {isInCall ? (
                <Button variant="destructive" size="sm" onClick={handleEndCall}>
                  <PhoneOff className="w-4 h-4 mr-2" />
                  {t('experts.endCall')}
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleStartCall("audio")}>
                    <Phone className="w-4 h-4 mr-2" />
                    {t('experts.startCall')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleStartCall("video")}>
                    <Video className="w-4 h-4 mr-2" />
                    {t('experts.videoCall')}
                  </Button>
                </>
              )}
            </div>
            
            {issueCategory && (
              <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                <Tag className="w-3 h-3" />
                {t(`issueCategories.${issueCategories.find(c => c.value === issueCategory)?.key}`) || issueCategory}
              </span>
            )}
          </div>

          {/* Call Indicator */}
          {isInCall && (
            <div className="bg-primary/10 border-b border-primary/20 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-primary">
                {callType === "video" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                <span className="font-medium">{t('experts.inCall')} - {callType === "video" ? t('experts.videoCall') : t('experts.startCall')}</span>
              </div>
            </div>
          )}

          {/* Previous Conversations */}
          {showIssueForm && previousConversations.length > 0 && (
            <div className="p-4 bg-card/50 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{t('experts.previousChats')}</h3>
                <Button variant="outline" size="sm" onClick={startNewChat}>
                  {t('experts.newChat')}
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {previousConversations.map((conv) => (
                  <div 
                    key={conv.id} 
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => continueConversation(conv)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t(`issueCategories.${issueCategories.find(c => c.value === conv.issue_category)?.key}`) || conv.issue_category}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {conv.issue_description}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      {t('experts.continueChat')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issue Form */}
          {showIssueForm && (
            <div className="p-6 bg-card border-b border-border">
              <h3 className="font-semibold text-foreground mb-4">{t('experts.describeIssue')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">{t('experts.issueCategory')}</label>
                  <Select value={issueCategory} onValueChange={setIssueCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('experts.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {issueCategories.map((cat) => (
                        <SelectItem key={cat.key} value={cat.value}>
                          {t(`issueCategories.${cat.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">{t('experts.describeProblem')}</label>
                  <Input
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder={t('experts.problemPlaceholder')}
                  />
                </div>
                <Button onClick={startConversation} disabled={isLoading} className="w-full">
                  {isLoading ? t('experts.starting') : t('experts.startConversation')}
                </Button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {!showIssueForm && messages.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('experts.typeMessage')}</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.from === "user" 
                    ? "bg-primary text-primary-foreground rounded-br-md" 
                    : "bg-card border border-border rounded-bl-md"
                }`}>
                  <p className="text-xs opacity-70 mb-1">{msg.senderName}</p>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          {!showIssueForm && (
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('experts.typeMessage')}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t('experts.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('experts.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {experts.map((expert) => (
            <div key={expert.id} className="glass-card rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold">
                  {expert.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-lg">{expert.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      expert.available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {expert.available ? t('experts.available') : t('experts.busy')}
                    </span>
                  </div>
                  <p className="text-primary font-medium">{expert.specialty}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" /> {expert.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {expert.experience}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => setSelectedExpert(expert)}
                  disabled={!expert.available}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t('experts.startChat')}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedExpert(expert);
                    setTimeout(() => handleStartCall("audio"), 100);
                  }}
                  disabled={!expert.available}
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedExpert(expert);
                    setTimeout(() => handleStartCall("video"), 100);
                  }}
                  disabled={!expert.available}
                >
                  <Video className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <AIAssistant />
    </div>
  );
};

export default Experts;
