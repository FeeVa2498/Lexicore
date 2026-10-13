// Lexicore core: tiles and letter values. Pure C# (no UnityEngine), C# 9.
using System.Collections.Generic;

namespace Lexicore.Core
{
    public enum TileDebuff { None, Slimy, Poison, Lock, Condemn, Curse, Frustrate, Burn }
    public enum Paint { None, Red, Blue, Green, Gold }

    /// <summary>One tile of the deck (a "card"). Ch is 'A'..'Z', '?', '!' or ','.</summary>
    public sealed class Tile
    {
        public int Uid;
        public char Ch;
        public int Level = 1;                 // 2 = +3 Spell Power (letters only)
        public Paint Paint;
        public TileDebuff Debuff;
        public int DebuffTurns;               // Lock: 2 (counts down at end of turn), Condemn: 1
        public bool Fragile;                  // banished after one use (created tiles vanish after the fight)
        public bool Fortified;                // never discarded at end of turn, immune to tile debuffs

        public Tile() { }
        public Tile(int uid, char ch) { Uid = uid; Ch = ch; }
        public bool IsLetter => Ch >= 'A' && Ch <= 'Z';
        public Tile Clone() => (Tile)MemberwiseClone();

        public static TileDebuff ParseDebuff(string s)
        {
            switch (s)
            {
                case "slimy": return TileDebuff.Slimy;
                case "poison": return TileDebuff.Poison;
                case "lock": return TileDebuff.Lock;
                case "condemn": return TileDebuff.Condemn;
                case "curse": return TileDebuff.Curse;
                case "frustrate": return TileDebuff.Frustrate;
                case "burn": return TileDebuff.Burn;
                default: return TileDebuff.None;
            }
        }
        public static Paint ParsePaint(string s)
        {
            switch (s)
            {
                case "red": return Paint.Red;
                case "blue": return Paint.Blue;
                case "green": return Paint.Green;
                case "gold": return Paint.Gold;
                default: return Paint.None;
            }
        }
    }

    public static class Letters
    {
        public const int Level2Bonus = 3;
        public const int HandSize = 16;

        // Same key ORDER as the prototype's VAL object: wildcard ties are broken by this order (first best wins).
        public static readonly char[] Order = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".ToCharArray();
        static readonly int[] Values = { 2, 4, 4, 3, 2, 5, 3, 5, 2, 9, 6, 2, 4, 2, 2, 4, 11, 2, 2, 2, 2, 5, 5, 9, 5, 11 };

        /// <summary>Level-1 Spell Power of a letter (0 for anything else).</summary>
        public static int Value(char c) => c >= 'A' && c <= 'Z' ? Values[c - 'A'] : 0;
        public static bool IsVowel(char c) => c == 'A' || c == 'E' || c == 'I' || c == 'O' || c == 'U';

        /// <summary>Bonus for a run of k consecutive '!' at the end of a word: 2,4,6,10,16,26,42 per extra '!' (cumulative).</summary>
        public static int BangBonus(int k)
        {
            int[] fib = { 1, 2, 3, 5, 8, 13, 21 };
            int b = 0;
            for (int i = 0; i < k; i++) b += fib[System.Math.Min(i, fib.Length - 1)] * 2;
            return b;
        }

        /// <summary>
        /// Spell Power of one tile, as the prototype's tileChip(): wildcards and Slimy tiles score 0,
        /// a resolved wildcard letter is passed in 'letter', the boss Syntax Filter letter scores 0.
        /// </summary>
        // A wildcard is ALWAYS worth 0, even after it resolves to a letter (the resolved letter only matters
        // for word validity and relic conditions). Slimy tiles are worth 0. The Syntax Filter letter is worth 0.
        public static int TileChip(Tile t, char? letter = null, char? bannedLetter = null)
        {
            if (t.Ch == '?') return 0;
            if (t.Debuff == TileDebuff.Slimy) return 0;
            char L = letter ?? t.Ch;
            int v = Value(L);
            if (v == 0) return 0;
            if (bannedLetter.HasValue && L == bannedLetter.Value) return 0;
            return v + (t.Level == 2 ? Level2Bonus : 0);
        }
    }
}
