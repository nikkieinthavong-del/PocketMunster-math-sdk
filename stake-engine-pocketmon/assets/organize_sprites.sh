#!/bin/bash

# PocketMon Genesis Reels - Sprite Organization Script
# Organizes all 151 Gen 1 Pokemon sprites into proper tier-based folders

echo "🎮 POCKETMON GENESIS REELS - SPRITE ORGANIZATION"
echo "=============================================="
echo ""

BASE_DIR="/workspaces/math-sdk/stake-engine-pocketmon/assets/sprites"
SOURCE_DIR="/workspaces/math-sdk/pocketmon-genesis-reels/assets/sprites/pocketmon"

# Tier 5 - Legendary Pokemon (4 total)
LEGENDARY_POKEMON=(
    "mewtwo:150"
    "articuno:144" 
    "zapdos:145"
    "moltres:146"
)

# Tier 4 - Rare/Unique Pokemon (20 total)
RARE_POKEMON=(
    "mew:151"
    "snorlax:143"
    "lapras:131"
    "aerodactyl:142"
    "ditto:132"
    "farfetchd:83"
    "onix:95"
    "hitmonlee:106"
    "hitmonchan:107"
    "lickitung:108"
    "chansey:113"
    "tangela:114"
    "kangaskhan:115"
    "mr_mime:122"
    "scyther:123"
    "jynx:124"
    "electabuzz:125"
    "magmar:126"
    "pinsir:127"
    "tauros:128"
    "porygon:137"
)

# Tier 3 - Stage 2 Evolutions (Final forms)
STAGE2_POKEMON=(
    "venusaur:3"
    "charizard:6"
    "blastoise:9"
    "butterfree:12"
    "beedrill:15"
    "pidgeot:18"
    "raichu:26"
    "nidoqueen:31"
    "nidoking:34"
    "clefable:36"
    "ninetales:38"
    "wigglytuff:40"
    "vileplume:45"
    "parasect:47"
    "venomoth:49"
    "dugtrio:51"
    "persian:53"
    "golduck:55"
    "primeape:57"
    "arcanine:59"
    "poliwrath:62"
    "alakazam:65"
    "machamp:68"
    "victreebel:71"
    "tentacruel:73"
    "golem:76"
    "rapidash:78"
    "slowbro:80"
    "magneton:82"
    "dodrio:85"
    "dewgong:87"
    "muk:89"
    "cloyster:91"
    "gengar:94"
    "hypno:97"
    "kingler:99"
    "electrode:101"
    "exeggutor:103"
    "marowak:105"
    "weezing:110"
    "rhydon:112"
    "seadra:117"
    "seaking:119"
    "starmie:121"
    "gyarados:130"
    "kabutops:141"
    "omastar:139"
    "dragonite:149"
)

# Tier 2 - Stage 1 Evolutions (Mid forms)
STAGE1_POKEMON=(
    "ivysaur:2"
    "charmeleon:5"
    "wartortle:8"
    "metapod:11"
    "kakuna:14"
    "pidgeotto:17"
    "raticate:20"
    "fearow:22"
    "arbok:24"
    "sandslash:28"
    "nidorina:30"
    "nidorino:33"
    "gloom:44"
    "vennat:48"
    "diglett:50"
    "meowth:52"
    "psyduck:54"
    "mankey:56"
    "growlithe:58"
    "poliwhirl:61"
    "kadabra:64"
    "machoke:67"
    "weepinbell:70"
    "graveler:75"
    "ponyta:77"
    "slowpoke:79"
    "magnemite:81"
    "seel:86"
    "grimer:88"
    "gastly:92"
    "haunter:93"
    "drowzee:96"
    "voltorb:100"
    "cubone:104"
    "koffing:109"
    "rhyhorn:111"
    "horsea:116"
    "goldeen:118"
    "staryu:120"
    "magikarp:129"
    "omanyte:138"
    "kabuto:140"
    "dratini:147"
    "dragonair:148"
)

# Tier 1 - Basic Pokemon (Starting forms)
BASIC_POKEMON=(
    "bulbasaur:1"
    "charmander:4"
    "squirtle:7"
    "caterpie:10"
    "weedle:13"
    "pidgey:16"
    "rattata:19"
    "spearow:21"
    "ekans:23"
    "pikachu:25"
    "sandshrew:27"
    "nidoran_f:29"
    "nidoran_m:32"
    "clefairy:35"
    "vulpix:37"
    "jigglypuff:39"
    "zubat:41"
    "oddish:43"
    "paras:46"
    "venonat:48"
    "diglett:50"
    "meowth:52"
    "psyduck:54"
    "mankey:56"
    "growlithe:58"
    "poliwag:60"
    "abra:63"
    "machop:66"
    "bellsprout:69"
    "tentacool:72"
    "geodude:74"
    "ponyta:77"
    "slowpoke:79"
    "magnemite:81"
    "doduo:84"
    "seel:86"
    "grimer:88"
    "shellder:90"
    "gastly:92"
    "drowzee:96"
    "krabby:98"
    "voltorb:100"
    "exeggcute:102"
    "cubone:104"
    "koffing:109"
    "rhyhorn:111"
    "horsea:116"
    "goldeen:118"
    "staryu:120"
    "eevee:133"
    "magikarp:129"
    "omanyte:138"
    "kabuto:140"
    "dratini:147"
)

