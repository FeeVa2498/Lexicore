using System;
using System.Collections.Generic;
using System.Linq;

namespace Lexicore.Core
{
    /// <summary>Everything outside the tiles that the score depends on.</summary>
    public sealed class ScoreContext
    {
        public string Hero = "scholar";
        public int Hp = 70, MaxHp = 70, Gold;
        public List<string> Relics = new List<string>();   // ORDER matters only for float summing (kept as the prototype)
        public int Might, Robust, Block;                     // player statuses in this combat
        public string LastWord;                              // Parrot: words of the previous cast joined by ","
        public Dictionary<string, int> WordUses = new Dictionary<string, int>(); // Journal: casts of each word key this combat
        public char? BannedLetter;                           // LEXICORE Syntax Filter
        public bool Has(string relic) => Relics.Contains(relic);
    }

    public sealed class ScoreResult
    {
        public bool Valid;
        public string Reason;
        public string EasterEgg;           // "close" / "close_enough": cast is invalid, but the attempt unlocks that achievement
        public int SpellPower;             // "chips"
        public double Mult;
        public int Output;                 // "total"
        public bool Crit;
        public bool SingleTile;            // fallback: only single letters (Mult 1, no relics)
        public List<string> Words;         // resolved words of the cast ("CAT","DOG"); for single tiles "U!!"
        public string Letters = "";        // all letters joined (R.L)
        public int Exclamations;           // number of trailing '!' tiles
        public Dictionary<int, char> Resolved = new Dictionary<int, char>(); // wildcard uid -> letter
        public List<string> Fired = new List<string>();
        public Dictionary<string, double> RelicMult = new Dictionary<string, double>();
        public bool Journal;
        public List<string> Notes = new List<string>();
        public string WordKey => Words == null ? null : string.Join(",", Words);
    }

    /// <summary>Exact port of the prototype's evaluate(tiles, weapon, check=true).</summary>
    public static class Scoring
    {
        /// <summary>Easter-egg spellings: never valid casts; trying one unlocks the achievement (data/achievements.json easterEggWords).</summary>
        public static Dictionary<string, string> EasterEggs = new Dictionary<string, string>();

