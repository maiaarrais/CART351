# Query Explanations & Visualization Intent

## 🌱 Introduction

This project explores how different factors—like weather, day of the week, and type of event—relate to changes in people's mood. Using a fictional dataset of 1000 entries stored in MongoDB, I created a series of queries and custom data visualizations to reveal patterns in how events affect emotional states. Each visualization focuses on a specific query and turns raw data into a visual story.

## 🔍 Query Explanations (Part III)

### Query 3 – After Mood is Positive

This query selects all entries where the participant's after_mood is one of the "positive" moods.
```json
{ "after_mood": { "$in": ["happy", "serene", "calm", "well"] } }
```

It isolates all the "good outcome" situations so they can be visualized on their own.

### Query 4 – Sorted by Event Name

This query selects all entries and sorts them alphabetically by event_name.
Great for comparing events side-by-side and seeing how often each one appears.

### Query 5 – Monday or Tuesday + Sort by Impact

This one filters entries that happened on Monday or Tuesday, then sorts them by event_affect_strength.
It focuses on early-week events and how strong their emotional impact felt for participants.

### Query 6 – Negative → Negative (Start & After Mood)

This query selects entries where both the starting mood and after mood are in the "negative" category, then sorts them by weather.
It highlights situations where mood didn't improve, and ties them to weather conditions.

## 🎨 Visualization Intent (Part IV)

### Query 3 – Positive Spiral ☀️

For positive outcomes, I created a spiral/sun-like layout.

- Stronger after-moods = points placed farther from the center
- Warmer colors = more intensity

The spiral shape visually represents mood "lifting" and expanding outward.

### Query 4 – Event Shelves 📚

Since the data is sorted by event name, I mapped each event to its own horizontal "shelf," like books in a library.
This makes it easy to see:

- Which events happen most
- How strong the after-moods are for each event type

### Query 5 – Impact Tracks (Mon vs Tue)

I created two horizontal lanes—one for Monday, one for Tuesday.

- X-position shows how strong the event felt
- Color represents the event type

It's a clean comparison of early-week emotional experiences.

### Query 6 – Storm Bands 🌧️

Entries where mood stayed negative are placed into vertical "weather bands."

- Each band = one type of weather
- Darker dots = stronger event impact

The result looks like storm columns, matching the emotional tone of the data.