"""
serial_gateway.py

Reads lines from a serial port (default COM3 @ 9600) and POSTs JSON to the FastAPI backend.
Configure with environment variables:
- MOISTURE_COM_PORT (e.g., COM3)
- MOISTURE_BAUD (default 9600)
- MOISTURE_API_URL (default http://localhost:8000/moisture)

Run: python backend/serial_gateway.py
"""
import os
import time
import requests
from datetime import datetime

try:
    import serial
except Exception:
    serial = None

COM_PORT = os.environ.get("MOISTURE_COM_PORT", "COM3")
BAUD = int(os.environ.get("MOISTURE_BAUD", "9600"))
API_URL = os.environ.get("MOISTURE_API_URL", "http://localhost:8000/api/v1/update-moisture")
SENSOR_ID = os.environ.get("MOISTURE_SENSOR_ID", "arduino-nano-1")


def parse_moisture_from_line(line: str):
    line = line.strip()
    if not line:
        return None
    # Attempt to parse a float from the line (line can be like "42" or "moisture:42")
    parts = line.replace("=", ":").split(":")
    for p in reversed(parts):
        p = p.strip()
        try:
            return float(p)
        except Exception:
            continue
    return None


def main():
    if serial is None:
        print("pyserial not installed. Install with: pip install pyserial")
        return

    ser = None
    print(f"Starting serial gateway for {COM_PORT} @ {BAUD} baud -> {API_URL}")

    while True:
        try:
            try:
                ser = serial.Serial(COM_PORT, BAUD, timeout=1)
                print(f"Serial port opened: {COM_PORT} @ {BAUD}")
            except Exception as e:
                print("Failed to open serial port, will retry in 5s:", e)
                time.sleep(5)
                continue

            print("Reading lines and forwarding to", API_URL)
            while True:
                try:
                    raw = ser.readline()
                except Exception as e:
                    print("Read error, will attempt to reopen port:", e)
                    break

                if not raw:
                    continue

                try:
                    line = raw.decode(errors="ignore").strip()
                except Exception:
                    line = str(raw)

                value = parse_moisture_from_line(line)
                if value is None:
                    # ignore unparsable lines
                    continue

                payload = {
                    "sensor_id": SENSOR_ID,
                    "moisture": float(value),
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                }

                try:
                    resp = requests.post(API_URL, json=payload, timeout=3)
                    if resp.status_code == 200:
                        print("Posted:", payload)
                    else:
                        print("Post failed", resp.status_code, resp.text)
                except Exception as e:
                    print("Error posting to backend:", e)

                time.sleep(0.1)

        finally:
            try:
                if ser is not None and ser.is_open:
                    ser.close()
                    print("Serial port closed")
            except Exception:
                pass

        # Wait before retrying to open the COM port
        time.sleep(5)


if __name__ == "__main__":
    main()