        public static ScoreResult Evaluate(IReadOnlyList<Tile> tiles, WeaponDef w, ScoreContext ctx, IWordList dict, bool check = true)
        {
            var R = new ScoreResult();
            if (tiles.Count == 0) { R.Reason = "Place some tiles first."; return R; }
            string raw = new string(tiles.Select(t => t.Ch).ToArray());
            if (check && EasterEggs.TryGetValue(raw, out var egg))
            {
                R.EasterEgg = egg;
                R.Reason = egg == "close" ? "…that was close. The Tablet won't take that one." : "Close enough… but the Tablet won't take that spelling.";
                return R;
            }
            // split on commas; each part = letters + optional trailing '!' tiles
            var partsT = new List<List<Tile>> { new List<Tile>() };
            foreach (var t in tiles) { if (t.Ch == ',') partsT.Add(new List<Tile>()); else partsT[partsT.Count - 1].Add(t); }
            if (partsT.Any(p => p.Count == 0)) { R.Reason = "A comma must sit between two words (or letters)."; return R; }
            var parts = new List<List<Tile>>(); var runs = new List<int>();
            foreach (var p in partsT)
            {
                int kk = 0; while (kk < p.Count && p[p.Count - 1 - kk].Ch == '!') kk++;
                var body = p.Take(p.Count - kk).ToList();
                if (body.Any(t => t.Ch == '!')) { R.Reason = "[ ! ] tiles must sit at the end of a word or letter."; return R; }
                if (body.Count == 0) { R.Reason = "[ ! ] can't be cast on its own. Put a letter before it."; return R; }
                parts.Add(body); runs.Add(kk);
            }
            int k = runs.Sum();
            int bangBonus = runs.Sum(Letters.BangBonus);

            if (parts.All(p => p.Count == 1))
            {
                // single tiles (U, U!!, A!,B!): Mult 1, no relics, no Might/Robust
                var letters = new List<char>();
                for (int i = 0; i < parts.Count; i++) { var t = parts[i][0]; char L = t.Ch == '?' ? 'Q' : t.Ch; R.Resolved[t.Uid] = L; letters.Add(L); }
                R.Valid = true; R.SingleTile = true; R.Letters = new string(letters.ToArray());
                R.Words = letters.Select((L, i) => L + new string('!', runs[i])).ToList();
                R.SpellPower = parts.Select((p, i) => Letters.TileChip(p[0], letters[i], ctx.BannedLetter)).Sum();
                R.Mult = 1;
                if (k > 0) { R.SpellPower += bangBonus; R.Exclamations = k; }
                R.Output = R.SpellPower;
                if (parts.Count == 1 && ctx.Has("monocle")) { R.Mult += 4; R.Fired.Add("monocle"); R.Output = (int)Math.Floor(R.SpellPower * R.Mult); }
                R.Crit = R.Letters.Length + k == w.Sigil;
                AddFlatBonuses(R, w, ctx);
                return R;
            }

            var words = new List<string>();
            foreach (var part in parts)
            {
                if (part.Count == 1) { char L = part[0].Ch == '?' ? 'Q' : part[0].Ch; R.Resolved[part[0].Uid] = L; words.Add(L.ToString()); continue; }
                var pat = part.Select(t => t.Ch).ToArray();
                var wild = Enumerable.Range(0, pat.Length).Where(i => pat[i] == '?').ToArray();
                if (!check) { words.Add(new string(pat)); continue; }
                if (wild.Length == 0)
                {
                    string wd = new string(pat);
                    if (!dict.IsValid(wd)) { R.Reason = $"\"{wd}\" is not in the ancient lexicon."; return R; }
                    words.Add(wd); continue;
                }
                // try every letter for every wildcard; keep the valid word whose wildcard letters are worth the most (first found wins ties)
                string best = null; int bestV = -1; var arr = (char[])pat.Clone();
                void Rec(int j)
                {
                    if (j == wild.Length)
                    {
                        var wd = new string(arr);
                        if (dict.IsValid(wd)) { int v = wild.Sum(i => Letters.Value(arr[i])); if (v > bestV) { bestV = v; best = wd; } }
                        return;
                    }
                    foreach (var L in Letters.Order) { arr[wild[j]] = L; Rec(j + 1); }
                }
                Rec(0);
                if (best == null) { R.Reason = $"No letter for [ ? ] makes \"{new string(pat)}\" a word."; return R; }
                foreach (var i in wild) R.Resolved[part[i].Uid] = best[i];
                words.Add(best);
            }
            R.Letters = string.Concat(words);
            var letterTiles = partsT.SelectMany(p => p).Where(t => t.Ch != '!' && t.Ch != ',').ToList();
            int Chip(Tile t) => t.Ch == '?' ? 0 : Letters.TileChip(t, null, ctx.BannedLetter);
            R.SpellPower = letterTiles.Sum(Chip);
            int statBonus = w.Kind == WeaponKind.Attack ? ctx.Might : w.Kind == WeaponKind.Defense ? ctx.Robust : 0;
            if (statBonus != 0) R.SpellPower += statBonus;
            R.Mult = w.Mult;

            // Mult relics check EACH word of a comma cast on its own; single letters (length 1) don't count
            var ctxs = new List<WordContext>();
            for (int i = 0; i < parts.Count; i++)
            {
                if (words[i].Length <= 1) continue;
                ctxs.Add(new WordContext { L = words[i], Sp = parts[i].Select(Chip).ToList(), Debuffed = parts[i].Count(t => t.Debuff != TileDebuff.None), Tags = dict.Tags(words[i]) });
            }
            foreach (var rid in ctx.Relics)
            {
                if (!MultRelics.IsMultRelic(rid)) continue;
                double v = 0; foreach (var c in ctxs) { double x = MultRelics.Bonus(rid, c); if (x != 0) v += x; }
                if (v != 0) { R.Mult += v; R.Fired.Add(rid); R.RelicMult[rid] = Round2(v); }
            }
            string key = string.Join(",", words);
            if (ctx.Has("parrot") && ctx.LastWord != null && ctx.LastWord == key) { R.Mult += 3; R.Fired.Add("parrot"); }
            if (k > 0) { R.SpellPower += bangBonus; R.Exclamations = k; }
            if (ctx.Hero == "champion" && ctx.Hp < ctx.MaxHp / 2.0) R.Mult += 0.5;      // Adrenaline
            R.Crit = R.Letters.Length + k == w.Sigil;                                   // '!' tiles count toward the sigil
            R.Mult = Round2(R.Mult);
            R.Output = (int)Math.Floor(R.SpellPower * R.Mult);
            AddFlatBonuses(R, w, ctx);
            if (check && ctx.Has("journal") && ctx.WordUses.TryGetValue(key, out var uses) && uses == 1) { R.Output *= 2; R.Journal = true; R.Fired.Add("journal"); }
            R.Valid = true; R.Words = words;
            return R;
        }

        /// <summary>Added after Mult (prototype midasBonus + Berserker's Blood wrapper): Midas gold, Shield Slam half Shield, Blood missing HP.</summary>
        static void AddFlatBonuses(ScoreResult R, WeaponDef w, ScoreContext ctx)
        {
            if (w.Id == "midas") { int gb = ctx.Gold / 10 * (R.Crit ? 2 : 1); R.Output += gb; }
            if (w.Id == "slam") { R.Output += ctx.Block / 2; }
            if (w.Kind == WeaponKind.Attack && ctx.Has("blood")) { int b = (ctx.MaxHp - ctx.Hp) / 4; if (b > 0) { R.Output += b; R.Fired.Add("blood"); } }
        }

        /// <summary>JavaScript +x.toFixed(2).</summary>
        public static double Round2(double x) => Math.Round(x, 2, MidpointRounding.AwayFromZero);
    }
}
