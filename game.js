import { GameEngine, LEVELS, RECIPES, UPGRADES } from "./engine.js";

const app = document.querySelector("#app");
const toastElement = document.querySelector("#toast");
let screen = "home";
let toastTimer;
let lastNotice = "";
let audioContext;
let musicTimer;

const game = new GameEngine(window.localStorage, render);

function playTone(frequency = 440, duration = 0.09, type = "sine", volume = 0.045, channel = "sound") {
  if (!game.progress.settings[channel]) return;
  try {
    audioContext ||= new window.AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    showToast(`Audio is unavailable: ${error.message}`);
  }
}

function startMusic() {
  if (musicTimer) return;
  const notes = [392, 494, 587, 494, 440, 523, 659, 523];
  let index = 0;
  musicTimer = window.setInterval(() => {
    if (game.progress.settings.music && screen === "play" && game.session?.phase === "playing") {
      playTone(notes[index++ % notes.length], 0.16, "triangle", 0.012, "music");
    }
  }, 410);
}

function showToast(message) {
  if (!message) return;
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastElement.classList.remove("visible"), 2600);
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function button(label, action, classes = "", extra = "") {
  return `<button class="btn ${classes}" data-action="${action}" ${extra}>${label}</button>`;
}

function render() {
  if (!app) return;
  if (game.notice && game.notice !== lastNotice) {
    lastNotice = game.notice;
    showToast(game.notice);
    game.notice = "";
  }
  if (screen === "play" && game.session && ["won", "lost"].includes(game.session.phase)) {
    screen = "result";
    playTone(game.session.phase === "won" ? 660 : 180, 0.28, "sine", 0.06);
  }
  const views = {
    home: renderHome,
    map: renderMap,
    play: renderPlay,
    result: renderResult,
    shop: renderShop,
    settings: renderSettings,
  };
  app.innerHTML = `${renderHeader()}${views[screen]()}${renderTutorial()}`;
}

function renderHeader() {
  if (screen === "home" || screen === "play") return "";
  return `<header class="topbar">
    <button class="brand brand-small" data-action="home"><span class="brand-mark">🍳</span><span>cooking<span class="brand-highlight">master</span></span></button>
    <nav class="top-nav" aria-label="Main navigation">
      ${button("🗺️ Map", "map", screen === "map" ? "nav-current" : "")}
      ${button("🛍️ Shop", "shop", screen === "shop" ? "nav-current" : "")}
      ${button("⚙️ Settings", "settings", screen === "settings" ? "nav-current" : "")}
    </nav>
    <div class="wallet" aria-label="Coin balance"><span>🪙</span><strong>${game.progress.coins}</strong></div>
  </header>`;
}

function renderHome() {
  return `<section class="home-screen">
    <div class="home-sun sun-one"></div><div class="home-sun sun-two"></div>
    <div class="home-brand"><span class="brand-mark big-mark">🍳</span><span class="brand-title">cooking<span class="brand-highlight">master</span></span></div>
    <p class="home-kicker">A LITTLE HEAT. A LOT OF HEART.</p>
    <h1>Your dream<br><span>restaurant</span> awaits!</h1>
    <p class="home-copy">Whip up delicious dishes, keep your guests smiling, and build a restaurant empire one plate at a time.</p>
    <div class="hero-food hero-burger" aria-hidden="true">🍔</div><div class="hero-food hero-pizza" aria-hidden="true">🍕</div>
    <div class="hero-food hero-cupcake" aria-hidden="true">🧁</div><div class="hero-food hero-chef" aria-hidden="true">👩‍🍳</div>
    <div class="home-actions">
      ${button("Let's cook! <span>→</span>", "map", "btn-primary btn-large")}
      ${button("🛍️ Visit the shop", "shop", "btn-light btn-large")}
    </div>
    <div class="home-stats"><span>⭐ ${Object.values(game.progress.stars).reduce((sum, stars) => sum + stars, 0)} stars</span><span>🪙 ${game.progress.coins} coins</span><span>🍽️ ${game.progress.unlocked}/10 restaurants</span></div>
    <footer class="home-footer">Made with a pinch of magic ✨</footer>
  </section>`;
}

