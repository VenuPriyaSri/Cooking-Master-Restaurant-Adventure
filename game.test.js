import test from "node:test";
import assert from "node:assert/strict";
import { GameEngine, LEVELS, RECIPES } from "./engine.js";

function createHarness() {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  return { storage, game: new GameEngine(storage) };
}

function prepareSelected(game) {
  while (!game.selectedCustomer && game.session.phase === "playing") game.tick(1);
  const customer = game.selectedCustomer;
  assert.ok(customer, "a waiting guest should arrive before the shift ends");
  for (let i = customer.prepared.length; i < RECIPES[customer.recipe].ingredients.length; i += 1) {
    assert.equal(game.prepareIngredient(i), true);
  }
  assert.equal(game.startCooking(), true);
  for (let i = 0; i <= RECIPES[customer.recipe].cook && game.session.phase === "playing"; i += 1) game.tick(1);
  assert.equal(game.serve(customer.id) > 0, true);
}

test("level one can be won, rewards once, and unlocks level two", () => {
  const { game } = createHarness();
  assert.equal(game.startLevel(1), true);
  while (game.session.phase === "playing") prepareSelected(game);
  assert.equal(game.session.phase, "won");
  assert.equal(game.session.result.served, 5);
  assert.ok(game.session.result.stars >= 1);
  assert.equal(game.progress.unlocked, 2);
  const coinsAfterWin = game.progress.coins;
  game.startLevel(1);
  while (game.session.phase === "playing") prepareSelected(game);
  assert.equal(game.session.result.firstWin, false);
  assert.equal(game.session.result.bonus, 0);
  assert.equal(game.progress.coins, coinsAfterWin + game.session.earned);
});

test("level two is unlocked only after winning level one", () => {
  const { game } = createHarness();
  assert.equal(game.startLevel(2), false);
  assert.equal(game.progress.unlocked, 1);
  game.startLevel(1);
  while (game.session.phase === "playing") prepareSelected(game);
  assert.equal(game.startLevel(2), true);
  game.tick(LEVELS[1].time + 1);
  assert.equal(game.session.phase, "lost");
  assert.equal(game.progress.unlocked, 2);
  assert.equal(game.progress.stars[3], undefined);
});

test("refresh restores saved progress and purchases are safe", () => {
  const { game, storage } = createHarness();
  game.progress.coins = 500;
  assert.equal(game.purchase("speed"), true);
  assert.equal(game.progress.coins, 390);
  assert.equal(game.progress.upgrades.speed, 1);
  game.progress.coins = 10;
  assert.equal(game.purchase("tips"), false);
  assert.equal(game.progress.coins, 10);
  game.save();
  const refreshed = new GameEngine(storage);
  assert.equal(refreshed.progress.coins, 10);
  assert.equal(refreshed.progress.upgrades.speed, 1);
});

test("pause freezes timers and unfinished dishes cannot be served", () => {
  const { game } = createHarness();
  game.startLevel(1);
  const before = game.session.timeLeft;
  game.togglePause();
  game.tick(30);
  assert.equal(game.session.timeLeft, before);
  game.togglePause();
  assert.equal(game.serve(), false);
  assert.equal(game.session.served, 0);
  assert.equal(game.prepareIngredient(1), false);
  assert.equal(game.startCooking(), false);
});

test("incorrect station state and repeated serving are rejected", () => {
  const { game } = createHarness();
  game.startLevel(1);
  prepareSelected(game);
  const served = game.session.served;
  assert.equal(game.serve(1), false);
  assert.equal(game.session.served, served);
});

test("a ready dish is discarded and its station freed when its guest leaves", () => {
  const { game } = createHarness();
  game.startLevel(1);
  const customer = game.selectedCustomer;
  const recipe = RECIPES[customer.recipe];
  for (let i = 0; i < recipe.ingredients.length; i += 1) game.prepareIngredient(i);
  assert.equal(game.startCooking(), true);
  game.tick(recipe.cook);
  assert.equal(game.session.station.status, "ready");
  customer.patience = 0.25;
  game.tick(1);
  assert.equal(customer.status, "missed");
  assert.equal(game.session.station.status, "idle");
  assert.equal(game.session.served, 0);
});

test("all ten levels are defined with distinct objective configurations", () => {
  assert.equal(LEVELS.length, 10);
  assert.deepEqual(LEVELS.slice(0, 3).map((level) => level.theme), ["burger", "burger", "burger"]);
  assert.deepEqual(LEVELS.slice(3, 6).map((level) => level.theme), ["pizza", "pizza", "pizza"]);
  assert.deepEqual(LEVELS.slice(6, 8).map((level) => level.theme), ["bakery", "bakery"]);
  assert.deepEqual(LEVELS.slice(8).map((level) => level.theme), ["advanced", "advanced"]);
  for (const level of LEVELS) assert.ok(level.target > 0 && level.coinGoal > 0 && level.time > 0);
});

test("a chef can advance through all ten levels and the final level stays replayable", () => {
  const { game } = createHarness();
  for (const level of LEVELS) {
    assert.equal(game.startLevel(level.id), true);
    let safety = 0;
    while (game.session.phase === "playing" && safety++ < 80) {
      if (!game.selectedCustomer) {
        game.tick(1);
        continue;
      }
      prepareSelected(game);
    }
    assert.equal(game.session.phase, "won", `level ${level.id} should be achievable`);
    assert.equal(game.progress.unlocked, Math.min(LEVELS.length, level.id + 1));
  }
  assert.equal(game.startLevel(10), true);
  assert.equal(game.progress.unlocked, 10);
});
