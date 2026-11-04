# Shkobba (شكبة)
 
**Shkobba**, the traditional Tunisian card game (a cousin of Italian *Scopa*). Play against the computer, or with friends over local Wi‑Fi, with **2 players** or **4 players (2 vs 2)**.
 
> Made with love by **aminodarling** and **Claude**.
 
## Features
 
- 🃏 **Two modes:** 2 players (first to 11) or 4 players in teams of two (first to 7)
- 🤖 **Play vs computer** with no setup, straight from the browser
- 📶 **Local Wi‑Fi multiplayer** with 2 or 4 real players, with no accounts or internet needed
- 🎴 **Standard deck look:** ♠ ♥ ♦ ♣ cards drawn in SVG, with the number in the corners and drawn J, Q and K
- ✅ **Rules enforced for you:** only legal captures are accepted, and shkobbas and round scoring are tracked automatically
- 📱 Works on phones, tablets and desktops (responsive, light and dark mode)
- 🪶 **Zero dependencies:** one HTML file and a ~100-line Node.js server
## Quick start
 
You need [Node.js](https://nodejs.org) 16 or newer. There is nothing to install with npm.
 
```bash
git clone https://github.com/AminoDarling/TunisianShkobba.git?
cd TunisianShkobba
```
 
The server prints two addresses:
 
```
On this computer / phone :      http://localhost:8080
Friends on your Wi-Fi:          http://192.168.1.12:8080
```
 
Open the first one, pick a mode, and play.
 
> **Just want to play alone?** `public/index.html` is fully self-contained. Open it in a browser, or host it on GitHub Pages, and the computer-opponent modes work with no server at all.
 
## Playing with friends over Wi‑Fi
 
1. The host runs `node server.js`, opens the `localhost` address, and taps **Host a game**.
2. The host picks **2 players** or **4 players** and sees the lobby.
3. Everyone else, on the same Wi‑Fi or on the host's phone hotspot, opens the **Friends on your Wi‑Fi** address in any browser. They join automatically.
4. When the last seat is filled, the game starts. In a 4-player game you play with the player opposite you against the other two.
Notes:
 
- One game at a time per server (a single room).
- Only the host can start the next round or a rematch.
- If a player drops mid-game, the game ends for everyone. If the host leaves, everyone returns to the menu.
- Keep the host's browser tab open and in the foreground, because the host's page runs the game.
## How to play
 
### The cards
 
A 40-card deck: a standard deck without the 8s, 9s and 10s.
 
| Card | Value |
|------|-------|
| Ace  | 1 |
| 2 to 7 | face value |
| Jack | 8 |
| Queen | 9 |
| King | 10 |
 
Diamonds (♦) are the "coins" (*dinari*).
 
### A round
 
Four cards are placed face up on the table and each player gets three cards. On your turn, play one card from your hand:
 
1. **Same value on the table?** You must take that card. A matching single card always beats a combination.
2. **Otherwise,** if some table cards add up to your card's value, you must take one such set (for example, a King (10) takes a 6 and a 4).
3. **If nothing can be captured,** drop your card on the table.
When everyone's hand is empty, three new cards are dealt to each player until the deck runs out. The last player to capture takes any cards left on the table.
 
### Scoring
 
After each round, points are awarded for:
 
| Point | For |
|-------|-----|
| **Cards** | Capturing the most cards (tie: no point) |
| **Diamonds** | Capturing the most diamonds (tie: no point) |
| **7♦ (Sbiaa)** | Capturing the 7 of diamonds |
| **Shkobba** | Each time you sweep the whole table, +1 each (not counted on the last play of the deal) |
 
The first player or team to reach the target (**11** for 2 players, **7** for 4 players) wins. If scores are tied at the target, play continues.
 
> Some tables also score *barmila* (most 7s). It is not included here.
 
## Project structure
 
```
shkobba/
├── server.js          # HTTP server + WebSocket relay (no dependencies)
├── package.json
└── public/
    └── index.html     # the whole game: UI, rules, computer opponent, networking
```
 
## How the multiplayer works
 
- The **host's browser is the game server**. It holds the full game state, validates every move, and plays its own seat.
- `server.js` is only a **relay**: it serves the page and forwards WebSocket messages between the host and the guests.
- After every move the host sends each guest a **personal snapshot** that contains only their own hand. Other players' cards are never sent to them.
- Guests send just their intended move (which card, and which table cards). The host checks it before applying it.
Relay protocol (plain text frames):
 
| Direction | Message | Meaning |
|-----------|---------|---------|
| client → server | `HOST` / `JOIN` | claim the host role / join the game |
| server → host | `J\|id`, `L\|id` | a guest joined / left |
| server → host | `M\|id\|payload` | a message from guest `id` |
| host → server | `S\|id\|payload` | send to guest `id` |
| host → server | `B\|payload` | broadcast to all guests |
 
HTTP helpers: `GET /status` returns `1` if a host is connected and `0` if not, and `GET /lan` returns the address to share with friends.
 
## Android app (optional)
 
The same game can run as a small Android app: a WebView wrapper with a **built-in relay server**, so a phone can host without a computer. Guests still just open the shown address in a browser.
 
## Deploying online
 
Because the relay is a plain Node server, it also works on hosts like Render, Railway or Fly.io. Set the start command to `node server.js`. The page switches to `wss://` automatically over HTTPS, so friends in different places can play together.
 
## Limitations and ideas
 
- [ ] Reconnect after a dropped connection
- [ ] Multiple rooms, so several games can share one server
- [ ] Optional *barmila* (most 7s) scoring
- [ ] Player names and a chat or emoji reactions
- [ ] Sound effects and card animations
## License
 
MIT. Add a `LICENSE` file to the repository if you want it to apply.
 
