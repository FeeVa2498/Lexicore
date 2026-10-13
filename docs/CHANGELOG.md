# Lexicore – Changelog (design docs and data)

Newest first. Each entry lists what changed and which files a dev needs to re-read.
Files: **GDD** = Lexicore GDD · **Unlocks** = Lexicore Unlocks spreadsheet · **data/** = JSON exports · **words/** = dictionary export.
Shared copies live in the Google Drive folder *Lexicore / Doc / New Version* (updated together with the GitHub repo FeeVa2498/Lexicore).

---

## 2026-10-13 · Unity port kit (Unity 6.3 LTS · UI Toolkit)
- New **Unity porting guide** (`docs/UNITY_PORTING.md`, Drive: *Lexicore Unity Porting Guide*): architecture (pure C# Core + UI Toolkit), data loading, the exact rules the prototype runs (cast order, weapon effects, damage pipeline, end/start of turn, enemy phase, relic hooks, consumables, boss gimmicks, rewards), UI Toolkit screen plan, art, tests, dead code to skip.
- New **C# Core** in `unity/Assets/Lexicore/Core/`: scoring (`Scoring.Evaluate`), the 25 Mult relics, word list loader, tiles, weapons, MiniJson. Copy `unity/Assets/Lexicore` into the Unity project.
- New **golden tests** recorded from the prototype: `golden_scoring.json` (1,816 cases, the C# scoring passes all of them) and `golden_combat.json` (103 combat scenarios for the combat port). Generators in `tools/golden/`.
- Found while testing: normal-fight **HP scaling** in the prototype is `[1,1,.75,.62,.55,.5][group size]` (2 enemies ×0.75, 3 ×0.62…) while the GDD says 1–2 ×1, 3 ×0.75. Design decision pending; the golden tests follow the prototype.

## 2026-10-13 · Word validity: swears always valid, easter eggs invalid
- **Swear words** (`SWEARS`, 64) are now always valid words; Swear Jar no longer unlocks them and only gives +2 Arcana per swear word. 3 of them (e.g. DUMBASS) are not in the base dictionary and were added to the valid list.
- **Easter-egg spellings** (FVCK, SH!T, NIGERIA…) are **not** valid casts any more: the bar shakes, nothing is spent, and the attempt unlocks the secret achievement (That Was Close / Close Enough).
- New `words/valid_words.txt`: all 193,091 valid words, one per line. `lexicon.tsv`: column `inDictionary` replaced by `source` (dictionary / swearList); every row is valid.
- GDD: §4.4, §8.2 (Swear Jar), §14.2, Appendix A. Data: `relics.json` (Swear Jar text), `achievements.json` (descriptions + note), `words/tags.json` (notes).

## 2026-10-13 · Champion: Undying removed
- The Champion's **Undying** passive (once per Act, survive a killing blow at 16 HP) is removed from the game: it was never an approved design. Only the Phoenix Feather consumable can revive the hero now. Adrenaline stays.
- GDD: §4.7, §5, §20 (open issue about the Undying/Phoenix order deleted). Data: `heroes.json` (passive and playstyle text).

## 2026-10-13 · Docs v1.4 – Dev handoff pack

**New**
- Google Drive mirror of all docs and data (folder *Lexicore / Doc / New Version*, see `docs/DRIVE.md`).
- **Lexicore Unlocks** spreadsheet: unlock levels 1–10 (XP needed, cumulative XP, relic + consumable per level), XP per fight by Act, run XP estimate, hero unlocks, the list of always-available relics/consumables. Inputs on the *Settings* block; everything else is formulas. Drive: one-tab Google Sheet; GitHub: `docs/Lexicore_Unlocks.xlsx` (6 tabs).
- **words/lexicon.tsv**: the full playable dictionary (193,088 words, 2–10 letters) with length, base Spell Power, noun/verb/adjective flags, animal/job/color/swear tags, inDictionary. Large file (5.8 MB): kept in the GitHub repo only, https://github.com/FeeVa2498/Lexicore/blob/main/data/words/lexicon.tsv (raw: https://raw.githubusercontent.com/FeeVa2498/Lexicore/main/data/words/lexicon.tsv).
- **words/tags.json**: theme word lists (animals 273, jobs 216, colors 79, swears 64), easter-egg spellings, counts, and the tag-matching rules.
- **words/pos.js**: build-time script that turns WordNet into the noun/verb/adjective mask.
- **data/progression.json**: XP thresholds `[80 … 215]` added.

**Changed**
- `enemies.json`: move names in every move cycle; `bossGimmick` is now an object `{id, name, description}`; Mother Mycelia `startingStatus.regrowth = 5`; Sporeling cycle and lore updated (bursts by HP left); stale Rival's Banner note removed.
- `statuses.json`: keywords 27 → 37 (icons for every keyword, boss mechanics tagged "(boss)"); new `bossPassives` block (7 boss gimmicks).
- `potions.json` / `relics.json`: `unlockLevel` on every locked item; UI wording "potion" → "consumable"; Cracked Lens text; Cracked Flask note fixed.
- `balance.json`: Journal per combat; events pool adds Painter (+ Arcade Token note); consumable wording.
- `tiles.json`: reward tiles are unpainted, 10% Fortified, always Level 2 with Laminator.
- `story.json`: tutorial Critical steps now teach GO (2-letter Spellbook crit).
- `heroes.json`: Champion playstyle text (Berserker's Blood, Greatsword crit).
- **GDD**: version 1.4; "potion" → "consumable" everywhere in the text; tutorial Critical is now GO (2 letters); relic category counts (Mult 25, Common 34); locked heroes on character select; §8.1 starter relic table fixed (Hero column); save keys in §14.4; §9 Consumables table rebuilt with an *Unlock level* column; Journal = per combat (formula block); Cracked Flask / Bottle Rack wording; Glossary tab names; §14.6 points to the Unlocks spreadsheet; Appendix A lists every data file with up-to-date counts (21 weapons, 43 enemies, 71 relics, 29 consumables).

## 2026-10-13 · Game build – Hero rework and unlock progression
- Journal doubles the 2nd cast of a word **per combat** (was per run).
- Berserker's Blood: +1 damage per 4 missing HP (no more end-of-fight heal). New relic **Thermos**: heal 8 at end of combat.
- Greatsword: crit at 3 letters → Broken 3, you lose max(2, 20% of output) HP; no per-swing HP cost, no Rage.
- Dumbbell: crit 5, Might = output ÷ 5. Spellbook: crit 2 letters → +1 Energy next turn.
- Unlocks: Scholar at start, Champion = reach Act 1 boss, Mercenary = reach Act 2 boss; 10 levels × (1 relic + 1 consumable), Swear Jar last; Unlocks bar on the death/victory screen.
- Glossary: "???" until seen; starter relics first; *Cheat: unlock all* and *Reset progress* buttons (**testing only, remove before release**).
- "Potion" renamed **Consumable** in all UI text.
- GDD: §14.6, §15.3. Data: `progression.json` (new), `heroes.json`, `weapons.json`, `relics.json`.

## 2026-10-13 · Game build – Boss gimmicks
- Mother Mycelia: Regrowth 5 per living Sporeling. Sporeling 18 HP, bursts for 1 Poison per 3 HP left.
- The Titan: words under 5 letters deal half damage; debuffs on it are halved.
- Ancient Stone Gargoyle: Living Statue (Petrify → +30 Shield, 8 Thorns; Awaken → 14 + 2 per Thorn, Thorns cleared).
- Gemini: Twin Bond (+6 Might when the other twin dies).
- Prisoner Zero: Time Haste ×2 / Time Slow loop (Slow takes ×2 damage). Replaced Time Prison.
- The Gatekeeper: Force Field 12 cells, Recharge +8.
- LEXICORE: Syntax Filter + Firewall (max 70 damage per player turn, reaching it ends the turn).
- Retired keywords removed: Layered Armor, Time Prison, Two Forms, Stone Skin.
- GDD: §13.4. Data: `enemies.json`, `statuses.json`.

## 2026-10-13 · Game build – Batch 5 and UI
- Consumable Use/Discard menu at the cursor; hand sort button; rune pedestal sigil UI; triggered relics glow with Arcana badges.
- Multi-hit attacks (bat 5×2, crow 5×3, mantis 7×3, drone 9×3, jar 6×3); Thornbloom Thorns; Spike Shield (was Mirror Ward); Shield Slam = 50% Shield + output, crit Stun.
- Boss relic reworks (Insomnia Lamp, Cracked Flask, Rival's Banner); Umbrella 8, Sandbag 10 Shield; Arcana relics under 1 get +0.2.
- New consumable Panacea; every consumable redrawn with its own silhouette.
- GDD: §4.10, §6, §8, §9, §15.3. Data: `weapons.json`, `relics.json`, `potions.json`, `enemies.json`.

## 2026-10-12 · Game build – Content packs
- New enemies: Needle Hog, Boombox Baboon, Riot Turtle, Tesla Jelly, Patch Bot; elites Scrapipede (Reassemble) and Hive Mind.
- Relics check each comma word separately; word-type relics (WordNet), Swear Jar, theme relics (animal/job/color), Paper Cut, Laminator, Arcade Token and more; weapon Midas Touch.
- Victory popup with 3 tiles; Painter moved to ? events; NPCs on every event.
- Ending rewrite; Endings tab in the Glossary (all endings unlocked for testing).
- GDD: §8, §11, §13, §16. Data: all.

## 2026-10-10 · Docs v1.0
- First GDD and data export (`data/*.json`).
