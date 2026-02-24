import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AIAssistant } from "@/components/AIAssistant";
import { Button } from "@/components/ui/button";
import { Bell, FileText, IndianRupee, Calendar, ExternalLink, CheckCircle } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "scheme",
    title: "PM-KISAN 16th Installment Released",
    description: "₹2000 has been credited to eligible farmers under PM-KISAN scheme. Check your bank account.",
    date: "2024-12-15",
    link: "https://pmkisan.gov.in",
    read: false,
  },
  {
    id: 2,
    type: "subsidy",
    title: "Fertilizer Subsidy Scheme 2024-25",
    description: "Apply for subsidized fertilizers through your local agriculture office. Up to 50% discount available.",
    date: "2024-12-10",
    link: "#",
    read: false,
  },
  {
    id: 3,
    type: "scheme",
    title: "Rythu Bharosa - AP",
    description: "Investment support of ₹7,500 per year for farmers. Ensure your registration is complete.",
    date: "2024-12-05",
    link: "#",
    read: true,
  },
  {
    id: 4,
    type: "announcement",
    title: "Crop Insurance Deadline Extended",
    description: "Last date to apply for Pradhan Mantri Fasal Bima Yojana has been extended to January 15, 2025.",
    date: "2024-12-01",
    link: "#",
    read: true,
  },
  {
    id: 5,
    type: "subsidy",
    title: "Solar Pump Subsidy Available",
    description: "Get up to 90% subsidy on solar water pumps under PM-KUSUM scheme. Limited slots available.",
    date: "2024-11-28",
    link: "#",
    read: true,
  },
  {
    id: 6,
    type: "announcement",
    title: "MSP Increased for Rabi Crops",
    description: "Government announces increase in Minimum Support Price for wheat, mustard, and gram for 2024-25 season.",
    date: "2024-11-25",
    link: "#",
    read: true,
  },
];

const Notifications = () => {
  const [filter, setFilter] = useState("all");
  const [notifs, setNotifs] = useState(notifications);

  const markAsRead = (id: number) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filteredNotifs = notifs.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const typeIcon = {
    scheme: IndianRupee,
    subsidy: FileText,
    announcement: Bell,
  };

  const typeColor = {
    scheme: "bg-primary/10 text-primary",
    subsidy: "bg-amber-500/10 text-amber-600",
    announcement: "bg-sky-500/10 text-sky-600",
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Government Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with schemes, subsidies & announcements
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: "all", label: "All" },
            { id: "unread", label: "Unread" },
            { id: "scheme", label: "Schemes" },
            { id: "subsidy", label: "Subsidies" },
            { id: "announcement", label: "Announcements" },
          ].map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "outline"}
              onClick={() => setFilter(f.id)}
              size="sm"
            >
              {f.label}
              {f.id === "unread" && (
                <span className="ml-2 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {notifs.filter(n => !n.read).length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifs.map((notif) => {
            const Icon = typeIcon[notif.type as keyof typeof typeIcon];
            const colorClass = typeColor[notif.type as keyof typeof typeColor];
            
            return (
              <div 
                key={notif.id} 
                className={`glass-card rounded-xl p-5 transition-all ${
                  !notif.read ? "border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-foreground">{notif.title}</h3>
                      {!notif.read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{notif.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notif.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${colorClass}`}>
                        {notif.type}
                      </span>
                      {notif.link !== "#" && (
                        <a 
                          href={notif.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Learn more <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredNotifs.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications found</p>
          </div>
        )}
      </main>

      <AIAssistant />
    </div>
  );
};

export default Notifications;