function renderMap() {
  const groups = [
    { theme: "burger", title: "Sunny Side Diner", subtitle: "Flip, stack & sizzle", icon: "🍔", ids: [1, 2, 3] },
    { theme: "pizza", title: "Bella's Pizzeria", subtitle: "A slice of something special", icon: "🍕", ids: [4, 5, 6] },
    { theme: "bakery", title: "Sugarcloud Bakery", subtitle: "Baked with a little love", icon: "🧁", ids: [7, 8] },
    { theme: "advanced", title: "The Master's Table", subtitle: "Only the best will do", icon: "🍽️", ids: [9, 10] },
  ];
  return `<main class="page-shell map-page">
    <div class="page-heading"><div><p class="eyebrow">YOUR CULINARY JOURNEY</p><h1>Pick your next adventure</h1><p>Every great chef starts with one delicious dish.</p></div><div class="heading-chef">👩‍🍳</div></div>
    <div class="restaurant-list">${groups.map((group, groupIndex) => `<section class="restaurant-card restaurant-${group.theme}">
      <div class="restaurant-intro"><div class="restaurant-icon">${group.icon}</div><div><span class="restaurant-step">RESTAURANT ${groupIndex + 1}</span><h2>${group.title}</h2><p>${group.subtitle}</p></div></div>
      <div class="level-row">${group.ids.map((id) => {
        const level = LEVELS[id - 1];
        const unlocked = id <= game.progress.unlocked;
        const stars = game.progress.stars[id] || 0;
        return `<button class="level-tile ${unlocked ? "" : "locked"} ${stars ? "completed" : ""}" data-action="level" data-id="${id}" ${unlocked ? "" : 'aria-label="Level ' + id + ', locked" aria-disabled="true"'}>
          <span class="level-number">${unlocked ? id : "🔒"}</span><span class="level-food">${level.icon}</span>
          <span class="level-label">Level ${id}</span><span class="level-stars">${"★".repeat(stars)}<span>${"☆".repeat(3 - stars)}</span></span>
          ${!unlocked ? '<span class="locked-hint">Win the level before this one</span>' : ""}
        </button>`;
      }).join("")}</div>
    </section>`).join("")}</div>
  </main>`;
}

