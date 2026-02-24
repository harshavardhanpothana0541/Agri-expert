from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Set
from pydantic import BaseModel
import asyncio
import os
import requests

app = FastAPI(title="AgriExpert Moisture API")

# Allow the frontend dev server origin; add others as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8082", "http://localhost:8083", "http://localhost:8084", "http://localhost:8085", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MoistureData(BaseModel):
    sensor_id: Optional[str] = None
    moisture: float
    timestamp: Optional[str] = None


class UserProfile(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None
    avatar_url: Optional[str] = None

# In-memory latest reading (simple, avoids DB dependency)
_latest = {"sensor_id": None, "moisture": None, "timestamp": None}

# Simple in-memory user profile store for demo purposes
_user_profile = {"full_name": None, "phone": None, "language": None, "avatar_url": None}

# Active WebSocket connections
_connections: Set[WebSocket] = set()
_conn_lock = asyncio.Lock()

async def _broadcast(payload: dict):
    """Send payload to all connected WebSocket clients."""
    async with _conn_lock:
        to_remove = []
        for ws in list(_connections):
            try:
                await ws.send_json(payload)
            except Exception:
                to_remove.append(ws)

        for ws in to_remove:
            try:
                _connections.remove(ws)
            except KeyError:
                pass


@app.post("/moisture")
async def post_moisture(data: MoistureData):
    _latest.update({"sensor_id": data.sensor_id, "moisture": data.moisture, "timestamp": data.timestamp})
    # broadcast to live clients; don't fail the request if broadcasts fail
    try:
        await _broadcast({"sensor_id": data.sensor_id, "moisture": data.moisture, "timestamp": data.timestamp})
    except Exception:
        pass
    return {"status": "ok"}


@app.post("/api/v1/update-moisture")
async def api_update_moisture(data: MoistureData):
    # alias to existing post_moisture behavior
    _latest.update({"sensor_id": data.sensor_id, "moisture": data.moisture, "timestamp": data.timestamp})
    try:
        await _broadcast({"sensor_id": data.sensor_id, "moisture": data.moisture, "timestamp": data.timestamp})
    except Exception:
        pass
    return {"status": "ok"}


@app.get("/moisture/latest")
async def get_latest():
    return _latest


@app.get("/api/v1/get-moisture")
async def api_get_moisture():
    return _latest


@app.get("/api/v1/weather")
async def api_get_weather(lat: float, lon: float):
    """Fetch weather from Open-Meteo (free, no API key required) for given coordinates."""
    try:
        # Open-Meteo API: no authentication needed
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=weather_code,temperature_2m,relative_humidity_2m,precipitation,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto"
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        try:
            print("Open-Meteo response:", data)
        except Exception:
            pass
        
        # Extract current conditions
        current = data.get("current_weather", {})
        temp = current.get("temperature")
        wind = current.get("windspeed")
        
        # Extract daily forecast (convert to days format compatible with frontend)
        daily = data.get("daily", {})
        temps_max = daily.get("temperature_2m_max", [])
        temps_min = daily.get("temperature_2m_min", [])
        precip_prob = daily.get("precipitation_probability_max", [])
        dates = daily.get("time", [])
        
        days = []
        for i in range(min(5, len(dates))):
            days.append({
                "datetime": dates[i],
                "tempmax": temps_max[i] if i < len(temps_max) else None,
                "tempmin": temps_min[i] if i < len(temps_min) else None,
                "precipprobability": precip_prob[i] if i < len(precip_prob) else None,
                "conditions": "Rainy" if (precip_prob[i] if i < len(precip_prob) else 0) > 50 else "Clear"
            })
        
        # precipitation probability from hourly data
        hourly_precip_prob = data.get("hourly", {}).get("precipitation_probability", [])
        rain_prob = hourly_precip_prob[0] if len(hourly_precip_prob) > 0 else 0
        
        return {
            "status": "ok",
            "data": {
                "currentConditions": {
                    "temp": temp,
                    "windspeed": wind,
                    "humidity": None,
                    "conditions": "Clear" if rain_prob < 30 else ("Rainy" if rain_prob > 70 else "Partly Cloudy")
                },
                "days": days,
                "alerts": []
            },
            "precipprob": rain_prob
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.websocket("/ws/moisture")
async def websocket_moisture(ws: WebSocket):
    await ws.accept()
    async with _conn_lock:
        _connections.add(ws)
    try:
        # Keep the connection open until client disconnects.
        while True:
            try:
                await ws.receive_text()
            except WebSocketDisconnect:
                break
            except Exception:
                # ignore other receive errors; loop will continue until disconnect
                await asyncio.sleep(0.1)
    finally:
        async with _conn_lock:
            try:
                _connections.remove(ws)
            except KeyError:
                pass


@app.get("/api/users/me")
async def get_user_profile():
    # return the stored profile (demo only)
    return _user_profile


@app.put("/api/users/me")
async def update_user_profile(profile: UserProfile):
    # update in-memory profile; in a real app persist to DB
    try:
        if profile.full_name is not None:
            _user_profile['full_name'] = profile.full_name
        if profile.phone is not None:
            _user_profile['phone'] = profile.phone
        if profile.language is not None:
            _user_profile['language'] = profile.language
        if profile.avatar_url is not None:
            _user_profile['avatar_url'] = profile.avatar_url
        return {"status": "ok", "message": "Profile updated", "profile": _user_profile}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# Run with: uvicorn backend.main:app --reload --port 8000
