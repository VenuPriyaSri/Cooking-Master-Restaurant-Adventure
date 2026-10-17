export const RECIPES = {
  burger: { name: "Sunny Burger", icon: "🍔", station: "Grill", stationIcon: "🔥", cook: 4, price: 32, ingredients: ["Brioche bun", "Juicy patty", "Cheddar", "Crisp lettuce"], color: "#ffb347" },
  fries: { name: "Golden Fries", icon: "🍟", station: "Fryer", stationIcon: "🍳", cook: 3, price: 24, ingredients: ["Fresh potatoes", "Pinch of salt"], color: "#ffe079" },
  pizza: { name: "Garden Pizza", icon: "🍕", station: "Pizza oven", stationIcon: "♨️", cook: 5, price: 38, ingredients: ["Pizza dough", "Tomato sauce", "Mozzarella", "Garden herbs"], color: "#ff987d" },
  cupcake: { name: "Berry Cupcake", icon: "🧁", station: "Bakery oven", stationIcon: "♨️", cook: 4, price: 30, ingredients: ["Cake batter", "Sweet berries", "Vanilla frosting"], color: "#f7a9cb" },
  pasta: { name: "Creamy Pasta", icon: "🍝", station: "Stove", stationIcon: "♨️", cook: 5, price: 42, ingredients: ["Fresh pasta", "Creamy sauce", "Parmesan"], color: "#ffd083" },
  steak: { name: "Seared Steak", icon: "🥩", station: "Grill", stationIcon: "🔥", cook: 6, price: 50, ingredients: ["Seasoned steak", "Herb butter", "Roasted greens"], color: "#f38d76" },
  salad: { name: "Garden Salad", icon: "🥗", station: "Prep counter", stationIcon: "🔪", cook: 1, price: 28, ingredients: ["Crisp greens", "Cherry tomatoes", "House dressing"], color: "#a9d883" },
};

export const LEVELS = [
  { id: 1, restaurant: "Sunny Side Diner", theme: "burger", icon: "🍔", target: 5, coinGoal: 100, time: 145, patience: 52, recipes: ["burger", "fries"], spawn: 8 },
  { id: 2, restaurant: "Sunny Side Diner", theme: "burger", icon: "🍔", target: 7, coinGoal: 165, time: 165, patience: 48, recipes: ["burger", "fries"], spawn: 8 },
  { id: 3, restaurant: "Sunny Side Diner", theme: "burger", icon: "🍔", target: 8, coinGoal: 220, time: 175, patience: 45, recipes: ["burger", "fries"], spawn: 7 },
  { id: 4, restaurant: "Bella's Pizzeria", theme: "pizza", icon: "🍕", target: 6, coinGoal: 175, time: 175, patience: 52, recipes: ["pizza", "salad"], spawn: 9 },
  { id: 5, restaurant: "Bella's Pizzeria", theme: "pizza", icon: "🍕", target: 8, coinGoal: 255, time: 190, patience: 48, recipes: ["pizza", "salad"], spawn: 8 },
  { id: 6, restaurant: "Bella's Pizzeria", theme: "pizza", icon: "🍕", target: 9, coinGoal: 310, time: 195, patience: 45, recipes: ["pizza", "salad"], spawn: 8 },
  { id: 7, restaurant: "Sugarcloud Bakery", theme: "bakery", icon: "🧁", target: 7, coinGoal: 210, time: 185, patience: 52, recipes: ["cupcake", "pizza"], spawn: 9 },
  { id: 8, restaurant: "Sugarcloud Bakery", theme: "bakery", icon: "🧁", target: 9, coinGoal: 290, time: 200, patience: 47, recipes: ["cupcake", "pizza", "salad"], spawn: 8 },
  { id: 9, restaurant: "Master's Table", theme: "advanced", icon: "🍽️", target: 8, coinGoal: 315, time: 205, patience: 48, recipes: ["pasta", "steak", "salad"], spawn: 9 },
  { id: 10, restaurant: "Master's Table", theme: "advanced", icon: "🍽️", target: 10, coinGoal: 420, time: 220, patience: 45, recipes: ["pasta", "steak", "salad", "pizza"], spawn: 8 },
];