function renderPlay() {
  const s = game.session;
  if (!s) {
    screen = "map";
    return renderMap();
  }
  const level = game.level;
  const selected = game.selectedCustomer;
  const recipe = selected ? RECIPES[selected.recipe] : null;
  const stationForSelected = selected && s.station.customerId === selected.id ? s.station : null;
  const pct = selected ? Math.max(0, Math.round(selected.patience / selected.maxPatience * 100)) : 0;
  const customers = s.customers.filter((customer) => customer.status === "waiting");
  return `<main class="kitchen-page theme-${level.theme}">
    <section class="shift-bar">
      <button class="back-button" data-action="map" aria-label="Back to level map">←</button>
      <div class="shift-place"><span class="shift-icon">${level.icon}</span><div><strong>${level.restaurant}</strong><small>LEVEL ${level.id} · SHIFT ${level.id < 4 ? "01" : "02"}</small></div></div>
      <div class="shift-objective"><span>🎯</span><div><strong>${s.served}/${level.target} served</strong><small>🪙 ${s.earned}/${level.coinGoal}</small></div></div>
      <div class="timer-pill ${s.timeLeft < 25 ? "timer-danger" : ""}"><span>⏱️</span><strong>${formatTime(s.timeLeft)}</strong></div>
      ${button("Ⅱ", "pause", "btn-pause", 'aria-label="Pause game"')}
    </section>
    <div class="kitchen-layout">
      <section class="customer-panel panel">
        <div class="panel-title"><div><p class="eyebrow">AT YOUR TABLES</p><h2>Hungry guests <span class="guest-count">${customers.length}</span></h2></div><span class="panel-spark">✦</span></div>
        <div class="customer-list">${customers.length ? customers.map((customer, index) => {
          const item = RECIPES[customer.recipe];
          const patience = Math.max(0, Math.round(customer.patience / customer.maxPatience * 100));
          return `<button class="customer-card ${customer.id === s.selectedId ? "customer-selected" : ""} ${customer.ready ? "customer-ready" : ""}" data-action="select-customer" data-id="${customer.id}">
            <span class="customer-avatar">${["👨🏻‍🦰", "👩🏽", "👨🏾", "👩🏻‍🦱", "👨🏼‍🦳"][customer.id % 5]}</span>
            <span class="customer-info"><strong>Guest ${String(customer.id).padStart(2, "0")}</strong><small>Wants ${item.name}</small><span class="patience-track"><i style="width:${patience}%;background:${patience < 32 ? "#f27669" : "#65bd80"}"></i></span></span>
            <span class="order-food">${item.icon}</span>
            ${customer.ready ? '<span class="ready-dot">READY!</span>' : ""}
          </button>`;
        }).join("") : `<div class="empty-guests"><span>🌱</span><strong>A little breathing room!</strong><small>Next guests are on their way.</small></div>`}</div>
        <div class="guest-tip">💡 Keep an eye on the patience bar!</div>
      </section>
      <section class="workbench">
        <div class="kitchen-scene">
          <div class="scene-window"><span>☀️</span><span>🌿</span><span>🌿</span>${game.progress.upgrades.decor ? "<span>🌼</span>" : ""}</div>
          <div class="scene-shelf"><span>🧂</span><span>🫙</span><span>🌶️</span><span>🪴</span></div>
          <div class="chef-avatar">${s.station.status === "cooking" ? "👩‍🍳💨" : "👩‍🍳"}</div>
          <div class="scene-speech">${s.station.status === "cooking" ? "Sizzle, sizzle!" : "Made fresh with love!"}</div>
          <div class="counter-line"></div>
        </div>
        <div class="prep-panel panel">
          ${selected && recipe ? `<div class="prep-heading"><div><p class="eyebrow">YOUR ACTIVE ORDER</p><h2>${recipe.icon} ${recipe.name}</h2></div><span class="price-tag">🪙 ${recipe.price}+</span></div>
            <div class="recipe-progress"><span>Recipe</span><strong>${selected.prepared.length}/${recipe.ingredients.length} ingredients</strong><div class="progress-track"><i style="width:${Math.round(selected.prepared.length / recipe.ingredients.length * 100)}%"></i></div></div>
            <div class="ingredient-list">${recipe.ingredients.map((ingredient, index) => `<button class="ingredient-chip ${index < selected.prepared.length ? "ingredient-done" : ""} ${index === selected.prepared.length && !selected.ready && s.station.status === "idle" ? "ingredient-next" : ""}" data-action="ingredient" data-index="${index}" ${index < selected.prepared.length || index !== selected.prepared.length || selected.ready || s.station.customerId === selected.id && s.station.status !== "idle" ? "disabled" : ""}>
              <span>${index < selected.prepared.length ? "✓" : ["🥯", "🥩", "🧀", "🥬", "🍅"][index % 5]}</span>${ingredient}
            </button>`).join("")}</div>
            <div class="station-row"><div class="station-illustration ${s.station.status === "cooking" ? "station-active" : ""}">${recipe.stationIcon}<span class="station-name">${recipe.station}</span></div>
              <div class="station-action">${stationForSelected?.status === "cooking" ? `<div class="cooking-state"><span class="spinner"></span><span>Cooking… <strong>${stationForSelected.remaining.toFixed(1)}s</strong><i style="width:${100 - Math.round(stationForSelected.remaining / Math.max(1, recipe.cook) * 100)}%"></i></span></div>` :
                selected.ready ? `<div class="dish-ready">${recipe.icon} <span>Fresh & ready!</span></div>` :
                button(`Cook it! ${recipe.stationIcon}`, "cook", "btn-primary cook-button", `${selected.prepared.length !== recipe.ingredients.length || s.station.status !== "idle" ? "disabled" : ""}`)}</div>
            </div>
            <div class="prep-footer">${selected.ready && stationForSelected?.status === "ready" ? button(`Serve ${recipe.icon} to Guest ${String(selected.id).padStart(2, "0")} <span>→</span>`, "serve", "btn-serve") : `<span>Choose ingredients in order, then cook and serve.</span>`}</div>
          ` : `<div class="no-order"><span>🍽️</span><h2>Ready when you are!</h2><p>Select a hungry guest to see their order and start cooking.</p></div>`}
        </div>
      </section>
    </div>
    <div class="kitchen-bottom"><span>🥇 Best streak <strong>${s.combo}</strong></span><span>Tap a guest to switch orders · <kbd>Space</kbd> cook · <kbd>Enter</kbd> serve · <kbd>Esc</kbd> pause</span><span>⭐ ${Object.values(game.progress.stars).reduce((a, b) => a + b, 0)} stars</span></div>
    ${s.phase === "paused" ? renderPause() : ""}
  </main>`;
}

