"""
Minimal terminal app to search and view air quality data.
- Live data from World Air Quality Index API
- Interactive (input): search stations by keyword, pick one, view details
- Terminal-only visuals: ASCII bar + emoji band
"""

import os
import sys
import requests
from colorama import init as colorama_init, Fore, Style

colorama_init(autoreset=True)

API_SEARCH = "https://api.waqi.info/search/"
API_FEED_ID = "https://api.waqi.info/feed/@{uid}"

# AQI bands: (min, max, label, emoji)
BANDS = [
    (0, 50, "Good", "😌"),
    (51, 100, "Moderate", "🙂"),
    (101, 150, "Unhealthy for Sensitive Groups", "😕"),
    (151, 200, "Unhealthy", "😷"),
    (201, 300, "Very Unhealthy", "🤢"),
    (301, 500, "Hazardous", "☠️"),
]
def parse_aqi(val):
    """Return int AQI or None if not parseable."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return int(val)
    if isinstance(val, str):
        s = val.strip()
        if s.isdigit():
            return int(s)
    return None

def color_for_aqi(aqi: int) -> str:
    """Return a Colorama foreground color for the AQI band."""
    if aqi <= 50:   return Fore.GREEN
    if aqi <= 100:  return Fore.YELLOW
    if aqi <= 150:  return Fore.LIGHTYELLOW_EX  
    if aqi <= 200:  return Fore.RED
    if aqi <= 300:  return Fore.MAGENTA
    return Fore.LIGHTMAGENTA_EX

def get_token():
    token = os.environ.get("WAQI_TOKEN", "").strip()
    if not token:
        token = input("Enter WAQI API token: ").strip()
    if not token:
        print("No token. Exiting.")
        sys.exit(1)
    return token

def aqi_band(aqi: int):
    for lo, hi, label, emo in BANDS:
        if lo <= aqi <= hi:
            return label, emo
    return "Beyond Index", "🫠"

def ascii_bar(aqi: int, width: int = 30) -> str:
    aqi = max(0, min(500, int(aqi)))
    filled = int((aqi / 500.0) * width)
    return "█" * filled + "░" * (width - filled)

def search_stations(token: str, keyword: str):
    try:
        r = requests.get(API_SEARCH, params={"token": token, "keyword": keyword}, timeout=10)
        r.raise_for_status()
        js = r.json()
        if js.get("status") != "ok":
            return []
        return js.get("data", [])
    except requests.RequestException:
        return []

def fetch_by_uid(token: str, uid: int):
    try:
        r = requests.get(API_FEED_ID.format(uid=uid), params={"token": token}, timeout=10)
        r.raise_for_status()
        js = r.json()
        if js.get("status") != "ok":
            return None
        return js.get("data")
    except requests.RequestException:
        return None

def show_results_table(results):
    print("\n#  Station (AQI)                            UID        Lat, Lon")
    print("-- ---------------------------------------- ---------- ----------------------")
    for i, item in enumerate(results, start=1):
        st = item.get("station", {})
        name = (st.get("name") or "—")[:40]
        aqi_raw = item.get("aqi")           # ✅ correct variable
        uid = str(item.get("uid", "—"))
        geo = st.get("geo", ["?", "?"])
        latlon = f"{geo[0]}, {geo[1]}" if isinstance(geo, list) and len(geo) == 2 else "—"

        aqi_val = parse_aqi(aqi_raw)
        if aqi_val is not None:
            c = color_for_aqi(aqi_val)
            aqi_disp = f"{c}{aqi_val}{Style.RESET_ALL}"
        else:
            aqi_disp = "—"

        print(f"{i:>2} {name:<40} ({aqi_disp})  {uid:<10} {latlon}")


def render_feed(data):
    city = data.get("city", {}).get("name", "Unknown")
    iaqi = data.get("iaqi", {})
    aqi = parse_aqi(data.get("aqi"))       # ✅ parse
    # Optional fallback if AQI missing: try pm25 → pm10 → o3
    if aqi is None and isinstance(iaqi, dict):
        for key in ("pm25", "pm10", "o3"):
            v = iaqi.get(key, {})
            v = v.get("v") if isinstance(v, dict) else None
            if isinstance(v, (int, float)):
                aqi = int(v); break

    dom = data.get("dominentpol", "n/a")
    timeblock = data.get("time", {})

    print("\n=== LIVE AQI ===")
    print(f"City:        {city}")
    if aqi is not None:
        label, emo = aqi_band(aqi)
        color = color_for_aqi(aqi)
        print(f"AQI:         {color}{aqi}{Style.RESET_ALL}  {emo}  ({label})")
        print(f"Bar:         {color}{ascii_bar(aqi)}{Style.RESET_ALL}")
        print(f"Dominant:    {color}{dom}{Style.RESET_ALL}")
    else:
        print("AQI:         n/a  ❔  (no reading)")
        print(f"Bar:         {ascii_bar(0)}")
        print(f"Dominant:    {dom}")

    stamp = timeblock.get("iso") or f"{timeblock.get('s', '—')} {timeblock.get('tz','')}"
    print(f"Time:        {stamp}")

    if isinstance(iaqi, dict) and iaqi:
        print("\nIAQI (per-pollutant):")
        for k, v in iaqi.items():
            val = v.get("v", "—") if isinstance(v, dict) else v
            print(f"  - {k:<6} {val}")


def main():
    print("WAQI Minimal — search → pick station → view")
    token = get_token()

    while True:
        kw = input("\nSearch keyword (e.g., Montreal) or ENTER to quit: ").strip()
        if not kw:
            print("Bye!")
            break

        results = search_stations(token, kw)
        if not results:
            print("No stations found (or network error). Try another keyword.")
            continue

        show_results_table(results)

        choice = input("\nPick by list index OR type a UID (q to back): ").strip().lower()
        if choice == "q":
            continue

        uid = None
        if choice.isdigit():
            idx = int(choice)
            if 1 <= idx <= len(results):
                uid = results[idx - 1].get("uid")
            else:
                # Maybe they actually typed a UID
                uid = int(choice)
        else:
            # Try parse UID directly (handles inputs like "5468")
            try:
                uid = int(choice)
            except ValueError:
                print("Not a valid index/UID.")
                continue

        data = fetch_by_uid(token, int(uid))
        if not data:
            print("Couldn’t fetch that station feed. Try another.")
            continue

        render_feed(data)

        # choose another station without going back
        again = input("\nCheck another station with same keyword? (y/n): ").strip().lower()
        if again != "y":
            # loop back to a new keyword
            pass

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nGoodbye!")
