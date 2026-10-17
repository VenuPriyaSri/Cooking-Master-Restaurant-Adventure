# Cooking Master — Restaurant Adventure

A colorful, playable restaurant time-management game built with HTML, CSS, and vanilla JavaScript. It has no runtime dependencies, paid APIs, or build step.

## Play locally

1. Install [Node.js 18 or newer](https://nodejs.org/) if it isn't already installed.
2. Open a terminal in this folder.
3. Run `npm run dev`.
4. Visit [http://localhost:8000](http://localhost:8000), the address printed in the terminal.

The included development server uses only Node.js built-ins: no `npm install` is needed. Keep the terminal open while playing; press `Ctrl+C` to stop the server. Use a local web server rather than opening `index.html` directly: the game uses native JavaScript modules, which browsers restrict on `file://` pages.

If the terminal says port 8000 is already in use, the game may already be running; open `http://localhost:8000` instead of starting another server. If you need another server, run `$env:PORT=8001; npm run dev` in PowerShell and open `http://localhost:8001`.

## How to play

- Start at the level map and select any unlocked restaurant shift.
- Select a guest, tap the recipe ingredients in order, press **Cook it!**, wait for the station to finish, then serve the matching dish.
- Serve the objective number of guests and meet the shift's coin goal before time runs out.
- Guests lose patience while they wait. Serving quickly earns tips.
- Pause from the kitchen button or with **Escape**. **Space** starts cooking, **Enter** serves a ready order, **1–9** selects a guest, and **A–D** prepares an ingredient.
- Earn stars and coins to unlock later levels and buy kitchen upgrades. Soundtrack and sound-effect toggles are in Settings.

The first visit starts with a short interactive tutorial. Progress, coins, stars, upgrades, and sound settings are saved in this browser's local storage. Use **Settings → Reset all progress** to restart the adventure.

## Restaurants

The game includes ten playable shifts: three at Sunny Side Diner, three at Bella's Pizzeria, two at Sugarcloud Bakery, and two at The Master's Table. Each shift has a distinct recipe mix, order target, coin target, guest patience, and time limit. Winning a level unlocks the next one; previously unlocked shifts can be replayed.

Coins earned from serving are awarded on every shift. A first level victory also earns a one-time completion bonus; replaying the result screen cannot award it again.

## Deploy

### Netlify

Drag this project folder into Netlify's deploy interface, or connect its Git repository. Use the project root as the publish directory; no build command is needed.

### GitHub Pages

Push the project files to a GitHub repository, then enable Pages in the repository settings and publish from the branch root. The game is static and requires no server-side functions.

## Tests

The gameplay and reward rules have dependency-free Node.js tests. With Node.js 18 or newer, run:

```sh
node --test game.test.js
```

The tests cover level one completion and rewards, level unlocking and failure, replay reward protection, saved upgrades and unaffordable purchases, paused timers, invalid/unfinished orders, and the ten-level progression layout.