function renderPause() {
  return `<div class="overlay"><section class="dialog pause-dialog"><span class="dialog-emoji">☕</span><p class="eyebrow">TAKE YOUR TIME</p><h2>Shift paused</h2><p>The kitchen can wait. Your timer and guests are taking a little break.</p>
    ${button("Back to the kitchen", "resume", "btn-primary btn-large")}
    ${button("Restart this level", "restart", "btn-light btn-large")}
    ${button("Back to level map", "map", "text-button")}
  </section></div>`;
}

function renderResult() {
  const result = game.session?.result;
  if (!result) {
    screen = "map";
    return renderMap();
  }
  const won = result.won;
  const level = game.level;
  return `<main class="result-page ${won ? "result-win" : "result-loss"}"><div class="result-confetti">${won ? "✦　✧　✦　✧　✦" : "☁　☁　☁"}</div>
    <section class="result-card"><div class="result-icon">${won ? "🏆" : "🥺"}</div>
      <p class="eyebrow">${won ? "THAT'S HOW IT'S DONE!" : "EVERY GREAT CHEF HAS A TOUGH SHIFT"}</p>
      <h1>${won ? "Service with a smile!" : "The kitchen got a little too hot…"}</h1>
      <p class="result-subtitle">${won ? `You made ${level.restaurant} proud!` : "Take a breather, sharpen your skills, and give it another go."}</p>
      ${won ? `<div class="big-stars" aria-label="${result.stars} stars">${[1, 2, 3].map((i) => `<span class="${i <= result.stars ? "star-lit" : ""}">★</span>`).join("")}</div>` : ""}
      <div class="result-stats"><div><span>🍽️</span><strong>${result.served}</strong><small>Orders served</small></div><div><span>💨</span><strong>${result.missed}</strong><small>Missed guests</small></div><div><span>🏅</span><strong>${result.score}</strong><small>Kitchen score</small></div></div>
      <div class="reward-row"><div><span>💰</span><span><strong>Shift earnings</strong><small>${result.firstWin ? "Includes first-win bonus!" : "Coins from this shift"}</small></span></div><strong class="reward-coins">+${result.earned} 🪙</strong></div>
      <div class="result-actions">      ${won ? button(level.id < LEVELS.length ? "Continue to next level <span>→</span>" : "Adventure complete! <span>→</span>", "continue", "btn-primary btn-large") : button("Try again", "restart", "btn-primary btn-large")}
      ${button("Replay level", "restart", "btn-light")}
      ${button("Level map", "map", "text-button")}</div>
    </section><div class="result-chef">${won ? "👩‍🍳🎉" : "👩‍🍳💪"}</div>
  </main>`;
}

