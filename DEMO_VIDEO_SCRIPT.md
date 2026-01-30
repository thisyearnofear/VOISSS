# VOISSS Flutter Butler - Demo Video Script

**Duration:** 3 minutes  
**Target:** Serverpod Hackathon Judges  
**Goal:** Showcase Flutter + Serverpod integration

---

## Scene 1: Introduction (0:00 - 0:20)

**Visual:** Splash screen animation

**Audio:** 
"Meet VOISSS Flutter Butler - your AI-powered voice assistant built entirely with Dart. From the beautiful Flutter frontend to the powerful Serverpod backend, this is full-stack Dart development at its finest."

**On Screen:**
- VOISSS logo
- "Serverpod Hackathon 2026"
- "Powered by Venice AI"

---

## Scene 2: The Problem (0:20 - 0:35)

**Visual:** Show messy voice memos on a phone

**Audio:**
"We all record voice memos, but they quickly become unmanageable. Finding that one important note? Nearly impossible. That's where the Butler comes in."

---

## Scene 3: Voice Recording (0:35 - 0:55)

**Visual:** 
- Navigate to Recordings tab
- Tap big red record button
- Record: "Meeting with the team tomorrow at 3 PM about the new feature launch"
- Stop recording
- Recording appears in list

**Audio:**
"Record high-quality voice memos with one tap. The sleek interface makes capturing ideas effortless."

**On Screen:**
- Recording duration: 0:05
- Recording saved

---

## Scene 4: Meet the Butler (0:55 - 1:25)

**Visual:**
- Switch to Butler tab
- Show welcome message
- Type: "What did I just record?"
- Show typing indicator
- AI responds with summary

**Audio:**
"But the magic happens with our AI Butler. Powered by Venice AI's Llama 3.3 70B model and connected through our Serverpod backend, you can chat naturally with your recordings."

**On Screen:**
- Butler: "You recorded a meeting reminder for tomorrow at 3 PM about a new feature launch."

---

## Scene 5: More AI Features (1:25 - 1:50)

**Visual:**
- Type: "Summarize all my work recordings"
- Show AI response
- Show quick suggestion chips
- Tap "Find recordings about meetings"

**Audio:**
"Ask it to summarize, find specific recordings, or extract action items. The Butler understands context and responds intelligently."

---

## Scene 6: The Backend (1:50 - 2:20)

**Visual:**
- Switch to terminal screen
- Show Docker containers running
- Show Serverpod logs
- Show curl command working

**Commands to show:**
```bash
$ docker ps
CONTAINER ID   IMAGE          STATUS
voisss_butler_server   Up 5 minutes
voisss_butler_postgres Up 5 minutes

$ curl https://butler.voisss.famile.xyz/butler/health
"Butler is ready to serve! AI enabled: true"
```

**Audio:**
"Under the hood, we're running Serverpod on Hetzner Cloud. Dart-native backend, PostgreSQL database, Docker containers, and Nginx reverse proxy with SSL. Production-ready infrastructure."

---

## Scene 7: Architecture Overview (2:20 - 2:40)

**Visual:** Animated diagram showing:
1. Flutter app (left)
2. HTTPS arrow
3. Serverpod backend (center)
4. Venice AI + PostgreSQL (right)

**Audio:**
"Flutter on the frontend, Serverpod on the backend, Venice AI for intelligence. All connected with type-safe generated code. This is the future of full-stack Dart development."

---

## Scene 8: Closing (2:40 - 3:00)

**Visual:**
- Split screen: Flutter app + Terminal
- Show GitHub repository
- Show live API URL

**Audio:**
"VOISSS Flutter Butler - built for the Serverpod Hackathon 2026. Experience the power of Flutter plus Serverpod today."

**On Screen:**
- https://butler.voisss.famile.xyz/
- https://github.com/thisyearnofear/VOISSS
- "Built with ❤️ using Flutter + Serverpod"

---

## Recording Tips

1. **Use a clean desktop** - Hide unnecessary icons
2. **Zoom in** - Make text readable (CMD+Plus on Mac)
3. **Smooth cursor** - Use a screen recorder with cursor highlighting
4. **Good audio** - Use a quality microphone
5. **Background music** - Optional, keep it subtle

## Tools Recommended

- **Screen Recording:** OBS Studio (free) or ScreenFlow (Mac)
- **Video Editing:** iMovie, DaVinci Resolve, or Adobe Premiere
- **Audio:** Built-in mic or external USB mic

## Checklist

- [ ] Splash screen animation smooth
- [ ] Recording feature works flawlessly
- [ ] AI responses are quick (< 3 seconds)
- [ ] Terminal commands are clearly visible
- [ ] Audio is clear and well-paced
- [ ] Video is under 3 minutes
- [ ] Export in 1080p quality

---

**Good luck with the submission! 🚀**
