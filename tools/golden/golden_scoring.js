// Golden test generator: runs the REAL prototype's evaluate() and records the expected scoring results.
const {chromium}=require('playwright'); const fs=require('fs');
const OUT=process.argv[2]||'golden_scoring.json';

// ---- case definitions (inputs only; expected values come from the prototype) ----
const T=(s,mods={})=>[...s].map((ch,i)=>Object.assign({ch},mods[i]||{}));      // "CAT" -> tiles
const words=["CAT","DOG","QUIZ","JAZZ","ZEBRA","OCTOPUS","BANANA","STRENGTH","AA","AUDIO","RED","CRIMSON","BAKER","WOLVES","MICE","RUN","HAPPY",
  "LLAMA","EERIE","ANNA","TOOTH","OXEN","PILOTS","XYZQ","FUCK","DUMBASS","FVCK","SH!T","NIGERIA","SO","GO","AXE","EAGLE","WIZARD","QUEEN"];
const weapons=["sword","greatsword","shield","dagger","drum","midas","slam","lance"];
const multRelics=["r1","r2","r3","r4","r5","r6","r7","r8","r9","r10","r11","r12","r13","r14","r15","r16","r17","nametag","actionfig","moodring","swearjar","lens","fieldguide","jobboard","paintchart"];
const cases=[]; let id=0; const add=c=>cases.push({id:"s"+String(++id).padStart(4,"0"),...c});
const base={relics:[],hero:"scholar",hp:70,maxHp:70,gold:0,might:0,robust:0,block:0,lastWord:null,wordUses:{}};

// 1) every word with every weapon, no relics
for(const w of words) for(const wp of weapons) add({...base,weapon:wp,tiles:T(w)});
// 2) every Mult relic alone on every word (Spellbook)
for(const r of multRelics) for(const w of words) add({...base,weapon:"sword",relics:[r],tiles:T(w)});
// 3) relic combos
const combos=[["r1","r15","fieldguide"],["r4","r5","r9","r11"],["nametag","actionfig","moodring"],["r6","r8","mirror?"].filter(x=>x!=="mirror?"),["swearjar","r14","r2"],["lens","r10","r12"],["r3","r16","r17","r13"]];
for(const cmb of combos) for(const w of words) add({...base,weapon:"sword",relics:cmb,tiles:T(w)});
// 4) comma casts, single tiles, ! tiles, invalid shapes
const shapes=["CAT,DOG","BIG,CAT","CAT,CAT","CAT,A","A,B","U","U!!","A!,B!","CAT!","CAT!!","CAT!!!!","DOG!,CAT!!","C!AT",",CAT","CAT,","!","!!!","Q","Z!!!","RED,BLUE,PINK","WOLF,MICE","SO!,GO!"];
for(const s of shapes) for(const wp of ["sword","greatsword","dagger"]) for(const rel of [[],["r15","fieldguide","r1"],["monocle"],["monocle","r1"]]) add({...base,weapon:wp,relics:rel,tiles:T(s)});
// 5) wildcards
const wild=["C?T","?AT","??T","???","Q?IZ","?","??","A?E","J?ZZ","?,?","C?T,D?G","ZZ?"];
for(const s of wild) for(const rel of [[],["r9","r11","r1"]]) add({...base,weapon:"sword",relics:rel,tiles:T(s)});
// 6) tile states: Level 2, Slimy, debuffed (Cracked Lens), paints do not change scoring
const tileStates=[
  ["CAT",{0:{lvl:2}}],["CAT",{0:{lvl:2},1:{lvl:2},2:{lvl:2}}],["QUIZ",{0:{lvl:2},3:{lvl:2}}],["CAT",{1:{deb:"slimy"}}],["QUIZ",{0:{deb:"slimy"}}],
  ["CAT",{0:{deb:"poison"},2:{deb:"curse"}}],["ZEBRA",{0:{deb:"lock"},1:{deb:"frustrate"},4:{deb:"burn"}}],["DOG",{0:{paint:"red"},1:{paint:"gold"}}],["C?T",{1:{lvl:2}}],["CAT!",{3:{lvl:2}}]];
