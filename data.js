/* OWC Crew Hub - game data.
   Update this file when THE FINALS changes (or ask Claude to). */
window.OWC_DATA = {
  dataVersion: "12.3.0",
  dataNote: "Updated through patch 12.3.0 (Nov 12, 2026). Weapon stats: THE FINALS Wiki and community stat databases. Tiers are an early Season 12 list (patch 12.0, Oct 21) from a third-party site; patches 12.1 to 12.3 changed some items since, flagged in Intel.",

  season: {
    name: "Season 12 · PRIME TIME",
    started: "2026-10-20",
    highlights: [
      "New Light playstyle, The Infiltrator: True Sight spec, Mimic Device and Translocator",
      "Solo Showdown (beta): 12 players, 3 rounds, 8 mini-modes. Leaderboard added in 12.1",
      "Health rebalance: Light 175 HP (was 150), Heavy 325 HP (was 350)",
      "Arena reworks: Monaco, Seoul, Skyway Stadium and Las Vegas Stadium",
      "New destruction: buildings sag and hinge, Blast Waves, debris piles, smoke and gas that explosions can blow away",
      "Sponsor Journey: OSPUZE, ALFA ACTA and ISEUL-T with Handlers, Challenges and Contracts",
      "VRs removed: gear unlocks through Playstyle Tokens; World Tour now ranks up with Fans",
      "New HUD and menus, Dynamic Commentary (beta), footsteps rework, new lighting"
    ],
    happening: [
      "Head Hunter LTM is back (12.3)",
      "TGM26 Pick'em runs until Nov 27; the Grand Major is Nov 27 to 29 in Stockholm",
      "Twitch Drops until Nov 26: Dagger, CB-01 Repeater and SA1216 skins"
    ],
    links: [
      { label: "Official patch notes", url: "https://www.reachthefinals.com/patchnotes" },
      { label: "THE FINALS on Steam", url: "https://store.steampowered.com/app/2073850/THE_FINALS/" }
    ]
  },

  health: { Light: { hp: 175, was: 150, note: "Slightly slower: sprint 7 → 6.6 m/s, regen delay 7 → 8s" },
            Medium: { hp: 250, was: 250, note: "Unchanged" },
            Heavy: { hp: 325, was: 350, note: "Slightly faster: sprint 5.8 → 6 m/s, run 3.8 → 4.35 m/s" } },

  patchLog: [
    { v: "12.3.0", date: "2026-11-12", items: [
      "Shockwave: building damage 3,000 → 1,000, cooldown 12 → 15s, glitch 2 → 1s",
      "Dome Shield: health 600 → 400, decay 100 → 66 per second",
      "Healing Emitter: max healing 20 → 15 per second",
      "H+ Infuser: 10 → 7 per shot, ammo 20 → 30",
      "Translocator: deploy time instant → 0.3s",
      "Flamethrower: impact damage 30 → 26, heat per tick 50 → 25",
      "Cerberus 12GA: burns targets faster; burning max damage 32 → 45",
      "C4, Breach Charge, Breach Drill: environmental damage retuned",
      "Game Show Events start at 4 min (was 2) and last 3 min (was 5)",
      "Head Hunter LTM returns; TGM26 bundles, Event Pass and Pick'em" ] },
    { v: "12.2.0", date: "2026-11-05", items: [
      "AKM: magazine 34 → 36",
      "Chimera-XB: damage 47 → 48, fire rate 260 → 280 RPM",
      "FCAR: damage 23 → 25, fire rate 530 → 500 RPM, magazine 25 → 20" ] },
    { v: "12.1.0", date: "2026-10-29", items: [
      "Translocator: max range 70 → 50m",
      "CB-01 Repeater: damage 88 → 85",
      "Pike-556: headshot multiplier 1.75 → 1.5",
      "Solo Showdown leaderboard added; shotgun hitmarker setting added" ] },
    { v: "12.0.0", date: "2026-10-20", items: [
      "Light 150 → 175 HP, Heavy 350 → 325 HP, movement retuned",
      "New: True Sight, Mimic Device, Translocator; Sonar Grenade now on Medium too",
      "Frag 140 → 165, Explosive Mine 120 → 145, Pyro Grenade +40 impact damage, Pyro Mine 55 → 45",
      "Dome Shield 250 → 600 HP (decays), Gas Grenade 8s / 2 charges, Smoke 13s and bigger",
      "Gateway cooldown 40 → 50s, Vanishing Bomb 25 → 30s, Thermal Bore fuse 1.75 → 1.4s",
      "Healing Beam 46 → 50 per second; Charge 'N' Slam no longer hits airborne targets",
      "Guns: BFR Titan 95, CB-01 88, Chimera 47, KS-23 100, LH1 40, Lewis 520 RPM, M60 600 RPM, MGL32 97, P90 15, Pike 50, R .357 76, SR-84 122, XP-54 34-round mag, SA1216 less recoil",
      "Melee rework: predictive lunges; Dagger backstab 90, Dual Blades and Riot Shield up, Sword 71/110 → 65/100",
      "Cashout: vaults open in 10s (was 20), rounds 9.5 min, final round 14 min",
      "Original Las Vegas retired, Las Vegas Sandstorm returns, Kyoto Moving Platforms off" ] }
  ],
  changedSinceTiers: [
    "Shockwave, Dome Shield, Healing Emitter and H+ Infuser were all nerfed in 12.3",
    "Translocator got a shorter range (12.1) and a deploy delay (12.3)",
    "CB-01 Repeater and Pike-556 were toned down in 12.1",
    "FCAR was reworked in 12.2: harder hits, slower fire, smaller magazine",
    "Chimera-XB and AKM got small buffs in 12.2"
  ],
  soloShowdown: [
    ["Blast Off!", "Grenade launchers and Dash, airborne fights"],
    ["Heavy Hitters", "Sledgehammer and Charge 'N' Slam; low health = more knockback"],
    ["Boom Brawl", "Sword and Dash; eliminated players leave a surprise"],
    ["Slam-A-Rama", "Jump Pads and a boosted Charge 'N' Slam"],
    ["Sniper Standoff", "Grappling Hook positioning and sniper duels"],
    ["Winch Wars", "Long Winch Claw and strong kicks to knock players off edges"],
    ["Turbo Tussle", "Shotguns and Dash at high speed"],
    ["One and Gunned", "One revolver bullet; eliminations earn more"]
  ],

  modes: ["Cashout", "Quick Cash", "Ranked Cashout", "Power Shift", "Point Break", "Team Deathmatch", "Head2Head", "Bank It", "Head Hunter (LTM)", "Solo Showdown", "World Tour", "Private Match", "Other"],
  maps: ["Bernal", "Fangwai City", "Fortune Stadium", "Galaxy Estates", "Kyoto", "Las Vegas Stadium", "Las Vegas (Sandstorm)", "Monaco", "Nozomi/Citadel", "Seoul", "Skyway Stadium", "SYS$HORIZON"],
  reworkedMaps: ["Monaco", "Seoul", "Skyway Stadium", "Las Vegas Stadium"],
  common: ["Flashbang", "Frag Grenade", "Gas Grenade", "Goo Grenade", "Pyro Grenade", "Smoke Grenade"],
  classes: {
    Light: {
      color: "#7fd4ff",
      specs: ["Cloaking Device", "Evasive Dash", "Grappling Hook", "True Sight"],
      weapons: ["93R", "ARN-220", "Dagger", "LH1", "M11", "M26 Matter", "Recurve Bow", "SH1900", "SR-84", "Sword", "Throwing Knives", "V9S", "XP-54"],
      gadgets: ["Breach Charge", "Gateway", "Glitch Grenade", "Gravity Vortex", "H+ Infuser", "Mimic Device", "Nullifier", "Sonar Grenade", "Thermal Bore", "Tracking Dart", "Translocator", "Vanishing Bomb"]
    },
    Medium: {
      color: "#b07cff",
      specs: ["Dematerializer", "Guardian Turret", "Healing Beam", "Shockwave"],
      weapons: ["AKM", "CB-01 Repeater", "Cerberus 12GA", "Chimera-XB", "CL-40", "Dual Blades", "FAMAS", "FCAR", "Model 1887", "P90", "Pike-556", "R .357", "Riot Shield"],
      gadgets: ["APS Turret", "Breach Drill", "Data Reshaper", "Defibrillator", "Explosive Mine", "Gas Mine", "Glitch Trap", "Hover Pad", "Jump Pad", "Proximity Sensor", "Sonar Grenade", "Zipline"]
    },
    Heavy: {
      color: "#f0a43a",
      specs: ["Charge 'N' Slam", "Goo Gun", "Mesh Shield", "Winch Claw"],
      weapons: [".50 Akimbo", "BFR Titan", "Flamethrower", "KS-23", "Lewis Gun", "M134 Minigun", "M60", "MGL32", "SA1216", "ShAK-50", "Sledgehammer", "Spear"],
      gadgets: ["Anti-Gravity Cube", "Barricade", "C4", "Dome Shield", "Explosive Mine", "Healing Emitter", "Lockbolt", "Proximity Sensor", "Pyro Mine", "RPG-7"]
    }
  },

  /* Season 12 tiers per build (early-season list, patch 12.0). Comp Meta rolls use S and A. */
  tiers: {
    Light: {
      "ARN-220": "S", "M11": "S", "XP-54": "A", "93R": "A", "V9S": "A", "SR-84": "A", "Recurve Bow": "A",
      "LH1": "B", "Dagger": "B", "M26 Matter": "B", "Throwing Knives": "B", "Sword": "C", "SH1900": "C",
      "Evasive Dash": "S", "Cloaking Device": "A", "True Sight": "A", "Grappling Hook": "B",
      "Sonar Grenade": "S", "Translocator": "S", "Gateway": "S", "H+ Infuser": "S", "Frag Grenade": "A", "Smoke Grenade": "A",
      "Glitch Grenade": "A", "Nullifier": "A", "Gravity Vortex": "A", "Vanishing Bomb": "B", "Mimic Device": "B", "Tracking Dart": "B",
      "Goo Grenade": "B", "Pyro Grenade": "B", "Flashbang": "B", "Breach Charge": "C", "Thermal Bore": "C"
    },
    Medium: {
      "Chimera-XB": "S", "R .357": "S", "Cerberus 12GA": "S", "FCAR": "A", "CB-01 Repeater": "A", "Pike-556": "A", "P90": "A",
      "Riot Shield": "A", "FAMAS": "A", "AKM": "A", "Model 1887": "A", "Dual Blades": "B", "CL-40": "B",
      "Shockwave": "S", "Healing Beam": "A", "Dematerializer": "A", "Guardian Turret": "B",
      "Jump Pad": "S", "Defibrillator": "S", "Goo Grenade": "S", "Sonar Grenade": "A", "Zipline": "A", "Glitch Trap": "A", "Data Reshaper": "A",
      "Frag Grenade": "A", "Gas Mine": "B", "APS Turret": "B", "Explosive Mine": "B", "Smoke Grenade": "B", "Pyro Grenade": "B", "Flashbang": "B",
      "Gas Grenade": "C", "Proximity Sensor": "C", "Hover Pad": "C", "Breach Drill": "C"
    },
    Heavy: {
      "Lewis Gun": "S", ".50 Akimbo": "S", "BFR Titan": "S", "KS-23": "S", "SA1216": "A", "ShAK-50": "A", "M60": "A",
      "MGL32": "B", "Sledgehammer": "B", "M134 Minigun": "B", "Spear": "C", "Flamethrower": "C",
      "Mesh Shield": "S", "Winch Claw": "A", "Charge 'N' Slam": "B", "Goo Gun": "B",
      "Dome Shield": "S", "C4": "S", "RPG-7": "S", "Barricade": "S", "Healing Emitter": "S", "Lockbolt": "A", "Explosive Mine": "A", "Goo Grenade": "A",
      "Anti-Gravity Cube": "B", "Frag Grenade": "B", "Pyro Grenade": "B", "Flashbang": "C", "Gas Grenade": "C", "Proximity Sensor": "C"
    }
  },
  metaNotes: [
    "Light got 25 more health (175), so steady guns like the ARN-220 and M11 lead, and the Sword no longer two-shots a Light.",
    "Medium's top picks moved to Chimera-XB, R .357 and Cerberus 12GA, with Shockwave as the top spec. Shockwave was nerfed in 12.3.",
    "Heavy lost 25 health (325) but moves faster. Lewis Gun, .50 Akimbo, BFR Titan and KS-23 lead; Mesh Shield is the top spec.",
    "New destruction rewards explosives: Frag, C4 and RPG-7 hit harder with Blast Waves, and blasts can clear enemy smoke.",
    "Translocator was the breakout Light gadget, but it has been nerfed twice since (12.1 and 12.3)."
  ],
  metaBuilds: [
    { cls: "Light", name: "Point Man", spec: "Evasive Dash", weapon: "ARN-220", gadgets: ["Sonar Grenade", "Translocator", "Frag Grenade"] },
    { cls: "Light", name: "Close Quarters", spec: "Evasive Dash", weapon: "M11", gadgets: ["Gateway", "H+ Infuser", "Sonar Grenade"] },
    { cls: "Medium", name: "Precision", spec: "Shockwave", weapon: "R .357", gadgets: ["Jump Pad", "Defibrillator", "Goo Grenade"] },
    { cls: "Medium", name: "Bolt Thrower", spec: "Shockwave", weapon: "Chimera-XB", gadgets: ["Defibrillator", "Jump Pad", "Glitch Trap"] },
    { cls: "Heavy", name: "Cashout Wall", spec: "Mesh Shield", weapon: "KS-23", gadgets: ["Dome Shield", "C4", "Barricade"] },
    { cls: "Heavy", name: "Long Range", spec: "Mesh Shield", weapon: "BFR Titan", gadgets: ["RPG-7", "Healing Emitter", "Barricade"] }
  ],
  metaBuildNote: "Weapon and spec picks are the Season 12 S-tier recommendations; gadgets are filled in from each build's S-tier gadgets. Examples, not an official list.",

  /* Weapon stats. dmg = body damage per shot, dps = dmg x RPM / 60, ttk = time to eliminate a Medium (250 HP).
     Base numbers: Season 11 (patch 11.4.1) with every Season 12 change through 12.3 applied.
     TTK is blank for guns whose damage or fire rate changed this season (to be re-measured). */
  weaponStats: {
    "ShAK-50": { type: "Hybrid rifle", dmg: 30, rpm: 420, dps: 210, mag: 20, ttk: 1.14 },
    "M11": { type: "SMG", dmg: 16, rpm: 1000, dps: 267, mag: 40, ttk: 0.90 },
    "FCAR": { type: "Assault rifle", dmg: 25, rpm: 500, dps: 208, mag: 20, ttk: null, s12: "12.2: dmg 23 → 25, 530 → 500 RPM, mag 25 → 20" },
    "KS-23": { type: "Shotgun", dmg: 100, rpm: 85, dps: 142, mag: 6, ttk: null, s12: "12.0: dmg 104 → 100" },
    "CB-01 Repeater": { type: "Marksman", dmg: 85, rpm: 82, dps: 116, mag: 8, ttk: 1.56, s12: "12.0: 84 → 88, 12.1: 88 → 85" },
    "XP-54": { type: "SMG", dmg: 16, rpm: 880, dps: 235, mag: 34, ttk: 1.05, s12: "12.0: mag 36 → 34" },
    "V9S": { type: "Pistol", dmg: 38, rpm: 360, dps: 228, mag: 18, ttk: 1.00 },
    "ARN-220": { type: "Assault rifle", dmg: 17, rpm: 725, dps: 205, mag: 30, ttk: 1.16 },
    "P90": { type: "SMG", dmg: 15, rpm: 857, dps: 214, mag: 50, ttk: null, s12: "12.0: dmg 14 → 15" },
    "AKM": { type: "Assault rifle", dmg: 20, rpm: 617, dps: 206, mag: 36, ttk: 1.17, s12: "12.2: mag 34 → 36" },
    "SA1216": { type: "Shotgun", dmg: 72, rpm: 190, dps: 228, mag: 16, ttk: 0.95, s12: "12.0: ~20% less recoil, tighter spread, better falloff" },
    "Lewis Gun": { type: "LMG", dmg: 23, rpm: 520, dps: 199, mag: 47, ttk: null, s12: "12.0: 500 → 520 RPM" },
    "M60": { type: "LMG", dmg: 20, rpm: 600, dps: 200, mag: 70, ttk: null, s12: "12.0: 580 → 600 RPM" },
    "Model 1887": { type: "Shotgun", dmg: 117, rpm: 77, dps: 150, mag: 6, ttk: 1.79 },
    ".50 Akimbo": { type: "Dual pistols", dmg: 46, rpm: 230, dps: 176, mag: 14, ttk: 1.30 },
    "LH1": { type: "Marksman", dmg: 40, rpm: 270, dps: 180, mag: 15, ttk: null, s12: "12.0: dmg 44 → 40, falloff starts at 35m (was 50m)" },
    "93R": { type: "Burst pistol", dmg: 24, rpm: 220, dps: 88, mag: 27, ttk: 1.19 },
    "FAMAS": { type: "Burst rifle", dmg: 24, rpm: null, dps: null, mag: 27, ttk: 1.20 },
    "Chimera-XB": { type: "Crossbow", dmg: 48, rpm: 280, dps: 224, mag: null, ttk: null, s12: "12.0: 45 → 47, 12.2: 47 → 48 and 260 → 280 RPM" },
    "BFR Titan": { type: "Long-range revolver", dmg: 95, rpm: 71, dps: 112, mag: 5, ttk: null, s12: "12.0: dmg 90 → 95, faster reload" },
    "Pike-556": { type: "Marksman", dmg: 50, rpm: 200, dps: 167, mag: 12, ttk: 1.20, s12: "12.0: dmg 49 → 50, 12.1: headshot x1.75 → x1.5" },
    "R .357": { type: "Revolver", dmg: 76, rpm: 140, dps: 177, mag: 6, ttk: 1.29, s12: "12.0: dmg 74 → 76 (headshot 152)" },
    "SR-84": { type: "Sniper", dmg: 122, rpm: 45, dps: 92, mag: 6, ttk: 2.67, s12: "12.0: dmg 118 → 122 (headshot 244)" },
    "MGL32": { type: "Grenade launcher", dmg: 97, rpm: 90, dps: 146, mag: 6, ttk: 1.33, s12: "12.0: dmg 83 → 97, Blast Waves" },
    "Flamethrower": { type: "Flamethrower", dmg: 26, rpm: 170, dps: 74, mag: 30, ttk: null, s12: "12.3: impact 30 → 26, heat per tick 50 → 25", note: "Plus burn damage over time" },
    "Cerberus 12GA": { type: "Shotgun", dmg: 117, rpm: 100, dps: 195, mag: 3, ttk: 1.20, s12: "12.3: sets targets burning much faster", note: "13 pellets × 9 damage, plus burn" },
    "Dagger": { type: "Melee", dmg: 70, note: "Precise hit 70 (glancing 49). Backstab 340.", s12: "12.0: backstab faster, lunge 5 → 4.25m" },
    "Sword": { type: "Melee", dmg: 100, note: "Precise hit 100 (glancing 65). Lunge attack 120.", s12: "12.0: damage 71/110 → 65/100, lunge 4.25 → 4m" },
    "Dual Blades": { type: "Melee", dmg: 60, note: "Precise hit 60 (glancing 39). Cross Slash 155 (glancing 100).", s12: "12.0: 37/57 → 39/60, Cross Slash 91/140 → 100/155" },
    "Riot Shield": { type: "Melee", dmg: 90, note: "Precise hit 90 (glancing 63). Shield Bash 50.", s12: "12.0: 60/86 → 63/90, bigger hitboxes, longer Shield Bash" },
    "Sledgehammer": { type: "Melee", dmg: 120, note: "Precise hit 120 (glancing 90). Overhead 200 (glancing 150).", s12: "12.0: lunge 5 → 4.5m" },
    "Spear": { type: "Melee", dmg: 82, note: "Precise hit 82 (glancing 57). Spin attack 75, 125, then 150.", s12: "12.0: lunge 6.5 → 5.75m, narrower hitbox" },
    "Throwing Knives": { type: "Throwing", dmg: 60, rpm: 107, dps: 107, ttk: 1.56, note: "Charged throw 140" }, "Recurve Bow": { type: "Bow", dmg: 126, rpm: 78, dps: 164, ttk: 1.25, note: "60 to 126 depending on draw; 2 charged shots down a Medium" }, "SH1900": { type: "Shotgun", dmg: 180, rpm: 80, dps: 240, mag: 2, ttk: 0.75, note: "15 pellets × 12 damage" }, "M26 Matter": { type: "Shotgun", dmg: 121, rpm: 84, dps: 169, mag: 8, ttk: 1.43, note: "11 pellets × 11 damage" },
    "CL-40": { type: "Grenade launcher", dmg: 105, rpm: 73, dps: 128, mag: 5, ttk: 1.60, s12: "12.0: gained Blast Waves", note: "Direct hit 105; hurts you if too close" }, "M134 Minigun": { type: "Minigun", dmg: 11, rpm: 1500, dps: 275, mag: 300, ttk: 0.88, note: "Needs spin-up" }
  },

  /* [cooldown seconds, what it does (Season 12 values)] */
  gadgetStats: {
    "Breach Charge": [20, "Sticks to a surface, blows it open on command (Blast Waves; retuned in 12.3)"],
    "Gateway": [50, "Two linked portals, first portal up to 60m away"],
    "Glitch Grenade": [25, "Briefly shuts down enemy specs, gadgets and deployables"],
    "Gravity Vortex": [20, "Pulls nearby players and objects inward"],
    "H+ Infuser": [12, "Healing rounds for teammates: 7 per shot, 30 ammo (12.3)"],
    "Mimic Device": [3, "NEW: disguise as a scanned prop; some keep the prop's function"],
    "Nullifier": [18, "Zap a target to briefly stop their items and damage"],
    "Thermal Bore": [25, "Burrows through a wall to open a sightline (1.4s fuse)"],
    "Tracking Dart": [12, "Marks an enemy so the squad sees them through walls"],
    "Translocator": [25, "NEW: swap places with a marked object, 50m range, 0.3s deploy (12.3)"],
    "Vanishing Bomb": [30, "Cloaks teammates in the blast for a bit"],
    "APS Turret": [null, "Shoots down incoming grenades and projectiles"],
    "Breach Drill": [15, "Flashes the other side, then drills through (radii retuned in 12.3)"],
    "Data Reshaper": [26, "Turns objects and enemy deployables into something else"],
    "Defibrillator": [45, "Revives a downed teammate at 40% HP"],
    "Gas Mine": [27, "Gas cloud when triggered or destroyed (3.5m radius)"],
    "Glitch Trap": [20, "Disables nearby enemy specs and gadgets when triggered"],
    "Hover Pad": [11, "A platform that floats mid-air"],
    "Jump Pad": [40, "Launches anyone who steps on it"],
    "Zipline": [30, "Ride between two points"],
    "Anti-Gravity Cube": [28, "Zone where players and objects float"],
    "Barricade": [30, "Portable wall for cover"],
    "C4": [45, "Remote explosive with Blast Waves (environment damage retuned in 12.3)"],
    "Dome Shield": [30, "Bubble shield: 400 HP, decays 66 per second (12.3)"],
    "Healing Emitter": [30, "Heals everyone nearby, up to 15 HP per second (12.3)"],
    "Lockbolt": [30, "Latches on and limits an enemy's movement; Gateways break it"],
    "Pyro Mine": [27, "Explodes (45 damage) and sets the area on fire"],
    "RPG-7": [45, "Rocket with Blast Waves for people and structures"],
    "Sonar Grenade": [34, "Pulses that reveal nearby enemies (Light and Medium)"],
    "Proximity Sensor": [20, "Reveals enemies in its line of sight"],
    "Explosive Mine": [15, "145 damage when an enemy touches or shoots it"],
    "Flashbang": [18, "Blinds for 2 to 5s; much weaker on teammates"],
    "Frag Grenade": [20, "Up to 165 damage with Blast Waves"],
    "Gas Grenade": [20, "2 charges, 8s toxic cloud, 4.5m radius"],
    "Goo Grenade": [30, "Makes a wall of goo"],
    "Pyro Grenade": [24, "40 impact damage, then sets the area on fire"],
    "Smoke Grenade": [50, "13s of smoke, 4.5m radius; explosions can blow it away"]
  },
  specStats: {
    "Cloaking Device": ["Energy meter", "Hard to spot; louder in Season 12 and countered by True Sight"],
    "Evasive Dash": ["2 charges", "Quick dash to dodge or close in"],
    "Grappling Hook": ["4 to 7.5s", "Swing across the arena; cooldown scales with grapple time"],
    "True Sight": ["Energy meter", "NEW: highlights enemies through smoke, cloaks and disguises"],
    "Dematerializer": ["3 charges, 15s each", "Temporarily opens a wall"],
    "Guardian Turret": ["35s if destroyed", "Turret that fires on enemies; highlights its target through walls and smoke"],
    "Healing Beam": ["7.5s after overheat", "Heals a teammate in sight, 50 HP per second"],
    "Shockwave": ["2 charges, 15s", "Blast orb that pushes; glitch 1s, much less building damage (12.3)"],
    "Charge 'N' Slam": ["12s", "Charge through walls; slam only damages targets near the ground"],
    "Goo Gun": ["20 ammo", "Shoot goo for cover and blocks"],
    "Mesh Shield": ["Energy meter", "Front barrier your squad can shoot through"],
    "Winch Claw": ["10 to 18s", "Grab an enemy or object and yank it in"]
  },

  /* Daily Sponsor Trials. 3 are picked each day (same for the whole crew). */
  sponsors: {
    "Night Watch": { color: "#7fd4ff", tag: "Stealth & picks" },
    "Talon Corps": { color: "#ff5a6e", tag: "Aggression" },
    "Iron Nest": { color: "#f0a43a", tag: "Defense & support" },
    "High Command": { color: "#ffe08a", tag: "Squad play" }
  },
  trials: [
    { id: "nw-cloak-elims", sponsor: "Night Watch", title: "Get 3 eliminations while playing Cloaking Device", bucks: 120 },
    { id: "nw-knife", sponsor: "Night Watch", title: "Eliminate someone with Throwing Knives or a Dagger backstab", bucks: 100 },
    { id: "nw-track", sponsor: "Night Watch", title: "Tag 5 enemies with a Tracking Dart or Sonar Grenade", bucks: 80 },
    { id: "nw-steal", sponsor: "Night Watch", title: "Steal a cashout from another team", bucks: 150 },
    { id: "nw-mimic", sponsor: "Night Watch", title: "Fool an enemy with the Mimic Device and win the fight", bucks: 140 },
    { id: "nw-truesight", sponsor: "Night Watch", title: "Spot and eliminate a cloaked or disguised enemy with True Sight", bucks: 150 },
    { id: "nw-transloc", sponsor: "Night Watch", title: "Escape or flank with the Translocator and get the elimination", bucks: 120 },
    { id: "nw-nodeath", sponsor: "Night Watch", title: "Finish a round with 0 deaths", bucks: 160 },
    { id: "tc-10elims", sponsor: "Talon Corps", title: "Get 10 eliminations in one match", bucks: 150 },
    { id: "tc-shotgun", sponsor: "Talon Corps", title: "Win a match using only a shotgun", bucks: 120 },
    { id: "tc-melee", sponsor: "Talon Corps", title: "Get 2 melee eliminations", bucks: 110 },
    { id: "tc-wipe", sponsor: "Talon Corps", title: "Your squad wipes a full enemy team", bucks: 140 },
    { id: "tc-destruct", sponsor: "Talon Corps", title: "Collapse a building or floor with an enemy on it", bucks: 130 },
    { id: "tc-blast", sponsor: "Talon Corps", title: "Get an elimination with a Frag, C4 or RPG-7 blast", bucks: 110 },
    { id: "tc-headhunter", sponsor: "Talon Corps", title: "Cash out a bounty in Head Hunter", bucks: 150 },
    { id: "in-revives", sponsor: "Iron Nest", title: "Revive teammates 5 times in one match", bucks: 120 },
    { id: "in-defib", sponsor: "Iron Nest", title: "Use the Defibrillator on 3 teammates", bucks: 100 },
    { id: "in-dome", sponsor: "Iron Nest", title: "Hold a cashout to completion with Dome Shield down", bucks: 140 },
    { id: "in-heal", sponsor: "Iron Nest", title: "Play a full match on Healing Beam (no swapping)", bucks: 110 },
    { id: "in-goo", sponsor: "Iron Nest", title: "Wall off a cashout with Goo and win the fight", bucks: 120 },
    { id: "in-mesh", sponsor: "Iron Nest", title: "Win a round as Heavy with Mesh Shield", bucks: 100 },
    { id: "hc-rolled", sponsor: "High Command", title: "Win a match with a loadout rolled in this app", bucks: 200 },
    { id: "hc-balanced", sponsor: "High Command", title: "Play a match with one Light, one Medium and one Heavy", bucks: 100 },
    { id: "hc-allheavy", sponsor: "High Command", title: "Play a full match as an all-Heavy squad", bucks: 120 },
    { id: "hc-alllight", sponsor: "High Command", title: "Play a full match as an all-Light squad", bucks: 120 },
    { id: "hc-pointbreak", sponsor: "High Command", title: "Win a Point Break match", bucks: 150 },
    { id: "hc-solo", sponsor: "High Command", title: "Survive to the final round of Solo Showdown", bucks: 140 },
    { id: "hc-mvp", sponsor: "High Command", title: "Be the squad MVP in a reported match", bucks: 130 },
    { id: "hc-srank", sponsor: "High Command", title: "Earn an S grade in a reported match", bucks: 180 },
    { id: "hc-report3", sponsor: "High Command", title: "Report 3 matches in the app today", bucks: 90 },
    { id: "hc-gamenight", sponsor: "High Command", title: "Join an OWC Game Night or squad session", bucks: 100 },
    { id: "hc-newgun", sponsor: "High Command", title: "Win a round with a weapon you've never used", bucks: 140 }
  ],

  achievements: [
    { id: "first", icon: "🎖️", name: "Enlisted", desc: "Report your first match", test: s => s.matches >= 1 },
    { id: "m10", icon: "📋", name: "Regular", desc: "Play 10 reported matches", test: s => s.matches >= 10 },
    { id: "m50", icon: "🪖", name: "Veteran", desc: "Play 50 reported matches", test: s => s.matches >= 50 },
    { id: "mvp1", icon: "👑", name: "Squad MVP", desc: "Win squad MVP once", test: s => s.mvps >= 1 },
    { id: "mvp10", icon: "🏆", name: "Field Marshal", desc: "Win squad MVP 10 times", test: s => s.mvps >= 10 },
    { id: "srank", icon: "⭐", name: "S-Rank", desc: "Earn an S grade", test: s => s.sGrades >= 1 },
    { id: "s5", icon: "🌟", name: "Prime Time", desc: "Earn 5 S grades", test: s => s.sGrades >= 5 },
    { id: "elims100", icon: "💥", name: "Wrecking Crew", desc: "100 total eliminations", test: s => s.elims >= 100 },
    { id: "elims500", icon: "☄️", name: "Demolition", desc: "500 total eliminations", test: s => s.elims >= 500 },
    { id: "rev50", icon: "🩺", name: "Field Medic", desc: "50 total revives", test: s => s.revives >= 50 },
    { id: "obj50", icon: "💰", name: "Vault Hunter", desc: "50 objective plays", test: s => s.objective >= 50 },
    { id: "nodeath", icon: "🛡️", name: "Untouchable", desc: "A match with 0 deaths", test: s => s.flawless >= 1 },
    { id: "dmg10k", icon: "🔥", name: "Heavy Hitter", desc: "10,000 damage in one match", test: s => s.bestDamage >= 10000 },
    { id: "rolledwin", icon: "🎲", name: "Roulette Royalty", desc: "Win with a rolled loadout", test: s => s.rolledWins >= 1 },
    { id: "win10", icon: "🦉", name: "Night Owl", desc: "10 reported wins", test: s => s.wins >= 10 }
  ]
};