export const UPGRADES = [
  { id: "speed", name: "Turbo burners", icon: "🔥", description: "Cook dishes 15% faster per level.", costs: [110, 190, 300], max: 3 },
  { id: "patience", name: "Comfy booths", icon: "🛋️", description: "Customers wait 12% longer per level.", costs: [100, 180, 280], max: 3 },
  { id: "tips", name: "Golden service bell", icon: "🔔", description: "Earn 10% more coins per level.", costs: [140, 230, 350], max: 3 },
  { id: "capacity", name: "Extra prep counter", icon: "🧑‍🍳", description: "Serve up to one extra customer before a miss ends the shift.", costs: [160], max: 1 },
  { id: "decor", name: "Cozy window flowers", icon: "🌼", description: "A cheerful little restaurant makeover.", costs: [90], max: 1 },
];

export const DEFAULT_PROGRESS = Object.freeze({
  coins: 0,
  unlocked: 1,
  stars: {},
  upgrades: { speed: 0, patience: 0, tips: 0, capacity: 0, decor: 0 },
  rewarded: [],
  settings: { music: true, sound: true },
  tutorialSeen: false,
});

const copy = (value) => JSON.parse(JSON.stringify(value));

export function readProgress(storage) {
  try {
    const saved = storage?.getItem("cooking-master-save");
    if (!saved) return copy(DEFAULT_PROGRESS);
    const parsed = JSON.parse(saved);
    const progress = {
      ...copy(DEFAULT_PROGRESS),
      ...parsed,
      stars: { ...DEFAULT_PROGRESS.stars, ...(parsed.stars || {}) },
      upgrades: { ...DEFAULT_PROGRESS.upgrades, ...(parsed.upgrades || {}) },
      settings: { ...DEFAULT_PROGRESS.settings, ...(parsed.settings || {}) },
      rewarded: Array.isArray(parsed.rewarded) ? parsed.rewarded.filter(Number.isInteger) : [],
    };
    progress.coins = Math.max(0, Math.floor(Number(progress.coins) || 0));
    progress.unlocked = Math.min(LEVELS.length, Math.max(1, Math.floor(Number(progress.unlocked) || 1)));
    return progress;
  } catch {
    return copy(DEFAULT_PROGRESS);
  }
}

export class GameEngine {
  constructor(storage = globalThis.localStorage, onChange = () => {}) {
    this.storage = storage;
    this.onChange = onChange;
    this.progress = readProgress(storage);
    this.session = null;
    this.notice = "";
  }

  save() {
    try {
      this.storage?.setItem("cooking-master-save", JSON.stringify(this.progress));
    } catch {
      this.notice = "Progress could not be saved. Check your browser storage settings.";
    }
    this.onChange();
  }

  startLevel(id) {
    const level = LEVELS.find((item) => item.id === Number(id));
    if (!level) return this.reject("That level doesn't exist.");
    if (level.id > this.progress.unlocked) return this.reject("Finish the previous level to unlock this one!");
    this.session = {
      levelId: level.id, phase: "playing", timeLeft: level.time, elapsed: 0, served: 0, missed: 0,
      earned: 0, score: 0, nextCustomerId: 1, nextSpawn: level.spawn,
      customers: [], selectedId: null, station: { status: "idle", customerId: null, remaining: 0 },
      combo: 0, result: null,
    };
    this.spawnCustomer();
    this.spawnCustomer();
    this.onChange();
    return true;
  }

  get level() { return this.session ? LEVELS[this.session.levelId - 1] : null; }

