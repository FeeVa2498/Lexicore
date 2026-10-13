# Lexicore for Unity (6.3 LTS)

Copy this whole `Lexicore` folder into your project's `Assets/` folder.

- `Core/` – pure C# rules (no UnityEngine). Today: scoring (`Scoring.Evaluate`), the 25 Mult relics, the word list (`WordList.FromTsv`), tiles, weapons, a tiny JSON reader.
- `Data/` – copy of the repo's `data/` (JSON + `words/lexicon.tsv`). The tests read these files directly from disk.
  For runtime loading as a TextAsset, Unity does not import `.tsv`: rename it to `lexicon.tsv.txt` / `.bytes` or load it from StreamingAssets.
- `Tests/EditMode/` – NUnit tests. Needs the Test Framework package (installed by default). Window > General > Test Runner > EditMode > Run All.
- `Tests/Golden/` – expected results recorded from the prototype: `golden_scoring.json` (1,816 cases, all passing) and `golden_combat.json` (103 combat scenarios, for the combat port).

Full guide: `docs/UNITY_PORTING.md` in the repo.
