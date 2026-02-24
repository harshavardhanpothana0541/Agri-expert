import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIAssistant } from "@/components/AIAssistant";
import { Search, ShoppingCart, Star, Package, Leaf, Bug, Droplets, Volume2, Plus, Wrench } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

const categories = [
  { id: "all", label: "All Products", icon: Package, emoji: "📦" },
  { id: "fertilizers", label: "Fertilizers", icon: Leaf, emoji: "🧴" },
  { id: "pesticides", label: "Pesticides", icon: Bug, emoji: "🧴" },
  { id: "seeds", label: "Seeds", icon: Droplets, emoji: "🌰" },
  { id: "tools", label: "Tools", icon: Wrench, emoji: "🛠️" },
];

const products = [
  { id: 1, name: "Organic NPK Fertilizer", category: "fertilizers", price: 450, rating: 4.8, seller: "GreenFarm Co.", image: "🌿", unit: "quintal" },
  { id: 2, name: "Neem Oil Pesticide", category: "pesticides", price: 320, rating: 4.6, seller: "AgroShield", image: "🛡️", unit: "liter" },
  { id: 3, name: "Hybrid Tomato Seeds", category: "seeds", price: 180, rating: 4.9, seller: "SeedMaster", image: "🍅", unit: "packet" },
  { id: 4, name: "Potash Fertilizer 5kg", category: "fertilizers", price: 580, rating: 4.7, seller: "FarmNutrients", image: "💚", unit: "bag" },
  { id: 5, name: "Bio Fungicide", category: "pesticides", price: 420, rating: 4.5, seller: "BioGuard", image: "🔬", unit: "bottle" },
  { id: 6, name: "Basmati Rice Seeds", category: "seeds", price: 250, rating: 4.8, seller: "RiceKing", image: "🌾", unit: "kg" },
  { id: 7, name: "Micronutrient Mix", category: "fertilizers", price: 380, rating: 4.6, seller: "NutriGrow", image: "⚗️", unit: "pack" },
  { id: 8, name: "Organic Wheat Seeds", category: "seeds", price: 200, rating: 4.7, seller: "WheatPro", image: "🌾", unit: "kg" },
];

const Marketplace = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart, totalItems } = useCart();
  const { t, language } = useLanguage();
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({ id: product.id, name: product.name, price: product.price, seller: product.seller, image: product.image });
    toast({ title: "Added to cart!", description: "Product added successfully" });
  };

  const speakProduct = (product: typeof products[0]) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `${product.name}, ${product.price} rupees per ${product.unit}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const iconScrollerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {t('marketplace.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('marketplace.subtitle')}
            </p>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0" onClick={() => navigate('/checkout')}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('marketplace.cart')} ({totalItems})
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('marketplace.search')}
            className="pl-10"
          />
        </div>

        {/* Icon-based Category Scrollbar */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scroll-smooth">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              title={cat.label}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-center leading-tight">{cat.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="glass-card rounded-xl p-4 hover:scale-105 transition-transform flex flex-col">
              <div className="text-6xl text-center mb-4">{product.image}</div>
              <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">{product.seller}</p>
              <div className="flex items-center gap-1 mb-3">
                <Star className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-muted-foreground">{product.rating}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mb-3 mt-auto">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-primary">₹{product.price}</span>
                  <span className="text-xs text-muted-foreground">{t('marketplace.perUnit')}</span>
                </div>
                <button
                  onClick={() => speakProduct(product)}
                  className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Read price"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <Button
                size="lg"
                onClick={() => handleAddToCart(product)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
              >
                <Plus className="w-5 h-5 mr-1" />
                {t('marketplace.add')}
              </Button>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </main>

      <AIAssistant />
    </div>
  );
};

export default Marketplace;
