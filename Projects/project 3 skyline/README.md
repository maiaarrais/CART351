# 🌃 Rising Intentions: A Collective Neon Skyline

**Explorable Networked Space Project**

---

## Overview

This project explores how personal intentions, private goals, and everyday decisions can become part of a shared digital space. I wanted to create something that visualizes the quiet motivations people carry into their week—things like wanting to improve their health, focus on school, rest more, or reconnect with others. These thoughts are often invisible, yet they guide so much of how we move through life. 

My intention was to design a gentle networked space that gives form to these inner commitments without exposing anyone's identity. The result is a **neon skyline** where buildings glow brighter as people set their goals, creating a city shaped entirely by collective intention. Unlike traditional data visualization tools that prioritize efficiency and clarity, this project prioritizes emotion and atmosphere, treating each data point not as a statistic but as a human moment worth honoring.

---

## Core Interaction

The core idea is simple. Each person answers a small, reflective questionnaire about what they want to focus on this week, what actions they plan to take, and how confident they feel. Their answers do not disappear—they become part of a **living visualization**. 

Every submission lights up a new window in a building that represents a larger theme such as:
- 🏫 School
- 💼 Work & Money
- 💕 Relationships
- 🏃 Health
- 🎨 Creativity
- 😴 Rest

Confidence levels affect how strongly each window glows, ranging from a dim cyan glow for uncertainty to an intense pink pulse for complete confidence. Over time, the skyline becomes a portrait of what the community cares about, where energy is being placed, and which areas feel strong or fragile. The visualization updates in real-time, meaning users can watch the city transform as new intentions arrive, creating a sense of active participation in something larger than themselves.

---

## Every Window as a Life

A key conceptual choice in this project is the idea that **every window represents a different person's response**. Each glowing square is its own tiny life, its own story, its own moment of intention.

In a real city, every apartment window contains an individual living their own life with different struggles and different hopes, yet they still participate in the same larger structure. I wanted this digital skyline to carry that same emotional truth. Each user's window is separate and personal, yet the building they form together is shared.

This reflects how people can be deeply individual while still connected, contributing to a collective atmosphere without knowing one another directly. This design choice supports the project's theme of **subtle online connectivity**, where anonymity does not erase meaning. You cannot know whose window is whose, but you know they are all real. You cannot read everyone's story, but you can sense the collective mood. This balance between privacy and presence felt essential to creating an ethical and emotionally honest networked space.

---

## Connection

This project connects directly to our course framework of building an explorable networked space that maintains shared state through a database.

- The skyline is **not static**, it updates as users interact with it
- Each window is stored in MongoDB, retrieved through Flask, and displayed asynchronously
- The city changes because people change
- It becomes a soft form of real-time data visualization with a more emotional and human focus than typical analytical tools

The project also engages with discussions about **meaningful interaction versus passive consumption**. Users are not simply viewing content created by others; they are actively shaping the space through their participation. Every submission changes the landscape. This mirrors our exploration of how digital environments can foster belonging without requiring constant engagement or surveillance. The skyline exists whether you visit it or not, but it welcomes you back whenever you return, showing you how the community has evolved in your absence.

---

## Design Choices

### Neon Skyline Aesthetic

The neon synthwave skyline was chosen because **light symbolizes effort, attention, and hope**. Light grows with intention. It reveals things that feel invisible. The nighttime backdrop creates a quiet environment where contributions glow clearly.

- Each building has its own color identity tied to its theme (blue for School, orange for Work, pink for Relationships, green for Health, purple for Creativity, cyan for Rest)
- Different heights reflect collective focus patterns and create visual rhythm
- Glowing intensity reflects emotional readiness and confidence levels
- The moon and stars provide a contemplative atmosphere, grounding the visualization in a familiar nocturnal setting

The aesthetic draws inspiration from vaporwave and synthwave art movements, which often explore themes of nostalgia, digital spaces, and emotional resonance. The neon glow creates a sense of warmth despite the digital medium, making the data feel human rather than clinical.

### Reflective Questionnaire

The questionnaire flow was designed to be calm and ritual-like. Each question appears on its own screen:

1. What do you want to focus on?
2. What action will help you get there?
3. What must change?
4. How confident are you?

