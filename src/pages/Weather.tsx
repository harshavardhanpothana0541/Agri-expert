import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AIAssistant } from "@/components/AIAssistant";
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, AlertTriangle, Sprout } from "lucide-react";

const initialWeather = {
  current: { temp: null, humidity: null, wind: null, condition: "--", icon: Cloud },
  forecast: [],
  alerts: [],
  recommendations: [],
};

const Weather = () => {
  const [weatherData, setWeatherData] = useState(initialWeather);
  const [location] = useState("Vijayawada, AP");

  useEffect(() => {
    const lat = 16.5062;
    const lon = 80.6480;
    let mounted = true;

    const weatherCodeToCondition = (code: number) => {
      // simplified mapping
      if (code === 0) return { text: 'Clear', icon: Sun };
      if (code <= 3) return { text: 'Mostly Clear', icon: Sun };
      if (code <= 48) return { text: 'Fog', icon: Cloud };
      if (code <= 67) return { text: 'Rain', icon: CloudRain };
      if (code <= 77) return { text: 'Snow/Hail', icon: CloudRain };
      if (code <= 99) return { text: 'Thunderstorm', icon: CloudRain };
      return { text: 'Cloudy', icon: Cloud };
    };

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=Asia%2FKolkata`;

    fetch(url)
      .then((r) => r.json())
      .then((payload) => {
        if (!mounted) return;
        const currentWeather = payload.current_weather || {};

        const cond = weatherCodeToCondition(Number(currentWeather.weathercode ?? 0));

        const current = {
          temp: currentWeather.temperature ?? null,
          humidity: null,
          wind: currentWeather.windspeed ?? null,
          condition: cond.text ?? '--',
          icon: cond.icon || Cloud,
        };

        const days = payload.daily || {};
        const times: string[] = days.time || [];
        const highs: number[] = days.temperature_2m_max || [];
        const lows: number[] = days.temperature_2m_min || [];
        const weathercodes: number[] = days.weathercode || [];
        const precip: number[] = days.precipitation_probability_max || [];

        const forecast = times.slice(0, 5).map((d: any, i: number) => {
          const wc = Number(weathercodes[i] ?? 0);
          const w = weatherCodeToCondition(wc);
          return {
            day: i === 0 ? 'Today' : new Date(d).toLocaleDateString('en-IN', { weekday: 'short' }),
            high: highs[i] ?? null,
            low: lows[i] ?? null,
            condition: w.text ?? '--',
            icon: w.icon || Sun,
            precip: precip[i] ?? null,
          };
        });

        setWeatherData({ current, forecast, alerts: [], recommendations: [] });
      })
      .catch(() => {
        // keep initial data on error
      });

    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Weather & Crop Advisory
          </h1>
          <p className="text-muted-foreground">📍 {location}</p>
        </div>

        {/* Current Weather */}
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <weatherData.current.icon className="w-20 h-20 text-primary" />
              <div>
                <p className="text-5xl font-bold text-foreground">{weatherData.current.temp ?? "--"}°C</p>
                <p className="text-lg text-muted-foreground">{weatherData.current.condition}</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <Droplets className="w-6 h-6 text-sky-500 mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Humidity</p>
                <p className="font-semibold text-foreground">{weatherData.current.humidity ?? "--"}%</p>
              </div>
              <div className="text-center">
                <Wind className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Wind</p>
                <p className="font-semibold text-foreground">{weatherData.current.wind ?? "--"} km/h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {weatherData.alerts && weatherData.alerts.length > 0 && (
          <div className="space-y-3 mb-6">
            {weatherData.alerts.map((alert, i) => (
              <div key={i} className={`p-4 rounded-xl flex items-start gap-3 ${
                alert.type === "warning" ? "bg-amber-500/10 border border-amber-500/20" : "bg-primary/10 border border-primary/20"
              }`}>
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${alert.type === "warning" ? "text-amber-500" : "text-primary"}`} />
                <p className="text-foreground">{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* 5-Day Forecast */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">5-Day Forecast</h2>
          <div className="grid grid-cols-5 gap-4">
            {weatherData.forecast && weatherData.forecast.length > 0 ? (
              weatherData.forecast.map((day, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-muted/50">
                  <p className="text-sm font-medium text-foreground mb-2">{day.day}</p>
                  <day.icon className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">{day.condition}</p>
                  <p className="text-sm font-semibold text-foreground mt-2">
                    {day.high ?? "--"}° / {day.low ?? "--"}°
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-5 text-center text-muted-foreground">No forecast available</div>
            )}
          </div>
        </div>

        {/* Crop Recommendations */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary" />
            Crop Recommendations
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {weatherData.recommendations.map((rec, i) => (
              <div key={i} className="p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{rec.crop}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    rec.status === "Excellent" ? "bg-primary/10 text-primary" :
                    rec.status === "Good" ? "bg-sky-500/10 text-sky-600" :
                    "bg-amber-500/10 text-amber-600"
                  }`}>
                    {rec.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{rec.message}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <AIAssistant />
    </div>
  );
};

export default Weather;
