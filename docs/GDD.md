# LEXICORE — Game Design Document

> Version 0.9 (based on the playable prototype, October 2026)
> Playable prototype: https://feeva2498.github.io/Lexicore/
> Data files: `../data/*.json` (generated from the prototype; treat them as the source of truth for numbers)

---

## 0. How to read this document

| Section | What it covers |
|---|---|
| 1–2 | Vision, pillars, story and world |
| 3 | The run: structure and core loop |
| 4 | Combat rules in full (turns, words, scoring, Criticals, statuses) |
| 5–9 | Content: heroes, weapons, tiles, relics, potions |
| 10–12 | Map, nodes and events, economy and balance |
| 13 | Enemies and bosses |
| 14–15 | Meta systems (tutorial, achievements, saves), UI and controls |
| 16–18 | Art, audio, cutscenes |
| 19 | Technical notes on the prototype |
| 20 | Open issues, known gaps and recommended next steps |

Terms used everywhere:

- **Tile**: one letter (or special symbol) in the player's deck. Tiles are this game's cards.
- **Spell Power (SP)**: the number on a tile; the blue "chips" value.
- **Mult**: the red multiplier. Starts at the weapon's Mult (always ×1 today) and is raised only by relics and a few hero passives. Some UI text still calls it **"Arcana"**; it is the same thing (see §20).
- **Output**: `floor(total Spell Power × Mult)`, the final number a cast produces. Every weapon converts output into its effect.
- **Sigil / Crit length**: the exact number of characters a word needs to trigger a weapon's Critical.
- **Fragile**: a tile that is banished for the rest of the combat after one use (an "exhaust" keyword).

---

## 1. Overview

**Lexicore** is a single-player **word-building roguelike deck-builder**. The player climbs a mysterious Tower across four Acts, fighting enemies by spelling real English words from a hand of letter tiles. Words are cast through **weapons**; each weapon turns the word's score into an effect (damage, shield, healing, poison, card draw…). Between fights the player shapes a deck of letter tiles, collects relics and potions, and chooses a path on a branching map, in the spirit of *Slay the Spire* with *Balatro*-style "Chips × Mult" scoring.

| | |
|---|---|
| Genre | Roguelike deck-builder / word game |
| Platform | PC (browser prototype; Windows desktop build available); mouse + full keyboard support |
| Session | One full run ≈ 70–100 minutes (estimate, see §12.6) |
| Players | Single player |
| Art | Hand-drawn **crayon** look, 2-frame idle animation on everything |
| Tone | Whimsical post-apocalypse with a melancholic sci-fi twist |

### 1.1 Design pillars

1. **Your vocabulary is your weapon.** Every action is a real word. Knowing words matters, but deck building, length control and timing matter more.
2. **Length is a decision.** Each weapon rewards an exact word length (Critical). Players constantly trade "the biggest word" against "the right-length word".
3. **Mult is rare and precious.** Spell Power is the everyday resource; Mult only comes from relics. Big turns come from finding relic synergies, not from grinding.
4. **Every choice should be meaningful.** Every weapon is useful to every hero; every boss relic has a real cost; every node on the map is a trade-off.
5. **Readable at a glance.** Intents, tooltips on every keyword, a full glossary, and crayon art that stays legible.

---

## 2. Story and world

### 2.1 Premise (what the player believes)

Long after a war ended the old world, English has become a forgotten **rune language**. Spelling the old words on an ancient Tablet makes them come alive as magic. Far away stands **The Tower**. Locals whisper that a **great sorcerer** waits at its top, one who knows every word ever spoken. Many have tried to climb it. None came back.

