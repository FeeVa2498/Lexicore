# Golden test generators

Regenerate the expected results from the prototype after a rule change:

```
npm i playwright            # once (uses Chromium)
node tools/golden/golden_scoring.js unity/Assets/Lexicore/Tests/Golden/golden_scoring.json index.html
node tools/golden/golden_combat.js  unity/Assets/Lexicore/Tests/Golden/golden_combat.json  index.html
```

The scripts open the prototype in a headless browser, set up each case, call the real game functions
(`evaluate`, `cast`, `endTurn`, `usePotion`) and write what they returned. Edit the case lists at the top of each script to add cases.