  spawnCustomer() {
    const s = this.session;
    if (!s || s.phase !== "playing" || s.nextCustomerId > this.level.target + 5) return;
    const recipe = this.level.recipes[(s.nextCustomerId - 1) % this.level.recipes.length];
    const customer = {
      id: s.nextCustomerId++, recipe, patience: this.level.patience * (1 + this.progress.upgrades.patience * 0.12),
      maxPatience: this.level.patience * (1 + this.progress.upgrades.patience * 0.12),
      status: "waiting", prepared: [], ready: false,
    };
    s.customers.push(customer);
    if (s.selectedId === null) s.selectedId = customer.id;
  }

  selectCustomer(id) {
    const customer = this.session?.customers.find((item) => item.id === Number(id) && item.status === "waiting");
    if (!customer) return this.reject("That customer has already been served.");
    this.session.selectedId = customer.id;
    this.onChange();
    return true;
  }

  get selectedCustomer() {
    return this.session?.customers.find((item) => item.id === this.session.selectedId && item.status === "waiting") || null;
  }

  prepareIngredient(index) {
    const customer = this.selectedCustomer;
    if (!customer) return this.reject("Choose a waiting customer first.");
    if (customer.ready || this.session.station.status !== "idle" && this.session.station.customerId === customer.id) {
      return this.reject("That dish is already cooking or ready.");
    }
    const recipe = RECIPES[customer.recipe];
    if (index !== customer.prepared.length || recipe.ingredients[index] === undefined) {
      return this.reject("Follow the recipe in order to prepare this dish.");
    }
    customer.prepared.push(index);
    this.onChange();
    return true;
  }

  startCooking() {
    const customer = this.selectedCustomer;
    if (!customer) return this.reject("Choose a waiting customer first.");
    if (customer.ready) return this.reject("This dish is already ready to serve!");
    if (this.session.station.status !== "idle") return this.reject("The cooking station is busy. Let it finish first.");
    const recipe = RECIPES[customer.recipe];
    if (customer.prepared.length !== recipe.ingredients.length) return this.reject("Prepare every ingredient before cooking.");
    const speed = 1 - this.progress.upgrades.speed * 0.15;
    this.session.station = { status: "cooking", customerId: customer.id, remaining: Math.max(0.8, recipe.cook * speed) };
    this.onChange();
    return true;
  }

  serve(id = this.session?.selectedId) {
    const s = this.session;
    if (!s || s.phase !== "playing") return this.reject("There isn't an active shift.");
    const customer = s.customers.find((item) => item.id === Number(id) && item.status === "waiting");
    if (!customer) return this.reject("That order is no longer waiting.");
    if (!customer.ready || s.station.status !== "ready" || s.station.customerId !== customer.id) {
      return this.reject("That dish isn't ready yet. Finish the recipe and cooking first.");
    }
    const recipe = RECIPES[customer.recipe];
    if (s.station.recipe !== customer.recipe) return this.reject("That dish doesn't match this customer's order.");
    customer.status = "served";
    s.served += 1;
    const quickTip = customer.patience / customer.maxPatience > 0.5 ? Math.ceil(recipe.price * 0.15) : 0;
    const payout = Math.round((recipe.price + quickTip) * (1 + this.progress.upgrades.tips * 0.1));
    s.earned += payout;
    s.score += 100 + quickTip * 2;
    s.combo += 1;
    s.station = { status: "idle", customerId: null, remaining: 0 };
    const next = s.customers.find((item) => item.status === "waiting");
    s.selectedId = next?.id ?? null;
    if (s.served >= this.level.target && s.earned >= this.level.coinGoal) this.finish(true);
    this.onChange();
    return payout;
  }

