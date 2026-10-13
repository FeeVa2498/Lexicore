// Golden combat scenarios: set up a fight in the REAL prototype, run one action (cast / end turn / consumable),
// and record the resulting state. Random parts (which tiles get debuffed, which tiles are drawn) are recorded as counts.
const {chromium}=require('playwright'); const fs=require('fs');
const OUT=process.argv[2]||'golden_combat.json';
const T=s=>[...s].map(ch=>({ch}));
const S=[]; let n=0;
// sc(desc, setup, action) ; setup fields: hero hp maxHp gold act kind relics enemies[{id,...overrides}] player{} weapon hand(tiles) cast(tiles to put on the bar, taken from hand) target extra{}
const sc=(desc,setup,action)=>S.push({id:"c"+String(++n).padStart(3,"0"),desc,setup:{hero:"scholar",act:1,kind:"elite",relics:[],gold:0,target:0,player:{},...setup},action});
const cast=(desc,weapon,word,setup={})=>sc(desc,{weapon,hand:T(word),cast:T(word),...setup},{type:"cast"});
const ET=(desc,setup)=>sc(desc,{weapon:"sword",hand:T("CATDOG"),...setup},{type:"endTurn"});
const POT=(desc,pot,setup={})=>sc(desc,{weapon:"sword",hand:T("CATDOG"),...setup},{type:"consumable",id:pot});
const slime=(o={})=>[{id:"slime",...o}];

