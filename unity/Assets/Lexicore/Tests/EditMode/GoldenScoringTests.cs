// Golden scoring tests: every case was produced by the prototype's evaluate(). The C# port must return the same numbers.
// Unity: Window > General > Test Runner > EditMode > Run All.
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Lexicore.Core;
using NUnit.Framework;

namespace Lexicore.Tests
{
    public static class TestData
    {
        /// <summary>Folder that holds Data/ and Tests/Golden/ (Assets/Lexicore in Unity).</summary>
        public static string Root
        {
            get
            {
#if UNITY_5_3_OR_NEWER
                return Path.Combine(UnityEngine.Application.dataPath, "Lexicore");
#else
                return System.Environment.GetEnvironmentVariable("LEXICORE_ROOT") ?? Directory.GetCurrentDirectory();
#endif
            }
        }
        public static string Read(params string[] p) => File.ReadAllText(Path.Combine(new[] { Root }.Concat(p).ToArray()));

        static WordList words; static Dictionary<string, WeaponDef> weapons;
        public static WordList Words => words ??= WordList.FromTsv(Read("Data", "words", "lexicon.tsv"));
        public static Dictionary<string, WeaponDef> Weapons => weapons ??= WeaponDef.FromJson(Read("Data", "weapons.json"));
        public static void LoadEasterEggs()
        {
            var a = MiniJson.Obj(MiniJson.Parse(Read("Data", "achievements.json")));
            Scoring.EasterEggs = MiniJson.Obj(a["easterEggWords"]).ToDictionary(kv => kv.Key, kv => (string)kv.Value);
        }
        public static Tile TileFrom(Dictionary<string, object> t, int uid)
        {
            var tile = new Tile(uid, ((string)t["ch"])[0]);
            if (t.TryGetValue("lvl", out var l)) tile.Level = MiniJson.Int(l);
            if (t.TryGetValue("paint", out var p)) tile.Paint = Tile.ParsePaint((string)p);
            if (t.TryGetValue("deb", out var d)) { tile.Debuff = Tile.ParseDebuff((string)d); tile.DebuffTurns = tile.Debuff == TileDebuff.Lock ? 2 : tile.Debuff == TileDebuff.Condemn ? 1 : 0; }
            return tile;
        }
    }

    public class GoldenScoringTests
    {
        static List<Dictionary<string, object>> cases;
        static IEnumerable<string> CaseIds()
        {
            cases ??= MiniJson.Arr(MiniJson.Obj(MiniJson.Parse(TestData.Read("Tests", "Golden", "golden_scoring.json")))["cases"]).Cast<Dictionary<string, object>>().ToList();
            return cases.Select(c => (string)c["id"]);
        }

        [OneTimeSetUp] public void Setup() { TestData.LoadEasterEggs(); CaseIds(); }

        /// <summary>Runs one golden case and returns "" when it matches, or a description of every mismatch.</summary>
        public static string Check(Dictionary<string, object> c)
        {
            int uid = 1;
            var tiles = MiniJson.Arr(c["tiles"]).Select(t => TestData.TileFrom((Dictionary<string, object>)t, uid++)).ToList();
            var ctx = new ScoreContext
            {
                Hero = (string)c["hero"], Hp = MiniJson.Int(c["hp"]), MaxHp = MiniJson.Int(c["maxHp"]), Gold = MiniJson.Int(c["gold"]),
                Relics = MiniJson.Arr(c["relics"]).Cast<string>().ToList(),
                Might = MiniJson.Int(c["might"]), Robust = MiniJson.Int(c["robust"]), Block = MiniJson.Int(c["block"]),
                LastWord = c["lastWord"] as string,
                WordUses = MiniJson.Obj(c["wordUses"]).ToDictionary(kv => kv.Key, kv => MiniJson.Int(kv.Value)),
            };
            var w = TestData.Weapons[(string)c["weapon"]];
            var R = Scoring.Evaluate(tiles, w, ctx, TestData.Words, true);
            var e = MiniJson.Obj(c["expected"]);
            var diff = new List<string>();
            void Eq(string what, object exp, object got) { if (!Equals(exp, got)) diff.Add($"{what}: expected {exp}, got {got}"); }
            Eq("valid", MiniJson.Bool(e["valid"]), R.Valid);
            if (!R.Valid || !MiniJson.Bool(e["valid"]))
            {
                Eq("easterEgg", e.TryGetValue("easterEgg", out var eg) ? eg as string : null, R.EasterEgg);
                return string.Join("; ", diff);
            }
            Eq("spellPower", MiniJson.Int(e["spellPower"]), R.SpellPower);
            Eq("mult", MiniJson.Num(e["mult"]), R.Mult);
            Eq("output", MiniJson.Int(e["output"]), R.Output);
            Eq("crit", MiniJson.Bool(e["crit"]), R.Crit);
            Eq("singleTile", MiniJson.Bool(e["singleTile"]), R.SingleTile);
            Eq("words", string.Join(",", MiniJson.Arr(e["words"]).Cast<string>()), string.Join(",", R.Words));
            Eq("relicsFired", string.Join(",", MiniJson.Arr(e["relicsFired"]).Cast<string>()), string.Join(",", R.Fired.Distinct().OrderBy(x => x, System.StringComparer.Ordinal)));
            Eq("journal", MiniJson.Bool(e["journal"]), R.Journal);
            return string.Join("; ", diff);
        }

        [TestCaseSource(nameof(CaseIds))]
        public void Scoring_matches_prototype(string id)
        {
            var c = cases.First(x => (string)x["id"] == id);
            var d = Check(c);
            Assert.IsTrue(d == "", id + ": " + d);
        }
    }
}