  tick(seconds = 1) {
    const s = this.session;
    if (!s || s.phase !== "playing" || seconds <= 0) return;
    s.timeLeft = Math.max(0, s.timeLeft - seconds);
    s.elapsed += seconds;
    s.nextSpawn -= seconds;
    if (s.nextSpawn <= 0 && s.nextCustomerId <= this.level.target + 5) {
      this.spawnCustomer();
      s.nextSpawn = this.level.spawn;
    }
    for (const customer of s.customers) {
      if (customer.status !== "waiting") continue;
      customer.patience = Math.max(0, customer.patience - seconds);
      if (customer.patience === 0) {
        customer.status = "missed";
        s.missed += 1;
        s.combo = 0;
        if (s.station.customerId === customer.id) {
          s.station = { status: "idle", customerId: null, remaining: 0 };
        }
        if (s.selectedId === customer.id) s.selectedId = s.customers.find((item) => item.status === "waiting")?.id ?? null;
      }
    }
    if (s.station.status === "cooking") {
      s.station.remaining = Math.max(0, s.station.remaining - seconds);
      if (!s.station.remaining) {
        const customer = s.customers.find((item) => item.id === s.station.customerId);
        if (customer?.status === "waiting") {
          customer.ready = true;
          s.station.status = "ready";
          s.station.recipe = customer.recipe;
        } else s.station = { status: "idle", customerId: null, remaining: 0 };
      }
    }
    const missLimit = 5 + this.progress.upgrades.capacity;
    const allSpawned = s.nextCustomerId > this.level.target + 5;
    const nobodyWaiting = !s.customers.some((item) => item.status === "waiting");
    if (s.timeLeft <= 0 || s.missed > missLimit || (allSpawned && nobodyWaiting && s.served < this.level.target)) {
      this.finish(false);
    }
    this.onChange();
  }

  togglePause() {
    if (!this.session || !["playing", "paused"].includes(this.session.phase)) return false;
    this.session.phase = this.session.phase === "playing" ? "paused" : "playing";
    this.onChange();
    return true;
  }

  restart() {
    const id = this.session?.levelId;
    return id ? this.startLevel(id) : false;
  }

  finish(won) {
    const s = this.session;
    if (!s || s.phase !== "playing") return;
    const level = this.level;
    const stars = won ? (s.missed === 0 && s.earned >= level.coinGoal * 1.5 ? 3 : s.missed <= 1 ? 2 : 1) : 0;
    const firstWin = won && !this.progress.rewarded.includes(level.id);
    const bonus = firstWin ? 35 + stars * 10 : 0;
    s.phase = won ? "won" : "lost";
    s.result = { won, stars, bonus, firstWin, served: s.served, missed: s.missed, score: s.score, earned: s.earned + bonus };
    this.progress.coins += s.earned + bonus;
    if (won) {
      this.progress.stars[level.id] = Math.max(this.progress.stars[level.id] || 0, stars);
      this.progress.unlocked = Math.max(this.progress.unlocked, Math.min(LEVELS.length, level.id + 1));
      if (firstWin) this.progress.rewarded.push(level.id);
    }
    this.save();
  }

  purchase(id) {
    const upgrade = UPGRADES.find((item) => item.id === id);
    if (!upgrade) return this.reject("That upgrade isn't available.");
    const level = this.progress.upgrades[id];
    if (level >= upgrade.max) return this.reject("This upgrade is already fully upgraded.");
    const cost = upgrade.costs[level];
    if (this.progress.coins < cost) return this.reject(`You need ${cost - this.progress.coins} more coins for this upgrade.`);
    this.progress.coins -= cost;
    this.progress.upgrades[id] += 1;
    this.save();
    return true;
  }

  setSetting(name, value) {
    if (!["music", "sound"].includes(name)) return false;
    this.progress.settings[name] = Boolean(value);
    this.save();
    return true;
  }

  markTutorialSeen() {
    this.progress.tutorialSeen = true;
    this.save();
  }

  resetProgress() {
    this.progress = copy(DEFAULT_PROGRESS);
    this.session = null;
    this.save();
  }

  reject(message) {
    this.notice = message;
    this.onChange();
    return false;
  }
}