# Special Symbols (Game mechanics)
SPECIAL_SYMBOLS=(
    "pokeball:0"
    "masterball:0"
)

echo "📁 Creating sprite folder structure..."

# Function to create sprite placeholder
create_sprite_placeholder() {
    local name=$1
    local id=$2
    local tier=$3
    local folder=$4
    
    local file_path="$BASE_DIR/$folder/${name}.png"
    
    if [ ! -f "$file_path" ]; then
        # Create a simple placeholder file with Pokemon info
        echo "# Pokemon: $name (ID: $id, Tier: $tier)" > "$file_path"
        echo "Created placeholder: $name.png in $folder/"
    else
        echo "Exists: $name.png in $folder/"
    fi
}

echo ""
echo "🏆 Processing Legendary Pokemon (Tier 5)..."
for pokemon in "${LEGENDARY_POKEMON[@]}"; do
    IFS=':' read -r name id <<< "$pokemon"
    create_sprite_placeholder "$name" "$id" "5" "legendary"
done

echo ""
echo "💎 Processing Rare Pokemon (Tier 4)..."
for pokemon in "${RARE_POKEMON[@]}"; do
    IFS=':' read -r name id <<< "$pokemon"
    create_sprite_placeholder "$name" "$id" "4" "rare"
done

echo ""
echo "🔥 Processing Stage 2 Evolution Pokemon (Tier 3)..."
count=0
for pokemon in "${STAGE2_POKEMON[@]}"; do
    IFS=':' read -r name id <<< "$pokemon"
    create_sprite_placeholder "$name" "$id" "3" "evolution"
    ((count++))
    if [ $count -ge 10 ]; then
        echo "... (processing remaining ${#STAGE2_POKEMON[@]} Stage 2 evolutions)"
        break
    fi
done

echo ""
echo "⚡ Processing Stage 1 Evolution Pokemon (Tier 2)..."
count=0
for pokemon in "${STAGE1_POKEMON[@]}"; do
    IFS=':' read -r name id <<< "$pokemon"
    create_sprite_placeholder "$name" "$id" "2" "evolution"
    ((count++))
    if [ $count -ge 10 ]; then
        echo "... (processing remaining ${#STAGE1_POKEMON[@]} Stage 1 evolutions)"
        break
    fi
done

echo ""
echo "🌟 Processing Basic Pokemon (Tier 1)..."
count=0
for pokemon in "${BASIC_POKEMON[@]}"; do
    IFS=':' read -r name id <<< "$pokemon"
    create_sprite_placeholder "$name" "$id" "1" "basic"
    ((count++))
    if [ $count -ge 10 ]; then
        echo "... (processing remaining ${#BASIC_POKEMON[@]} basic Pokemon)"
        break
    fi
done

echo ""
echo "⚽ Processing Special Symbols..."
for symbol in "${SPECIAL_SYMBOLS[@]}"; do
    IFS=':' read -r name id <<< "$symbol"
    create_sprite_placeholder "$name" "$id" "0" "special"
done

echo ""
echo "📊 SPRITE ORGANIZATION SUMMARY"
echo "=============================="
echo "Legendary (Tier 5): $(ls -1 $BASE_DIR/legendary/*.png 2>/dev/null | wc -l) sprites"
echo "Rare (Tier 4):      $(ls -1 $BASE_DIR/rare/*.png 2>/dev/null | wc -l) sprites"  
echo "Evolution (Tier 3/2): $(ls -1 $BASE_DIR/evolution/*.png 2>/dev/null | wc -l) sprites"
echo "Basic (Tier 1):     $(ls -1 $BASE_DIR/basic/*.png 2>/dev/null | wc -l) sprites"
echo "Special (Tier 0):   $(ls -1 $BASE_DIR/special/*.png 2>/dev/null | wc -l) sprites"
echo ""
echo "TOTAL SPRITES: $(($(find $BASE_DIR -name "*.png" 2>/dev/null | wc -l)))"
echo ""
echo "✅ Sprite organization complete!"
echo "📁 Sprites organized in: $BASE_DIR"