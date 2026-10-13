using System.Collections.Generic;

namespace Lexicore.Core
{
    /// <summary>Weapon kinds as in the prototype ("atk","def","buff","psn","heal","draw","forge","cleanse","store","util").</summary>
    public enum WeaponKind { Attack, Defense, Buff, Poison, Heal, Draw, Forge, Cleanse, Store, Utility }

    public sealed class WeaponDef
    {
        public string Id;
        public string Name;
        public int Cost;          // Energy
        public int Sigil;         // crit length: letters + '!' tiles (commas not counted)
        public WeaponKind Kind;
        public double Mult = 1;   // always 1 today

        public static WeaponKind ParseKind(string k)
        {
            switch (k)
            {
                case "atk": case "attack": return WeaponKind.Attack;
                case "def": case "defense": return WeaponKind.Defense;
                case "buff": return WeaponKind.Buff;
                case "psn": case "poison": return WeaponKind.Poison;
                case "heal": return WeaponKind.Heal;
                case "draw": return WeaponKind.Draw;
                case "forge": return WeaponKind.Forge;
                case "cleanse": return WeaponKind.Cleanse;
                case "store": return WeaponKind.Store;
                case "util": case "utility": return WeaponKind.Utility;
                default: throw new System.ArgumentException("Unknown weapon kind " + k);
            }
        }

        /// <summary>Loads weapons from data/weapons.json (parsed with MiniJson).</summary>
        public static Dictionary<string, WeaponDef> FromJson(string json)
        {
            var root = (Dictionary<string, object>)MiniJson.Parse(json);
            var d = new Dictionary<string, WeaponDef>();
            foreach (Dictionary<string, object> w in (List<object>)root["weapons"])
            {
                var def = new WeaponDef
                {
                    Id = (string)w["id"],
                    Name = (string)w["name"],
                    Cost = MiniJson.Int(w["energyCost"]),
                    Sigil = MiniJson.Int(w["critLength"]),
                    Kind = ParseKind((string)w["kind"]),
                    Mult = MiniJson.Num(w["mult"]),
                };
                d[def.Id] = def;
            }
            return d;
        }
    }
}
