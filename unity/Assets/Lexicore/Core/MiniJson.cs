using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Lexicore.Core
{
    /// <summary>
    /// Tiny dependency-free JSON reader (objects -> Dictionary&lt;string,object&gt;, arrays -> List&lt;object&gt;,
    /// numbers -> double, true/false, null, strings). Enough for data/*.json and the golden test files.
    /// In the game you can use com.unity.nuget.newtonsoft-json instead; Core keeps zero dependencies.
    /// </summary>
    public static class MiniJson
    {
        public static object Parse(string s) { int i = 0; var v = Value(s, ref i); return v; }
        public static int Int(object o) => o == null ? 0 : (int)Convert.ToDouble(o, CultureInfo.InvariantCulture);
        public static double Num(object o) => o == null ? 0 : Convert.ToDouble(o, CultureInfo.InvariantCulture);
        public static bool Bool(object o) => o is bool b && b;
        public static string Str(object o) => o as string;
        public static Dictionary<string, object> Obj(object o) => o as Dictionary<string, object>;
        public static List<object> Arr(object o) => o as List<object>;
        public static object Get(Dictionary<string, object> d, string k) => d != null && d.TryGetValue(k, out var v) ? v : null;

        static void Ws(string s, ref int i) { while (i < s.Length && char.IsWhiteSpace(s[i])) i++; }
        static object Value(string s, ref int i)
        {
            Ws(s, ref i);
            char c = s[i];
            if (c == '{')
            {
                var d = new Dictionary<string, object>(); i++; Ws(s, ref i);
                if (s[i] == '}') { i++; return d; }
                while (true)
                {
                    Ws(s, ref i); string k = Str(s, ref i); Ws(s, ref i); i++; // ':'
                    d[k] = Value(s, ref i); Ws(s, ref i);
                    if (s[i] == ',') { i++; continue; }
                    i++; return d; // '}'
                }
            }
            if (c == '[')
            {
                var a = new List<object>(); i++; Ws(s, ref i);
                if (s[i] == ']') { i++; return a; }
                while (true)
                {
                    a.Add(Value(s, ref i)); Ws(s, ref i);
                    if (s[i] == ',') { i++; continue; }
                    i++; return a; // ']'
                }
            }
            if (c == '"') return Str(s, ref i);
            if (s.Length - i >= 4 && string.CompareOrdinal(s, i, "true", 0, 4) == 0) { i += 4; return true; }
            if (s.Length - i >= 5 && string.CompareOrdinal(s, i, "false", 0, 5) == 0) { i += 5; return false; }
            if (s.Length - i >= 4 && string.CompareOrdinal(s, i, "null", 0, 4) == 0) { i += 4; return null; }
            int st = i; while (i < s.Length && "+-0123456789.eE".IndexOf(s[i]) >= 0) i++;
            return double.Parse(s.Substring(st, i - st), CultureInfo.InvariantCulture);
        }
        static string Str(string s, ref int i)
        {
            var sb = new StringBuilder(); i++; // opening quote
            while (true)
            {
                char c = s[i++];
                if (c == '"') return sb.ToString();
                if (c != '\\') { sb.Append(c); continue; }
                char e = s[i++];
                switch (e)
                {
                    case 'n': sb.Append('\n'); break;
                    case 't': sb.Append('\t'); break;
                    case 'r': sb.Append('\r'); break;
                    case 'b': sb.Append('\b'); break;
                    case 'f': sb.Append('\f'); break;
                    case 'u': sb.Append((char)Convert.ToInt32(s.Substring(i, 4), 16)); i += 4; break;
                    default: sb.Append(e); break;
                }
            }
        }
    }
}
