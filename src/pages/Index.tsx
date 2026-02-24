import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AIAssistant } from "@/components/AIAssistant";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Sprout, Brain, Users, ShoppingCart, Tractor, Cloud, 
  TrendingUp, Bell, ArrowRight, CheckCircle2, Leaf, Sun, Droplets 
} from "lucide-react";

const Index = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Check if translations are loaded
  const heroTitle = t('home.heroTitle');
  if (heroTitle.includes('home.')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }
  
  const features = [
    { icon: Brain, title: t('home.features.aiAnalysis'), desc: t('home.features.aiAnalysisDesc') },
    { icon: Users, title: t('home.features.expertConnect'), desc: t('home.features.expertConnectDesc') },
    { icon: ShoppingCart, title: t('home.features.marketplace'), desc: t('home.features.marketplaceDesc') },
    { icon: Tractor, title: t('home.features.rentals'), desc: t('home.features.rentalsDesc') },
    { icon: Cloud, title: t('home.features.weather'), desc: t('home.features.weatherDesc') },
    { icon: TrendingUp, title: t('home.features.prices'), desc: t('home.features.pricesDesc') },
  ];

  const steps = [
    { step: "1", title: t('home.steps.step1'), desc: t('home.steps.step1Desc') },
    { step: "2", title: t('home.steps.step2'), desc: t('home.steps.step2Desc') },
    { step: "3", title: t('home.steps.step3'), desc: t('home.steps.step3Desc') },
    { step: "4", title: t('home.steps.step4'), desc: t('home.steps.step4Desc') },
  ];

  const problems = [
    t('home.problems.expertAdvice'),
    t('home.problems.diseaseId'),
    t('home.problems.marketPrices'),
    t('home.problems.equipment'),
    t('home.problems.weatherAlerts'),
    t('home.problems.govSchemes')
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 md:px-8 overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-20 right-10 opacity-20">
          <Leaf className="w-64 h-64 text-primary animate-float" />
        </div>
        <div className="absolute bottom-10 left-10 opacity-10">
          <Sun className="w-48 h-48 text-accent" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sprout className="w-4 h-4" />
                {t('home.badge')}
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                {t('home.heroTitle')}<br />
                <span className="text-gradient">{t('home.heroSubtitle')}</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                {t('home.heroDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={user ? "/dashboard" : "/auth"}>
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    {user ? t('nav.dashboard') : t('nav.getStarted')} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/problem-input">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    {t('home.scanCrop')}
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative animate-scale-in">
              <div className="glass-card rounded-3xl p-8 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t('home.card.aiAnalysis')}</p>
                    <p className="text-sm text-muted-foreground">{t('home.card.aiAnalysisDesc')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-xl">
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t('home.card.expertChat')}</p>
                    <p className="text-sm text-muted-foreground">{t('home.card.expertChatDesc')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t('home.card.solutions')}</p>
                    <p className="text-sm text-muted-foreground">{t('home.card.solutionsDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 px-4 md:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('home.problemsTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home.problemsDesc')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {problems.map((problem, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-destructive font-bold text-sm">✕</span>
                </div>
                <p className="text-foreground">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('home.howItWorksTitle')}
            </h2>
            <p className="text-muted-foreground">{t('home.howItWorksDesc')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="glass-card rounded-2xl p-6 text-center h-full">
                  <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-primary/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 md:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('home.featuresTitle')}
            </h2>
            <p className="text-muted-foreground">{t('home.featuresDesc')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 hover:shadow-xl transition-shadow group">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t('home.trustTitle')}
            </h2>
            <div className="grid sm:grid-cols-3 gap-8 mb-8">
              <div>
                <p className="text-4xl font-bold text-primary mb-2">10,000+</p>
                <p className="text-muted-foreground">{t('home.activeFarmers')}</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary mb-2">500+</p>
                <p className="text-muted-foreground">{t('home.expertAdvisors')}</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary mb-2">50,000+</p>
                <p className="text-muted-foreground">{t('home.problemsSolved')}</p>
              </div>
            </div>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="gap-2">
                {user ? t('nav.dashboard') : t('home.joinNow')} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <Bell className="w-12 h-12 text-primary-foreground/80 mx-auto mb-6" />
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            {t('home.ctaDesc')}
          </p>
          <Link to="/notifications">
            <Button size="lg" variant="secondary" className="gap-2">
              {t('home.viewNotifications')} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
      <AIAssistant />
    </div>
  );
};

export default Index;
