import React, { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ProfilePage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [lang, setLang] = useState<string>(language);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // load existing from localStorage (or backend endpoint)
    try {
      const stored = localStorage.getItem('profile');
      if (stored) {
        const p = JSON.parse(stored);
        setFullName(p.full_name || '');
        setPhone(p.phone || '');
        setLang(p.language || language);
        setAvatarDataUrl(p.avatar_url || null);
      }
    } catch (e) {}

    // voice guidance when page opens
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const msg = language === 'te' ? 'ఇక్కడ మీ పేరు మరియు ఫోటోను నవీకరించవచ్చు' : 'You can update your name and photo here';
        const u = new SpeechSynthesisUtterance(msg);
        u.lang = language === 'te' ? 'te-IN' : 'en-IN';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }, []);

  const onSelectFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarDataUrl(String(reader.result));
    };
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    // prepare payload
    const payload: any = {
      full_name: fullName,
      phone,
      language: lang,
      avatar_url: avatarDataUrl,
    };

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json?.message || 'Failed to save profile');
        return;
      }
      const json = await res.json().catch(() => ({}));
      // store locally and notify UI
      localStorage.setItem('profile', JSON.stringify({ full_name: fullName, phone, language: lang, avatar_url: avatarDataUrl }));
      try { window.dispatchEvent(new Event('profileUpdated')); } catch (e) {}
      toast.success(json?.message || 'Profile saved');
      setEditing(false);
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save profile');
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="pt-24 px-4 md:px-8 max-w-3xl mx-auto">
        <div className="glass-card rounded-2xl p-6 md:p-8 mt-6">
          <div className="flex items-center gap-4">
            <Avatar>
              {avatarDataUrl ? (
                <AvatarImage src={avatarDataUrl} />
              ) : (
                <AvatarFallback>{(fullName || 'U').toString().charAt(0).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div>
              {!editing ? (
                <div>
                  <h2 className="text-lg font-semibold">{fullName || 'Your Name'}</h2>
                  <p className="text-sm text-muted-foreground">{phone || 'Phone number'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" />
                </div>
              )}
            </div>
            <div className="ml-auto flex flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
              <Button onClick={() => fileRef.current?.click()}>Upload</Button>
              <Button variant="ghost" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full rounded-md border border-input px-3 py-2">
                <option value="en">English</option>
                <option value="te">తెలుగు</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
