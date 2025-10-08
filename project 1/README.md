*Project 1 Write up:*

I wanted the terminal to feel like a tiny stage where air, something invisible and usually ignored, can perform. Instead of building a serious dashboard, I made a small, chatty command-line piece that asks you for a city, searches real monitoring stations through the World Air Quality Index API, and then shows you what the air is “feeling” like right now. The output is intentionally simple and a bit playful: an emoji mood, a chunky ASCII bar that fills up depending on the AQI (0–500), and some colored text using Colorama to tint everything from calm green to “please don’t breathe too hard” magenta. It’s not trying to be perfect; it’s trying to nudge you into noticing the air around you in a funny way we all know, emojis and colors!
Motivation-wise, I’m curious about how numbers become feelings. AQI values are just digits, but we already attach vibes to weather (“it’s cozy,” “it’s crisp”) so why not to air quality? The terminal is a great place for that because it strips away polish, just characters and color. That constraint makes every choice feel a little more creative. The intention isn’t moral panic or environmental preaching. It’s softer: small awareness through tiny delight. If you get excited by seeing the bar level or by the emoji shrugging, you’ve already paid attention longer than usual.

The interaction mirrors how I actually explored the API at first: search a city keyword (like “Montreal”), get a list of stations (with their UIDs), pick one, and pull its live feed. I kept that flow on purpose—it’s like flipping through radio stations to find a signal you care about. Technically, the program uses Python’s requests library to make live calls to the WAQI search endpoint and then to the feed endpoint by UID. The program parses the response safely (AQI is sometimes a dash or missing), prints the dominant pollutant, timestamp, and a small IAQI breakdown (the per-pollutant mini-scores). Colorama provides ANSI colors so the mood is instantly visible: green for “you’re okay,” yellow for “hmm,” red and purple for “maybe stay inside.” The point is not to be exhaustive but expressive enough to be informative, but also enough to be a little silly.

I learn to structure a Python script with user input, error handling, and live API requests. On the artistic side, I test whether humor and low-fi visuals can increase attention to environmental data. The success metric isn’t just “does it run”—it’s also “did someone linger?” Did someone ask what “pm25” means after seeing it? Did the colored bar make the number stick in memory as a vibe, not just a value? If so, that’s enough for me. The piece is small, but it opens a window to something we usually can’t see. And if it also makes someone grin in a terminal window for five extra seconds, I’ll call that a success. 

Resources:
- https://www.geeksforgeeks.org/python/print-colors-python-terminal/
- https://pypi.org/project/asciibars/



