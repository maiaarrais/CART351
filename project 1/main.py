"""
Minimal terminal app to search and view air quality data.
- Live data from World Air Quality Index API
- Interactive (input): search stations by keyword, pick one, view details
- Terminal-only visuals: ASCII bar + emoji band

Expected run flow: 
    WAQI Minimal — search → pick station → view
    # User enters a keyword like "Montreal", sees a table of stations.
    # User chooses a row number or types a UID.
    # Program prints a detailed "LIVE AQI" panel for that station.

(Actual numbers/rows vary because the API is live.)

"""

import os
import sys
from dotenv import load_dotenv
import requests
from colorama import init as colorama_init, Fore, Style

colorama_init(autoreset=True)


load_dotenv()  # reads .env into environment

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
    token = os.getenv("WAQI_TOKEN", "").strip()
    if not token:
        print("No WAQI_TOKEN set. Put it in a .env file or env var.")
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

    # Expected output (example; colors not shown in comments):
    # 
    # #  Station (AQI)                            UID        Lat, Lon
    # -- ---------------------------------------- ---------- ----------------------
    #  1 Montreal                                (24)       5922       45.5086699, -73.5539925
    #  2 Échangeur Décarie, Montreal, Canada     (30)       8595       45.502648, -73.663913
    #  3 Ontario, Montreal, Canada               (30)       8628       45.52055, -73.563222
    #  4 Jardin Botanique, Montreal, Canada      (17)       8695       45.56221, -73.571785
    #  5 Verdun, Montreal, Canada                (12)       8594       45.472854, -73.57296
    #   ... (more rows) ...
    #
    # Notes:
    # - The AQI in parentheses is colorized in the real terminal.
    # - Rows and values will change based on live API data.

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

# Expected (example):
    # === LIVE AQI ===
    # City:        Sainte-Anne-de-Bellevue, Montreal, Canada
    # AQI:         30  🙂  (Moderate)
    # Bar:         ████████░░░░░░░░░░░░░░░░░░░  ← (length depends on AQI)
    # Dominant:    pm25
    # Time:        2025-09-22T14:00:00-04:00
    #
    # IAQI (per-pollutant):
    #   - co      6.4
    #   - h       75.1
    #   - no2     7.4
    #   - o3      22
    #   - p       1013.6
    #   - pm25    30
    #   - so2     5.1
    #   - t       19.1
    #   - w       1
    #   - wg      1.3


    print(f"City:        {city}")
    if aqi is not None:
        label, emo = aqi_band(aqi)
        color = color_for_aqi(aqi)
        print(f"AQI:         {color}{aqi}{Style.RESET_ALL}  {emo}  ({label})")
        print(f"Bar:         {color}{ascii_bar(aqi)}{Style.RESET_ALL}")
        print(f"Dominant:    {color}{dom}{Style.RESET_ALL}")
    else:
        # Expected when AQI missing:
        # AQI:         n/a  ❔  (no reading)
        # Bar:         ░░░░░░░░░░░░░░░░░░░░░░░░
        # Dominant:    pm25
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
        # OUTER LOOP: choose keyword
        kw = input("\nSearch keyword (e.g., Montreal) or ENTER to quit: ").strip()
        if not kw:
            print("Bye!")
            break

        results = search_stations(token, kw)
        if not results:
            print("No stations found (or network error). Try another keyword.")
            continue

        # INNER LOOP: reuse the SAME results so user can pick multiple stations
        while True:
            show_results_table(results)

            choice = input(
                "\nPick by list index OR type a UID "
                "(b/back = new keyword, r/refresh = refresh list): "
            ).strip().lower()

            if choice in ("b", "back"):
                # break inner loop → go ask for a NEW keyword
                break
            if choice in ("r", "refresh"):
                # refresh the same keyword’s results and stay in inner loop
                results = search_stations(token, kw)
                continue

            uid = None
            if choice.isdigit():
                idx = int(choice)
                if 1 <= idx <= len(results):
                    uid = results[idx - 1].get("uid")
                else:
                    # maybe they actually typed a UID
                    uid = int(choice)
            else:
                try:
                    uid = int(choice)  # typed a UID directly
                except ValueError:
                    print("Not a valid index/UID.")
                    continue

            data = fetch_by_uid(token, int(uid))
            if not data:
                print("Couldn’t fetch that station feed. Try another.")
                continue

            render_feed(data)

            # stay in the SAME keyword/results if 'y'; otherwise break to new keyword
            again = input("\nCheck another station from the same list? (y/n): ").strip().lower()
            if again != "y":
                break  # leave inner loop → back to keyword prompt

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nGoodbye!")
