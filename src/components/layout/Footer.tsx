import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-card border-t border-border py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">Agri Expert</span>
          </div>
          <p className="text-muted-foreground text-sm">{t('home.heroTitle')} {t('home.heroSubtitle')}</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3">{t('common.viewAll')}</h4>
          <div className="space-y-2 text-sm">
            <Link to="/marketplace" className="block text-muted-foreground hover:text-foreground">{t('nav.marketplace')}</Link>
            <Link to="/rentals" className="block text-muted-foreground hover:text-foreground">{t('nav.rentals')}</Link>
            <Link to="/weather" className="block text-muted-foreground hover:text-foreground">{t('nav.weather')}</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3">{t('experts.title')}</h4>
          <div className="space-y-2 text-sm">
            <Link to="/problem-input" className="block text-muted-foreground hover:text-foreground">{t('problemInput.title')}</Link>
            <Link to="/experts" className="block text-muted-foreground hover:text-foreground">{t('experts.startChat')}</Link>
            <Link to="/prices" className="block text-muted-foreground hover:text-foreground">{t('nav.prices')}</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3">{t('common.close')}</h4>
          <p className="text-sm text-muted-foreground">support@agriexpert.com</p>
          <p className="text-sm text-muted-foreground">+91 98765 43210</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
        © 2024 Agri Expert. {t('common.success')}
      </div>
    </footer>
  );
};
