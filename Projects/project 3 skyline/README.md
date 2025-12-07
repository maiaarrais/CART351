🌃 Rising Intentions: A Collective Neon Skyline
Explorable Networked Space Project Report
⭐ Overview

This project explores how personal intentions, private goals, and everyday decisions can become part of a shared digital space. I wanted to create something that visualizes the quiet motivations people carry into their week, things like wanting to improve their health, focus on school, rest more, or reconnect with others. These thoughts are often invisible, yet they guide so much of how we move through life. My intention was to design a gentle networked space that gives form to these inner commitments without exposing anyone’s identity. The result is a neon skyline where buildings glow brighter as people set their goals, creating a city shaped entirely by collective intention.

🎯 Core Interaction

The core idea is simple. Each person answers a small, reflective questionnaire about what they want to focus on this week, what actions they plan to take, and how confident they feel. Their answers do not disappear. They become part of a living visualization. Every submission lights up a new window in a building that represents a larger theme such as School, Work and Money, Health, Relationships, Creativity, or Rest. Confidence levels affect how strongly each window glows. Over time, the skyline becomes a portrait of what the community cares about, where energy is being placed, and which areas feel strong or fragile.

🪟 Every Window as a Life

A key conceptual choice in this project is the idea that every window represents a different person’s response. Each glowing square is its own tiny life, its own story, its own moment of intention.

In a real city, every apartment window contains an individual living their own life with different struggles and different hopes, yet they still participate in the same larger structure. I wanted this digital skyline to carry that same emotional truth. Each user’s window is separate and personal, yet the building they form together is shared.

This reflects how people can be deeply individual while still connected, contributing to a collective atmosphere without knowing one another directly. This design choice supports the project’s theme of subtle online connectivity, where anonymity does not erase meaning.

🧠 Connection to Course Themes

This project connects directly to our course framework of building an explorable networked space that maintains shared state through a database.

The skyline is not static. It updates as users interact with it.

Each window is stored in MongoDB, retrieved through Flask, and displayed asynchronously.

The city changes because people change.

It becomes a soft form of real-time data visualization with a more emotional and human focus than typical analytical tools.

🎨 Design Choices
Neon Skyline Aesthetic

The neon synthwave skyline was chosen because light symbolizes effort, attention, and hope. Light grows with intention. It reveals things that feel invisible. The nighttime backdrop creates a quiet environment where contributions glow clearly.

Each building has its own color identity.
Different heights reflect collective focus patterns.
Glowing intensity reflects emotional readiness.

Reflective Questionnaire

The questionnaire flow was designed to be calm and ritual-like. Each question appears on its own screen.

What do you want to focus on?

What action will help you get there?

What must change?

How confident are you?

This pacing encourages mindful participation rather than rushed input.

Tooltips

Hovering over a building reveals a small selection of recent anonymous responses. This maintains privacy while letting users feel the collective presence of others.

🛠️ Technical Implementation
Backend

The project uses Flask to handle routes, process form submissions, and communicate with MongoDB Atlas.

Database

Each submission is stored as a document containing:

Category

Goal

Planned action

Required change

Confidence score

Timestamp

Up to the last 36 entries per category are displayed as glowing windows.

Front-End Visualization

JavaScript dynamically generates the neon skyline using:

A fixed grid of windows

Glow intensity mapped to confidence levels

Tooltips populated with recent responses

CSS for the neon city, moon, stars, and lighting effects

🌐 Meaningful Networked Interaction

The skyline is not built by one person. It only comes alive through participation. Each window is a small contribution, but enough windows together shift the entire mood of the city.

If many users focus on School, the School building grows dense and bright.
If people choose Rest, that building glows warmly.

The skyline becomes a way of sensing the emotional atmosphere of a community without revealing anything personal.

The project avoids logins, identity, or long-term data requirements. This keeps the barrier to participation low and aligns with class discussions on making networked spaces open and accessible.

💭 Final Reflection

This project represents an intersection of data, emotion, and shared digital space. It is not simply a tool that displays information. It is a quiet portrait of collective motivation.

It invites users to reflect on themselves while also contributing to something larger. It embodies the course themes of:

networked interaction

human presence inside digital systems

visualizing behavior in thoughtful and respectful ways

The final outcome is a space that evolves with every visitor. It is a digital city made of intentions, bright and hopeful and always shifting, reminding us that even though each window holds a different life, we still illuminate the same shared world.