for(const [s,m] of tileStates) for(const rel of [[],["lens"],["r9","r10"]]) add({...base,weapon:"sword",relics:rel,tiles:T(s,m)});
// 7) stats: Might / Robust / Shield (Shield Slam) / gold (Midas) / Champion low HP (Adrenaline + Berserker's Blood)
for(const w of ["CAT","ZEBRA","OCTOPUS","CAT,DOG","U!!"]){
  add({...base,weapon:"sword",might:5,robust:3,tiles:T(w)});
  add({...base,weapon:"shield",might:5,robust:3,tiles:T(w)});
  add({...base,weapon:"drum",might:5,robust:3,tiles:T(w)});
  add({...base,weapon:"slam",block:37,tiles:T(w)});
  add({...base,weapon:"slam",block:37,might:2,tiles:T("ABANDONED")});
  add({...base,weapon:"midas",gold:157,tiles:T(w)});
  add({...base,weapon:"midas",gold:157,tiles:T("CATS")});
  for(const hp of [88,45,43,20,1]) add({...base,hero:"champion",relics:["blood"],hp,maxHp:88,weapon:"greatsword",tiles:T(w)});
  add({...base,hero:"champion",relics:["blood"],hp:30,maxHp:88,weapon:"dumbbell",tiles:T(w)});
}
// 8) Journal (2nd cast of the same word this combat doubles), Parrot (same as previous cast)
for(const w of ["CAT","CAT,DOG","ZEBRA"]) for(const uses of [0,1,2]){ const key=w; add({...base,weapon:"sword",relics:["journal"],wordUses:uses?{[key]:uses}:{},tiles:T(w)}); }
for(const w of ["CAT","CAT,DOG"]) for(const lw of [null,"CAT","CAT,DOG","DOG"]) add({...base,weapon:"sword",relics:["parrot"],lastWord:lw,tiles:T(w)});
add({...base,weapon:"sword",relics:["journal","blood"],hero:"champion",hp:40,maxHp:88,wordUses:{"ZEBRA":1},tiles:T("ZEBRA")});
// 9) crit lengths with ! (sigil counts letters and !)
for(const [wp,s] of [["sword","GO"],["sword","G!"],["greatsword","SAW"],["greatsword","SAW!"],["greatsword","HI!"],["greatsword","U!!"],["shield","BEAR"],["shield","BEA!"],["drum","BEAR"],["dumbbell","ZEBRA"],["dumbbell","ZEBR!"],["slam","ABANDONED"],["lance","BANANA"],["dagger","CAT"],["dagger","CA,T"]]) add({...base,weapon:wp,tiles:T(s)});

(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1600,height:900}}); await p.emulateMedia({reducedMotion:'reduce'});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+require('path').resolve(process.argv[3]||__dirname+'/../../index.html')); await p.evaluate(()=>localStorage.setItem('lexspire-tutorial-done','1')); await p.reload(); await p.waitForTimeout(1200);
  const res=await p.evaluate(async(cases)=>{
    closeSplash(); newRun("scholar"); startCombat(["slime"],"elite"); await new Promise(r=>setTimeout(r,800));
    const out=[]; let uid=900000;
    for(const c of cases){
      G.hero=c.hero; G.hp=c.hp; G.maxHp=c.maxHp; G.gold=c.gold; G.relics=c.relics.slice(); G.lastWord=c.lastWord;
      C.p.might=c.might; C.p.robust=c.robust; C.p.block=c.block; C.wordUses={...c.wordUses}; C.banLetter=null;
      const tiles=c.tiles.map(t=>({uid:uid++,ch:t.ch,lvl:t.lvl||1,paint:t.paint||null,deb:t.deb?{t:t.deb,n:t.deb==="lock"?2:t.deb==="condemn"?1:0}:null,fragile:false}));
      const R=evaluate(tiles,WEAPONS[c.weapon],true);
      out.push({id:c.id, expected: R.valid?{valid:true,spellPower:R.chips,mult:R.mult,output:R.total,crit:!!R.crit,singleTile:!!R.fallback,words:R.words||null,
        resolvedWildcards:Object.keys(R.resolved).length?tiles.filter(t=>R.resolved[t.uid]).map(t=>R.resolved[t.uid]).join(""):null,
        exclamations:R.bang||0,relicsFired:[...new Set(R.fired)].sort(),relicMult:R.relicVals||{},journal:!!R.journal}
        :{valid:false,reason:R.reason,easterEgg:R.easter||null}});
    }
    return out;
  },cases);
  const byId=Object.fromEntries(res.map(r=>[r.id,r.expected]));
  const full=cases.map(c=>({...c,expected:byId[c.id]}));
  fs.writeFileSync(OUT,JSON.stringify({
    _about:["Golden scoring cases generated by running evaluate() in the Lexicore prototype (build of "+new Date().toISOString().slice(0,10)+").",
      "Each case: the cast state (hero, HP, gold, relics, Might/Robust/Shield, Journal word uses, Parrot last word) + the tiles on the sigil bar + the weapon. 'expected' is what the prototype returned.",
      "Tiles: ch = letter, '?' wildcard, '!' exclamation, ',' comma. lvl 2 = +3 Spell Power. deb = tile debuff (slimy scores 0; any deb counts for Cracked Lens). paint does not change scoring.",
      "spellPower = chips after Might/Robust and ! bonus; output = floor(spellPower x mult) + Midas/Shield Slam/Berserker's Blood, then x2 for Journal. Echo Draught and Too Tall are applied later in cast(), not here.",
      "A C# port passes when every case returns the same valid/spellPower/mult/output/crit/words/relicsFired. 'reason' strings are informative only."],
    count:full.length, cases:full},null,1));
  console.log(full.length,'cases', errs.slice(0,3));
  await b.close();
})();
