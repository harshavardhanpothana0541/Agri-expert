import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { AIAssistant } from "@/components/AIAssistant";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Sprout, Camera, Mic, MessageSquare, ShoppingBag, Tractor, Cloud,
  Bell, TrendingUp, LogOut, ChevronRight, Plus, Package, Users, Droplets, Stethoscope
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";
import VoiceMoistureButton from "@/components/VoiceMoistureButton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // attempt to get user location and fetch weather for smart suggestions
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(`http://localhost:8000/api/v1/weather?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const json = await res.json();
            const precip = json?.precipprob ?? null;
            if (typeof precip === "number" && precip > 50) {
              toast.error("Rain likely: Delay irrigation and check rental schedules");
            }
          }
        } catch (e) {
          // ignore weather lookup errors
        }
      });
    }
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      setProfile(profileData);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;
  
  const userName = profile?.full_name || user.user_metadata?.full_name || "Farmer";
  const userRole = profile?.role || user.user_metadata?.role || "farmer";

  const quickActions = [
    { icon: Camera, label: "Scan Crop", desc: "Upload photo for AI analysis", path: "/problem-input", color: "bg-primary" },
    { icon: Mic, label: "Voice Input", desc: "Describe your problem", path: "/problem-input", color: "bg-accent" },
    { icon: MessageSquare, label: "Chat Expert", desc: "Connect with specialists", path: "/experts", color: "bg-earth" },
    { icon: ShoppingBag, label: "Marketplace", desc: "Buy & sell products", path: "/marketplace", color: "bg-primary" },
    ...(userRole === "farmer" ? [{ icon: Droplets, label: "Soil Monitor", desc: "Arduino sensor data", path: "/soil-monitor", color: "bg-sky-500" }] : []),
  ];

  const stats = [
    { label: "Problems Solved", value: "12", icon: Sprout },
    { label: "Expert Chats", value: "8", icon: MessageSquare },
    { label: "Orders", value: "5", icon: Package },
    { label: "Rentals", value: "2", icon: Tractor },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar>
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} />
              ) : user.user_metadata?.avatar_url ? (
                <AvatarImage src={String(user.user_metadata?.avatar_url)} />
              ) : (
                <AvatarFallback>{userName.toString().charAt(0).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Welcome, {userName}! 🌾
              </h1>
              <p className="text-muted-foreground mt-1">
                Role: <span className="capitalize font-medium text-primary">{userRole}</span>
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="mt-4 md:mt-0">
            <LogOut className="w-4 h-4 mr-2" /> {t('nav.logout')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-4 rounded-xl">
              <stat.icon className="w-8 h-8 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions - Icon First */}
        <h2 className="text-xl font-semibold text-foreground mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, i) => (
            action.label === 'Voice Input' ? (
              <div key={i} className="glass-card p-6 rounded-xl text-left">
                <div className={`w-20 h-20 ${action.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <action.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{action.label}</h3>
                <p className="text-sm text-muted-foreground">{action.desc}</p>
                <div className="mt-4"><VoiceMoistureButton /></div>
              </div>
            ) : (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="glass-card p-6 rounded-xl text-left hover:scale-105 transition-transform group flex flex-col items-center justify-center"
                aria-label={action.label}
              >
                <div className={`w-24 h-24 ${action.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                  <action.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground text-center">{action.label}</h3>
                <p className="text-xs text-muted-foreground text-center">{action.desc}</p>
                <ChevronRight className="w-4 h-4 text-primary mt-2 group-hover:translate-x-1 transition-transform" />
              </button>
            )
          ))}
        </div>

        {/* Quick Links Grid - Icon First */}
        <div className="grid md:grid-cols-3 gap-4">
          <button onClick={() => navigate("/weather")} className="glass-card p-6 rounded-xl text-center hover:border-primary/50 transition-colors group" aria-label={t('weather.title')}>
            <div className="w-16 h-16 bg-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
              <Cloud className="w-8 h-8 text-sky-500" />
            </div>
            <h3 className="font-semibold text-foreground">{t('nav.weather')}</h3>
            <p className="text-sm text-muted-foreground">{t('weather.forecast')}</p>
          </button>
          <button onClick={() => navigate("/prices")} className="glass-card p-6 rounded-xl text-center hover:border-primary/50 transition-colors group" aria-label={t('nav.prices')}>
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">{t('nav.prices')}</h3>
            <p className="text-sm text-muted-foreground">{t('prices.dailyMarketPrices')}</p>
          </button>
          <button onClick={() => navigate("/notifications")} className="glass-card p-6 rounded-xl text-center hover:border-primary/50 transition-colors group" aria-label={t('nav.notifications')}>
            <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
              <Bell className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="font-semibold text-foreground">{t('notifications.schemes')}</h3>
            <p className="text-sm text-muted-foreground">{t('nav.notifications')}</p>
          </button>
        </div>

        {/* Role-specific sections */}
        {userRole === "rental" && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('rentals.title')}</h2>
            <Button onClick={() => navigate("/rentals/add")}>
              <Plus className="w-4 h-4 mr-2" /> {t('addVehicle.addButton')}
            </Button>
          </div>
        )}

        {userRole === "seller" && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('dashboard.title')} - {t('common.farmer')}</h2>
            <div className="flex gap-4">
              <Button onClick={() => navigate("/marketplace/add")}>
                <Plus className="w-4 h-4 mr-2" /> {t('marketplace.title')}
              </Button>
              <Button variant="outline" onClick={() => navigate("/orders")}>
                <Package className="w-4 h-4 mr-2" /> {t('checkout.orderSummary')}
              </Button>
            </div>
          </div>
        )}

        {userRole === "expert" && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('dashboard.title')} - {t('experts.title')}</h2>
            <div className="flex gap-4">
              <Button onClick={() => navigate("/expert-dashboard")}>
                <Stethoscope className="w-4 h-4 mr-2" /> {t('experts.startConversation')}
              </Button>
              <Button variant="outline" onClick={() => navigate("/experts")}>
                <MessageSquare className="w-4 h-4 mr-2" /> {t('experts.startChat')}
              </Button>
            </div>
          </div>
        )}
      </main>

      <AIAssistant />
    </div>
  );
};

export default Dashboard;
