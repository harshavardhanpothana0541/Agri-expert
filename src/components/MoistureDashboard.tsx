import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Reading = {
  sensor_id?: string | null;
  moisture: number;
  timestamp?: string | null;
};

export default function MoistureDashboard(): JSX.Element {
  const [moisture, setMoisture] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [readings, setReadings] = useState<Reading[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const failureCountRef = useRef<number>(0);
  const pingTimerRef = useRef<number | null>(null);
  const MAX_READINGS = 10;

  const connectRef = useRef<() => void | null>(null);

  useEffect(() => {
    let mounted = true;

    const addReading = (r: Reading) => {
      setReadings((prev) => [r, ...prev].slice(0, MAX_READINGS));
    };

    const connect = () => {
      setStatus("connecting");
      try {
        const ws = new WebSocket("ws://localhost:8000/ws/moisture");
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mounted) return;
          setStatus("connected");
          toast.success("Live backend connection established");
        };

        ws.onmessage = (ev) => {
          try {
            const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
            if (data && typeof data.moisture === "number") {
              const m = Number(data.moisture);
              const ts = data.timestamp ?? new Date().toISOString();
              if (mounted) {
                setMoisture(m);
                setTimestamp(ts);
                addReading({ sensor_id: data.sensor_id ?? null, moisture: m, timestamp: ts });
              }
            }
          } catch (err) {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          if (!mounted) return;
          // don't immediately mark disconnected here — rely on ping "3-strike" logic
          toast.error("Backend connection lost — attempting reconnect");
          scheduleReconnect();
        };

        ws.onerror = () => {
          // let onclose handle reconnection
        };
      } catch (e) {
        setStatus("disconnected");
        scheduleReconnect();
      }
    };

    // expose connect so UI can trigger a manual retry
    connectRef.current = connect;

    const scheduleReconnect = () => {
      if (reconnectTimer.current) return;
      // simple fixed retry
      reconnectTimer.current = window.setTimeout(() => {
        reconnectTimer.current = null;
        connect();
      }, 2000);
    };

    // seed with latest once
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/get-moisture");
        if (res.ok) {
          const d = await res.json();
          if (d && typeof d.moisture === "number") {
            const m = Number(d.moisture);
            const ts = d.timestamp ?? null;
            if (mounted) {
              setMoisture(m);
              setTimestamp(ts);
              if (ts !== null) addReading({ sensor_id: d.sensor_id ?? null, moisture: m, timestamp: ts });
            }
          }
        }
      } catch (e) {
        // ignore
      }

      connect();
    })();

    // start lightweight ping loop to detect backend availability (3 consecutive failures => disconnected)
    const startPing = () => {
      const pingInterval = 2000;
      const doPing = async () => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 1500);
        try {
          const res = await fetch("http://localhost:8000/api/v1/get-moisture", { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            failureCountRef.current = 0;
            if (mounted) setStatus("connected");
          } else {
            failureCountRef.current += 1;
            if (failureCountRef.current >= 3 && mounted) setStatus("disconnected");
          }
        } catch (e) {
          clearTimeout(timeout);
          failureCountRef.current += 1;
          if (failureCountRef.current >= 3 && mounted) setStatus("disconnected");
        }
      };

      // run immediately then interval
      doPing();
      pingTimerRef.current = window.setInterval(doPing, pingInterval) as unknown as number;
    };

    startPing();

    return () => {
      mounted = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current as unknown as number);
        pingTimerRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
        wsRef.current = null;
      }
    };
  }, []);

  // Web Serial API: allow direct connection to Arduino via USB from the browser
  const serialPortRef = useRef<any>(null);
  const readerRef = useRef<any>(null);

  const connectSerial = async () => {
    if (!("serial" in navigator)) {
      toast.error("Web Serial API not supported in this browser. Use Chrome or Edge.");
      return;
    }

    try {
      // request a port
      // @ts-ignore
      const port = await (navigator as any).serial.requestPort();
      // open at 9600 baud
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;

      // set UI state
      toast.success("Arduino connected via USB");
      setStatus("connected");

      const textDecoder = new TextDecoderStream();
      // @ts-ignore
      const readable = port.readable.pipeThrough(textDecoder);
      const reader = readable.getReader();
      readerRef.current = reader;

      // read loop
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        const lines = value.split(/\r?\n/).map((s: string) => s.trim()).filter((s: string) => s.length);
        for (const line of lines) {
          // parse numeric moisture from line
          const parsed = parseFloat(line.replace(/[^0-9.\-]/g, ""));
          if (!Number.isNaN(parsed)) {
            const m = Number(parsed);
            const ts = new Date().toISOString();
            setMoisture(m);
            setTimestamp(ts);
            setReadings((prev) => [{ sensor_id: "arduino-usb", moisture: m, timestamp: ts }, ...prev].slice(0, 10));
          }
        }
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err).toLowerCase();
      // common error when another process (like the Python serial gateway) has the port open
      if (msg.includes("already open") || msg.includes("access denied") || msg.includes("busy") || msg.includes("in use")) {
        toast.error("Please close your Python terminal script to use this button.");
      } else {
        toast.error(`Serial connect failed: ${err?.message ?? err}`);
      }
      setStatus("disconnected");
    }
  };

  const disconnectSerial = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
      toast.error("Arduino disconnected");
      setStatus("disconnected");
    } catch (e) {
      // ignore
    }
  };

  // Manual retry to restart the WebSocket/API connection
  const handleRetryClick = async () => {
    // close existing ws if any
    try {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
        wsRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      setStatus("connecting");
    } catch (e) {}

    // call the exposed connect function (websocket) and attempt serial reconnect if available
    try {
      connectRef.current && connectRef.current();
    } catch (e) {}

    // If browser supports Web Serial, try reconnecting Arduino serial as well
    try {
      if (typeof (navigator as any).serial !== "undefined") {
        // attempt disconnect first to clear any stale state, then reconnect
        try {
          await disconnectSerial();
        } catch (e) {}
        // small delay before attempting serial reconnect
        setTimeout(() => {
          try {
            connectSerial();
          } catch (e) {}
        }, 500);
      }
    } catch (e) {}
  };

  // notify on status changes
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev !== status) {
      if (status === "disconnected") {
        toast.error("Live moisture connection lost", { duration: 5000 });
      } else if (status === "connected") {
        toast.success("Live moisture connection restored", { duration: 3000 });
      }
      prevStatusRef.current = status;
    }
  }, [status]);

  const displayValue = typeof moisture === "number" ? Math.max(0, Math.min(100, Math.round(moisture))) : null;

  const statusColor = status === "connected" ? "#10b981" : status === "connecting" ? "#f59e0b" : "#ef4444";
  // Circular gauge helpers
  const radius = 70;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const pct = displayValue !== null ? Math.max(0, Math.min(100, displayValue)) : 0;
  const dash = `${(pct / 100) * circumference} ${circumference}`;

  // Weather / Climate Intelligence
  const [weather, setWeather] = useState<any>(null);
  const [rainAlert, setRainAlert] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setWeather(data.current_weather ?? data);
        // check next 6 hours for precipitation
        const hourly = data.hourly?.precipitation || [];
        const nextHours = hourly.slice(0, 6);
        const willRain = nextHours.some((p: number) => p > 0.5);
        setRainAlert(willRain);
      } catch (e) {
        // ignore
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => {
          // fallback: approximate center of India
          fetchWeather(17.3850, 78.4867);
        },
        { timeout: 4000 }
      );
    } else {
      fetchWeather(17.3850, 78.4867);
    }

    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Soil Moisture</h2>
        {status !== "connected" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 6, background: statusColor }} />
            <div style={{ fontSize: 13, color: "#666" }}>{status}</div>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <svg height={radius * 2} width={radius * 2}>
            <circle
              stroke="#e6e6e6"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={pct < 30 ? '#ef4444' : pct > 60 ? '#10b981' : '#f59e0b'}
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={0}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              style={{ transition: 'stroke-dasharray 350ms ease, stroke 250ms ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{displayValue !== null ? `${displayValue}%` : '—'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{timestamp ? new Date(timestamp).toLocaleString() : 'no data'}</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Recent Readings</h4>
          {readings.length === 0 ? (
            <div style={{ fontSize: 13, color: '#666' }}>No recent readings</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {readings.map((r, i) => (
                <div
                  key={`${r.timestamp ?? i}-${i}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: '#fafafa', borderRadius: 8, border: '1px solid #eee' }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{Math.round(r.moisture)}%</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{r.sensor_id ?? 'sensor'}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            {typeof (navigator as any).serial !== 'undefined' ? (
              <>
                <button onClick={() => connectSerial()} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff' }}>
                  Connect Arduino (USB)
                </button>
                <button onClick={() => disconnectSerial()} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff' }}>
                  Disconnect Arduino
                </button>
                {status === 'disconnected' ? (
                  <button onClick={handleRetryClick} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff' }}>
                    Retry Connection
                  </button>
                ) : null}
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#666' }}>Web Serial not supported in this browser.</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 8 }}>Climate Intelligence</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ padding: 12, borderRadius: 12, background: '#fff', border: '1px solid #eee', minWidth: 220 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Local Weather</div>
            {weather ? (
              <div style={{ fontSize: 13 }}>
                <div>Temp: {weather.temperature ?? weather.temp ?? '—'}°C</div>
                <div>Wind: {weather.windspeed ?? '—'} km/h</div>
                <div style={{ marginTop: 6, color: rainAlert ? '#b91c1c' : '#047857' }}>{rainAlert ? 'Rain expected soon' : 'No rain expected'}</div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#666' }}>Loading weather…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