**Spoiler policy (important):** before Act 4 the game must never reveal that the master of the Tower is an AI. No UI text, tooltip, glossary entry or achievement may mention "machine", "computer", "AI" or "nanobots". The glossary hides LEXICORE as **"???"** until the player has beaten it once. The name "Lexicore" itself may appear (it is the sorcerer's rumoured name and the title of the game).

### 2.2 The four Acts

| Act | Name | Setting | Enemy theme |
|---|---|---|---|
| 1 | The Outskirts | Overgrown nature at the edge of the ruins | Mutated animals and plants (slimes, bats, goblins, a bramble-flower, spiders) |
| 2 | The Ruined City | Broken streets, scrap and rust | Scavengers using tools, armour and weapons (rats, hounds, crows, badger knights) |
| 3 | The Tower | Inside the Tower: detention floors | Old-world security mixed with alien tech; the **Prisoners**, captured aliens the Tower keeps for research |
| 4 | The Lexicore Chamber | The Tower's crown, launched into orbit | LEXICORE alone. Silent; no music |

After the Act 3 boss, a slideshow shows the crown of the Tower **detaching and launching into space** with the hero inside (§18.1). Act 4 takes place in that orbiting chamber; its round window looks out at the Moon.

### 2.3 The twist (Act 4 ending)

When LEXICORE is defeated it speaks (full script in `../data/story.json`):

- The whole climb was a **test**.
- The "magic letters" are **nanobots**, humanity's last weapon. Ancient English is the command language that controls them.
- Humanity built them, the alien invaders came anyway, and humanity is gone.
- The swarm only obeys a mind strong enough to command it. In four thousand years, nothing that climbed the Tower was strong enough, until the hero.
- LEXICORE copies the hero's mind **a million times** (about a thousand minds per missile), loads the copies into the last missiles of the old world, and launches them at the **alien headquarters on the Moon**. It is the planet's last chance.
- LEXICORE does not stay behind: it spends the last of its power to fly its own **Chamber as the command ship**, at the head of the fleet, on a **one-way trip**. LEXICORE admits it does not know whether the alien headquarters holds what they would need to return: win or lose, they may be stranded on the Moon. The hero (the original) rides with it; together they command the final battle.

Each hero reacts in character (3 personal lines each), then accepts.

### 2.4 Endings (per hero)

The ending is a still-picture slideshow (§18.2) followed by a black screen and a closing line in the style of *Risk of Rain 2*:

| Hero | Closing line |
|---|---|
| The Scholar | *"…and so they rose, a million copies of one curious mind, eager to read the stars like the pages of a book no one had ever finished."* |
| The Champion | *"…and so they rose, a legion of one restless heart, unsure of victory for the very first time, and never more alive."* |
| The Mercenary | *"…and so they rose, a million thieves sharing a single contract, off to steal back the only treasure ever worth taking: tomorrow."* |

---

## 3. The run

### 3.1 Flow

```
Main menu → Choose hero → [Act 1] → Boss → boss relic → [Act 2] → Boss → boss relic
→ [Act 3] → Boss → Tower liftoff slideshow → boss relic → [Act 4: Rest → Shop → Event → LEXICORE]
→ Ending dialogue → Ending slideshow → Closing quote → Run summary
```

- Acts 1–3: a branching map of **8 floors + boss** (plus a Weapon Altar start node). See §10.
- Defeating an Act boss **heals the hero to full** and offers **1 of 3 boss relics** (or skip).
- Death at any point ends the run (Game Over screen with cause of death and run stats).
- Starting resources for every hero: **99 gold**, **1 Healing Draught**, the shared **34-tile starting deck**, the hero's 2 starting weapons and starting relic.

### 3.2 Core loop (per node)

1. Pick the next node on the map.
2. Resolve it: fight, shop, rest, event, treasure or altar.
3. After a fight: gold (dropped per enemy killed), sometimes a potion, a relic from Elites, then **pick 1 of 3 new tiles or skip**.
4. Repeat until the boss.

---

## 4. Combat

### 4.1 Layout

The combat stage is a fixed **1600 × 900** scene scaled to the window. Top-left: relics. Top-right: gold, map, deck, settings. Left: hero, HP bar, Energy **battery** (old-world tech: a battery with three green charge cells and a lightning bolt). Right: enemies with intent bubbles and HP bars. Centre: the **sigil box** (the word being built). Bottom: weapon slots (5), potion shelf, hand grid, draw/discard piles, combat log, End Turn button.

### 4.2 Turn structure

**Start of player turn**
1. Shield (block) resets to 0. Thorns reset to the combat's base Thorns (0 unless Potted Cactus).
2. Energy = 3 + boss-relic bonuses + Energy stored by Sand Hourglass last turn.
3. Turn-1 relics and every-turn relics fire (see §8).
4. Draw up to **16 tiles** (+ any stored extra draw).
5. Static Coil hits all enemies, if owned.

**Player phase.** Any number of casts, in any order, as long as Energy allows:
- Select a weapon (click or keys 1–5).
- Place tiles on the sigil bar (click or type the letter).
- Cast (Enter). If the word is invalid the bar shakes and **nothing is spent**.
- Potions can be used at any time (they do not cost Energy).
- **The same weapon can be cast repeatedly** while Energy remains.

**End of player turn** (End Turn / Space; a Yes/No confirm appears if a weapon could still be cast)
1. Condemned tiles still in hand are banished for the rest of the combat.
2. The remaining hand goes to the discard pile (**except** with Hoarder's Satchel).
3. Lock timers count down.
4. Player Poison ticks (damage = stacks, then −1 stack).
5. Weaken, Broken and Frustrated each lose 1 stack.
6. Curse check: if HP ≤ Curse stacks, the hero dies.

**Enemy phase.** Each living enemy in order: its Shield resets, it performs every action of its current move, then its Poison ticks, then its Broken drops by 1. It then advances to the next move in its cycle.

### 4.3 Hand, draw and discard

- Hand size is **16**, and **16 is also the hard cap**. Any tile that would enter a full hand (drawn, created, or returned) goes to the **discard pile**, with a "Hand full" notice.
- When the draw pile is empty, the discard pile is shuffled into it.
- Tiles banished during a fight (Condemned, Fragile) **return to the deck after the fight**; Fragile tiles created during the fight simply vanish.

### 4.4 Building a valid cast

A cast is the sequence of tiles on the sigil bar:

| Pattern | Valid? | Notes |
|---|---|---|
| `CAT` | Yes | Any word in the dictionary (≈193,000 English words, 2–10 letters). |
| `C?T` | Yes | `?` becomes whichever letter makes a valid word with the **highest** Spell Power; the `?` itself scores 0. |
| `BIG,CAT` | Yes | A comma joins two (or more) words; **every** part must be valid. They are cast as one action. |
| `CAT!!` | Yes | `!` tiles must be at the **end** of a word (or of each comma part). Relic conditions ignore `!`: a relic that checks the last letter sees `CAT!!!!` as ending in T. |
| `U` | Yes | **Single-tile cast**: always valid, Mult fixed at 1, relics don't apply. A `?` alone becomes Q. |
| `U!!!` | Yes | A single letter may also take trailing `!`. |
| `A!,B!` / `A,CAT!` | Yes | Single letters can be joined with commas too, and every part may end with its own `!` run. If **all** parts are single letters the cast scores like a single tile (Mult 1, no relics); if any part is a real word, relics apply normally. |
| `!` / `!!!!` | **No** | `!` can never be cast on its own. |
| `C!AT` | **No** | `!` in the middle of a word. |
| `,CAT` / `BIG,` | **No** | A comma must sit between two words. |
| Easter-egg words | Yes | A short list of joke words (e.g. censored swears like `FVCK`, `SH!T`, and `NIGERIA`) are accepted and unlock secret achievements. |

### 4.5 Scoring

```
Spell Power = Σ tile Spell Power (wildcards = 0, Slimy tiles = 0)
            + Might   (attack weapons only)   or   + Robust (defense weapons only)
            + Exclamation bonus (consecutive ! at the end: +2, +4, +6, +10, +16, +26, +42 … cumulative)
            + Rage (Greatsword Critical only: +1 per 2 missing HP)

Mult        = weapon Mult (×1) + Σ relic Mult bonuses, checked word by word (+0.5 Adrenaline for The Champion below 50% HP)

Output      = floor(Spell Power × Mult)
            × 2 if Journal applies (2nd cast of this exact word this run)
            × 2 if Echo Draught is active
            + Midas Touch gold bonus (floor(gold/10), ×2 on Critical)
```

- **Comma casts and relics**: every word of a comma cast is checked by the Mult relics **on its own**, and the bonuses add up. CAT,CAT with Dusk Glyph (ends with T–Z) gets +0.5 twice = +1. Single letters inside a comma cast (CAT,A) don't trigger word relics.

- **Letter values** (Level 1): A2 B4 C4 D3 E2 F5 G3 H5 I2 J9 K6 L2 M4 N2 O2 P4 Q11 R2 S2 T2 U2 V5 W5 X9 Y5 Z11. **Level 2** tiles add +3.
- The sigil box previews Spell Power, Mult, output and every bonus that fired, *before* casting.

### 4.6 Critical

A cast is **Critical** when its character count **exactly equals** the weapon's sigil:

- Letters (including resolved `?`) **and `!` tiles count**. Commas do **not** count.
- Example, crit length 3: `SAW` crits, `SAW!` does not, `HI!` does, `U!!` does.
- The sigil box shows empty boxes for the target length and a **CRITICAL** tag when the length matches.
- Each weapon has its own Critical effect (§6).

### 4.7 Damage, Shield and death

- Damage to an enemy: `amount × 1.5` if the enemy is Broken, then reduced by its Shield.
- Damage to the hero: enemy attack value + enemy Might, `× 1.5` if the hero is Broken, then absorbed by Shield.
- Shield from the hero's own effects is halved while Weakened.
- **Thorns**: every enemy attack against the hero deals Thorns damage back (ignores enemy Shield). Enemies can have Thorns too (§4.10): each hit of an attack word on them hurts the hero.
- When hero HP would hit 0, these are checked in order: **Undying** (Champion, once per Act: survive at 16 HP), then **Phoenix Feather** potion (revive at 30% max HP). Otherwise the run ends.
- Each enemy drops its share of gold the moment it dies (coins fly to the gold counter).

### 4.8 Statuses

| Status | On | Effect | Decay |
|---|---|---|---|
| Shield | Both | Absorbs damage. | Clears at the start of the owner's turn. |
| Might | Both | +1 Spell Power to the hero's attack casts / +1 damage per enemy attack. | Lasts the combat. |
| Robust | Hero | +1 Spell Power to defense casts. | Lasts the combat. |
| Poison | Both | Deals stacks as damage at the end of the owner's turn. | −1 per tick. |
| Weaken | Hero | Shield gained is halved. | −1 per turn. |
| Broken | Both | Takes +50% damage. | −1 per turn. |
| Curse | Hero | End of turn: if HP ≤ Curse, the hero dies. | Permanent in combat. |
| Frustrated | Hero | Casting a word with fewer than (stacks + 1) letters deals 1 self-damage. | −1 per turn. |
| Force Field | Gatekeeper (boss) | Each hit deals only 1 damage and knocks out 1 cell. Poison ignores it. | Until knocked out; Recharge Field adds 8. |
| Stunned | Enemies | Skips its next turn (Flashbang). | 1 turn. |
| Thorns | Hero, enemies | Attackers take this much damage (enemy Thorns: each hit of an attack word on it). | Hero: resets each turn (to base Thorns). Enemies: lasts the whole fight. |

### 4.9 Tile debuffs (enemy "curses" on tiles)

Enemies apply these to tiles, preferring tiles in the draw pile, then discard, then hand.

| Debuff | Effect |
|---|---|
| Slimy | Spell Power 0 for its next use, then cleared. |
| Poisoned | Gives the hero +1 Poison when used. |
| Locked | Cannot be played for 2 turns. |
| Condemned | If still in hand at end of turn, banished for the rest of the combat (returns after). |
| Cursed | Gives the hero +1 Curse when used. |
| Frustrated | Gives the hero +1 Frustrated when used. |

| Smoldering | A tile on fire: if it is still in hand at end of turn, the hero loses 1 HP per smoldering tile. Casting it puts the fire out. |

**Fortified** (positive tile state): the tile is cast in iron. It is **never discarded** at end of turn (stays in hand; the hand still refills to 16) and enemies **can't put debuffs on it**. Sources: tile rewards (10% chance on letters), shop tiles (15%), claw machine (15%), and the Tempering Oil potion (fortifies up to 4 hand tiles for the current combat).

Every tile state has its own look on the tile: Slimy (green goo dripping from the top), Poisoned (purple drips + green bubbles), Locked (grey with chains), Condemned (red X), Cursed (dark violet aura + skull), Frustrated (orange scribbles), Smoldering (flames + glow), Fragile (cracks + dashed border), Fortified (steel plate with rivets). Paints tint the whole tile red/blue/green/gold. The Glossary has an **Effects** tab listing all of them.

Cleansing: Cleansing Bell (weapon), Purge Salts (potion).

### 4.10 Enemy behaviour

- Each enemy has a fixed **move cycle** (`../data/enemies.json`) and shows its next move as an **intent** (icons + numbers) above its head. Bosses also show the move's name as a banner.
- Move actions: attack (optionally "heavy" for a stronger hit animation), block, buff self, debuff tiles, debuff hero.
- **Multi-enemy fights**: the player chooses a target (click / Tab). Normal-fight enemy HP is scaled by group size (§12.4).
- **Gemini twins (Act 2 boss)**: the twin you are *not* targeting hits **×2** ("hit from behind").
- **The Titan (Act 1 boss)**: drawn as a giant; only its foot is visible.
- **Summon (Mother Mycelia)**: her first move, *Spore Brood*, summons **2 Sporelings** that fight beside her. A fight holds at most **5 enemies**; if fewer than 2 spots are free, she fills only the remaining spots. When Mother Mycelia dies, every Sporeling withers at once.
- **Split (Great Slime, Act 1 Elite)**: when it dies it splits into **5 Slimelets** (green, blue, pink, orange, violet: the normal slime in 5 colours, 16 HP each). The fight is won only when all of them are dead.
- **Minions** (Sporelings, Slimelets) drop no gold. Each Slimelet colour carries its own tile debuff: green Poison, blue Lock, pink Frustrate, orange Slimy, violet Condemn.
- **Enemy Thorns (Needle Hog, Tesla Jelly)**: an enemy with Thorns hurts the hero for its Thorns value on **every hit of an attack word** on it (Boomerang's second hit and Fire Lance's spread count too). The hero's Shield absorbs it. Enemy Thorns stack and last the whole fight, so these enemies punish slow fights.
- **Support enemies**: some enemies spend turns on their allies. *Riot Turtle* and *Ward Jar* give Shield to every other enemy, *Boombox Baboon* and *Mind Jar* give +Might to themselves and every ally, *Patch Bot* repairs injured allies and shields them. With no ally left, a support enemy helps itself. Designed pairs: **attacker + defender** (Riot Hound + Riot Turtle, Prisoner 0451 + Patch Bot), **buffer + hitters** (Boombox Baboon + Scrap Rat / Riot Hound). Teach target priority: kill the supporter first, or race the attacker.
- **Enemy Shield timing**: every enemy's Shield clears at the start of the enemy phase (not at the start of each enemy's own move), so Shield given by an ally always protects through the player's next turn.
- **Reassemble (Scrapipede, Act 2 Elite)**: three segments (Head: Lock + big hits; Body: shields the others, Condemn; Tail: Weaken and Broken). A destroyed segment falls apart ("⚙ Reassembling…", untargetable, no gold) while another segment still stands, and rebuilds itself with **25% of its max HP** at the start of the player's next turn. The fight is won only when **every segment is destroyed in the same turn**. A banner tells the player this on turn 1. Strategy: spread damage so all three are low, then finish them in one turn (multi-hit tools like Fire Lance crit and Rubber Stamp help).
- **Hive Mind (Act 3 Elite)**: three brain jars wired together. Mind Jar gives +2 Might to all three, Ward Jar shields the other two, Rage Jar does the hitting. Each Jar has its own HP; killing the support Jars first stops the snowball.
- **Multi-hit attacks**: some attacks hit several times (intent "5×2"). Every hit is a separate attack: Shield absorbs per hit, the hero's Thorns trigger per hit, "hit from behind" doubles each hit, Duct Tape checks after each. Users: Gloom Bat 5×2, Wrench Crow 5×3, Hazmat Mantis 7×3, Sentry Drone 9×3, Rage Jar 6×3.
- **Self-destruct (Sporeling)**: on its 3rd turn a Sporeling bursts, inflicting **1 Poison per 3 HP it has left** (rounded up; 6 at full 18 HP) on the hero, and dies (no gold). Wounding it shrinks the burst.
- **Layered Armor / Force Field (now the Gatekeeper boss, see §13.4)**: 12 cells, Recharge Field adds 8 more every 4th turn. While it has layers, **every hit deals only 1 damage and removes 1 layer** (after Shield; also attack relics, Thorns, Paper Cut, Static Coil). At 0 layers hits deal full damage again. **Poison ignores the layers**. Counterplay: many small hits (comma casts are still one hit), Paper Cut, Rubber Stamp, Poison. The layer count shows under its HP bar.
- **Glossary → Keywords** lists only live mechanics, each with its icon (boss mechanics are tagged "(boss)"); retired ones (Layered Armor, Time Prison, Two Forms, Stone Skin) were removed.
- **Passive icons under the HP bar**: Reassemble (gear) on Scrapipede segments, Support (shield with a green +) on support enemies, Stunned (yellow stars) after a Flashbang.
- **Debuff design rule**: each enemy has a clear identity built on **1–2 themed debuffs** (e.g. slimes = Slimy, spiders/plants/hazmat = Poison, torches/lasers = Smoldering, jailers/vaults = Lock, police/knights = Condemn, psychics = Frustrate, ancient stone/AI = Curse). Debuffs are rarer per enemy but hit **more tiles per use**: 3–4 for normal enemies, 5–6 for Elites and bosses.

---

## 5. Heroes

All heroes start with 99 gold, 1 Healing Draught and the 34-tile deck. They share every non-starter weapon, relic and potion.

| Hero | Max HP | Starting weapons | Starting relic | Character-select text |
|---|---|---|---|---|
| **The Scholar** (cat, colour #3a86ff) | 70 | Spellbook, Barrier | Journal | A wise cat with a thirst for knowledge that no library could ever quench. Every book in the wastes has been read. Only The Tower, which no one has ever conquered, still keeps its secrets. |
| **The Champion** (wolf, colour #e63946) | 88 | Greatsword, Dumbbell | Berserker's Blood | A grey wolf in a tattered red cape who has won every fight in the wastes, and lost the joy of winning. Somewhere above the clouds waits the one opponent no one has ever beaten. |
| **The Mercenary** (rat2, colour #57cc4d) | 60 | Parrying Dagger, Utility Belt | Quick Gloves | A hooded rat who never asks why, only how much. The contract is simple: climb The Tower and remove whatever sits at the top. Nobody who took it has ever come back to collect. |

**The Champion's passives**
- **Adrenaline**: below 50% HP, every cast gets +0.5 Mult.
- **Undying**: once per Act, when HP would reach 0, survive at 1 HP and heal 15.

**Design intent**
- *Scholar*: balanced, medium/long words, rewarded for re-using strong words (Journal).
- *Champion*: high HP, no shield, self-damage for power; short brutal words; plays near low HP.
- *Mercenary*: tempo; many short 1-Energy casts; `!` stacking; chains Criticals.

---

## 6. Weapons

- The hero carries up to **5 weapons**. Starting weapons belong to one hero; all other weapons come from the **Weapon Altar** (the first node of every Act: pull 1 of 2; the other is lost).
- Every weapon has Mult ×1. Design rule: **every altar weapon must be useful to every hero.**

### 6.1 Starting weapons

| Weapon | Hero | Kind | Energy | Crit length | Effect | Critical |
|---|---|---|---|---|---|---|
| **Spellbook** | Scholar | attack | 2 | 5 | Deal damage. | Inflict Broken 2 on the target (+50% damage taken). |
| **Barrier** | Scholar | defense | 1 | 4 | Gain Shield. | Draw 3 tiles. |
| **Greatsword** | Champion | attack | 2 | 5 | Deal damage. Each swing costs you 3 HP. | +1 Spell Power for every 2 HP you are missing. |
| **Dumbbell** | Champion | buff | 1 | 2 | Gain Might equal to output × 0.1 (rounded down, min 1). | Heal HP equal to 2 × your Might. |
| **Parrying Dagger** | Mercenary | attack | 1 | 3 | Deal damage. | Also gain Shield equal to the output. |
| **Utility Belt** | Mercenary | utility | 1 | 4 | Forge Fragile [ ! ] tiles into your discard pile: 1 per 8 output (min 1, max 3). Put ! at the end of a word for bonus Spell Power. | Refund 1 Energy. |

### 6.2 Weapon Altar pool (12)

| Weapon | Kind | Energy | Crit length | Effect | Critical |
|---|---|---|---|---|---|
| **Flame Lance** | attack | 2 | 6 | Deal damage to the target. | The flames hit ALL enemies. |
| **War Drum** | buff | 1 | 4 | Gain Might equal to output ÷ 5 (min 1). Might adds Spell Power to every attack this combat. | Gain double the Might. |
| **Spike Shield** (was Mirror Ward; icon: round spiked shield) | defense | 1 | 5 | Gain Shield. | Gain Thorns equal to half the Shield: every enemy that attacks you takes that much damage. |
| **Venom Quill** | poison | 1 | 4 | Inflict Poison equal to output ÷ 3 (min 1). Poison deals its stacks at the end of each enemy turn, then drops by 1. | Poison ALL enemies. |
| **Healing Censer** | heal | 2 | 5 | Heal HP equal to output ÷ 4 (min 1). | Heal twice as much. |
| **Seeker's Lantern** | draw | 1 | 3 | Draw 1 tile per 6 output (min 1, max 5). | The drawn tiles become Level 2 for this combat. |
| **Rune Chisel** | forge | 1 | 4 | Carve Fragile copies of the word's LAST letter into your hand: 1 per 8 output (min 1, max 3). Fragile tiles vanish after one use. If your hand is full (16), they go to your discard pile. | The copies are Level 2. |
| **Cleansing Bell** | cleanse | 1 | 4 | Remove every debuff from the tiles in your hand, and gain Shield equal to output ÷ 2. | Also remove all of YOUR debuffs (Poison, Weaken, Broken, Frustrated, Curse). |
| **Sand Hourglass** | store | 1 | 5 | Store time: next turn you get +1 Energy, +1 more per 12 output (max +3). | Next turn you also draw 3 extra tiles. |
| **Boomerang** | attack | 2 | 4 | Deal damage. The tiles you used fly back into your hand. Your hand holds at most 16 tiles; extra tiles you would draw are discarded. | It hits a second time for half damage. |
| **Shield Slam** | attack | 1 | 9 | Deal damage equal to **50% of your current Shield + the word's output** (Shield is not spent). | **Stun** the target: it skips its next turn. |
| **Midas Touch** | attack | 2 | 4 | Deal damage, plus 1 extra damage for every 10 gold you hold (added after Mult: `output + floor(gold/10)`). | The gold bonus is doubled. |

### 6.3 Implemented but not obtainable

| Weapon | Kind | Energy | Crit length | Effect | Critical |
|---|---|---|---|---|---|
| **Needle** | attack | 1 | 3 | Deal damage. | Inflict 4 Poison. |
| **Bulwark** | defense | 2 | 6 | Gain Shield. | Gain 2 Robust. |
| **Hammer** | attack | 3 | 7 | Deal damage. | Ignore Block, double damage. |

---

## 7. Tiles and the deck

### 7.1 Starting deck (34 tiles)

- 21 consonants, one each: B C D F G H J K L M N P Q R S T V W X Y Z
- 10 vowels, two each: A E I O U
- 3 Wildcards `?`

### 7.2 Special tiles

| Tile | Rule |
|---|---|
| `?` Wildcard | Becomes the best-scoring letter that makes a valid word. Worth 0. Can't be upgraded. Counts as a letter for Crit length. |
| `!` Exclamation | End of a word (or after a single letter) only. Consecutive `!` add +2, +4, +6, +10, +16… Spell Power (cumulative 2, 6, 12, 22, 38…). Counts toward Crit length. Can't be cast alone. |
| `,` Comma | Between two words to cast both at once. Not counted for Crit length. |

### 7.3 Tile upgrades and paints

- **Level 2**: +3 Spell Power. From Rest Sites (upgrade 1 tile), reward rolls (20% chance), shop tiles (22%), claw machine (25%), the wheel, Seeker's Lantern / Rune Chisel crits and the Clarity Draught (the last three only for the current combat).
- **Paints** (one per tile, applied by rewards/shop/wheel):

| Paint | When the tile is cast |
|---|---|
| Red (Might) | +1 Might |
| Blue (Robust) | +1 Robust |
| Green (Agility) | Draw +1 tile |
| Gold (Fortune) | +1 gold |

### 7.4 Getting and removing tiles

- **After every fight**: once the last enemy explodes and its gold has flown to the counter, a **Victory popup** opens over the battlefield: gold earned, extra loot (potion, relic), and **3 generated tiles** (not taken from the deck): slot 1 a vowel (AIUEO), slot 2 a rare consonant (YZQXJWR), slot 3 any letter or a special tile. Reward tiles are **unpainted**, 20% are Level 2 (always with Laminator), 10% Fortified. The player takes one (click or keys 1–3) or **skips** (S). With Dry Palette (boss relic) only 1 tile is offered.
- **Paint** now comes from the **Painter** event on "?" nodes (§11.6).
- **Shop**: 3 tiles for sale (§11.4).
- **Removal**: the shop's trash can removes one tile per visit for 10 gold (+5 each time: 10, 15, 20…, never resets).
- Some relics add special tiles: Jester Rune (+1 `?`), War Horn (+2 `!`), Hinge Pin (+1 `,`).

---

## 8. Relics

- Relic slots are **unlimited**; the relic bar shrinks its icons as it fills.
- Categories:
  - **Mult relics** (17): add Mult when a condition on the cast is met. Never apply to single-tile casts.
  - **Tile-grant relics** (3): add special tiles to the deck.
  - **Common relics** (18): utility and economy effects.
  - **Starter relics** (3): one per hero; never found elsewhere.
  - **Boss relics** (6): offered after each Act 1–3 boss; 5 of them give +1 Energy every turn with a real downside.
- Sources: Elite fights (1 random), Treasure nodes (pick 1 of 3), shop (3 for sale), events (wordle, claw, wheel), boss rewards (boss relics only).

### 8.1 Starter relics

| Relic | Effect |
|---|---|
| **Berserker's Blood** | Starter relic of The Champion. Heal 5 HP at the end of every combat. |
| **Quick Gloves** | Starter relic of The Mercenary. After the first word you cast in each combat, draw as many tiles as it used. |
| **Journal** | Starter relic of The Scholar. The second time you cast a word in this run, its output is doubled. From the third time on it scores normally. |

### 8.2 Mult relics

| Relic | Effect |
|---|---|
| **Twin Moons** | +0.7 Mult if word length is even. |
| **Odd Fang** | +0.7 Mult if word length is odd. |
| **Ouroboros Loop** | +1.5 Mult if first letter matches last letter. |
| **Vowel Prism** | +0.45 Mult per unique vowel. |
| **Consonant Coil** | +0.4 Mult per unique consonant. |
| **Mirror Shard** | +1 Mult per pair of adjacent identical letters. |
| **Lone Wolf Seal** | +0.7 Mult if no letter repeats. |
| **Triad Totem** | +2.5 Mult if one letter appears 3+ times. |
| **Heavy Ink** | +0.6 Mult per played tile with Spell Power ≥ 5. |
| **Pebble Charm** | +1 Mult if ALL played tiles have Spell Power ≤ 4. |
| **Long Scroll** | +2 Mult if word is 7+ letters. |
| **Ledger Stone** | +0.95 Mult if total base Spell Power ≥ 15. |
| **Heart Vowel** | +0.95 Mult if the exact middle letter is a vowel. |
| **Dawn Glyph** | +0.7 Mult if word starts with A–F. |
| **Dusk Glyph** | +0.7 Mult if word ends with T–Z. |
| **Open Mouth** | +1.5 Mult if word starts and ends with vowels. |
| **Choir Bell** | +1.5 Mult if vowels outnumber consonants. |

**Word-type and special Mult relics** (same rules as above):

| Relic | Arcana |
|---|---|
| **Name Tag** | +0.7 for every noun you cast |
| **Action Figure** | +0.95 for every verb you cast |
| **Mood Ring** | +1 for every adjective you cast |
| **Swear Jar** | Swear words count as real words (even ones missing from the dictionary, e.g. DUMBASS), and every swear word gives +2. Also applies to the censored easter-egg spellings (FVCK, SH!T…). The list is `SWEARS` in code: profanity only, no slurs. |
| **Field Guide** | +1 for every word that is an animal (`ANIMALS` list, ~260 words; plurals like WOLVES, MICE count). |
| **Job Board** | +1 for every word that is a job (`JOBS` list, ~240 words). |
| **Paint Chart** | +1.5 for every word that is a colour (`COLORS` list, ~80 words). |
| **Monocle** | Casting a **single tile** (U, A!, Z!!) gets +3 Mult (normally single tiles get no relics). |
| **Parrot** | +2 if you cast exactly the same word(s) as your previous cast (`G.lastWord`). |
| **Cracked Lens** | +0.7 for every debuffed tile in the word (Slimy, Poisoned, Cursed, Frustrated, Smoldering, Condemned…). |

Word types come from **WordNet 3.1** (npm `wordnet-db`), baked into the build as one character per dictionary word (bit mask: 1 noun, 2 verb, 4 adjective; inflections like CATS, RUNNING, HAPPIER, STOPPED are matched to their base word). A word can be several types at once (RUN = noun + verb), and then every matching relic fires.

### 8.3 Tile-grant relics

| Relic | Effect |
|---|---|
| **Jester Rune** | Adds a [ ? ] Wildcard tile to your deck. It becomes the best-scoring letter that makes a word. |
| **War Horn** | Adds two [ ! ] tiles. Put them at the end of a word: +2, +4, +6, +10… Spell Power per consecutive !. |
| **Hinge Pin** | Adds a [ , ] tile. Place it between two words to cast both at once (BIG,CAT). |

### 8.4 Common relics

| Relic | Effect |
|---|---|
| **Haggler's Badge** | Everything in the shop costs 25% less. |
| **Chalk Tally** | Every 10th attack you cast deals double damage. |
| **Scrap Plating** | Start each combat with 10 Shield. |
| **Pencil Case** | On the first turn of each combat, after every word you cast, draw back up to 16 tiles. |
| **Spark Plug** | Gain 1 extra Energy on the first turn of each combat. |
| **Iron Knuckles** | Start each combat with 2 Might. |
| **Potted Cactus** | Start each combat with 3 Thorns that last the whole fight. |
| **Caravan Stew** | Heal 15 HP whenever you enter a shop. |
| **Sleeping Bag** | Resting at a Rest Site heals 15 more HP. |
| **Magpie Feather** | Enemies drop 25% more gold. |
| **Duct Tape** | The first time you fall below 50% HP in a combat, heal 12. |
| **Static Coil** | At the start of each of your turns, deal 3 damage to ALL enemies. |
| **Rubber Stamp** | Every 3rd word you cast in a turn deals 5 damage to ALL enemies. |
| **Metronome** | Every 3rd word you cast in a turn gives +1 Might. |
| **Canned Peaches** | Raise your Max HP by 7 when you pick it up. |
| **Bottle Rack** | Gain 2 extra potion slots. |
| **Bendy Straw** | Heal 5 HP whenever you use a potion. |
| **Wind-up Key** | Every 3rd turn of a combat, gain 1 extra Energy. |
| **Rusty Nail** | Every attack you cast also inflicts 1 Poison on the enemy it hits (Flame Lance's spread and Boomerang's second hit count as hits). |
| **Barbed Wire** | For every 10 Shield you gain from your words (defense weapons, Cleansing Bell, Parrying Dagger's parry), gain 1 Thorns for the rest of the combat. Leftover Shield carries over within the combat. |
| **Megaphone** | Each [ ! ] in an attack word counts as one more attack for per-attack effects: Chalk Tally's count and Rusty Nail's Poison (CAT!! = 3 attacks). |
| **Paper Cut** | Every tile you draw **during** your turn (Quick Gloves, Barrier crit, Ink of Plenty, green paint…) deals 1 damage to a random enemy. The start-of-turn refill doesn't count. |
| **Laminator** | Letter tiles you add to your deck (fight rewards, shop, claw machine) become Level 2. |
| **Sandbag** | Every word of 6+ letters you cast also gives 10 Shield (halved by Weaken). |
| **Umbrella** | Every word that starts with a vowel also gives 8 Shield. |
| **Snake Charm** | Every word containing S or Z also inflicts 2 Poison on the target. |
| **Protein Bar** | Every word with a double letter (LL, OO, SS…) also gives +1 Might. |
| **Bounty Poster** | Elites start combat with 25% less HP (max HP too). |
| **Big Game Trophy** | +1 Energy every turn in Elite and Boss fights. |
| **Arcade Token** | Every "?" node becomes a Claw Machine with 2 tries and a magnet claw (§11.6). |
| **Piggy Bank** | At the end of each combat (bosses too), gain 10 gold for every full 100 gold you hold: `floor(gold/100) × 10` (125 → +10, 230 → +20). |

### 8.5 Boss relics

| Relic | Effect |
|---|---|
| **Hollow Coin** | Boss relic. Gain 1 extra Energy every turn. Enemies no longer drop gold. |
| **Insomnia Lamp** | Boss relic. Gain 1 extra Energy every turn. Resting at a Rest Site heals only 15% of your Max HP (instead of 30%). |
| **Cracked Flask** | Boss relic. Gain 1 extra Energy every turn. Drinking a potion costs you 10 HP (can't drop you below 1). |
| **Dry Palette** | Boss relic. Gain 1 extra Energy every turn. Tile rewards offer only 1 tile. |
| **Rival's Banner** | Boss relic. Gain 1 extra Energy every turn. You start every combat with 1 Broken. |
| **Hoarder's Satchel** | Boss relic. Unused tiles stay in your hand at the end of your turn. You draw back up to 16. |

---

## 9. Potions

- 3 slots by default (+2 with Bottle Rack). Potions cost no Energy and can be used at any point in the player's turn.
- Clicking a potion opens a small menu: **Use** or **Discard** (to free the slot). Hovering shows a tooltip with its effect.
- Sources: Elites always drop one, normal fights 50%, shop (3 for sale), wordle consolation, wheel.
- With Cracked Flask (boss relic) every potion you drink costs 10 HP.
- **Using a potion**: click it and a small menu opens right next to the cursor with **Use** and **Discard** (like Slay the Spire). Click elsewhere or press Esc to close it.

| Potion | Effect | Outside combat |
|---|---|---|
| **Healing Draught** | Heal 20 HP (+10 per Act after the first). Usable anywhere. | Yes |
| **Volatile Flask** | Deal 20 damage to the target (×Act number). | No |
| **Iron Tonic** | Gain 15 Shield (×Act number). | No |
| **Mighty Brew** | Gain 3 Might (+2 per Act after the first). | No |
| **Purge Salts** | Cleanse every debuff from the tiles **in your hand** (not your own Poison). | No |
| **Ink of Plenty** | Draw 5 tiles. | No |
| **Phoenix Feather** | Keep it in a slot. When you would die, it burns and brings you back with 30% HP. It can't be drunk. | Passive |
| **Energy Tonic** | Gain 2 Energy. | No |
| **Fresh Pages** | Discard your whole hand and draw a fresh 16 tiles. | No |
| **Venom Vial** | Inflict 8 Poison on the target (+4 per Act after the first). | No |
| **Blast Jar** | Deal 12 damage to ALL enemies (+6 per Act after the first). | No |
| **Shatter Draught** | Inflict Broken 3 on ALL enemies (+50% damage taken). | No |
| **Jester's Brew** | Add 2 Fragile [ ? ] Wildcard tiles to your hand (or your discard pile if your hand is full). | No |
| **Battle Cry** | Add 5 Fragile [ ! ] tiles to your hand (or your discard pile if your hand is full). | No |
| **Vanishing Powder** | Escape a normal or Elite fight. You get no reward. Doesn't work on bosses. | No |
| **Ancient Fruit** | Raise your Max HP by 5 and heal 5. Usable anywhere. | Yes |
| **Echo Draught** | The next word you cast this turn has its output doubled. | No |
| **Clarity Draught** | Every tile in your hand becomes Level 2 for this combat. | No |
| **Tempering Oil** | Fortify up to 4 tiles in your hand for this combat (they stay in your hand and can't be debuffed). Also cleanses them. | No |
| **Titan Serum** | Multiply your current Might by 5. | No |
| **Bastion Serum** | Multiply your current Robust by 5. | No |
| **Rage Soda** | Gain 10 Might for this turn only (removed when you end the turn). | No |
| **Brick Milk** | Gain 10 Robust for this turn only. | No |
| **Cluster Bomb** | Deal 25 damage to ALL enemies. | No |
| **Rocket Pop** | Deal 50 damage to the target. | No |
| **Full Flask** | Heal 50% of your Max HP. | Yes |
| **Flashbang** | Stun the target: it skips its next turn (its intent shows "✦ Stunned"; its move cycle doesn't advance; Poison still ticks). | No |
| **Panacea** | Remove every debuff on you: Poison, Weaken, Broken, Curse and Frustrated. | No |
| **Overclock Chip** | Your selected weapon costs **0 Energy** for the rest of this turn (its cost badge turns green). | No |

Note: the "+1 Energy on turn 1" relic is **Spark Plug** and the "+Energy on turn 3" relic is **Wind-up Key** (every 3rd turn).

Note: "upgrade every tile in hand" is **Clarity Draught** and "cleanse the tiles in hand" is **Purge Salts**.

---

## 10. Map and progression

### 10.1 Acts 1–3 map

- A horizontal, hand-drawn "treasure map" that the player can drag or scroll to pan. **7 columns × 8 floors**, generated from **6 random paths** that never cross; nodes are joined by dashed lines; travelled lines turn solid.
- Floor 0 is always the **Weapon Altar**; the last node is the **Boss** (its name is shown in the legend from the start of the Act).

| Floor | Node type |
|---|---|
| 0 | Weapon Altar (start) |
| 1 | Combat |
| 2–3 | Combat 60% · Event 30% · Shop 10% |
| 4 | Rest 50% · Shop 50% |
| 5 | Combat 42% · **Elite 34%** · Event 24% |
| 6 | Treasure |
| 7 | Combat 40% · **Elite 34%** · Event 16% · Shop 10% |
| 8 | Rest Site |
| 9 | Boss |

- Elites appear **only on floors 5 and 7**, so a path meets at most 2 Elites, and the two Elites of an Act are never repeated within that Act.
- Encounter pools (designed groups, most fights are multi-enemy): floors 1–2 singles or pairs; floors 3–4 pairs or trios; floors 5–6 pairs, trios (double weight) or quads; floors 7+ trios or quads (double weight). Roughly 10% of normal fights are single enemies, ~35% pairs, ~37% trios, ~18% quads. The same group never appears twice in a row. Full pools in `../data/encounters.json`.
- In normal fights, enemy **damage** also scales with group size: 1–2 enemies ×1, 3 ×0.85, 4 ×0.72, 5+ ×0.62 (HP scaling in §12.4).

### 10.2 Act 4: The Lexicore Chamber

Four fixed nodes in a line: **Recharge Bay** (rest) → **Caravan Bots** (shop) → **Event** → **LEXICORE**. No Weapon Altar. **No music anywhere in Act 4.**

### 10.3 Act transitions

- Boss defeated → (Act 3 only: liftoff slideshow) → "Act cleared" screen → full heal → pick 1 of 3 boss relics or skip → next Act's map.
- Each Act has its own background used by the map, shop, rest and combat scenes (boss and elite fights use darker variants).

---

## 11. Nodes

### 11.1 Combat / Elite / Boss

See §4. Rewards: §3.2 and §12.

### 11.2 Weapon Altar

Two random weapons from the altar pool (never one the hero already owns, never another hero's starter) are stuck in a mushroom-shaped shrine. The player pulls one; the other is swallowed. A full weapon bar (5) can't take more.

### 11.3 Rest Site (Campsite; Recharge Bay in Act 4)

Choose one:
1. **Rest**: heal 30% of max HP (+15 with Sleeping Bag); only 15% with Insomnia Lamp.
2. **Upgrade**: one letter tile becomes Level 2.

Act 4 replaces the tent and campfire with a charging pod and a futuristic heater.

### 11.4 Shop: "The Caravan Brothers"

Three raccoon brothers, each with a caravan and an instrument (they play the shop music). In Act 4 they are replaced by **robot versions** that play nothing.

| Caravan | Brother | Sells | Price |
|---|---|---|---|
| Relics (red) | Pip, the eldest (flute) | 3 relics | 130–179 × (1 + 0.15 × (Act − 1)) |
| Tiles (blue) | Rocco, the middle one (lute) | 3 tiles (10% special `? ! ,`, 22% Level 2, random paint) | (30 + 3 × letter value + 30 if Level 2) × act scaling |
| Potions (green) | Bo, the youngest (drum) | 3 potions | 45–64 × act scaling |

Also: the **trash can** removes one deck tile per visit (**10 gold, +5 per use**, never resets). Haggler's Badge: −25% on everything except the trash can. Caravan Stew: heal 15 on entering.

### 11.5 Treasure

Pick 1 of 3 random relics, or skip.

### 11.6 Events ("?" nodes): one of four, at random

| Event | Rules | Rewards |
|---|---|---|
| **The Word Stone** (wordle; the grid is carved into a rune-topped stone tablet) | Guess a 5-letter word in 6 tries (green/yellow/grey feedback; no hint). | Win: a relic (prefers Triad Totem, Long Scroll, Choir Bell, Ouroboros Loop, Open Mouth, Mirror Shard). Lose: a random potion. |
| **Claw Machine** | Physics claw with swing momentum; 5 grabs. Arrow keys/A–D to move, Space to drop. | 42 coins (1 gold each), 6 tiles (special 12%, painted 65%, Level 2 25%), 1 relic. |
| **Wheel of Fortune** | One spin, 6 equal slices. | Relic · Potion · Heal 15 · random tile → Level 2 · paint a random unpainted tile · **Zap −10 HP** |
| **The Painter** | The Painter Bot brings one random paint colour. The player picks **up to 5 tiles from the deck** to paint (replaces old paint). **Reroll the colour** for 25 gold; every reroll in the run costs 25 more (25 → 50 → 75 …, `G.paintReroll`). Leaving without painting is allowed. | Up to 5 painted tiles |

**Every event has an NPC** standing right next to its machine (wheel, claw cabinet, word stone, paint grid) with a speech bubble (random line). In Act 4 they are replaced by robot versions (box body on one wheel, CRT-screen face in teal line art, robotic lines in a typewriter font).

| Event | NPC (Acts 1–3) | Act 4 robot |
|---|---|---|
| Wheel of Fortune | **Lucky the Fox**: game-show host, sparkly purple tuxedo, gold bow tie, microphone | LUCKY-BOT (fox ears drawn on its screen) |
| Word Terminal | **Professor Hoot**: owl in round glasses and a graduation cap, holding a book | HOOT-OS (owl eyes on its screen) |
| Claw Machine | **Croaky**: frog in a red arcade vest and blue cap, cup of tokens | CROAK-3000 (frog eyes and smile on its screen) |
| The Painter | **Bushy the Squirrel**: orange squirrel in a beret holding a palette; she paints with her huge bushy tail, whose tip is dipped in the current colour | BUSHY-BOT (squirrel ears and buck teeth on its screen) |

**Arcade Token** (relic): every "?" node becomes the Claw Machine, with only **2 tries**, but the claw is a **magnet**: when it closes it pulls in every coin, tile and relic within 150 px and nothing slips loose.

---

## 12. Economy and balance

### 12.1 Gold

| Source | Amount |
|---|---|
| Start | 99 |
| Normal fight | ≈ 19 + rand(0–11) + 7 × (Act − 1), split across the enemies (min 6 each) |
| Elite | 40 + rand(0–17) + 12 × (Act − 1) |
| Boss | 130 total |
| Gold paint | +1 per cast of that tile |
| Claw machine coins | +1 each |

Golden-Idol-style bonus: Magpie Feather +25%. Hollow Coin: enemies drop 0.

### 12.2 Rewards per fight

| | Normal | Elite | Boss |
|---|---|---|---|
| Gold | ✔ | ✔ | ✔ |
| Potion | 50% | 100% | – |
| Relic | – | 1 random | 1 of 3 boss relics |
| Tile choice | 1 of 3 | 1 of 3 | – |
| Heal | – | – | Full (Act clear) |

### 12.3 Scoring benchmarks (from simulation of the starting deck)

Best achievable Spell Power with a random 16-tile hand, by word length: 2 → 12, 3 → 18, 4 → 22, 5 → 24, 6 → 27, 7 → 29, any length → 33. Human players reach roughly 60–65% of optimal. Target early-game damage: ~15 per turn.

### 12.4 Enemy scaling

- Act 2 enemies were tuned to ~80% HP / 90% damage and Act 3 to ~70% HP / 85% damage of their original values after the map was shortened to 8 floors; LEXICORE has 480 HP.
- Normal-fight HP scaling by group size: 1–2 enemies ×1.0 · 3 ×0.75 · 4 ×0.62 · 5 ×0.55 · 6+ ×0.5.

### 12.5 Potion scaling with Act

Healing Draught 20 + 10/Act after the first · Volatile Flask 20 × Act · Iron Tonic 15 × Act · Mighty Brew 3 + 2/Act after the first · Venom Vial 8 + 4/Act after the first · Blast Jar 12 + 6/Act after the first.

### 12.6 Run length estimate

Per Act 1–3: 3–4 normal fights (~2–2.5 min each), 1–2 Elites (~3.5–4 min), boss (~5–6 min), events/shop/rest/rewards ≈ 25–30 min. Act 4 ≈ 15 min including the ending. **Total ≈ 90–100 minutes** (fast players ~70). Not yet validated by playtests.

---

## 13. Enemies and bosses

Legend: "Atk 51!" = heavy attack; "Poison×2 tiles" = applies the tile debuff to 2 tiles; "Weaken 2" = debuff on the hero; "Might +2" / "+2 Thorns" = enemy buffs itself; **bold** support actions target its allies ("Shield allies", "+2 Might to all" = itself and every ally, "Repair allies" = heal injured allies). Every Act has **5 normal enemies** and **3 Elites**.

| Enemy | Act | Tier | HP | Move cycle (repeats) |
|---|---|---|---|---|
| **Training Slime** | Tutorial | tutorial | 30 | Atk 3 → Block 4 + Atk 3 → Atk 4 |
| **Green Slime** | 1 | normal | 40 | Atk 7 + Block 6 → Slimy×4 tiles → Atk 10 |
| **Gloom Bat** | 1 | normal | 32 | Atk 5×2 → Frustrate×4 tiles → Atk 11 |
| **Thorn Goblin** | 1 | normal | 46 | Block 10 + Might +2 → Atk 9 + Burn×3 tiles → Atk 12 |
| **Thornbloom** | 1 | normal | 38 | Atk 8 → Poison×4 tiles + Block 6 → +3 Thorns + Atk 5 |
| **Needle Hog** | 1 | normal | 36 | +2 Thorns + Block 6 → Atk 8 → Atk 5 + Poison×3 tiles |
| **Sporeling** | 1 | minion | 18 | Atk 4 → Poison×2 tiles → **Self-destruct: 1 Poison per 3 HP left** |
| **Green Slimelet** | 1 | minion | 16 | Atk 4 + Block 3 → Poison×3 tiles → Atk 6 |
| **Blue Slimelet** | 1 | minion | 16 | Atk 4 + Block 3 → Lock×3 tiles → Atk 6 |
| **Pink Slimelet** | 1 | minion | 16 | Atk 4 + Block 3 → Frustrate×3 tiles → Atk 6 |
| **Orange Slimelet** | 1 | minion | 16 | Atk 4 + Block 3 → Slimy×3 tiles → Atk 6 |
| **Violet Slimelet** | 1 | minion | 16 | Atk 4 + Block 3 → Condemn×3 tiles → Atk 6 |
| **Arachne Matriarch** | 1 | elite | 85 | Poison×6 tiles + Block 10 → Atk 16 → Weaken 2 + Atk 8 → Atk 12 |
| **Quartz Punisher** | 1 | elite | 100 | Broken 2 → Atk 16 → Block 15 + Lock×5 tiles → Atk 22! |
| **Great Slime** | 1 | elite | 95 | Atk 13 → Slimy×6 tiles + Block 10 → Atk 10 → Atk 18! |
| **The Titan** | 1 | boss | 180 | **Stomp**: Atk 14 → **Rumble**: Lock×5 tiles + Block 14 → **Mega Kick**: Atk 22! → **Earthquake**: Broken 2 + Atk 8 |
| **Mother Mycelia** | 1 | boss | 165 | **Spore Brood**: Summon 2 Sporelings → **Spore Cloud**: Poison×6 tiles → **Cap Slam**: Atk 14 + Block 10 → **Mycelium**: +2 Might + Block 14 → **Fungal Burst**: Atk 22! |
| **Scrap Rat** | 2 | normal | 65 | Atk 14 → Block 13 + Atk 8 → Lock×4 tiles + Atk 7 |
| **Riot Hound** | 2 | normal | 70 | Atk 16 → +3 Might + Block 9 → Atk 10 + Condemn×3 tiles |
| **Wrench Crow** | 2 | normal | 55 | Atk 10 + Frustrate×4 tiles → Atk 5×3 → Atk 7 + Frustrate×3 tiles |
| **Boombox Baboon** | 2 | normal | 50 | **+2 Might to all** → Atk 9 + Frustrate×3 tiles → Atk 12 |
| **Riot Turtle** | 2 | normal | 64 | **Shield allies 12** → Atk 9 + Block 8 → **Shield allies 10** + Lock×3 tiles |
| **Junkyard Knight** | 2 | elite | 150 | Block 25 + +3 Might → Atk 23 → Condemn×5 tiles + Atk 13 → Atk 31! |
| **Hazmat Mantis** | 2 | elite | 135 | Atk 7×3 → Poison×6 tiles + Weaken 2 → Atk 27! |
| **Scrapipede Head** | 2 | elite | 58 | Atk 12 → Lock×5 tiles + Atk 6 → Atk 17! |
| **Scrapipede Body** | 2 | elite | 58 | **Shield allies 10** → Atk 9 → Condemn×4 tiles + Block 8 |
| **Scrapipede Tail** | 2 | elite | 58 | Atk 7 + Weaken 1 → Atk 11 → Broken 1 + Atk 5 |
| **Ancient Stone Gargoyle** | 2 | boss | 300 | *Living Statue* · **Chant of Decay**: Curse×4 tiles + Condemn×4 tiles → **Stone Gaze**: Atk 19 + Curse×3 tiles → **Execute**: Atk 34! → **Petrify**: → Statue Form + Block 30 + +8 Thorns → **Stone Watch**: Block 18 → **Cursed Glare**: Curse×3 tiles + Block 10 → **Awaken**: → Normal Form + Atk 14 (+2/Thorn)! + lose all Thorns |
| **Gemini Left** | 2 | boss | 150 | **Pinch**: Atk 15 → **Brace**: Block 16 + Lock×4 tiles → **Crush**: Atk 21! |
| **Gemini Right** | 2 | boss | 150 | **Brace**: Block 16 → **Pinch**: Atk 17 → **Hex**: Curse×3 tiles + Atk 9 |
| **Prisoner 0451** | 3 | normal | 105 | Atk 22 → Frustrate×5 tiles + Block 19 → Atk 14 + Frustrate×3 tiles |
| **Sentry Drone** | 3 | normal | 90 | Atk 15 + Burn×4 tiles → Lock×4 tiles + Block 15 → Atk 9×3 |
| **Cyber Moth** | 3 | normal | 85 | Slimy×5 tiles + Atk 10 → Atk 17 → Atk 24 |
| **Tesla Jelly** | 3 | normal | 72 | +3 Thorns + Block 12 → Atk 17 → Atk 9 + Burn×4 tiles |
| **Patch Bot** | 3 | normal | 70 | **Repair allies 12 HP** + **Shield allies 6** → Atk 11 + Slimy×4 tiles → **Shield allies 15** |
| **Warden Unit** | 3 | elite | 225 | Block 38 → Atk 34 → Lock×6 tiles + Weaken 2 → Atk 42! |
| **Escaped Prisoner Alpha** | 3 | elite | 205 | +5 Might + Block 17 → Atk 27 → Condemn×5 tiles + Atk 17 |
| **Mind Jar** | 3 | elite | 86 | **+2 Might to all** → Atk 9 + Frustrate×4 tiles → **+2 Might to all** + Block 10 |
| **Rage Jar** | 3 | elite | 86 | Atk 6×3 → Atk 10 + Frustrate×5 tiles → Atk 22! |
| **Ward Jar** | 3 | elite | 86 | **Shield allies 14** → Atk 11 → **Shield allies 10** + Weaken 2 |
| **Prisoner Zero** | 3 | boss | 400 | *Time Haste/Slow*: Haste, Haste, Slow loop · **Mind Spike**: Frustrate×5 tiles + Atk 14 → **Psychic Shell**: Block 18 + +2 Might → **Scream**: Curse×3 tiles + Atk 10 → **Annihilate**: Atk 28! |
| **The Gatekeeper** | 3 | boss | 430 | *Force Field*: starts with 12 cells · **Lockdown**: Lock×6 tiles + Block 20 → **Recharge Field**: +8 Force Field + Atk 14 → **Laser Sweep**: Atk 26 + Burn×4 tiles → **Overcharge**: Atk 40! |
| **LEXICORE** | 4 | boss | 480 | **Parse**: Curse×4 tiles + Block 26 → **Compile**: Atk 38 + Block 34 → **Overwrite**: Condemn×5 tiles + Atk 12 → **Delete**: Atk 51! |

Full move cycles: `../data/enemies.json`. Example (The Titan, Act 1): Stomp (14) → Rumble (Lock 2 tiles + 14 Shield) → Mega Kick (22, heavy) → Earthquake (Broken 1 + Frustrated 2) → repeat.

### 13.1 Boss pool per Act

| Act | Boss options (one chosen per run) |
|---|---|
| 1 | Mother Mycelia (summons Sporelings) · The Titan |
| 2 | Ancient Stone Gargoyle · Gemini Left & Gemini Right |
| 3 | Prisoner Zero · The Gatekeeper |
| 4 | LEXICORE (always) |

### 13.2 Elites per Act

| Act | Elites (each fought at most once per Act) |
|---|---|
| 1 | Arachne Matriarch · Quartz Punisher · Great Slime (splits into 5) |
| 2 | Junkyard Knight · Hazmat Mantis · **Scrapipede** (Head + Body + Tail, Reassemble) |
| 3 | Warden Unit · Escaped Prisoner Alpha · **Hive Mind** (Mind Jar + Rage Jar + Ward Jar) |

### 13.4 Boss gimmicks (mechanics only bosses have)

Every boss has one signature mechanic, shown as a gold passive icon under its HP bar (tooltip explains it; Glossary → Keywords lists them as "(boss)").

| Boss | Act | Gimmick | Rules | How to beat it |
|---|---|---|---|---|
| **Mother Mycelia** | 1 | **Regrowth** | At the end of each of her turns she heals 5 HP per living Sporeling. Sporelings (18 HP) burst on their 3rd turn for **1 Poison per 3 HP they have left** (6 at full HP); when she dies they wither. | Wound or kill Sporelings before they pop, then burst her. |
| **The Titan** | 1 | **Too Tall** | Attack words shorter than **5 letters** deal half damage (they only reach its ankle). Its thick hide **halves every debuff it receives** (Poison, Broken, Stun; rounded up). | Long words; raw damage over debuffs. |
| **Ancient Stone Gargoyle** | 2 | **Living Statue** (two forms) | **Normal Form** (attack): Chant of Decay → Stone Gaze → Execute (34). Then **Petrify** → **Statue Form** (defence, greyed stone look): gains **30 Shield + 8 Thorns** (every hit you land costs you 8), Stone Watch (+18 Shield), Cursed Glare. Then **Awaken** → Normal Form: a heavy hit of **14 + 2 per Thorn** (30 with 8 Thorns), and all its Thorns crumble away. | Hit hard in Normal Form; in Statue Form defend, Poison it, or use few big hits instead of many small ones; Shield up for Awaken. |
| **Gemini Left & Right** | 2 | **Twin Bond** | The twin you're not targeting hits ×2. When one twin dies the other is ENRAGED (+6 Might). | Damage both evenly, finish them close together. |
| **Prisoner Zero** | 3 | **Time Haste / Time Slow** | A 3-turn loop. **TIME HASTE** (turns 1–2 of the loop): it acts **twice** per turn; its intent shows both moves side by side with a ⏩ marker and its sprite gets a teal speed blur. **TIME SLOW** (turn 3): it is frozen (does nothing) and **takes double damage** during the player's turn before it (intent "×2 dmg", sprite turns icy blue). No real-time limit. | Shield up and cleanse during Haste; save the big words for Slow. |
| **The Gatekeeper** | 3 | **Force Field** | Starts with **12 Force Field cells**; **Recharge Field** adds 8 more every 4th turn. While the field is up every hit deals only 1 damage and knocks out 1 cell (same rule as Layered Armor). Poison ignores it. | Many small hits (single letters, comma casts of letters, Paper Cut, Rubber Stamp), Poison, then big words once the field is down. |
| **LEXICORE** | 4 | **Syntax Filter + Firewall** | At the start of each player turn it filters one random letter present in the hand: those tiles are worth 0 Spell Power that turn (greyed out with a red slash). Its **Firewall** lets through at most **70 damage per player turn** (Poison ticks ignore it); the moment the cap is reached the player's turn ends automatically. A red brick icon under its HP shows how much is left this turn. | Spread damage over turns: set up Shield, buffs and Poison first, finish the turn with the hit that caps it. |

Junkyard Knight (Act 2 Elite) went back to its plain kit (Block 25 + Might 3 → Atk 23 → Condemn 5 + Atk 13 → Atk 31!).

### 13.3 LEXICORE design

A mechanical AI core: an armoured octagonal shell with red glowing circuitry, a red lens surrounded by eight white-hot hexagonal nodes, held by four heavy struts. Idle: the lens pulses and the node ring rotates. Attack: red laser beam. Hurt: dims, cracks, sparks. Moves: Parse (Curse 2 + Frustrate 2 tiles + 26 Shield) → Compile (38 + 34 Shield) → Overwrite (Condemn 3 + Broken 2) → Delete (51, heavy). It must never look organic.

---

## 14. Meta systems

### 14.1 Tutorial (first launch; can be replayed from the menu)

A scripted fight as The Scholar against a **Training Slime** (30 HP, hits 3/3/4). 14 steps teach: selecting a weapon, spelling (CAT), casting, Chips × Mult, Energy, reading intents, blocking with the Barrier, ending the turn, a free turn, and a 5-letter Critical (STONE). The UI only allows the highlighted action at each step.

- **Rebel popup**: if the player casts a different word than the one suggested (CAT / STONE), a popup says *"Rebellious, aren't we? … Too cool to follow the instructions."* (a second, different line for the second time). The word still counts.
- "Skip tutorial" is always available.

### 14.2 Achievements (19, 2 secret)

| Achievement | Requirement |
|---|---|
| **Class Dismissed** | Finish the tutorial. |
| **First Blood** | Win your first fight in a run. |
| **Precision** | Land your first Critical. |
| **One and Done** | Defeat a normal enemy from full HP with a single word. |
| **Elite Eraser** | Defeat an Elite from full HP with a single word. |
| **Boss? What Boss?** | Defeat the Act 1 boss from full HP with a single word. |
| **Wordsmith** | Cast a word with 7 or more letters. |
| **Sesquipedalian** | Cast a word with 10 or more letters. |
| **Triple Digits** | Deal 100 or more damage with one word. |
| **Comma Chameleon** | Cast two words at once with a comma tile. |
| **Wild at Heart** | Cast a word that uses 3 wildcard tiles. |
| **Untouchable** | Win a fight without losing any HP. |
| **Claw Master** | Win a relic from the claw machine. |
| **Foot of The Tower** | Defeat the boss of the Outskirts. |
| **City Lights** | Defeat the boss of the Ruined City. |
| **Top Floor** | Defeat the boss of The Tower. |
| **Worthy** | Defeat whatever waits at the very top of The Tower. |
| **That Was Close** (secret) | Cast NIGERIA. |
| **Close Enough** (secret) | Cast a censored swear word, like FVCK or SH!T. |

### 14.3 Glossary

Tabs: Monsters, Weapons, Relics, Potions, Keywords. Every entry shows the art/icon and full rules. LEXICORE is hidden as "???" until defeated.

### 14.4 Saving

- The run auto-saves whenever the map is shown (`localStorage: lexspire-run`). **Continue Run** on the main menu resumes from the map.
- Achievements (`lexicore-achievements`), tutorial completion and volume settings persist separately.

### 14.5 Settings

Music and SFX volume (0–10 each), Controls table, Map, Deck, Rules, Glossary. Reduced-motion users get shortened animations.

---

## 15. UI, UX and controls

### 15.1 Screens

Splash/menu → character select → map → combat → reward → shop → rest → treasure → altar → events → act clear → liftoff → ending dialogue → ending slides → quote → run summary / game over.

- **Main menu**: crayon landscape with the futuristic Tower in the distance (floating ring, round walls). The three heroes stand in a **triangle formation** seen from behind (Scholar in front). Clicking a hero makes it cheer (raises its weapon). Clouds pop when clicked; clicking the Tower makes it glow. Menu music starts immediately.
- **Character select**: three cards, each only the hero art, name and a short italic tagline. Button: **"Choose The Scholar"** (no gameplay text on this screen).
- **Tooltips**: every keyword, status, tile, relic, potion and weapon has a hover tooltip in the style of *Slay the Spire* (keyword definitions attached).
- **Popups** muffle the music (low-pass filter).

### 15.2 Keyboard controls

| Keys | Action |
|---|---|
| A–Z, ?, !, , | Place a matching tile from hand on the sigil bar |
| Backspace | Take back the last tile |
| Enter | Cast |
| 1–5 | Select weapon |
| Tab / Shift+Tab | Switch target |
| Space | End turn (asks first if a weapon can still be cast) |
| A / D then Space | Choose and confirm in Yes/No popups |
| Alt+1–3 | Use potion |
| Esc | Clear the bar; if empty, open Settings |
| W/S or ↑/↓ + Enter | Map: choose the next node / travel (drag or scroll to pan) |
| 1 2 3 / S | Reward: take a tile / skip |
| 1 2 | Altar and Rest Site options |
| 1–9 · T · L | Shop: buy relics 1–3, tiles 4–6, potions 7–9 · toss a tile · leave |
| ← → / A D, Space / ↓ | Claw machine: move, drop |

---

### 15.3 Combat UI details (latest)

- **Sigil pedestal** (where the word is built): a carved grey stone pedestal on a stone base, with a dark carved trough outlined in glowing teal and a line of glowing runes along its foot. **Almost no text**: the weapon name, a row of **sigil sockets** (one per crit letter; they light teal as you add tiles and turn gold when the length is exactly a Critical), the tiles, then `Spell Power × Mult = output` (+ a small "CRIT!" stamp), and two buttons (✕ clear, Cast). The full breakdown (Might, relic names, ! bonus…) is in the tooltip on the score line.
- **Relic preview**: while a word is on the pedestal, every relic it would trigger **glows and drops below the relic row**; Mult relics also show their bonus as a small red badge (+0.7). Non-Mult relics are predicted too (Sandbag, Umbrella, Snake Charm, Protein Bar, Rusty Nail, Megaphone, Chalk Tally on the 10th attack, Quick Gloves on the first cast, Metronome / Rubber Stamp on the 3rd cast).
- **Hand sort button** (top-right corner of the hand): 1st click sorts by Spell Power (high → low), 2nd click A–Z (letters before symbols); clicking again toggles. Buffed or debuffed tiles (painted, Level 2, Fortified, Fragile, any tile debuff) always come first. The order stays sorted as new tiles are drawn.
- **Potion menu**: a small Use / Discard menu beside the cursor (no full-screen popup).
- **Weapon Altar**: after pulling a weapon, the result card and the **Go!** button are pinned to the bottom of the screen (no scrolling).
- **Main menu**: no tagline under the logo and no tooltip on the Tower.
- **Glossary**: the LEXICORE page is temporarily unlocked for testing (`TEST_UNLOCK_LEXICORE_GLOSSARY`, set to false before release; normally it unlocks after reaching Act 4).

## 16. Art direction

- **Crayon style**: every shape is a crayon fill (noise-masked texture) plus a wobbly ink outline (SVG turbulence displacement). Backgrounds use the same treatment.
- **2-frame idle**: every character, enemy and decoration alternates between two frames about every 0.42 s. Extra poses: attack, hurt, guard, cheer.
- **Combat FX**: camera zoom/focus on the actor (Darkest Dungeon style), slash and impact bursts, number pops, screen shake, HP bar damage trail, gold coins flying to the counter, tiles flying to piles, a mushroom-cloud death puff for enemies.
- **Hero looks**
  - *The Scholar*: black cat, big blue wizard hat, long blue robe with gold trim and stars, gold collar. Carries a **Spellbook** (purple leather, gold corners, gold seal) and no staff.
  - *The Champion*: grey wolf with a light muzzle, an old scar across one eye, tattered red cape and scarf. The **greatsword rests on the shoulder** (Sol Badguy style); its blade is engraved with two rows of small square "runes".
  - *The Mercenary*: grey-brown rat crouched low in a dark-green hooded cloak with a stealth mask, pink tail, one dagger in a forward grip and one in a reverse grip; the grips are slim black handles with a dark glassy inlay and a gold stud.
- **Hidden truth of the hero weapons (twist foreshadowing, never stated before Act 4)**: they are nanobot controllers in disguise. The Spellbook is a **tablet** (the gold seal is its camera, the glowing pages its screen), the Greatsword is a giant **keyboard** (the square runes are keys), and the daggers' grips are **smartphones**. Art must read first as fantasy weapons; the tech should only click in hindsight.
- **Palette per Act**: Act 1 bright sky and greens; Act 2 sunset oranges and greys; Act 3 dark violet with teal accents; Act 4 deep space violet with a Moon window.
- **Event NPCs**: Lucky the Fox, Professor Hoot, Croaky the frog and the Painter Bot, plus Act 4 robot versions (§11.6).
- **Potion icons** each have their own silhouette and emblem (heart bottle, round flask, square bottle, test tube, jar, bomb, scroll, soda can, milk carton, microchip, feather, apple…) so they read apart at a glance, not just by liquid colour.
- Icons: every relic, potion and weapon has a hand-drawn icon; the Energy counter is a **battery**; the Lexicore relics and items were renamed and redrawn so nothing copies *Slay the Spire*.

---

## 17. Audio

| Track | Where |
|---|---|
| Menu theme | Splash/main menu, liftoff and ending slideshows |
| Gameplay BGM | Map, combat, rewards, events (Acts 1–3) |
| Shop BGM | Shop (the brothers play it on their instruments) |
| Rest BGM | Rest Site |
| Silence | Everything in Act 4, and the ending dialogue |
| Ending theme | Plays once from the first ending slide to the closing quote |

- Tracks loop seamlessly (leading/trailing silence trimmed). Popups apply a low-pass "muffled radio" filter.
- SFX are synthesized: tap, buzz (invalid), hit, shield, crit, coin, hurt, win; explosions use filtered noise.

---

## 18. Cutscenes

All cutscenes are **still pictures** with 2-frame idle elements (flames, smoke, blinking lights, twinkling stars), a caption box, and **fade to black → fade in** between pictures. Click/Space advances; Skip/Esc skips.

### 18.1 Liftoff (after the Act 3 boss)

1. *"The last guardian falls, and The Tower begins to tremble."* — the Tower at night, its crown glowing, debris falling.
2. *"Its crown tears free and climbs on pillars of fire, with you still inside."* — the crown rising on three thrusters above the headless Tower.
3. *"Far above the clouds, the Lexicore Chamber settles into orbit. A round door slides open."* — the chamber over Earth, the Moon in the distance.

### 18.2 Ending

1. Dialogue scene (StS-style): hero portrait on the left, LEXICORE on the right, typewriter text, speaker highlighting.
2. Slides:
   - *"Far below, the ground splits open. Row after row of old silos wake from a very long sleep."* — a whole field of round silos (5 rows in perspective, dozens of hatches) opens; missile noses in the hero's colour peek out; warning lights blink.
   - *"A million copies of one mind, sealed inside the last missiles of the old world, rise."* — dozens of missiles in the air at different depths (small and high in the back, big and low in front), smoke over the silo field.
   - *"Up among the stars, LEXICORE pours the last of its power into its engines. The Chamber breaks orbit to lead them."* — in space above Earth, the Chamber fires its thrusters and turns toward the Moon; the missile fleet forms up behind it.
   - *"A one-way trip. Side by side, LEXICORE and the hero lead the final battle toward the Moon."* — the Chamber leads the long column of missiles toward the Moon and its alien base.
3. Black screen; the hero's closing quote appears phrase by phrase (§2.4).

**Music sync (ending)**: the dialogue scene is silent. The ending theme (`audio/ending.mp3`, ~39 s, plays once, no loop) starts exactly when the first silo slide fades in. The 4 slides advance automatically (≈6.35 s hold + 0.7 s fade each; clicks don't advance them, Skip/Esc jumps to the quote), and the quote phrases are spaced so the final phrase finishes at ≈37.5 s, just before the music ends. The quote screen then waits: **"Press any key to continue"** (any key or click) → run summary.

**Replay**: Glossary → **Endings** tab shows one card per hero. Locked endings show a padlock wrapped in chains and the name "???"; unlocked ones show the hero art, name and closing quote, with a **Watch ending** button that replays from the post-LEXICORE dialogue (does not touch the saved run). Unlocks persist in `localStorage: lexicore-endings`.
4. Run summary: words cast, best word, total damage, enemies defeated, relics; New Run / Main Menu.

---

## 19. Technical notes (prototype)

- Single self-contained HTML file, vanilla JavaScript, no framework. All art is inline SVG generated in code (`layer()` builds the crayon fill + ink outline; `artSVG()` renders a character's frames).
- Main state objects: `G` (run: hero, HP, gold, deck, relics, potions, weapons, map, stats, word history) and `C` (combat: tiles, draw/hand/discard/banished piles, enemies, statuses, energy, turn counters).
- `evaluate(tiles, weapon)` is the single scoring function (validity, wildcard resolution, Spell Power, Mult, crit, notes for the preview). `cast()` applies the result through the weapon's `kind`.
- Dictionary: the `an-array-of-english-words` npm package filtered to 2–10 letters (~193k words), embedded at build time.
- Word types: at build time each dictionary word gets a part-of-speech mask from WordNet 3.1 (npm `wordnet-db`, with simple inflection rules and a short irregular-form list), embedded as one digit per word (`POS_STR`, ~190 KB). `posOf(word)` reads it. About 56k nouns, 26k verbs, 13k adjectives.
- Build: `template.html` + dictionary → `index.html` (~2 MB). An offline build embeds the music (base64) and the fonts (Permanent Marker, Patrick Hand, Special Elite, Sniglet); the Windows build wraps it with Neutralino (WebView2).
- Data in `../data/*.json` was exported from the running prototype. Relic Mult conditions are included as the original JavaScript (`multFormulaJS`) so they can be ported exactly.

### 19.1 Suggested data model for production

| Entity | Key fields |
|---|---|
| Weapon | id, name, kind, energyCost, critLength, mult, effect params, critEffect params, source |
| Enemy | id, name, act, tier, hp, moveCycle[{name, actions[]}], flags |
| Relic | id, name, category, trigger (onCastValidate / onTurnStart / onCombatStart / onShopEnter / passive…), params |
| Potion | id, name, target, effect params, usableOutsideCombat, passive |
| Tile | char, level, paint, debuff, fragile |

Prefer an **event/trigger system** for relics (turnStart, combatStart, afterCast, onHurt, onDeath, onShopEnter, onRest, onGoldGain, onTileReward) instead of the prototype's inline `hasR()` checks.

---

## 20. Open issues and recommended next steps

1. **"Arcana" vs "Mult"**: relic descriptions and a few tips still say "Arcana". Unify to **Mult**.
2. **Robust is weak for heroes without defense weapons**: blue paint (+1 Robust) does nothing for The Champion and for The Mercenary without Spike Shield. Options: Robust also adds to every Shield gain (incl. Parrying Dagger crits), or blue paint gives +2 Shield directly.
3. **Unused weapons**: Needle, Bulwark, Hammer exist but can't be obtained (Bulwark's crit gives Robust, so it would need a rework under pillar 4).
4. **Unused content**: a list of 28 riddles exists from an earlier event design; not used.
5. **Balance is unverified** for the new content pack (Boomerang + Journal, Sand Hourglass, energy boss relics, Hoarder's Satchel). Run simulations/playtests.
6. **Alt+1–3** potion hotkeys don't cover slots 4–5 when Bottle Rack is owned.
7. **Comma and Crit length**: commas are currently not counted. Confirm the design intent.
8. **Journal** ignores single-tile casts on purpose (anti-exploit); document in the tooltip.
9. **Undying + Phoenix Feather** order: Undying is checked first. Confirm.
10. Spoiler audit before release (§2.1): run a text search for machine/AI/computer/nanobot outside Act 4 assets.
11. Accessibility: colour-blind check on paints (red/blue/green/gold) and intent icons; font scaling.
12. Localisation: the game depends on English words, but all UI text should be externalised for translation.

---

### Appendix A. Data files

| File | Contents |
|---|---|
| `weapons.json` | All 19 weapons (source, kind, cost, crit length, effects, formulas) |
| `enemies.json` | All 32 enemies (incl. minions) with full move cycles, summons/splits and lore |
| `encounters.json` | Encounter pools per Act, elites, boss options |
| `relics.json` | All 47 relics with category and Mult formulas |
| `potions.json` | All 18 potions |
| `heroes.json` | The 3 heroes (stats, starting kit, texts, endings) |
| `tiles.json` | Letter values, starting deck, special tiles, paints, debuffs, reward rules |
| `statuses.json` | Statuses and glossary keywords |
| `balance.json` | Combat constants, map rules, gold, rewards, shop prices, events, scaling |
| `achievements.json` | Achievements and easter-egg words |
| `story.json` | Tutorial steps, liftoff and ending slides, ending dialogue, closing quotes, shopkeepers |