This pacing encourages mindful participation rather than rushed input. The progression moves from broad intention to specific action to internal reflection to emotional assessment. This structure mirrors therapeutic and coaching frameworks that emphasize clarity and self-awareness. By slowing users down and asking them to articulate not just goals but also obstacles and confidence levels, the questionnaire becomes a moment of genuine reflection rather than just data collection.

### Tooltips

Hovering over a building reveals a small selection of recent anonymous responses. This maintains privacy while letting users feel the collective presence of others. The tooltips are carefully designed to show just enough to spark recognition or empathy without overwhelming the viewer. They create moments of connection—users might see someone else struggling with the same challenge they face, or they might discover a new approach to their own goals. These brief glimpses into others' intentions transform the skyline from an abstract visualization into a genuinely human space.

---

## Technical Implementation

### Backend
The project uses **Flask** to handle routes, process form submissions, and communicate with MongoDB Atlas. The Flask server manages several key endpoints:
- A GET route for the home page and questionnaire
- A POST route for processing submissions
- An API endpoint that returns JSON data for the skyline visualization

This separation of concerns allows the front-end to update dynamically without full page reloads, creating a smoother user experience.

### Database
Each submission is stored as a document in MongoDB containing:
- Category (which building the window belongs to)
- Goal (the user's stated intention)
- Planned action (concrete step toward the goal)
- Required change (what needs to shift internally or externally)
- Confidence score (1-5 rating)
- Timestamp (for ordering and potential time-based analysis)

Up to the last **36 entries per category** are displayed as glowing windows, creating a rolling window of recent community activity. This limit ensures the visualization remains readable while still capturing meaningful patterns. Older entries are preserved in the database but not displayed, allowing for potential future analytics or archival features.

### Front-End Visualization
JavaScript dynamically generates the neon skyline using:
- A fixed grid of windows per building (3 columns × 12 rows)
- Glow intensity mapped to confidence levels using CSS filters and box-shadows
- Tooltips populated with recent responses, triggered by hover events
- CSS animations for the neon city, including a glowing moon, twinkling stars, and atmospheric fog effects
- Smooth transitions and hover effects that make the city feel alive and responsive

The rendering logic prioritizes performance while maintaining visual richness, using CSS transforms and GPU-accelerated properties to ensure smooth animations even with many glowing elements on screen.

---

## Meaningful Networked Interaction

The skyline is not built by one person, it only comes alive through participation. Each window is a small contribution, but enough windows together shift the entire mood of the city.

- If many users focus on **School**, the School building grows dense and bright
- If people choose **Rest**, that building glows warmly
- If everyone feels uncertain, the city dims to soft cyans
- If confidence rises, intense pinks and oranges illuminate the night

The skyline becomes a way of sensing the emotional atmosphere of a community without revealing anything personal. This creates what I call **ambient awareness**, a sense of collective presence that doesn't demand direct interaction but still fosters connection.

The project avoids logins, identity, or long-term data requirements. This keeps the barrier to participation low and aligns with class discussions on making networked spaces open and accessible. Anyone can contribute. No one is tracked. The space exists for everyone while belonging to no one in particular. This democratic approach to digital space-making felt important in an era where most online platforms extract value through surveillance and engagement metrics.

---

## Final Reflection

This project represents an intersection of data, emotion, and shared digital space. It is not simply a tool that displays information. It is a **quiet portrait of collective motivation**.

It invites users to reflect on themselves while also contributing to something larger. It embodies the themes of:

- Networked interaction as a form of community building
- Human presence inside digital systems and how to honor it
- Visualizing behavior in thoughtful and respectful ways
- Creating spaces that prioritize emotional truth over efficiency

The final outcome is a space that evolves with every visitor. It is a digital city made of intentions, bright and hopeful and always shifting, reminding us that even though each window holds a different life, we still illuminate the same shared world.

Through this project, I learned that networked spaces can be gentle, that data can be beautiful without losing its humanity, and that sometimes the most meaningful interactions are the ones that don't require us to know each other's names. The skyline stands as evidence that our individual efforts, however small, contribute to something greater; a collective glow that pushes back against the darkness, one intention at a time.

---

*Built with Flask, MongoDB, JavaScript, and hope.*