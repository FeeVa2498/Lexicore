using System;
using System.Collections.Generic;

namespace Lexicore.Core
{
    [Flags]
    public enum WordTags : byte
    {
        None = 0, Noun = 1, Verb = 2, Adjective = 4,   // same bits as the prototype's posOf()
        Animal = 8, Job = 16, Color = 32, Swear = 64
    }

    public interface IWordList
    {
        /// <summary>Word in UPPERCASE. True if it is a valid cast word.</summary>
        bool IsValid(string upper);
        WordTags Tags(string upper);
    }

    /// <summary>
    /// The playable word list, loaded from data/words/lexicon.tsv (every row is a valid word, tags precomputed
    /// with the same rules as the prototype: WordNet part of speech, plural matching for animal/job/color, exact swear match).
    /// </summary>
    public sealed class WordList : IWordList
    {
        readonly Dictionary<string, WordTags> words;
        public int Count => words.Count;

        public WordList(Dictionary<string, WordTags> words) { this.words = words; }

        public bool IsValid(string upper) => words.ContainsKey(upper);
        public WordTags Tags(string upper) => words.TryGetValue(upper, out var t) ? t : WordTags.None;

        /// <summary>Parses lexicon.tsv text (header + rows: word length baseSpellPower noun verb adjective animal job color swear source).</summary>
        public static WordList FromTsv(string tsv)
        {
            var d = new Dictionary<string, WordTags>(200000, StringComparer.Ordinal);
            int i = 0, n = tsv.Length;
            bool header = true;
            while (i < n)
            {
                int end = tsv.IndexOf('\n', i); if (end < 0) end = n;
                if (header) { header = false; i = end + 1; continue; }
                if (end > i)
                {
                    var cols = tsv.Substring(i, end - i).TrimEnd('\r').Split('\t');
                    if (cols.Length >= 10)
                    {
                        WordTags t = WordTags.None;
                        if (cols[3] == "1") t |= WordTags.Noun;
                        if (cols[4] == "1") t |= WordTags.Verb;
                        if (cols[5] == "1") t |= WordTags.Adjective;
                        if (cols[6] == "1") t |= WordTags.Animal;
                        if (cols[7] == "1") t |= WordTags.Job;
                        if (cols[8] == "1") t |= WordTags.Color;
                        if (cols[9] == "1") t |= WordTags.Swear;
                        d[cols[0]] = t;
                    }
                }
                i = end + 1;
            }
            return new WordList(d);
        }
    }
}
