# PROJECT 2 

# 🧘‍♀️ Find Your Balance  
A simple, class booking web app built with Flask to make lives easier.

---

## 🎯 Concept

**Flow Studio** is a small web application designed to make class scheduling easier for teachers and students, especially in smaller studios that don’t have a full booking system.  
As someone who attends Pilates classes often, I noticed how some studios still rely on messages or paper lists for sign-ups. This project aims to simplify that process by creating an easy-to-use, visual platform where users can see class availability and book instantly.

The goal was to take what we’ve learned in class: Flask, JSON, Jinja templates, Fetch requests, and turn it into something functional and meaningful. Instead of a purely technical demo, I wanted to build something that could genuinely help real people manage their time better.

---

## 🧩 How It Works

- The app **reads class information** from a `classes.json` file (with schedule, time, and capacity).  
- When a user books a class, the data is **sent via a Fetch POST request** to the Flask server and **stored in a `bookings.json` file**.  
- Bookings are **displayed visually** on the main page as part of a collective schedule, you can see which classes are filling up in real time.  
- The interface also includes filters, capacity meters, and dynamic updates for a clean and transparent experience.

While the admin and user sides are not yet separated (meaning it’s not secure for public release), this version works as a **fully functional prototype** and a foundation for future improvements. 

---

## 🧠 Intentions & Future Plans

I wanted this project to feel *useful and easy*, not just like another coding assignment. It’s a tool built from everyday observation — a way to turn a messy manual process into something organized and calming.

In future iterations, I’d like to:
- Add **admin login** for better data protection  
- Send **email confirmations** after bookings  
- Include a **calendar integration** and better analytics visualization  
- Potentially expand to support multiple teachers or studios  

---

## 💻 Tech Overview

- **Backend:** Flask (Python)  
- **Frontend:** HTML, CSS, JavaScript  
- **Data Storage:** JSON files (`classes.json`, `bookings.json`)  
- **Templating:** Jinja  
- **Requests:** Fetch API (GET + POST)  
- **Visuals:** Custom UI with gradient theme, meters, and agenda/grid views  

---

## 🌱 Summary

This project is a personal exploration of how small digital tools can make real-world coordination easier.  
It’s not perfect, but it’s a starting point. A system that combines structure, design, and code into something that helps people find a little more balance in their day. It might not be super visually stimulating but it follows the calm vibe of a yoga/pilates class and a structured way to manage messy activities. 

---
