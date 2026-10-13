using System.Collections.Generic;
using System.Linq;

namespace Lexicore.Core
{
    /// <summary>What a Mult relic sees: ONE word of the cast (comma casts are checked word by word).</summary>
    public sealed class WordContext
    {
        public string L;               // the word's letters, wildcards resolved, no '!'
        public List<int> Sp;           // Spell Power of each tile of this word (wildcards 0, Slimy 0)
        public int Debuffed;           // tiles of this word that carry any tile debuff (Cracked Lens)
        public WordTags Tags;          // from the word list
    }

    /// <summary>
    /// The 25 Mult relics. Exact C# translation of the prototype's multFormulaJS (see data/relics.json).
    /// Returns 0 when the relic does not fire for this word.
    /// </summary>
    public static class MultRelics
    {
        public static readonly HashSet<string> Ids = new HashSet<string> {
            "r1","r2","r3","r4","r5","r6","r7","r8","r9","r10","r11","r12","r13","r14","r15","r16","r17",
            "nametag","actionfig","moodring","swearjar","lens","fieldguide","jobboard","paintchart" };

        public static bool IsMultRelic(string id) => Ids.Contains(id);

        public static double Bonus(string id, WordContext c)
        {
            string L = c.L; int n = L.Length;
            switch (id)
            {
                case "r1": return n % 2 == 0 ? .7 : 0;                                              // Twin Moons
                case "r2": return n % 2 == 1 ? .7 : 0;                                              // Odd Fang
                case "r3": return n > 1 && L[0] == L[n - 1] ? 1.5 : 0;                               // Ouroboros Loop
                case "r4": return .45 * L.Where(Letters.IsVowel).Distinct().Count();                // Vowel Prism
                case "r5": return .4 * L.Where(ch => !Letters.IsVowel(ch)).Distinct().Count();      // Consonant Coil
                case "r6": { int k = 0; for (int i = 1; i < n; i++) if (L[i] == L[i - 1]) k++; return 1 * k; } // Mirror Shard
                case "r7": return n > 1 && L.Distinct().Count() == n ? .7 : 0;                       // Lone Wolf Seal
                case "r8": return L.GroupBy(ch => ch).Any(g => g.Count() >= 3) ? 2.5 : 0;            // Triad Totem
                case "r9": return .6 * c.Sp.Count(v => v >= 5);                                      // Heavy Ink
                case "r10": return c.Sp.Count > 0 && c.Sp.All(v => v <= 4) ? 1 : 0;                  // Pebble Charm
                case "r11": return n >= 7 ? 2 : 0;                                                   // Long Scroll
                case "r12": return c.Sp.Sum() >= 15 ? .95 : 0;                                       // Ledger Stone
                case "r13": return n % 2 == 1 && Letters.IsVowel(L[(n - 1) / 2]) ? .95 : 0;          // Heart Vowel
                case "r14": return n > 0 && L[0] >= 'A' && L[0] <= 'F' ? .7 : 0;                    // Dawn Glyph
                case "r15": return n > 0 && L[n - 1] >= 'T' && L[n - 1] <= 'Z' ? .7 : 0;            // Dusk Glyph
                case "r16": return n > 1 && Letters.IsVowel(L[0]) && Letters.IsVowel(L[n - 1]) ? 1.5 : 0; // Open Mouth
                case "r17": { int v = L.Count(Letters.IsVowel); return v > n - v ? 1.5 : 0; }        // Choir Bell
                case "nametag": return (c.Tags & WordTags.Noun) != 0 ? .7 : 0;
                case "actionfig": return (c.Tags & WordTags.Verb) != 0 ? .95 : 0;
                case "moodring": return (c.Tags & WordTags.Adjective) != 0 ? 1 : 0;
                case "swearjar": return (c.Tags & WordTags.Swear) != 0 ? 2 : 0;
                case "lens": return .7 * c.Debuffed;                                                 // Cracked Lens
                case "fieldguide": return (c.Tags & WordTags.Animal) != 0 ? 1 : 0;
                case "jobboard": return (c.Tags & WordTags.Job) != 0 ? 1 : 0;
                case "paintchart": return (c.Tags & WordTags.Color) != 0 ? 1.5 : 0;
                default: return 0;
            }
        }
    }
}
