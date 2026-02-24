import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AIAssistant } from "@/components/AIAssistant";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, MapPin, Calendar, ArrowUpDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const priceData = [
  { commodity: "Rice (Basmati)", unit: "Quintal", prices: { vijayawada: 4200, guntur: 4150, hyderabad: 4300 }, trend: "up", change: "+2.5%" },
  { commodity: "Wheat", unit: "Quintal", prices: { vijayawada: 2800, guntur: 2750, hyderabad: 2900 }, trend: "down", change: "-1.2%" },
  { commodity: "Cotton", unit: "Quintal", prices: { vijayawada: 7500, guntur: 7600, hyderabad: 7450 }, trend: "up", change: "+3.1%" },
  { commodity: "Tomato", unit: "Kg", prices: { vijayawada: 45, guntur: 42, hyderabad: 48 }, trend: "down", change: "-5.0%" },
  { commodity: "Onion", unit: "Kg", prices: { vijayawada: 35, guntur: 33, hyderabad: 38 }, trend: "up", change: "+4.2%" },
  { commodity: "Potato", unit: "Kg", prices: { vijayawada: 28, guntur: 26, hyderabad: 30 }, trend: "stable", change: "0%" },
  { commodity: "Groundnut", unit: "Quintal", prices: { vijayawada: 6200, guntur: 6100, hyderabad: 6350 }, trend: "up", change: "+1.8%" },
  { commodity: "Chilli (Dry)", unit: "Quintal", prices: { vijayawada: 18000, guntur: 18500, hyderabad: 17800 }, trend: "down", change: "-2.3%" },
];

const locations = ["vijayawada", "guntur", "hyderabad"];

const Prices = () => {
  const [selectedLocation, setSelectedLocation] = useState<keyof typeof priceData[0]["prices"]>("vijayawada");
  const [sortBy, setSortBy] = useState<"name" | "price" | "trend">("name");

  const sortedData = [...priceData].sort((a, b) => {
    if (sortBy === "name") return a.commodity.localeCompare(b.commodity);
    if (sortBy === "price") return b.prices[selectedLocation] - a.prices[selectedLocation];
    return a.trend.localeCompare(b.trend);
  });

  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t('marketplace.dailyMarketPrices') || t('prices.dailyMarketPrices') || 'Daily Market Prices'}
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            Updated: {new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}
          </p>
        </div>

        {/* Location Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {locations.map((loc) => (
            <Button
              key={loc}
              variant={selectedLocation === loc ? "default" : "outline"}
              onClick={() => setSelectedLocation(loc as any)}
              className="capitalize"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {loc}
            </Button>
          ))}
        </div>

        {/* Price Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold text-foreground">{t('prices.commodity')}</th>
                  <th className="text-left p-4 font-semibold text-foreground">{t('prices.unit')}</th>
                  <th className="text-right p-4 font-semibold text-foreground">
                    {t('prices.price')} (₹) - {selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1)}
                  </th>
                  <th className="text-right p-4 font-semibold text-foreground">{t('prices.trend')}</th>
                  <th className="text-right p-4 font-semibold text-foreground">{t('prices.change')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium text-foreground">{item.commodity}</td>
                    <td className="p-4 text-muted-foreground">{item.unit}</td>
                    <td className="p-4 text-right font-semibold text-foreground">
                      ₹{item.prices[selectedLocation].toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {item.trend === "up" && <TrendingUp className="w-5 h-5 text-primary inline" />}
                      {item.trend === "down" && <TrendingDown className="w-5 h-5 text-destructive inline" />}
                      {item.trend === "stable" && <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className={`p-4 text-right font-medium ${
                      item.trend === "up" ? "text-primary" : 
                      item.trend === "down" ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {item.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Location Comparison */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Price Comparison by Location</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <div key={loc} className="glass-card rounded-xl p-4">
                <h3 className="font-semibold text-foreground capitalize mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {loc}
                </h3>
                <div className="space-y-2">
                  {priceData.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.commodity}</span>
                      <span className="font-medium text-foreground">
                        ₹{item.prices[loc as keyof typeof item.prices].toLocaleString()}
                      </span>
                    </div>
                  ))}
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

export default Prices;
