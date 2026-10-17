# Lexicore – Unity porting guide (Unity 6.3 LTS · UI Toolkit)

> For the dev team. Written from the playable prototype (updated 17 Oct 2026, v1.6). The prototype is the reference: when this guide, the GDD and the prototype disagree, **the golden tests (taken from the prototype) win**, except for the open decisions listed in §9.
> Target: Unity **6.3 LTS (6000.3.x)**, **UI Toolkit** for all UI, C# 9.
> Code, tests and golden files: GitHub repo FeeVa2498/Lexicore, folder `unity/Assets/Lexicore/` (https://github.com/FeeVa2498/Lexicore/tree/main/unity/Assets/Lexicore).

---

## 0. The short version

1. **Don't translate the prototype line by line.** It is one 6,000-line HTML file where later code wraps or overrides earlier code. Use it as an *executable spec*: this guide lists the rules that actually run, and the golden tests prove a port matches.
2. **Split rules from presentation.** Put every game rule in a pure C# assembly (`Lexicore.Core`, no `UnityEngine`). The UI only shows what Core decided.
3. **Load the data, don't retype it.** `data/*.json` holds every weapon, relic, consumable, enemy move cycle and encounter pool. `data/words/` holds the word list with tags.
4. **Test against the prototype.**
   - `golden_scoring.json`: 1,816 scoring cases.
   - `golden_combat.json`: 103 combat scenarios.
   - Both were produced by running the real prototype.
5. **A head start is included.** `unity/Assets/Lexicore/` already contains:
   - the C# port of scoring (`Scoring.Evaluate`, the 25 Mult relics, the word list, tiles), which passes all 1,816 golden scoring cases;
   - the EditMode test that checks it.

Copy `unity/Assets/Lexicore/` into the Unity project's `Assets/`, open **Window ▸ General ▸ Test Runner ▸ EditMode ▸ Run All**.

---

## 1. What you get

| Path (repo `FeeVa2498/Lexicore`) | What it is |
|---|---|
| `index.html` | The playable prototype. Open it in Chrome; the console has the live state: `G` (run), `C` (combat), `ENEMIES`, `RELICS`, `WEAPONS`, `POTIONS`. |
| `docs/GDD.md` | Design document (what and why). |
| `docs/Lexicore_Unlocks.xlsx` | Unlock levels, XP, hero unlocks. |
| `data/*.json` | All content and numbers (see GDD Appendix A). |
| `data/words/lexicon.tsv` | Every valid word (193,091) with tags: noun/verb/adjective, animal/job/color/swear. |
| `data/words/valid_words.txt` | Same words, one per line. |
| `unity/Assets/Lexicore/Core/` | C# port of scoring (pure C#). |
| `unity/Assets/Lexicore/Tests/` | NUnit EditMode tests + golden files. |
| `unity/Assets/Lexicore/Data/` | Copy of `data/` used by the tests. |

**Reading the prototype code.** The effective version of a function is the **last** one defined, plus any wrappers (`const x=fn; fn=function(){ … x() … }`). The prototype function names are used in this guide (e.g. `cast()`, `enemyTurn()`), so you can search for them.

---

## 2. Project architecture

### 2.1 Assemblies

```
Assets/Lexicore/
  Core/            Lexicore.Core.asmdef      noEngineReferences: true   ← all rules, deterministic, unit-tested
  Data/            JSON + word list (TextAssets / StreamingAssets)
  Game/            Lexicore.Game.asmdef      → Core, UnityEngine          ← run flow, save/load, RNG seed, audio hooks
  UI/              Lexicore.UI.asmdef        → Core, Game, UIElements     ← UXML/USS, VisualElement views, presenters
  Tests/EditMode/  Lexicore.Tests.asmdef     → Core (+ NUnit)             ← golden tests
```

### 2.2 Rules produce events, the UI plays them

In the prototype, logic and animation are mixed (`await strikeAnim(...)` in the middle of `cast()`). In Unity:

- Core resolves a whole action **synchronously**: a cast, end of turn, use of a consumable or a map choice.
- While it resolves, Core appends to a list of **events** (`IReadOnlyList<CombatEvent>`).
- A presenter plays the events one after another with `Awaitable` (built into Unity 6) or coroutines.

```csharp
public abstract record CombatEvent;
public record Cast(string Weapon, IReadOnlyList<string> Words, int SpellPower, double Mult, int Output, bool Crit, IReadOnlyList<string> RelicsFired) : CombatEvent;
public record Damage(Actor Target, int Amount, int Absorbed, bool Pierce) : CombatEvent;
public record ShieldGain(Actor Target, int Amount) : CombatEvent;
public record StatusChange(Actor Target, Status Status, int Delta) : CombatEvent;
public record TilesDebuffed(TileDebuff Debuff, IReadOnlyList<int> TileUids) : CombatEvent;
public record TilesDrawn(IReadOnlyList<int> TileUids, int Overflow) : CombatEvent;
public record EnemyMove(int Enemy, string MoveName) : CombatEvent;
public record Banner(string Text) : CombatEvent;           // "TIME HASTE!", "FIREWALL: TURN OVER"…
public record RelicFlash(IReadOnlyList<string> Relics) : CombatEvent;
public record Log(string Text) : CombatEvent;
public record EnemyDied(int Enemy, int Gold) : CombatEvent;
public record CombatEnded(bool Won) : CombatEvent;
```

There is no player decision in the middle of an action, so this split is safe. Keep the **order** of the steps exactly as in §4: deaths are checked at fixed points, and the order changes results (Thorns can kill you mid-cast, poison can kill an enemy before its next move, and so on).

### 2.3 State and randomness

- `RunState` (prototype `G`) and `CombatState` (prototype `C`) are plain serializable classes. Save `RunState` whenever the map is shown (prototype: `localStorage["lexspire-run"]`). Combats are not saved mid-fight.
- Use **one RNG per run** with a stored seed, and send every random choice through it: shuffle, encounter pick, map, rewards, shop, debuff targets. The golden tests never compare random outcomes, only counts. Seeded runs make bugs reproducible.
- Meta progression (XP, unlock level, heroes, seen ids) is separate: prototype `localStorage["lexicore-progress"] = {xp, level, heroes[], seen:{e,w,r,p}}`.

### 2.4 Data loading

- **JSON**:
  - Option 1: `com.unity.nuget.newtonsoft-json` (official package) to map into DTOs.
  - Option 2: the dependency-free `MiniJson` in Core, which is what the tests use.
  - Put the JSON in `Resources/`, `StreamingAssets/` or Addressables as `TextAsset`.
- **Word list**: `WordList.FromTsv(text)` builds a `Dictionary<string, WordTags>` (193k entries, ~0.3 s, done once at boot).
  - Unity does not import `.tsv` as a TextAsset. Rename it to `lexicon.tsv.txt` or `.bytes`, or read it from StreamingAssets.
  - The tags are precomputed with the prototype's rules, so you don't need to port WordNet or the plural matching. Just read the columns.
- **Enemy actions** in `enemies.json` (`moveCycle[].actions[]`):

| `type` | Fields | Prototype `k` |
|---|---|---|
| `attack` | `value`, `hits`?, `heavy`?, `plusPerThorn`? | `atk` (`n`, `heavy`, `addThorns`) |
| `block` | `value` | `blk` |
| `buff` | `status`, `value` (self) | `buff` |
| `tileDebuff` | `debuff`, `count` | `tile` |
| `playerDebuff` | `status`, `value` | `pdeb` |
| `allyBlock` / `allyBuff` / `allyHeal` | `value`, (`status`), `target` | `ablk` / `abuff` (all) / `aheal` |
| `summon` | `enemy`, `count` | `summon` |
| `selfDestruct` | `status`, `perHpLeft` | `boom` |
| `changeForm` | `to` (`statue`/`normal`) | `form` |
| `clearStatus` | `status` | `clear` |

  - Boss data: `bossGimmick` (id, name, description), `startingStatus` (`field`, `regrowth`), `damageCapPerTurn`.
  - Tile-debuff ids: `slimy poison lock condemn curse frustrate burn` (`burn` = Smoldering).
- **Relics**:
  - Mult relics: use `MultRelics.Bonus` (already ported).
  - All other relics are hooks (§4.11). `unlockLevel` decides when a relic enters the pools.
- **Ids are not always the display name** (old ids kept for saves):
  - Weapons: `sword` = Spellbook, `shield` = Barrier, `mirror` = Spike Shield, `lantern2` = Seeker's Lantern.
  - Relics: `sozu` = Cracked Flask, `ecto` = Hollow Coin, `philo` = Rival's Banner, `dripper` = Insomnia Lamp, `crown` = Dry Palette, `potbelt` = Bottle Rack, `bird` = Bendy Straw, `idol` = Magpie Feather.
  - `potions.json` = consumables.

---

## 3. Order of work (suggested milestones)

| # | Milestone | Done when |
|---|---|---|
| 1 | Import `Assets/Lexicore`, run the tests | 1,816/1,816 green (already true) |
| 2 | Data DTOs + loaders for weapons, relics, consumables, enemies, encounters, heroes, progression | Every id in the JSON loads |
| 3 | `CombatState` + cast resolution (§4.2–4.5) | Golden **cast** scenarios match |
| 4 | Enemy phase + end/start of turn (§4.6–4.9) | Golden **endTurn** scenarios match |
| 5 | Consumables (§4.12) + boss gimmicks (§4.13) | Golden **consumable** + boss scenarios match |
| 6 | Combat screen in UI Toolkit (§5), playing the event list | A fight is playable with placeholder art |
| 7 | Rewards, map, shop, rest, treasure, altar, events (§4.15–4.16) | A full Act is playable |
| 8 | Run flow: acts, bosses, liftoff, Act 4, ending, death/victory, unlocks, Glossary, save | A full run is playable |
| 9 | Art, audio, juice | — |

---

## 4. The rules that actually run

### 4.1 Tiles and the cast bar

- A tile is `{uid, ch, lvl 1|2, paint, deb {t, n}, fragile, fort}`. `ch` is A–Z, `?`, `!` or `,`.
- A tile's Spell Power:
  - Level 1 letter value + 3 if Level 2.
  - **`?` is always 0**, even after it resolves to a letter.
  - Slimy = 0.
  - The LEXICORE filtered letter = 0.
- Valid cast shapes and the scoring are fully covered by `Scoring.Evaluate` (ported, tested):
  - comma parts;
  - trailing `!` runs;
  - single-tile casts;
  - wildcard resolution: try A–Z for every `?` and keep the valid word whose wildcard letters are worth the most; ties go to the first found in A→Z order;
  - easter eggs (always invalid; the attempt unlocks the achievement);
  - swears (always valid).

Output pipeline (in this order):

```
SpellPower = Σ tile SP + Might (attack weapons) / Robust (defense weapons)      [single-tile casts: no Might/Robust]
Mult       = weapon Mult + Σ over relics (Σ over words of length ≥ 2: relic bonus) + Parrot 3 + Adrenaline 0.5   [single tile: Monocle +4]
SpellPower += ! bonus (2,4,6,10,16,26,42 per extra ! in a run)
Crit       = letters + ! count == sigil
Mult       = round(Mult, 2)
Output     = floor(SpellPower × Mult)
           + Midas floor(gold/10) (×2 on crit) + Shield Slam floor(Shield/2) + Berserker's Blood floor(missing HP/4) [attack weapons]
           × 2 Journal (this word key cast exactly once before in this combat)
— then, in cast(): × 2 Echo Draught; Too Tall halving, Hammer ×2 and Chalk Tally ×2 apply to the attack damage only.
```

### 4.2 `cast()`: resolution order

1. Refuse silently (no cost) when:
   - the bar is empty;
   - Energy < cost (Overclock Chip makes the selected weapon cost 0 this turn);
   - the cast is invalid.
   An easter-egg attempt unlocks its achievement here.
2. Echo Draught armed: Output ×2, disarm.
3. Pay Energy. Remember Frustrated stacks **before** the cast (`fr`).
4. For each cast tile:
   - Paints: red +1 Might, blue +1 Robust, green +1 extra draw, gold +1 gold.
   - Debuffs: Poisoned +1 Poison, Cursed +1 Curse, Frustrated +1 Frustrated.
   - Slimy, Condemned and Smoldering are removed from the tile.
5. Move the cast tiles out of the hand:
   - Fragile tiles are banished.
   - With **Boomerang** the tiles go back to the hand (hand cap 16; overflow goes to the discard pile).
   - Otherwise they go to the discard pile.
6. Bookkeeping:
   - `turnCasts++`.
   - Word-use count for the Journal (key = words joined by `,`; not counted for single tiles).
   - `lastWord` for Parrot (null after a single-tile cast).
   - First cast of the combat + Quick Gloves: extra draw = number of tiles cast.
7. **Weapon effect** by kind (§4.3).
8. **Word relics** (§4.11 *afterCast*): Sandbag, Umbrella, Snake Charm, Protein Bar.
9. Third cast this turn: Metronome +1 Might; Rubber Stamp 5 to all.
10. Frustrated: if `fr > 0` and letter count < `fr + 1`, lose 1 HP.
11. Pencil Case (turn 1): extra draw = refill to 16.
12. Draw the extra tiles (Paper Cut fires on them).
13. Check player death → Phoenix Feather (§4.8).
14. If the selected weapon is no longer affordable, auto-select the first affordable one.
15. Resolve enemy deaths (§4.7).
16. LEXICORE Firewall: if the cap was hit during this action, the turn ends now (§4.13).

### 4.3 Weapon effects (`kind`)

| Kind | Effect | Critical |
|---|---|---|
| **atk** | Damage to target = Output. Too Tall: ÷2 if fewer than 5 letters. Chalk Tally: ×2 when the attack counter passes a multiple of 10. One "attack" = 1 + `!` count with Megaphone. Then enemy Thorns hit you (§4.5). Then Rusty Nail: + attacks Poison if the target is alive. | Spellbook: next turn +1 Energy. Greatsword (target alive): target Broken +3, you lose max(2, floor(Output×0.2)) HP. Shield Slam (target alive): Stun +1. Boomerang (target alive): 2nd hit floor(dmg/2) + Thorns + Nail +1. Parrying Dagger: Shield + Output (halved if Weakened, Barbed Wire counts). Flame Lance: same dmg to every other enemy, Nail on each, then each enemy's Thorns. |
| **def** (Barrier, Spike Shield) | Shield = Output (halved if Weakened) → Barbed Wire | Barrier: draw 3. Spike Shield: Thorns + floor(Shield/2). |
| **buff** (Dumbbell, War Drum) | Might + max(1, floor(Output/5)) | Dumbbell: heal 2 × Might (after the gain). War Drum: the same gain again. |
| **psn** (Venom Quill) | Poison max(1, floor(Output/3)) on the target | on every living enemy |
| **heal** (Censer) | Heal max(1, floor(Output/4)) | ×2 |
| **draw** (Seeker's Lantern) | Draw min(5, max(1, floor(Output/6))) | drawn letters become Level 2 (this combat) |
| **forge** (Rune Chisel) | min(3, max(1, floor(Output/8))) Fragile copies of the LAST letter into the hand | copies are Level 2 |
| **cleanse** (Cleansing Bell) | Clear every debuff on hand tiles; Shield floor(Output/2) (halved if Weakened) | also set your Poison/Weaken/Broken/Frustrated/Curse to 0 (after the Shield) |
| **store** (Sand Hourglass) | Next turn Energy + min(3, 1 + floor(Output/12)) | next turn draw +3 |
| **util** (Utility Belt) | min(3, max(1, floor(Output/8))) Fragile `!` tiles into the **discard** pile | +1 Energy now |

`hammer`, `needle` and `bulwark` exist in code but are not obtainable; skip them.

### 4.4 `dealToEnemy(i, amount, {pierce})`, in this order

1. Broken: floor(amount × 1.5).
2. Shield absorbs, unless `pierce` (your Thorns pierce).
3. Prisoner Zero in Time Slow: ×2.
4. Force Field > 0: the hit deals **1** and removes 1 cell (after Shield; the field ignores the amount).
5. Firewall cap (LEXICORE): damage clipped to the cap left this turn; reaching it sets `capHit`.
6. HP − damage (min 0).

Poison ticks do **not** go through this function. They bypass Shield, Field and the cap.

**Woodpecker Beak** (relic): in `cast()` the main attack hit becomes `peckFlurry` when the attack damage `dmg` (after Too Tall, Hammer, Chalk Tally) is even and ≥ 2: call `dealToEnemy(ti, 2, opts)` up to `dmg/2` times, stopping when the target's HP reaches 0 or `capHit` is set. So Broken, Shield, Force Field (1 cell per peck), Time Slow and the Firewall apply per peck. Afterwards Thorns, Rusty Nail and the crit effects run once, as for a normal hit. The big `strikeAnim` is skipped (the flurry has its own animation: hit *i* at D·√(i/n) ms, D = min(2600, 520 + 42n)).

### 4.5 Thorns

- **Enemy Thorns**: after each attack hit *you* land on that enemy, you take its Thorns. Your Shield absorbs it. It can kill you mid-cast.
- **Your Thorns**: after each enemy attack hit, that enemy takes your Thorns (pierce). They are reset at the start of your turn to `baseThorns`:
  - Potted Cactus 3;
  - plus Barbed Wire gains, which last the whole combat.
  Spike Shield crit Thorns only last until your next turn starts.

### 4.6 End of your turn (`endTurn()`), in this order

1. Rage Soda / Brick Milk: remove the temporary Might / Robust.
2. Condemned tiles in hand: counter −1; at 0 they are banished for this combat.
3. Smoldering tiles in hand: lose 1 HP each → death check.
4. Discard the hand. Fortified tiles stay; with Hoarder's Satchel nothing is discarded.
5. Every Locked tile anywhere: counter −1; at 0 it unlocks.
6. Poison: lose Poison HP, then Poison −1 → death check → Duct Tape check.
7. Weaken −1, Broken −1, Frustrated −1.
8. Curse: if HP ≤ Curse → HP 0 → death check.
9. Enemy phase (§4.7).

### 4.7 Enemy phase (`enemyTurn()`)

1. **Every living enemy's Shield → 0**, once, at the start of the phase. Shield an ally gives therefore protects through your next turn.
2. Order = enemies left to right. A hasted Prisoner Zero appears **twice** in a row.
3. For each enemy:
   - Stunned: skip, Stun −1, the cycle does not advance.
   - Zero in Time Slow: skip.
   - Otherwise run every action of `moves[mi % len]`:
     - `atk` × hits. Each hit = round(value × group damage scale) + Might (+ Thorns × `plusPerThorn`). ×1.5 if you are Broken. ×2 if Gemini and this twin is not your target. Then your Shield → HP → death check → Duct Tape → your Thorns hit back (can kill it; stop its remaining hits).
     - `blk`, `buff`, `pdeb`.
     - `tile`: pick N tiles without a debuff and not Fortified, from the draw pile first, then discard, then hand. Lock n = 2, Condemn n = 1. Picked draw-pile tiles move to the top.
     - `summon`: max 5 living enemies.
     - `boom`: you get ceil(HP/per) of the status, then it dies.
     - `form`, `clear`.
     - `ablk` / `abuff` / `aheal`:
       - Shield goes to every *other* living enemy (itself if alone).
       - `all` buffs go to itself + everyone.
       - Heal goes to injured others (or itself if hurt and alone).
   - Haste first pass: advance `mi` and go straight to the second pass. The end-of-move steps below run once.
   - End of its move:
     - Regrowth heals 5 × living minions.
     - **Poison** tick (HP − Poison, Poison −1) → deaths.
     - Broken −1.
     - `mi++` (if not stunned).
     - Zero: phase counter +1.
4. Start your turn (§4.8).

### 4.8 Start of your turn (`startPlayerTurn()`, with its wrappers)

1. Reset `capTaken`/`capHit` (Firewall) and `dmgTaken`.
2. `turn++`. Your Shield → 0.
3. Reassemble: downed Scrapipede segments with `turn ≥ reviveTurn` (reviveTurn = the turn it fell + **2**) come back with ceil(25 % max HP), Shield 0, if any segment still stands.
4. Energy = 3 + boss-relic Energy (Hollow Coin, Insomnia Lamp, Cracked Flask, Dry Palette, Rival's Banner: +1 each) + stored `nextEnergy`. Big Game Trophy: +1 in Elite/Boss fights.
5. Turn 1 only:
   - Spark Plug +1 Energy;
   - Scrap Plating +10 Shield;
   - Iron Knuckles +2 Might;
   - Potted Cactus base Thorns 3.
6. Wind-up Key: +1 Energy when `turn % 3 == 0`.
7. Your Thorns = base Thorns.
8. Draw up to 16 + stored `nextDraw`. Hand cap 16; overflow goes to the discard pile. If the draw pile is empty, shuffle the discard pile into it. Paper Cut does **not** fire on this refill.
9. Static Coil: 3 to all → deaths.
10. Syntax Filter (LEXICORE alive): pick one random letter present in the hand; those tiles are worth 0 this turn.

**Death check** (everywhere): HP ≤ 0 → if a Phoenix Feather is in a slot, remove it and set HP to max(1, floor(30 % max HP)). Otherwise the run ends. There is **no** hero revive; Champion's Undying was removed.

### 4.9 Deaths (`resolveDeaths()`)

- An enemy at HP ≤ 0:
  - If it has `reform` (Scrapipede) and another segment stands, it is **down**: no gold, revives 2 turns later (`reviveTurn = turn + 2`).
  - Otherwise it is dead: gold drop, split (Great Slime → 5 Slimelets), and if it was the leader (Mother Mycelia), every minion withers.
- When no segment stands, downed segments die for good.
- Gemini Twin Bond: when one twin dies and the other lives, the living twin gets +6 Might (once).
- All enemies dead → combat won (§4.15).

### 4.10 Statuses (numbers)

Weaken halves Shield **you** gain (floor). Broken ×1.5 damage taken (floor). Poison ticks at the end of its owner's turn, then −1. Curse = instant death at the end of your turn if HP ≤ Curse. Frustrated: words shorter than stacks + 1 cost 1 HP. Might/Robust last the combat. Stun skips 1 turn.

### 4.11 Relic hooks (non-Mult relics)

| Trigger | Relics |
|---|---|
| Score (in `Evaluate`) | the 25 Mult relics (values +1 in v1.6, see `relics.json` / `MultRelics.cs`), Parrot +3, Monocle (single tile +4), Journal ×2, Berserker's Blood |
| Combat start | Rival's Banner: you Broken +1. Bounty Poster: Elite max HP ×0.75 (ceil). |
| Turn start | Spark Plug, Scrap Plating, Iron Knuckles, Potted Cactus (turn 1); Wind-up Key; Big Game Trophy; Static Coil; boss-relic Energy |
| On attack | Chalk Tally (every 10th attack ×2, counter `G.nib` lasts the run), Rusty Nail, Megaphone, Woodpecker Beak (even damage → pecks of 2, §4.4) |
| After cast (each word ≥ 2 letters) | Sandbag 6+ letters → +10 Shield; Umbrella starts with a vowel → +8 Shield (both halved by Weaken, feed Barbed Wire); Snake Charm S or Z → +2 Poison on target; Protein Bar double letter → +1 Might |
| 3rd cast in a turn | Metronome +1 Might, Rubber Stamp 5 to all |
| First cast of a combat | Quick Gloves draw = tiles cast |
| On Shield gain | Barbed Wire: +1 base Thorns per 10 Shield (remainder carried in the combat) |
| On draw during your turn | Paper Cut: 1 damage per drawn tile to a random enemy |
| HP < 50 % | Duct Tape heal 12, once per combat |
| Turn end | Hoarder's Satchel keeps the hand |
| Combat won | Thermos heal 8, Piggy Bank +floor(gold/100)×10 gold |
| Gold drop | Magpie Feather ×1.25, Hollow Coin 0 |
| Shop | Haggler's Badge −25 %, Caravan Stew heal 15 |
| Rest | Sleeping Bag +15, Insomnia Lamp heals 15 % instead of 30 % |
| Rewards | Laminator (added letters Level 2), Dry Palette (1 tile offered), Bottle Rack (+2 consumable slots), Bendy Straw (+5 HP per consumable), Cracked Flask (−10 HP per consumable, min 1) |
| Map | Arcade Token: every ? node is the Claw Machine (2 grabs, magnet) |
| Pick-up | Canned Peaches +7 max HP; Jester Rune / War Horn / Hinge Pin add tiles |

### 4.12 Consumables (`usePotion`)

- Cost no Energy.
- Phoenix Feather can't be used (it is passive).
- Vanishing Powder can't be used in boss fights.
- Outside combat, only `heal`, `fruit` and `bigheal` work.
- On use: Cracked Flask −10 HP (min 1), Bendy Straw +5.
- Each effect is in `potions.json`. Act scaling:
  - Healing Draught 20 + 10/Act;
  - Volatile Flask 20 × Act;
  - Iron Tonic 15 × Act;
  - Mighty Brew 3 + 2/Act;
  - Venom Vial 8 + 4/Act;
  - Blast Jar 12 + 6/Act.
- Damage consumables use `dealToEnemy` (Shield, Field, cap apply).
- Fresh Pages discards the hand and draws 16.
- Tempering Oil fortifies 4 random letter/`?` tiles in hand and cleanses them.
- After use: deaths, then the Firewall check.

### 4.13 Boss gimmicks: implementation notes

- **Too Tall (Titan)**:
  - Attack words under 5 letters deal floor(dmg/2).
  - Every *increase* of its Poison, Broken or Stun is halved, rounded up. Prototype `halveDebuffs`: the setter is `v = n > v ? v + ceil((n − v)/2) : n`.
- **Regrowth (Mycelia)**: +5 HP per living Sporeling at the end of her move. Sporeling `boom`: ceil(HP/3) Poison to you.
- **Living Statue (Gargoyle)**: just its move cycle. `changeForm` (visual + state), Shield 30, Thorns 8. Awaken hit 14 + 2 × Thorns, then `clearStatus` thorns.
- **Twin Bond (Gemini)**: hits from the twin you are *not* targeting ×2; +6 Might when its twin dies.
- **Time Haste/Slow (Zero)**:
  - Phase = `["haste","haste","slow"][ph % 3]`, and `ph++` after each of its full turns.
  - Haste: it acts twice in a row (two moves).
  - Slow: no move, and it takes ×2 damage (during your turn before it).
  - The intent shows both moves when hasted.
- **Force Field (Gatekeeper)**: starts with 6 cells. `buff field 2` adds cells (every 4th turn). See §4.4 step 4.
- **Syntax Filter + Firewall (LEXICORE)**:
  - Filter at turn start (§4.8).
  - Cap 70 per player turn (§4.4). When reached, finish the current action, then end the turn automatically.

### 4.14 Combat start

- Enemy HP: in **normal** fights scaled by group size (see §9.1 for the exact values the prototype uses). Elites and bosses are unscaled.
- Enemy attack values in normal fights × `[1,1,1,.85,.72,.62][min(n,5)]`.
- Then Rival's Banner and Bounty Poster apply.
- Energy 3. The hand is drawn by the first `startPlayerTurn`.
- Combat works on **copies** of the deck tiles. Everything that happens to a tile in a fight is gone afterwards: debuffs, Level 2 from Seeker's Lantern or Clarity Draught, Fortified from Tempering Oil, banishment. Created Fragile tiles vanish.
- Summoned and split enemies (Sporelings, Slimelets) are never scaled.

### 4.15 After a win

- Gold per kill:
  - normal: max(6, round((19 + rnd(0..11) + 7(act−1)) / enemies));
  - elite: 40 + rnd(0..17) + 12(act−1);
  - boss: 130 split over boss enemies;
  - minions 0;
  - Magpie ×1.25, Hollow Coin 0.
- Then Thermos and run XP:
  - normal 9 + 2(a−1);
  - elite 22 + 5(a−1);
  - boss 45 + 10(a−1).
- Boss: Piggy Bank, then the Act-clear flow: full heal and pick 1 of 3 boss relics (Act 3: liftoff slideshow first).
- Normal and Elite:
  - Piggy Bank.
  - A consumable: Elite 100 %, normal 50 %, only if a slot is free.
  - Elite: one random unlocked relic.
  - Then the tile reward:
    - 3 generated tiles: a vowel, a rare consonant (YZQXJWR), any letter or `? ! ,`;
    - unpainted, 20 % Level 2 (always with Laminator), 10 % Fortified;
    - Dry Palette offers 1 of them;
    - take one or skip.

### 4.16 Outside combat (pointers)

| System | Prototype function | Notes |
|---|---|---|
| Map | `genMap()` | 7 columns × 8 floors, 6 non-crossing random paths, floor types in GDD §10.1, boss after floor 8, Weapon Altar start. Act 4: rest → shop → event → LEXICORE. |
| Encounters | `pickEncounter()` | Group size from `encounterRules` in encounters.json: counter `G.encN[act]` +1 per normal fight; take the last tier with `from` ≤ counter; weighted pick of a size among sizes that have a pool; then a random group of that size, never the same group twice in a row; elites never repeat in an Act; boss chosen once per Act. |
| Shop | `showShop()` | 3 relics (130–179) × (1 + 0.15(act−1)); 3 tiles (30 + 3 × value + 30 if Lv2) × act scale, 10 % special, 22 % Lv2, 15 % Fortified, random paint; 3 consumables 45–64 × act scale; tile removal 10 gold +5 each time (run-wide). |
| Rest | `restHeal()` / `restUpgrade()` | heal floor(30 % max) (+15 Sleeping Bag; 15 % with Insomnia Lamp) or upgrade 1 letter to Lv2 |
| Treasure | `showTreasure()` | pick 1 of 3 relics or skip |
| Altar | `showAltar()` | pull 1 of 2 random altar weapons the hero doesn't have; max 5 weapons |
| Events | `showEvent()` | Word Stone (wordle), Claw Machine, Wheel, Painter; see GDD §11.6 |
| Unlocks | `applyRunXp()` | `xpNeed(level) = 80 + 15 × level`; see the Unlocks sheet |

---

## 5. UI Toolkit

### 5.1 Setup

- **PanelSettings**: Scale Mode *Scale With Screen Size*, Reference Resolution **1600 × 900**, Match 0.5. All prototype coordinates are in this 1600 × 900 space.
- **One `UIDocument`** with a root that holds:
  - a **screen layer** (one screen visible at a time);
  - an **overlay layer** (reward popup, consumable menu, confirm boxes);
  - a **tooltip layer**.
  Swap screens by instantiating `VisualTreeAsset`s.
- Fonts: import Permanent Marker, Patrick Hand, Special Elite and Sniglet as **Font Assets (SDF)**. Set them in a theme USS (`--font-display`, `--font-body`, …).
- Use **USS variables** for the palette (the prototype's `CC` colours) and **USS classes** for tile states.

### 5.2 Screens (one UXML each)

Splash/menu, Character select, Map, Combat, Reward popup, Shop, Rest, Treasure, Altar, Event screens (Word Stone, Claw, Wheel, Painter), Act clear + boss relic pick, Liftoff slideshow, Ending dialogue, Ending slides + quote, Death / Victory with the Unlocks bar, Settings, Controls, Glossary (tabs), Deck viewer.

### 5.3 Combat screen

Layout zones (1600 × 900):
- top-left: relics;
- top-right: gold / map / deck / settings;
- left: hero + HP bar + Energy battery;
- right: enemies (slot positions per group size in the prototype `SLOTS` table) with intents over their heads and statuses under the HP bar;
- centre-left (right of the hero): the compact sigil pedestal, ≈400 px wide, tiles row on top and weapon/sockets/buttons below; it must never cover the front enemy or any intent;
- just above the pedestal (below it in the Gemini fight): the **score board** `Spell Power × Arcana = output`, each number in 3 size tiers (SP 0–20 / 21–50 / 51+, Arcana 0–10 / 11–20 / 21+) with spinning crayon starbursts at tier 2 and 3 and rising glyph sparks at tier 3 (GDD §4.5);
- bottom: 5 weapon slots, consumable shelf, 16-tile hand grid, draw/discard piles, log, End Turn.

Custom controls (Unity 6 `[UxmlElement]` + `[UxmlAttribute]`):
- **`TileView`**: letter, Spell Power badge, classes:
  - `.lv2`;
  - `.paint-red|blue|green|gold`;
  - `.deb-slimy|poison|lock|condemn|curse|frustrate|burn`;
  - `.fragile`, `.fortified`, `.filtered`.
  Each state has a distinct look (GDD §4.9).
- **`SigilPedestal`**: one socket per sigil letter. Sockets light up as tiles are added and turn gold on an exact Critical.
- **`ScoreBoard`**: the `SP × Arcana = Output` board with a tooltip breakdown (`ScoreResult.Notes` / `Fired`); a USS class per tier (`.t1/.t2/.t3`) per number.
- **`FighterView`**: art (2-frame idle via `schedule.Execute(...).Every(420)`), HP bar with a trailing damage bar, Shield badge, status icons, intent bubble.
- **`IntentView`**: icons + numbers for the current move.
  - Bosses show the move name as a banner.
  - A hasted Zero shows two moves.
  - A slowed Zero shows "×2 dmg".
- **Journal panel**: clicking the Journal relic opens a panel listing `CombatState.WordUses` grouped 1× / 2× / 3+×.
- **Scrapipede link**: an aura layer behind the fighters draws beams between the segments' centres and a ring under each; beams to a downed segment flicker.
- **Relic bar**: while a word is on the pedestal, run `Scoring.Evaluate(check:false)` to preview. Relics that would fire glow and drop below the bar with a Mult badge (`RelicMult`).

Animations:
- USS transitions (`transition-property: translate, scale, opacity`) for simple moves.
- `VisualElement.experimental.animation` or a tween library for paths.
- Camera "focus" = scale + translate the stage element.
- Damage numbers = short-lived Labels.
- Coins and tiles flying to piles = absolutely positioned elements animated between `worldBound` rects. Tiles: cast and End-Turn discards fly to the Discard pile; drawn tiles fly from the Draw pile into their hand slot (~0.4 s each, ~35 ms stagger).

Input:
- Clicks on tiles, plus **typing letters** places a matching hand tile (Input System `Keyboard.onTextInput`).
- Keys: Backspace, Enter cast, 1–5 weapons, Tab target, Space end turn, Esc. Full table in GDD §15.2.

### 5.4 Map screen

- Horizontal `ScrollView` (drag to pan).
- Nodes are buttons.
- Dashed paths drawn with `generateVisualContent` + `Painter2D` (dashes = many short `LineTo`). Travelled paths become solid.

### 5.5 Tooltips and Glossary

- Every keyword, status, tile state, relic, consumable and weapon has a tooltip. Show it on `PointerEnterEvent` from a `TooltipLayer`; texts are in `statuses.json` → `keywords`.
- Glossary entries show "???" until seen (`progress.seen`).

---

## 6. Art

- All prototype art is SVG drawn by code with a **crayon filter** (SVG `feTurbulence` displacement + noise mask).
- Unity 6.3 can import SVG natively for UI Toolkit (`VectorImage`), but the crayon look depends on SVG filters, which Unity's vector importer does not render. Use **PNG** instead.
- PNG export from the prototype is available on request:
  - every hero, enemy (2 idle frames + attack/hurt), relic, consumable, weapon, status and intent icon;
  - transparent, 2× scale.
  They work as placeholders or as the reference for the final art. The asset list is `docs/art/Lexicore_Art_Asset_List.csv`.

---

## 7. Tests

### 7.1 Scoring (`golden_scoring.json`, 1,816 cases), already passing

- Each case gives:
  - the cast state: hero, HP, gold, relics, Might/Robust/Shield, Journal word uses, Parrot last word;
  - the tiles;
  - the weapon;
  - the prototype's result: `valid`, `spellPower`, `mult`, `output`, `crit`, `words`, `relicsFired`, `journal`.
- `GoldenScoringTests` runs every case through `Scoring.Evaluate`.
- If you refactor scoring, keep these green.

### 7.2 Combat (`golden_combat.json`, 103 scenarios)

- Each scenario is `setup → one action → expected`:
  - actions: `cast`, `endTurn` (the whole enemy phase and the start of your next turn) or `consumable`;
  - `expected` lists player and enemy numbers, piles, debuffed-tile counts and the prototype's combat log for that action.
- How to apply a setup:
  1. Start a combat with `setup.enemies` ids and `setup.kind` (group HP scaling applies), then overwrite the listed enemy fields.
  2. Set the player statuses (Energy 10 unless given).
  3. Make `setup.weapon` the only weapon.
  4. Replace the hand with `setup.hand` (indices for `handDebuffs`/`handPaints`); the rest of the deck is the draw pile.
  5. Put `setup.cast` on the bar.
- Compare deterministic values exactly. Compare random parts (which tiles were debuffed or drawn, rewards after a win) only as the counts given.
- Writing the runner is part of milestone 3. Use the same `TestData` helpers as the scoring test.

### 7.3 Regenerating

After a design change in the prototype, regenerate both files with `tools/golden/` (see its README) so the Unity tests follow the new rules.

---

## 8. Things to skip (dead code in the prototype)

- `forms` (vault/laser), `layers` (Layered Armor), `rewind`, `clock` (Time Prison): retired boss mechanics still in the file.
- `hammer`, `needle`, `bulwark`: weapons that are not obtainable.
- `TEST_UNLOCK_ALL_ENDINGS`, `TEST_UNLOCK_LEXICORE_GLOSSARY`, Glossary "Cheat: unlock all" / "Reset progress": testing only.
- The first `pickEncounter`, `midasBonus`, `showEvent`, `renderReward`… definitions that are overridden later. Always check for a later definition or a wrapper.

---

## 9. Open decisions (prototype vs GDD)

### 9.1 Normal-fight HP scaling (needs a decision)

- The prototype uses `[1, 1, .75, .62, .55, .5][groupSize]`, so:
  - **2 enemies ×0.75, 3 ×0.62, 4 ×0.55, 5 ×0.5**.
- The GDD says:
  - 1–2 ×1, 3 ×0.75, 4 ×0.62, 5 ×0.55.
- The damage table is correct in both (3 ×0.85, 4 ×0.72, 5+ ×0.62).
- The golden combat scenarios follow the **prototype**. Ask design which one is intended. If the GDD wins, change the table and regenerate the golden file.

### 9.2 Naming

- UI text still says "Arcana" for Mult on relics.
- Consumables are still `potions` in ids and data.

---

## 10. Next steps available on request

- **C# port of the combat core** (§4.2–4.15) that passes the 103 golden combat scenarios.
- **PNG export** of all art (§6).
- **UXML/USS skeleton** of the combat screen with the custom controls above.