function renderShop() {
  return `<main class="page-shell shop-page"><div class="page-heading"><div><p class="eyebrow">A SMART CHEF INVESTS IN THEIR KITCHEN</p><h1>The upgrade corner</h1><p>Spend your hard-earned coins on upgrades that make every shift smoother.</p></div><div class="shop-bag">🛍️</div></div>
    <div class="shop-wallet"><span>👛 Your wallet</span><strong>🪙 ${game.progress.coins}</strong></div>
    <div class="upgrade-grid">${UPGRADES.map((upgrade) => {
      const current = game.progress.upgrades[upgrade.id];
      const maxed = current >= upgrade.max;
      const cost = upgrade.costs[current];
      return `<article class="upgrade-card"><div class="upgrade-icon">${upgrade.icon}</div><div class="upgrade-copy"><div class="upgrade-title"><h2>${upgrade.name}</h2><span>${current}/${upgrade.max}</span></div><p>${upgrade.description}</p><div class="upgrade-meter">${Array.from({ length: upgrade.max }, (_, index) => `<i class="${index < current ? "meter-filled" : ""}"></i>`).join("")}</div></div>
        ${button(maxed ? "All upgraded ✓" : `Upgrade · 🪙 ${cost}`, `buy-${upgrade.id}`, maxed ? "btn-owned" : "btn-buy", maxed ? "disabled" : "")}
      </article>`;
    }).join("")}</div><div class="shop-note">✨ Upgrades are saved automatically and stay with you on every shift.</div></main>`;
}

function renderSettings() {
  return `<main class="page-shell settings-page"><div class="page-heading"><div><p class="eyebrow">MAKE YOURSELF AT HOME</p><h1>Your kitchen, your rules</h1><p>Fine-tune your experience and manage your restaurant adventure.</p></div><div class="settings-art">⚙️</div></div>
    <section class="settings-card panel"><p class="eyebrow">SOUND & FEEL</p>
      ${settingRow("🎵", "Kitchen soundtrack", "A gentle tune while the kitchen is open.", "music")}
      ${settingRow("🔔", "Kitchen sound effects", "Little pings for cooking, serving, and more.", "sound")}
    </section>
    <section class="settings-card reset-card panel"><div><p class="eyebrow">A FRESH START</p><h2>Reset your adventure</h2><p>Clear your coins, restaurant progress, stars, and upgrades. This can't be undone.</p></div>${button("Reset all progress", "reset", "btn-danger")}</section>
    <p class="settings-footnote">Your game progress is stored privately in this browser. Version 1.0 · Made with love 🍳</p></main>`;
}

function settingRow(icon, label, description, setting) {
  const enabled = game.progress.settings[setting];
  return `<div class="setting-row"><span class="setting-icon">${icon}</span><div class="setting-copy"><strong>${label}</strong><small>${description}</small></div><button class="toggle ${enabled ? "toggle-on" : ""}" data-action="toggle-${setting}" role="switch" aria-checked="${enabled}" aria-label="${label}"><i></i></button></div>`;
}

function renderTutorial() {
  if (game.progress.tutorialSeen || screen === "play" || screen === "result") return "";
  return `<div class="overlay tutorial-overlay"><section class="dialog tutorial-dialog"><span class="dialog-emoji">👩‍🍳</span><p class="eyebrow">WELCOME TO YOUR FIRST SHIFT</p><h2>Let's make something delicious!</h2><p>Every happy customer starts with a great recipe. Here's the recipe for success:</p>
    <div class="tutorial-steps"><div><span>1</span><div><strong>Pick a guest</strong><small>Tap their order to see what they're craving.</small></div></div><div><span>2</span><div><strong>Prep & cook</strong><small>Tap each ingredient in order, then fire up the right station.</small></div></div><div><span>3</span><div><strong>Serve with a smile!</strong><small>Serve before patience runs out to earn a lovely tip.</small></div></div></div>
    ${button("Got it, let's cook! <span>→</span>", "tutorial-start", "btn-primary btn-large")}
    ${button("Maybe later", "tutorial-dismiss", "text-button")}
  </section></div>`;
}

