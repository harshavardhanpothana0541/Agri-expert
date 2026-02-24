import { useState } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: "user" | "ai"; text: string }[]>([
    { from: "ai", text: "Hi! I'm your Agri Expert assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { from: "user", text: input }]);
    setInput("");
    
    setTimeout(() => {
      const response = input.toLowerCase().includes("price") 
        ? "You can check daily market prices in the Prices section. Navigate there from the menu!"
        : input.toLowerCase().includes("weather")
        ? "Check the Weather section for forecasts and crop recommendations!"
        : "I can help you with crop problems, marketplace, rentals, and more. What would you like to know?";
      setMessages(prev => [...prev, { from: "ai", text: response }]);
    }, 1000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <Sparkles className="w-6 h-6 text-primary-foreground" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-card border border-border rounded-2xl shadow-xl flex flex-col z-50">
          <div className="p-4 border-b border-border flex items-center justify-between bg-primary rounded-t-2xl">
            <span className="font-semibold text-primary-foreground">AI Assistant</span>
            <button onClick={() => setIsOpen(false)}><X className="w-5 h-5 text-primary-foreground" /></button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                  msg.from === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>{msg.text}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything..." onKeyDown={(e) => e.key === "Enter" && handleSend()} />
            <Button size="icon" onClick={handleSend}><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </>
  );
};
