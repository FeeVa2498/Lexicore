# Google Drive mirror (for the dev team)

Every docs/data update is also copied to the owner's Google Drive folder
**Lexicore / Doc / New Version**: https://drive.google.com/drive/folders/10NCoTFdDYF0n_yCXE_xr8wls5uQRs2FW

| Drive item | Source in this repo | Format on Drive |
|---|---|---|
| Lexicore GDD | docs/GDD.md | Google Doc |
| CHANGELOG | docs/CHANGELOG.md | Google Doc |
| Lexicore Unlocks | docs/Lexicore_Unlocks.xlsx (6 tabs) | Google Sheet, single tab (same formulas) |
| data/*.json (12 files) | data/*.json | JSON (minified) |
| words/tags.json, words/pos.js | data/words/ | JSON / JS |
| words/README – lexicon.txt | — | points to data/words/lexicon.tsv and valid_words.txt on GitHub (too big for the connector; the owner uploads the zip by hand) |

Update rule: when a file changes, replace the Drive copy (same name, same folder) and add an entry to CHANGELOG.
Folder ids: root 10NCoTFdDYF0n_yCXE_xr8wls5uQRs2FW · data 1xHPaE9c638tqY16N8X8MuUrOi5aKnA93 · words 15qtPIBB3Ej0T6i2o3u_I483_PWPselSz