function formatTime(seconds) {
  const whole = Math.ceil(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function dispatch(action, element) {
  const id = Number(element.dataset.id);
  if (action === "home") { screen = "home"; render(); return; }
  if (action === "map") { screen = "map"; if (game.session?.phase === "playing" || game.session?.phase === "paused") game.session.phase = "paused"; render(); return; }
  if (action === "shop") { screen = "shop"; render(); return; }
  if (action === "settings") { screen = "settings"; render(); return; }
  if (action === "tutorial-start") {
    game.markTutorialSeen();
    game.startLevel(1);
    screen = "play";
    window.scrollTo(0, 0);
    startMusic();
    render();
    return;
  }
  if (action === "tutorial-dismiss") { game.markTutorialSeen(); render(); return; }
  if (action === "level") {
    if (game.startLevel(id)) {
      screen = "play";
      window.scrollTo(0, 0);
      startMusic();
      playTone(523, 0.12);
      render();
    }
    return;
  }
  if (action === "pause") { game.togglePause(); playTone(330, 0.08); return; }
  if (action === "resume") { game.togglePause(); playTone(523, 0.08); return; }
  if (action === "restart") {
    game.restart();
    screen = "play";
    playTone(440, 0.1);
    render();
    return;
  }
  if (action === "continue") {
    const next = Math.min(LEVELS.length, game.session.levelId + 1);
    screen = "map";
    if (game.session.levelId < LEVELS.length && game.progress.unlocked > game.session.levelId) {
      game.startLevel(next);
      screen = "play";
    }
    render();
    return;
  }
  if (action === "select-customer") { game.selectCustomer(id); return; }
  if (action === "ingredient") { if (game.prepareIngredient(Number(element.dataset.index))) playTone(550, 0.07); return; }
  if (action === "cook") { if (game.startCooking()) playTone(250, 0.14, "triangle"); return; }
  if (action === "serve") { if (game.serve()) { playTone(740, 0.17); } return; }
  if (action.startsWith("buy-")) {
    if (game.purchase(action.slice(4))) playTone(650, 0.14);
    return;
  }
  if (action.startsWith("toggle-")) {
    const setting = action.slice(7);
    game.setSetting(setting, !game.progress.settings[setting]);
    return;
  }
  if (action === "reset") {
    if (window.confirm("Reset all coins, stars, restaurant progress, and upgrades? This cannot be undone.")) {
      game.resetProgress();
      screen = "home";
      showToast("Your kitchen has a fresh start. Welcome back, chef!");
      render();
    }
  }
}

app.addEventListener("click", (event) => {
  if (event.target.matches(".tutorial-overlay")) {
    game.markTutorialSeen();
    return;
  }
  const target = event.target.closest("[data-action]");
  if (target && !target.disabled) dispatch(target.dataset.action, target);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !game.progress.tutorialSeen && screen !== "play" && screen !== "result") {
    game.markTutorialSeen();
    return;
  }
  if (screen !== "play" || !game.session) return;
  if (event.key === "Escape") { event.preventDefault(); game.togglePause(); return; }
  if (game.session.phase !== "playing") return;
  if (event.code === "Space") {
    event.preventDefault();
    if (game.startCooking()) playTone(250, 0.14, "triangle");
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (game.serve()) playTone(740, 0.17);
  } else if (/^[1-9]$/.test(event.key)) {
    const customer = game.session.customers.filter((item) => item.status === "waiting")[Number(event.key) - 1];
    if (customer) game.selectCustomer(customer.id);
  } else if (/^[a-d]$/i.test(event.key)) {
    game.prepareIngredient(event.key.toLowerCase().charCodeAt(0) - 97);
  }
});

window.setInterval(() => {
  if (screen === "play" && game.session?.phase === "playing") game.tick(0.25);
}, 250);

window.addEventListener("storage", (event) => {
  if (event.key === "cooking-master-save") {
    game.progress = new GameEngine(window.localStorage).progress;
    render();
  }
});

render();
