import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIAssistant } from "@/components/AIAssistant";
import { Search, MapPin, Calendar, Tractor, Star, Phone, Volume2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const staticEquipment = [
  { id: 1, name: "John Deere Tractor", brand: "John Deere", type: "Tractor", pricePerDay: 2500, location: "Vijayawada", rating: 4.8, owner: "Ram Farms", available: true, image: "🚜" },
  { id: 2, name: "Harvester Combine", brand: "AgriCorp", type: "Harvester", pricePerDay: 4500, location: "Guntur", rating: 4.7, owner: "Agri Rentals", available: true, image: "🌾" },
  { id: 3, name: "Seed Drill Machine", brand: "Kisan", type: "Seeder", pricePerDay: 1200, location: "Vijayawada", rating: 4.5, owner: "Kisan Equipment", available: false, image: "🌱" },
  { id: 4, name: "Rotavator", brand: "Modern", type: "Tillage", pricePerDay: 1800, location: "Krishna", rating: 4.9, owner: "Modern Farms", available: true, image: "🛠️" },
  { id: 5, name: "Sprayer Machine", brand: "SprayTech", type: "Sprayer", pricePerDay: 800, location: "Guntur", rating: 4.6, owner: "SprayTech", available: true, image: "🧴" },
  { id: 6, name: "Power Tiller", brand: "TillMaster", type: "Tiller", pricePerDay: 1500, location: "Prakasam", rating: 4.7, owner: "TillMaster", available: true, image: "🔧" },
];



const Rentals = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [rainPredicted, setRainPredicted] = useState(false);
  const [equipment, setEquipment] = useState<any[]>(staticEquipment);
  const { t, language } = useLanguage();
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const types = ["all", ...new Set(equipment.map(e => e.type))];

  const typeEmoji = {
    "Tractor": "🚜",
    "Harvester": "🌾",
    "Seeder": "🌱",
    "Tillage": "🛠️",
    "Sprayer": "🧴",
    "Tiller": "🔧",
  } as Record<string,string>;

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/machines');
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      if (Array.isArray(json)) {
        // normalize fields expected by the UI
        const list = json.map((m: any) => ({
          id: m.id,
          name: m.name,
          brand: m.brand || m.owner || '',
          type: m.type || 'Tractor',
          pricePerDay: m.pricePerDay || m.price || m.rate || 0,
          location: m.location || '',
          rating: m.rating || 4.5,
          owner: m.owner || '',
          available: m.available !== undefined ? m.available : true,
          image: m.image || typeEmoji[m.type] || typeEmoji[(m.type || 'Tractor')] || '🚜'
        }));
        setEquipment(list);
      }
    } catch (e) {
      // fallback to static data (already set)
    }
  };

  useEffect(() => {
    fetchMachines();
    const handler = () => fetchMachines();
    window.addEventListener('machinesUpdated', handler);
    return () => window.removeEventListener('machinesUpdated', handler);
  }, []);

  // Also refetch immediately after a successful POST if the app navigates back here
  useEffect(() => {
    const onFocus = () => fetchMachines();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // attempt geolocation and check weather to show Weather-Sync on cards
  useEffect(() => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
          if (res.ok) {
            const json = await res.json();
            // Simple check for rain risk
            const code = json?.current_weather?.weathercode;
            if (code && (code > 50 && code < 78)) {
              setRainPredicted(true);
            }
          }
        } catch (e) {}
      });
    }
  }, []);

  const filteredEquipment = equipment.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || e.type === selectedType;
    return matchesSearch && matchesType;
  });

  const speakEquipment = (item: typeof equipment[0]) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `${item.name}, ${item.pricePerDay} rupees per day, ${item.available ? 'Available' : 'Booked'} at ${item.location}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleBook = (item: typeof equipment[0]) => {
    toast({ 
      title: "Booking Request Sent!", 
      description: `Request sent for ${item.name}. Owner will contact you soon.` 
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t('rentals.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('rentals.subtitle')}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('rentals.search')}
            className="pl-10"
          />
        </div>

        {/* Icon-based Type Scroller */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scroll-smooth">
          {types.map(type => {
            const emoji = type === 'all' ? '📦' : typeEmoji[type as keyof typeof typeEmoji] || '🛠️';
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  selectedType === type
                    ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
                title={type}
              >
                <span className="text-3xl">{emoji}</span>
                <span className="text-xs font-medium text-center leading-tight capitalize">{type === 'all' ? 'All' : type}</span>
              </button>
            );
          })}
        </div>

        {/* Equipment Grid */}
        {filteredEquipment.length === 0 ? (
          <div className="text-center py-12">
            <Tractor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No equipment found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map((item) => (
              <div key={item.id} className="glass-card rounded-2xl p-6 relative flex flex-col">
                <div className="text-6xl text-center mb-4">{item.image}</div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                    <p className="text-sm text-primary">{item.type} • <span className="capitalize">{item.brand}</span></p>
                  </div>
                  {/* Visual Availability Indicator */}
                  {item.available ? (
                    <div className="ml-2 flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-semibold text-green-600">{t('rentals.available')}</span>
                    </div>
                  ) : (
                    <div className="ml-2 flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-400 rounded-full opacity-50"></div>
                      <span className="text-xs font-semibold text-gray-500">{t('rentals.booked')}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" /> {item.location}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="w-4 h-4 text-amber-500" /> {item.rating} • {item.owner}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-4 mt-auto">
                  <div>
                    <div className="text-2xl font-extrabold text-primary">₹{item.pricePerDay}<span className="text-sm font-medium text-muted-foreground">{t('rentals.perDay')}</span></div>
                  </div>
                  <button
                    onClick={() => speakEquipment(item)}
                    className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    title="Read details"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {rainPredicted && (
                  <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Rain predicted — check weather before booking</span>
                  </div>
                )}

                <Button 
                  onClick={() => handleBook(item)}
                  disabled={!item.available}
                  size="lg"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold disabled:bg-gray-400"
                >
                  <Plus className="w-5 h-5 mr-1" />
                  {t('rentals.bookNow')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>

      <AIAssistant />
    </div>
  );
};

export default Rentals;
