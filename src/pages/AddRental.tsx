import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIAssistant } from "@/components/AIAssistant";
import { Volume2, Plus, Tractor, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AddRentalPage = () => {
  const { t, language } = useLanguage();
  const [name, setName] = useState("");
  const [pricePerHour, setPricePerHour] = useState<number | "">("");
  const [vehicleType, setVehicleType] = useState<string>("");
  const [location, setLocation] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; pricePerHour?: string; location?: string; type?: string; server?: string }>({});
  const { user } = useAuth();
  const prevCountRef = useRef<number>(0);
  const [newBookingIds, setNewBookingIds] = useState<Set<any>>(new Set());

  useEffect(() => {
    fetchBookings();
  }, []);

  const speakGuidance = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const en = 'Enter your vehicle details here to start earning';
    const te = 'సరళంగా సంపాదించడానికి ఇక్కడ మీ వాహన వివరాలను నమోదు చేయండి';
    const utter = new SpeechSynthesisUtterance(language === 'te' ? te : en);
    utter.lang = language === 'te' ? 'te-IN' : 'en-IN';
    window.speechSynthesis.speak(utter);
  };

  const handleSubmit = async (e?: any) => {
    if (e) e.preventDefault();
    setErrors({});
    if (!name || pricePerHour === '' || !location || !vehicleType) {
      const newErrors: any = {};
      if (!name) newErrors.name = 'Required';
      if (pricePerHour === '') newErrors.pricePerHour = 'Required';
      if (!location) newErrors.location = 'Required';
      if (!vehicleType) newErrors.type = 'Required';
      setErrors(newErrors);
      toast({ title: 'Missing fields', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // POST: send fields exactly as backend expects: name, description (vehicle type), price_per_hour, location
      const body = { name, description: vehicleType, price_per_hour: Number(pricePerHour), location, owner_id: user?.id };
      const res = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      let json: any = {};
      try { json = await res.json(); } catch (e) { json = {}; }

      if (!(res.status === 201 || res.ok)) {
        // handle validation errors returned by server
        if (json?.errors && typeof json.errors === 'object') {
          setErrors(json.errors);
          toast({ title: 'Validation error', description: json.message || 'Please correct fields', variant: 'destructive' });
        } else {
          setErrors({ server: json?.message || 'Failed to add vehicle' });
          toast({ title: 'Error', description: json?.message || 'Failed to add vehicle', variant: 'destructive' });
        }
        setSubmitting(false);
        return;
      }

      toast({ title: json?.message || t('addVehicle.added') || 'Vehicle added successfully', description: 'Your vehicle is listed for rentals' });
      setName(''); setPricePerHour(''); setLocation('');
      setVehicleType('');
      // voice confirmation in selected language
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const msg = language === 'te' ? 'వాహనం విజయవంతంగా జోడించబడింది' : 'Vehicle added successfully';
          const u = new SpeechSynthesisUtterance(msg);
          u.lang = language === 'te' ? 'te-IN' : 'en-IN';
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } catch (e) {}
      // notify other pages to refresh machines list
      try { window.dispatchEvent(new Event('machinesUpdated')); } catch (e) {}
      fetchBookings();
    } catch (err) {
      console.error(err);
      setErrors({ server: t('addVehicle.failed') });
      toast({ title: t('addVehicle.failed'), description: t('addVehicle.failed'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const json = await res.json();
      // expect json to be array of bookings
      const list = Array.isArray(json) ? json : [];
      // detect new bookings
      if (prevCountRef.current && list.length > prevCountRef.current) {
        const newItems = list.slice(- (list.length - prevCountRef.current));
        const ids = new Set(newBookingIds);
        newItems.forEach((it: any) => ids.add(it.id));
        setNewBookingIds(ids);
        // remove pulse after 5s
        setTimeout(() => {
          const idsRem = new Set(ids);
          newItems.forEach((it: any) => idsRem.delete(it.id));
          setNewBookingIds(idsRem);
        }, 5000);
      }
      prevCountRef.current = list.length;
      setBookings(list);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load bookings', variant: 'destructive' });
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleConfirm = async (id: any) => {
    try {
      const res = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Confirm failed');
      const json = await res.json();
      toast({ title: json?.message || t('bookings.confirmSuccess') });
      fetchBookings();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to confirm', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold">Add Vehicle</h1>
          <p className="text-muted-foreground">List your machine to start earning</p>
        </div>

        <div className="glass-card rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">{t('rentals.title') || 'Rentals'}</div>
            <button onClick={speakGuidance} className="p-2 rounded-md bg-muted hover:bg-muted/80">
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex items-center gap-3">
              <span className="text-3xl">🚜</span>
              <div className="flex-1">
                <Input placeholder="Vehicle Name" value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>
            </label>

            <label className="flex items-center gap-3">
              <span className="text-3xl">🪪</span>
              <div className="flex-1">
                <div className="w-full">
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="w-full rounded-md border border-input bg-transparent px-3 py-2">
                    <option value="">Select Vehicle Type</option>
                    <option value="Tractor">🚜 Tractor</option>
                    <option value="Harvester">🌾 Harvester</option>
                    <option value="Seeder">🌱 Seeder</option>
                    <option value="Tillage">🛠️ Tillage</option>
                    <option value="Sprayer">🧴 Sprayer</option>
                    <option value="Tiller">🔧 Tiller</option>
                  </select>
                  {errors.type && <p className="text-sm text-destructive mt-1">{errors.type}</p>}
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <span className="text-3xl">⏱️</span>
              <div className="flex-1">
                <Input placeholder="Price per Hour (₹)" type="number" value={pricePerHour as any} onChange={(e) => setPricePerHour(e.target.value === '' ? '' : Number(e.target.value))} />
                {errors.pricePerHour && <p className="text-sm text-destructive mt-1">{errors.pricePerHour}</p>}
              </div>
            </label>

            <label className="flex items-center gap-3">
              <span className="text-3xl">📍</span>
              <div className="flex-1">
                <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
              </div>
            </label>

            <div className="pt-2">
              <Button type="submit" disabled={submitting} className="w-full bg-green-500 hover:bg-green-600 text-white">
                <Plus className="w-5 h-5 mr-2" /> {submitting ? 'Adding...' : 'Add Vehicle'}
              </Button>
              {errors.server && <p className="text-sm text-destructive mt-2">{errors.server}</p>}
            </div>
          </form>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Active Bookings</h2>
          <div className="space-y-3">
            {loadingBookings && <div className="text-muted-foreground">{t('common.loading')}</div>}
            {!loadingBookings && bookings.length === 0 && <div className="text-muted-foreground">{t('bookings.noActive')}</div>}
            {bookings.map((b) => (
              <div key={b.id} className={`p-4 rounded-xl border border-border flex items-center justify-between ${newBookingIds.has(b.id) ? 'bg-emerald-50 animate-pulse' : ''}`}>
                <div className="flex items-center gap-3">
                  <Avatar>
                    {b.farmer_avatar ? (
                      <AvatarImage src={String(b.farmer_avatar)} />
                    ) : (
                      <AvatarFallback>{(b.farmer_name || 'U').toString().charAt(0).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium">{b.farmer_name}</div>
                    <div className="text-sm text-muted-foreground">{b.date || `${b.start_date} → ${b.end_date}`}</div>
                    <div className="text-xs mt-1">
                      <span className={`px-2 py-1 rounded-md text-xs ${b.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{b.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <a href={`tel:${b.phone}`} className="p-3 rounded-md bg-primary text-primary-foreground flex items-center gap-2 text-lg">
                    <Phone className="w-6 h-6" />
                  </a>
                  {b.status !== 'CONFIRMED' && (
                    <Button className="w-full bg-emerald-500 text-white" onClick={() => handleConfirm(b.id)}>{t('bookings.confirm')}</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <AIAssistant />
    </div>
  );
};

export default AddRentalPage;
