import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, Menu, X } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NotificationBell } from "@/components/NotificationBell";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const [localProfile, setLocalProfile] = useState<any>(null);

  // listen for profile updates stored in localStorage
  useEffect(() => {
    const load = () => {
      try {
        const p = localStorage.getItem('profile');
        setLocalProfile(p ? JSON.parse(p) : null);
      } catch (e) { setLocalProfile(null); }
    };
    load();
    const handler = () => load();
    window.addEventListener('profileUpdated', handler);
    return () => window.removeEventListener('profileUpdated', handler);
  }, []);

  const navLinks = [
    { label: t('nav.home'), path: "/" },
    { label: t('nav.marketplace'), path: "/marketplace" },
    { label: t('nav.rentals'), path: "/rentals" },
    { label: t('nav.soil') || 'Soil Sensor', path: "/soil-monitor" },
    { label: t('nav.weather'), path: "/weather" },
    { label: t('nav.prices'), path: "/prices" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">Agri Expert</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSelector />
            <NotificationBell />
            {user ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar>
                    {localProfile?.avatar_url ? (
                      <AvatarImage src={String(localProfile.avatar_url)} />
                    ) : user.user_metadata?.avatar_url ? (
                      <AvatarImage src={String(user.user_metadata?.avatar_url)} />
                    ) : (
                      <AvatarFallback>{(user.email ?? user.id ?? 'U').toString().charAt(0).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">
                      {localProfile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('common.farmer')}</div>
                  </div>
                </div>
                <Button variant="ghost" onClick={async () => { await signOut(); navigate('/'); }}>{t('nav.logout') || 'Logout'}</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>{t('nav.login')}</Button>
                <Button onClick={() => navigate("/auth")}>{t('nav.getStarted')}</Button>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <NotificationBell />
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background border-t border-border p-4 space-y-3">
          {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="block py-2 text-foreground" onClick={() => setIsOpen(false)}>
                {link.label}
              </Link>
            ))}
          {user ? (
            <Button className="w-full" onClick={() => { navigate('/dashboard'); setIsOpen(false); }}>{t('nav.dashboard') || 'Dashboard'}</Button>
          ) : (
            <Button className="w-full" onClick={() => { navigate("/auth"); setIsOpen(false); }}>{t('nav.getStarted')}</Button>
          )}
        </div>
      )}
    </nav>
  );
};