// ---- casts: every weapon kind ----
cast("Spellbook, plain hit","sword","CAT",{enemies:slime()});
cast("Spellbook crit (2 letters) = +1 Energy next turn","sword","GO",{enemies:slime()});
cast("Enemy Shield absorbs first","sword","ZEBRA",{enemies:slime({block:5})});
cast("Broken enemy takes x1.5 (before Shield)","sword","ZEBRA",{enemies:slime({broken:2,block:4})});
cast("Greatsword crit: Broken 3 + self damage max(2, 20%)","greatsword","SAW",{hero:"champion",enemies:slime()});
cast("Greatsword crit with big output: self damage 20%","greatsword","JAW",{hero:"champion",player:{might:20},enemies:[{id:"warden"}]});
cast("Kill the last enemy = combat won","greatsword","ZEBRA",{hero:"champion",enemies:slime({hp:10})});
cast("Barrier crit (4 letters) = Shield + draw 3","shield","BEAR",{enemies:slime()});
cast("Barrier while Weakened: Shield halved","shield","ZEBRA",{player:{weaken:2},enemies:slime()});
cast("Parrying Dagger crit: also Shield = output","dagger","CAT",{hero:"mercenary",enemies:slime()});
cast("Dumbbell: Might = output/5","dumbbell","BEAR",{hero:"champion",enemies:slime()});
cast("Dumbbell crit: heal 2 x Might","dumbbell","ZEBRA",{hero:"champion",hp:50,player:{might:4},enemies:slime()});
cast("War Drum crit: double Might","drum","BEAR",{enemies:slime()});
cast("Venom Quill: Poison = output/3","quill","ZOO",{enemies:[{id:"slime"},{id:"bat"}]});
cast("Venom Quill crit: Poison ALL","quill","QUIZ",{enemies:[{id:"slime"},{id:"bat"}]});
cast("Healing Censer crit x2","censer","ZEBRA",{hp:30,enemies:slime()});
cast("Seeker's Lantern crit: drawn tiles Level 2","lantern2","ZOO",{enemies:slime()});
cast("Rune Chisel: Fragile copies of last letter","chisel","JAZZ",{enemies:slime()});
cast("Cleansing Bell crit: cleanse hand + your debuffs + Shield/2","bell","QUIZ",{player:{poison:4,weaken:2,broken:1,frustrated:2,curse:3},handDebuffs:{4:"slimy",5:"lock"},hand:T("QUIZCAT"),enemies:slime()});
cast("Sand Hourglass crit: +Energy and +3 draw next turn","hourglass","ZEBRA",{enemies:slime()});
cast("Boomerang crit: second hit for half, tiles return to hand","boomerang","QUIZ",{enemies:[{id:"warden"}]});
cast("Shield Slam: output + half Shield","slam","CAT",{player:{block:31},enemies:[{id:"warden"}]});
cast("Shield Slam crit (9 letters): Stun","slam","ABANDONED",{player:{block:20},enemies:[{id:"warden"}]});
cast("Midas Touch: +1 per 10 gold","midas","ZEBRA",{gold:157,enemies:[{id:"warden"}]});
cast("Midas Touch crit: gold bonus x2","midas","CATS",{gold:157,enemies:[{id:"warden"}]});
cast("Flame Lance crit: same damage to every enemy","lance","BANANA",{kind:"normal",enemies:[{id:"slime"},{id:"bat"},{id:"goblin"}]});
cast("Utility Belt: forge Fragile ! into discard; crit refunds 1 Energy","belt","JAZZ",{hero:"mercenary",enemies:slime()});
cast("! tiles at the end add Spell Power","dagger","CAT!!",{hero:"mercenary",enemies:[{id:"warden"}]});
cast("Comma cast: two words, one hit","sword","BIG,CAT",{enemies:[{id:"warden"}]});
// ---- statuses on the player during a cast ----
cast("Might adds to attack words","sword","CAT",{player:{might:6},enemies:[{id:"warden"}]});
cast("Robust adds to shield words","shield","CAT",{player:{robust:6},enemies:slime()});
cast("Frustrated: word shorter than stacks+1 costs 1 HP","sword","CAT",{player:{frustrated:3},enemies:slime()});
cast("Debuffed tiles: Poisoned/Cursed/Frustrated give the status when cast","sword","ZEBRA",{handDebuffs:{0:"poison",1:"curse",2:"frustrate"},enemies:[{id:"warden"}]});
cast("Paints: red +Might, blue +Robust, gold +1 gold, green +1 draw","sword","ZEBRA",{handPaints:{0:"red",1:"blue",2:"gold",3:"green"},enemies:[{id:"warden"}]});
cast("Slimy tile scores 0, then the slime washes off","sword","QUIZ",{handDebuffs:{0:"slimy"},enemies:[{id:"warden"}]});
cast("Echo Draught active: output x2","sword","ZEBRA",{extra:{echo:true},enemies:[{id:"warden"}]});
cast("Journal: 2nd cast of the same word this combat x2","sword","ZEBRA",{relics:["journal"],extra:{wordUses:{"ZEBRA":1}},enemies:[{id:"warden"}]});
// ---- enemy Thorns, relic hooks ----
cast("Enemy Thorns hurt you per hit (Shield absorbs)","sword","CAT",{player:{block:1},enemies:[{id:"needlehog",thorns:4}]});
cast("Rusty Nail: +1 Poison per attack","sword","CAT",{relics:["nail"],enemies:[{id:"warden"}]});
cast("Megaphone + Rusty Nail: each ! is one more attack","sword","CAT!!",{relics:["nail","megaphone"],enemies:[{id:"warden"}]});
cast("Chalk Tally: the 10th attack is doubled","sword","ZEBRA",{relics:["nib"],extra:{nib:9},enemies:[{id:"warden"}]});
cast("Sandbag (6+ letters) and Umbrella (starts with a vowel)","sword","ORANGES",{relics:["sandbag","umbrella"],enemies:[{id:"warden"}]});
cast("Snake Charm (S or Z) and Protein Bar (double letter)","sword","JAZZ",{relics:["snakecharm","protein"],enemies:[{id:"warden"}]});
cast("Barbed Wire: +1 Thorns per 10 Shield gained","shield","OCTOPUS",{relics:["barbed"],player:{robust:10},enemies:slime()});
cast("Metronome + Rubber Stamp on the 3rd cast this turn","sword","CAT",{relics:["shuriken","opener"],extra:{turnCasts:2},enemies:[{id:"slime"},{id:"bat"}]});
cast("Quick Gloves: draw as many tiles as the first word used","dagger","ZEBRA",{hero:"mercenary",relics:["gloves"],extra:{firstCast:false},enemies:[{id:"warden"}]});
cast("Berserker's Blood + Adrenaline at low HP","greatsword","ZEBRA",{hero:"champion",hp:30,relics:["blood"],enemies:[{id:"warden"}]});
cast("Swear words are valid without Swear Jar","sword","DUMBASS",{enemies:[{id:"warden"}]});
cast("Swear Jar +2 Mult on a swear word","sword","DUMBASS",{relics:["swearjar"],enemies:[{id:"warden"}]});
cast("Easter-egg spelling is NOT a valid cast (nothing spent)","sword","FVCK",{enemies:[{id:"warden"}]});
cast("Invalid word: nothing is spent","sword","XYZQ",{enemies:[{id:"warden"}]});
// ---- boss gimmicks on cast ----
cast("Titan: word under 5 letters deals half","sword","QUIZ",{kind:"boss",enemies:[{id:"titan"}]});
cast("Titan: 5+ letters full damage","sword","ZEBRA",{kind:"boss",enemies:[{id:"titan"}]});
cast("Titan: debuffs it receives are halved (Venom Quill)","quill","QUIZZES".slice(0,4),{kind:"boss",enemies:[{id:"titan"}]});
cast("Gargoyle in Statue Form: Thorns 8 hurt you","sword","ZEBRA",{kind:"boss",act:2,enemies:[{id:"gargoyle",form:"statue",thorns:8,block:0}]});
cast("Prisoner Zero in Time Slow: takes x2","sword","ZEBRA",{kind:"boss",act:3,enemies:[{id:"zero",ph:2}]});
cast("Gatekeeper Force Field: a hit deals 1 and knocks out 1 cell","sword","ZEBRA",{kind:"boss",act:3,enemies:[{id:"gatekeeper"}]});
cast("Gatekeeper with no field: full damage","sword","ZEBRA",{kind:"boss",act:3,enemies:[{id:"gatekeeper",field:0}]});
cast("LEXICORE Firewall: max 70 per turn, reaching it ends your turn","sword","JAZZ",{kind:"boss",act:4,player:{might:80,block:200},enemies:[{id:"lexicore"}]});
// ---- end turn / enemy phase ----
ET("Slime: attack 7 + Shield 6 vs your Shield 3",{player:{block:3},enemies:slime()});
ET("Player Poison ticks at end of your turn, then -1; Weaken/Broken/Frustrated -1",{player:{poison:4,weaken:2,broken:2,frustrated:1},enemies:slime({mi:1})});
ET("Broken player takes x1.5 from attacks",{player:{broken:2},enemies:slime()});
ET("Curse: HP at or below Curse at end of turn = death",{hp:5,player:{curse:6},enemies:slime({mi:1})});
ET("Smoldering tiles still in hand burn 1 HP each",{handDebuffs:{0:"burn",1:"burn"},enemies:slime({mi:1})});
ET("Condemned tile in hand is banished; Locked counts down",{handDebuffs:{0:"condemn",1:"lock"},enemies:slime({mi:1})});
ET("Your Thorns hit back on every hit of a multi-hit attack",{player:{thorns:3},enemies:[{id:"bat"}]});
ET("Multi-hit vs Shield: Shield absorbs per hit",{player:{block:7},enemies:[{id:"crow",mi:1}]});
ET("Enemy Might adds to each hit",{enemies:slime({might:3})});
ET("Gemini: the twin you are not targeting hits x2",{kind:"boss",act:2,target:0,enemies:[{id:"twinA",mi:1},{id:"twinB",mi:1}]});
ET("Riot Turtle shields every other enemy",{kind:"normal",enemies:[{id:"hound",mi:1},{id:"turtle"}]});
ET("Boombox Baboon: +2 Might to itself and every ally",{kind:"normal",enemies:[{id:"baboon"},{id:"rat"}]});
ET("Patch Bot repairs injured allies and shields",{kind:"normal",enemies:[{id:"prisoner",hp:40},{id:"repairbot"}]});
ET("Sporeling burst: 1 Poison per 3 HP left (rounded up)",{kind:"normal",enemies:[{id:"slime",mi:1},{id:"sporeling",mi:2,hp:10}]});
ET("Mother Mycelia summons 2 Sporelings",{kind:"boss",enemies:[{id:"shroom"}]});
ET("Mother Mycelia Regrowth: heal 5 per living Sporeling",{kind:"boss",enemies:[{id:"shroom",mi:2,hp:100},{id:"sporeling"},{id:"sporeling"}]});
ET("Gargoyle Petrify: Statue Form, +30 Shield, +8 Thorns",{kind:"boss",act:2,enemies:[{id:"gargoyle",mi:3}]});
ET("Gargoyle Awaken: 14 + 2 per Thorn, then Thorns cleared",{kind:"boss",act:2,enemies:[{id:"gargoyle",mi:6,form:"statue",thorns:8}]});
ET("Prisoner Zero Time Haste: acts twice",{kind:"boss",act:3,enemies:[{id:"zero",ph:0,mi:1}]});
ET("Prisoner Zero Time Slow: does nothing",{kind:"boss",act:3,enemies:[{id:"zero",ph:2}]});
ET("Gatekeeper Recharge Field +8",{kind:"boss",act:3,enemies:[{id:"gatekeeper",mi:1,field:3}]});
ET("Stunned enemy skips its turn and its cycle does not advance",{enemies:slime({stun:1})});
ET("Enemy Poison ticks after its move; dies = combat won",{enemies:slime({hp:3,poison:5,mi:1})});
ET("Duct Tape heals 12 the first time you drop below 50%",{relics:["medkit"],hp:40,enemies:[{id:"warden",mi:1}]});
ET("Phoenix Feather revives at 30% when you would die",{hp:5,extra:{potions:["phoenix"]},enemies:[{id:"warden",mi:1}]});
ET("Normal fight with 3 enemies: HP x0.75, damage x0.85",{kind:"normal",enemies:[{id:"slime"},{id:"slime"},{id:"slime"}]});
ET("Start of turn: Spark Plug/Scrap Plating/Iron Knuckles fire on turn 1 only, Wind-up Key every 3rd turn",{relics:["lantern","anchor","knuckle","flower"],enemies:slime({mi:1}),extra:{turn:2}});
ET("Rage Soda / Brick Milk wear off at end of turn",{extra:{tmpMight:10,tmpRobust:10},player:{might:12,robust:10},enemies:slime({mi:1})});
// ---- consumables ----
POT("Volatile Flask: 20 x Act",'fire',{act:2,enemies:[{id:"warden"}]});
POT("Iron Tonic: 15 x Act Shield",'iron',{act:3,enemies:slime()});
POT("Mighty Brew: 3 + 2 per Act after the first",'might',{act:2,enemies:slime()});
POT("Blast Jar: 12 + 6/Act to ALL",'bomb',{act:2,kind:"normal",enemies:[{id:"rat"},{id:"crow"}]});
POT("Venom Vial: 8 + 4/Act Poison",'venom',{act:3,enemies:[{id:"warden"}]});
POT("Shatter Draught: Broken 3 to all",'brittle',{kind:"normal",enemies:[{id:"slime"},{id:"bat"}]});
POT("Energy Tonic +2",'tonic',{enemies:slime()});
POT("Titan Serum: Might x5",'titan',{player:{might:3},enemies:slime()});
POT("Rage Soda: +10 Might this turn",'ragesoda',{enemies:slime()});
POT("Cluster Bomb: 25 to all",'cluster',{kind:"normal",enemies:[{id:"slime"},{id:"bat"}]});
POT("Rocket Pop: 50 to target",'rocket',{enemies:[{id:"warden",block:10}]});
POT("Flashbang: stun target",'flashbang',{enemies:slime()});
POT("Panacea: remove every debuff on you",'panacea',{player:{poison:3,weaken:2,broken:2,curse:1,frustrated:2},enemies:slime()});
POT("Full Flask: heal 50% max HP",'bigheal',{hp:10,enemies:slime()});
POT("Cracked Flask -10 HP and Bendy Straw +5 HP on use",'tonic',{relics:["sozu","bird"],hp:40,enemies:slime()});
POT("Echo Draught then cast: x2 (consumable only arms it)",'echo',{enemies:slime()});

(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1600,height:900}}); await p.emulateMedia({reducedMotion:'reduce'});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+require('path').resolve(process.argv[3]||__dirname+'/../../index.html')); await p.evaluate(()=>localStorage.setItem('lexspire-tutorial-done','1')); await p.reload(); await p.waitForTimeout(1200);
  await p.evaluate(()=>{ closeSplash(); window.__LOG=[]; const ol=log; log=function(s){ window.__LOG.push(String(s).replace(/<[^>]+>/g,"")); return ol(s); }; Math.random=(()=>{ let s=12345; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; })(); });
  const out=[];
  for(const s of S){
    const r=await p.evaluate(async(s)=>{
      const wait=async()=>{ for(let i=0;i<600;i++){ if(!C||C.over||!C.busy) return; await new Promise(r=>setTimeout(r,25)); } };
      try{ closeStage(); }catch(e){} C=null;
      const st=s.setup; newRun(st.hero); G.act=st.act; G.gold=st.gold; G.relics=st.relics.slice();
      if(st.maxHp) G.maxHp=st.maxHp; if(st.hp) G.hp=st.hp;
      if(st.extra&&st.extra.potions) G.potions=st.extra.potions.slice(); else G.potions=[];
      if(st.extra&&st.extra.nib!=null) G.nib=st.extra.nib;
      if(s.action.type==="consumable") G.potions=[s.action.id];
      G.weapons=[st.weapon];
      startCombat(st.enemies.map(e=>e.id),st.kind); await wait();
      C.es.forEach((e,i)=>{ const o=st.enemies[i]; for(const k in o) if(k!=="id") e[k]=o[k]; if(o.hp!=null&&o.hp>e.max) e.max=o.hp; });
      Object.assign(C.p,{block:0,might:0,robust:0,poison:0,weaken:0,broken:0,curse:0,frustrated:0,thorns:0},st.player);
      C.baseThorns=st.player.thorns||0; C.energy=st.player.energy??10; C.banLetter=null; C.target=st.target;
      const ex=st.extra||{}; for(const k of ["echo","wordUses","turnCasts","tmpMight","tmpRobust","turn"]) if(ex[k]!=null) C[k]=ex[k];
      if(ex.firstCast===false) C.firstCast=false; else C.firstCast=true;
      // hand: replace with the given tiles
      C.draw.push(...C.hand); C.hand=[]; const uids=[];
      st.hand.forEach((t,i)=>{ const u=G.uidN++; C.t[u]={uid:u,ch:t.ch,lvl:1,paint:(st.handPaints||{})[i]||null,deb:null,fragile:false}; const d=(st.handDebuffs||{})[i]; if(d) C.t[u].deb={t:d,n:d==="lock"?2:d==="condemn"?1:0}; C.hand.push(u); uids.push(u); });
      C.wi=0; window.__LOG.length=0; C.busy=false;
      const es=C.es.slice(), hp0=G.hp, e0=C.energy;
      if(s.action.type==="cast"){ const used=new Set(); C.bar=st.cast.map(t=>{ const u=uids.find(x=>!used.has(x)&&C.t[x].ch===t.ch); used.add(u); return u; }); await cast(); }
      else if(s.action.type==="endTurn"){ await endTurn(); }
      else { await usePotion(0); if(s.action.id==="echo"){ C.bar=uids.slice(0,3); await cast(); } }
      await wait(); await new Promise(r=>setTimeout(r,60));
      const won=!C&&(G.screen==="reward"||G.screen==="actclear"||G.screen==="map"||!!document.querySelector(".rwpop,.screen"));
      const dead=G.hp<=0;
      const snap={result: dead?"playerDied": (!C?"combatWon":"continue"),
        player:{hp:G.hp,maxHp:G.maxHp,gold:G.gold,potions:G.potions.slice()},
        enemies:es.map(e=>({id:e.id,hp:e.hp,max:e.max,block:e.block,might:e.might,thorns:e.thorns||0,poison:e.poison||0,broken:e.broken||0,stun:e.stun||0,field:e.field||0,form:e.form||null,moveIndex:e.mi,dead:!!e.dead}))};
      if(C){ Object.assign(snap.player,{block:C.p.block,might:C.p.might,robust:C.p.robust,poison:C.p.poison,weaken:C.p.weaken,broken:C.p.broken,curse:C.p.curse,frustrated:C.p.frustrated,thorns:C.p.thorns,energy:C.energy,nextEnergy:C.nextEnergy||0,nextDraw:C.nextDraw||0,turn:C.turn});
        const deb={}; for(const u in C.t){ const d=C.t[u].deb; if(d) deb[d.t]=(deb[d.t]||0)+1; }
        snap.piles={hand:C.hand.length,draw:C.draw.length,discard:C.disc.length,banished:C.ban.length,fragileInHand:C.hand.filter(u=>C.t[u].fragile).length,level2InHand:C.hand.filter(u=>C.t[u].lvl===2).length,debuffedTiles:deb};
        snap.enemyCount=C.es.length; if(C.es.length!==es.length) snap.enemiesNow=C.es.map(e=>({id:e.id,hp:e.hp,dead:!!e.dead})); }
      snap.log=window.__LOG.slice(0,40);
      if(dead||!C) await new Promise(r=>setTimeout(r,1000));
      return snap;
    },s);
    out.push({...s,expected:r}); process.stdout.write(".");
  }
  fs.writeFileSync(OUT,JSON.stringify({_about:[
    "Golden combat scenarios generated by running the Lexicore prototype. setup -> one action -> expected state.",
    "setup: hero, act, kind (normal/elite/boss), relics, gold, hp/maxHp, enemies (id + field overrides: hp, block, might, thorns, poison, broken, stun, field, mi = move index 0-based, ph = Prisoner Zero time phase counter, form), player statuses, energy 10 unless given, weapon (the only weapon, index 0), hand (exact tiles; the rest of the deck is in the draw pile), cast (tiles moved from hand to the bar, in order), handDebuffs/handPaints (by hand index), extra (combat flags: echo, wordUses, turnCasts, nib, tmpMight, potions...).",
    "Enemy HP is scaled by group size in normal fights BEFORE overrides are applied. Overrides replace values after startCombat.",
    "action: cast | endTurn (your end of turn, the whole enemy phase, then the start of your next turn incl. drawing back to 16) | consumable (use slot 0).",
    "expected.enemies is the state of the enemies that existed before the action; enemiesNow lists summons/splits. Random choices (which tiles get debuffed, which tiles are drawn) are only compared as counts (piles, debuffedTiles). log = the prototype's combat log for this action, handy when a value differs.",
    "result: continue | combatWon (C is gone: reward/act-clear screen) | playerDied."],count:out.length,scenarios:out},null,1));
  console.log("\n",out.length,"scenarios",errs.slice(0,5)); await b.close();
})();
