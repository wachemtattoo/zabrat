import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Bieres disponibles en Tunisie uniquement
  const beers = [
    // Locales
    { name: "Celtia", brand: "SFBT", type: "Lager" },
    { name: "Stella", brand: "SFBT", type: "Lager" },
    { name: "Stella Gold", brand: "SFBT", type: "Lager" },
    { name: "Stella Black", brand: "SFBT", type: "Dark Lager" },
    { name: "Berber", brand: "Sonobra", type: "Lager" },
    { name: "Elbeya", brand: "Tunisienne", type: "Lager" },
    // Importees (disponibles en Tunisie)
    { name: "Heineken", brand: "Sonobra", type: "Lager" },
    { name: "Beck's", brand: "SFBT", type: "Pils" },
    { name: "Lowenbrau", brand: "SFBT", type: "Lager" },
    { name: "33 Export", brand: "SFBT", type: "Lager" },
    { name: "Golden Brau", brand: "Sonobra", type: "Lager" },
    { name: "Fayrouz", brand: "Sonobra", type: "Sans alcool" },
  ];

  for (const beer of beers) {
    await prisma.beer.upsert({
      where: { name_brand: { name: beer.name, brand: beer.brand } },
      update: {},
      create: beer,
    });
  }
  console.log(`Seeded ${beers.length} beers`);

  // Seed badges
  const badges = [
    // Exploration
    { name: "Premier Pas", description: "Log ta premiere biere", icon: "beer-outline", category: "exploration", conditionType: "total_checkins", conditionValue: 1 },
    { name: "Habitue", description: "10 bieres loguees", icon: "beer", category: "exploration", conditionType: "total_checkins", conditionValue: 10 },
    { name: "Pro", description: "50 bieres loguees", icon: "trophy", category: "exploration", conditionType: "total_checkins", conditionValue: 50 },
    { name: "Legende", description: "100 bieres loguees", icon: "star", category: "exploration", conditionType: "total_checkins", conditionValue: 100 },
    { name: "Explorateur", description: "5 bars differents", icon: "map", category: "exploration", conditionType: "unique_bars", conditionValue: 5 },
    { name: "Globe-Trotter", description: "10 bars differents", icon: "earth", category: "exploration", conditionType: "unique_bars", conditionValue: 10 },
    { name: "Connaisseur", description: "5 types de bieres differents", icon: "flask", category: "exploration", conditionType: "unique_types", conditionValue: 5 },
    // Social
    { name: "Social Drinker", description: "Envoie ton premier Cheers", icon: "heart", category: "social", conditionType: "total_cheers_sent", conditionValue: 1 },
    { name: "Life of the Party", description: "10 Cheers envoyes", icon: "people", category: "social", conditionType: "total_cheers_sent", conditionValue: 10 },
    { name: "Populaire", description: "5 amis ajoutes", icon: "person-add", category: "social", conditionType: "total_friends", conditionValue: 5 },
    // Regularity
    { name: "Regulier", description: "Log 3 semaines consecutives", icon: "calendar", category: "regularity", conditionType: "weekly_streak", conditionValue: 3 },
    { name: "Fidele", description: "Log 8 semaines consecutives", icon: "ribbon", category: "regularity", conditionType: "weekly_streak", conditionValue: 8 },
    // Fun
    { name: "Early Bird", description: "Biere avant midi", icon: "sunny", category: "fun", conditionType: "checkin_before_noon", conditionValue: 1 },
    { name: "Night Owl", description: "Biere apres minuit", icon: "moon", category: "fun", conditionType: "checkin_after_midnight", conditionValue: 1 },
    { name: "Marathon", description: "5 bars en une soiree", icon: "flame", category: "fun", conditionType: "bars_in_one_night", conditionValue: 5 },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }
  console.log(`Seeded ${badges.length} badges`);

  // Seed bars in Tunisia (real locations)
  // We need a system user to create bars
  let systemUser = await prisma.user.findFirst({ where: { username: "zabrat_system" } });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: { username: "zabrat_system", email: "system@zabrat.app", password: "system" },
    });
  }

  const bars = [
    // ===== TUNIS CENTRE =====
    { name: "Le Comptoir", address: "Avenue Habib Bourguiba, Tunis", latitude: 36.7998, longitude: 10.1802 },
    { name: "Bar Le Diplomate", address: "Rue de Marseille, Tunis", latitude: 36.7955, longitude: 10.1788 },
    { name: "Hotel Africa Bar", address: "Avenue Habib Bourguiba, Tunis", latitude: 36.7985, longitude: 10.1795 },
    { name: "Le Bistrot du Lac", address: "Rue du Lac Windermere, Les Berges du Lac", latitude: 36.8320, longitude: 10.2340 },
    { name: "Le Plug", address: "Rue du Lac Biwa, Les Berges du Lac", latitude: 36.8325, longitude: 10.2330 },
    { name: "Patio du Lac", address: "Les Berges du Lac 1, Tunis", latitude: 36.8315, longitude: 10.2320 },
    { name: "Le Zinc", address: "Rue du Lac Turkana, Lac 2", latitude: 36.8380, longitude: 10.2420 },
    { name: "L'Avenue", address: "Avenue Hedi Nouira, Ennasr", latitude: 36.8430, longitude: 10.1960 },

    // ===== GAMMARTH =====
    { name: "Lazy Club", address: "Gammarth, Tunis", latitude: 36.9100, longitude: 10.2880 },
    { name: "Bubble's Lounge", address: "Gammarth, Tunis", latitude: 36.9120, longitude: 10.2900 },
    { name: "Le Mövenpick Bar", address: "Hotel Movenpick, Gammarth", latitude: 36.9130, longitude: 10.2870 },
    { name: "The Residence Bar", address: "The Residence Tunis, Gammarth", latitude: 36.9140, longitude: 10.2860 },

    // ===== LA MARSA / SIDI BOU SAID =====
    { name: "Brasserie de La Marsa", address: "Avenue Habib Bourguiba, La Marsa", latitude: 36.8783, longitude: 10.3247 },
    { name: "Bar Chez Marcel", address: "La Marsa Plage", latitude: 36.8810, longitude: 10.3280 },
    { name: "Elyssar", address: "La Marsa", latitude: 36.8790, longitude: 10.3260 },
    { name: "RED KISS Lounge", address: "La Marsa", latitude: 36.8775, longitude: 10.3255 },
    { name: "Terraza del Marabella", address: "La Marsa", latitude: 36.8800, longitude: 10.3270 },
    { name: "Yas Shisha Lounge", address: "La Marsa", latitude: 36.8785, longitude: 10.3240 },
    { name: "Le Pirate", address: "Port de Sidi Bou Said", latitude: 36.8690, longitude: 10.3490 },
    { name: "Cafe des Nattes", address: "Sidi Bou Said", latitude: 36.8695, longitude: 10.3477 },
    { name: "Cafe des Delices", address: "Sidi Bou Said", latitude: 36.8700, longitude: 10.3485 },
    { name: "SidiBou Sky Bar", address: "Sidi Bou Said", latitude: 36.8698, longitude: 10.3480 },

    // ===== LA GOULETTE / CARTHAGE =====
    { name: "Le Golfe", address: "La Goulette", latitude: 36.8180, longitude: 10.3050 },
    { name: "Restaurant Le Neptune", address: "La Goulette Port", latitude: 36.8175, longitude: 10.3060 },

    // ===== SOUSSE =====
    { name: "Le QG", address: "Avenue du 14 Janvier, Sousse", latitude: 35.8283, longitude: 10.6367 },
    { name: "Boga Bar", address: "Zone Touristique, Sousse", latitude: 35.8400, longitude: 10.6050 },
    { name: "The Saloon", address: "Sousse Centre", latitude: 35.8270, longitude: 10.6380 },
    { name: "Sorry Babushka", address: "Sousse Medina", latitude: 35.8260, longitude: 10.6370 },
    { name: "Rose and Crown", address: "Zone Touristique, Sousse", latitude: 35.8390, longitude: 10.6060 },
    { name: "Mokis Restobar", address: "Sousse", latitude: 35.8300, longitude: 10.6350 },
    { name: "Red Iguana", address: "Port El Kantaoui", latitude: 35.8930, longitude: 10.5930 },
    { name: "Hard Rock Cafe", address: "Port El Kantaoui, Sousse", latitude: 35.8920, longitude: 10.5940 },

    // ===== HAMMAMET =====
    { name: "Calypso Club", address: "Hammamet Sud", latitude: 36.3850, longitude: 10.6200 },
    { name: "Bar Samba", address: "Zone Touristique, Hammamet", latitude: 36.4000, longitude: 10.6167 },
    { name: "Le Barberousse", address: "Medina de Hammamet", latitude: 36.3950, longitude: 10.6120 },
    { name: "Manhattan Club", address: "Yasmine Hammamet", latitude: 36.3700, longitude: 10.5650 },
    { name: "Marina Lounge", address: "Port Yasmine Hammamet", latitude: 36.3710, longitude: 10.5660 },
    { name: "Oasis Bar", address: "Zone Touristique, Hammamet", latitude: 36.3980, longitude: 10.6150 },

    // ===== MONASTIR =====
    { name: "Le Marina Bar", address: "Port de Monastir", latitude: 35.7700, longitude: 10.8310 },
    { name: "Skanes Beach Bar", address: "Zone Touristique Skanes, Monastir", latitude: 35.7580, longitude: 10.7530 },

    // ===== SFAX =====
    { name: "Le Piano Bar", address: "Centre-ville, Sfax", latitude: 34.7400, longitude: 10.7600 },
    { name: "Cafe Diwan", address: "Medina de Sfax", latitude: 34.7390, longitude: 10.7610 },

    // ===== BIZERTE =====
    { name: "Le Petit Mousse", address: "Vieux Port, Bizerte", latitude: 37.2744, longitude: 9.8739 },
    { name: "Bar du Port", address: "Port de Bizerte", latitude: 37.2750, longitude: 9.8745 },

    // ===== DJERBA =====
    { name: "Chichkhan Lounge", address: "Houmt Souk, Djerba", latitude: 33.8750, longitude: 10.8570 },
    { name: "Cyclone Club", address: "Zone Touristique Midoun, Djerba", latitude: 33.8200, longitude: 10.9950 },
    { name: "Bar de l'Hotel Hasdrubal", address: "Djerba La Douce", latitude: 33.8100, longitude: 11.0100 },

    // ===== TABARKA =====
    { name: "La Plage Bar", address: "Tabarka Centre", latitude: 36.9540, longitude: 8.7580 },

    // ===== TOZEUR =====
    { name: "Bar Dar Tozeur", address: "Centre-ville, Tozeur", latitude: 33.9200, longitude: 8.1330 },

    // ===== MAGASINS / SUPERMARCHES =====
    { name: "Monoprix - Tunis Centre", address: "Avenue Habib Bourguiba, Tunis", latitude: 36.7990, longitude: 10.1810 },
    { name: "Monoprix - La Marsa", address: "Avenue Habib Bourguiba, La Marsa", latitude: 36.8780, longitude: 10.3250 },
    { name: "Monoprix - El Menzah 6", address: "El Menzah 6, Tunis", latitude: 36.8340, longitude: 10.1580 },
    { name: "Carrefour - La Marsa", address: "Centre Commercial La Marsa", latitude: 36.8770, longitude: 10.3260 },
    { name: "Carrefour - Tunisia Mall", address: "Les Berges du Lac 2", latitude: 36.8400, longitude: 10.2450 },
    { name: "Geant - Tunis City", address: "Tunis City, Berges du Lac", latitude: 36.8350, longitude: 10.2380 },
    { name: "Magasin General - Lac 1", address: "Centre Commercial Les Berges du Lac", latitude: 36.8310, longitude: 10.2350 },
    { name: "Magasin General - Sousse", address: "Route de Tunis, Sousse", latitude: 35.8350, longitude: 10.6200 },
    { name: "La Cave Privee", address: "Galerie Marchande Mg Maxi, La Marsa", latitude: 36.8760, longitude: 10.3245 },
    { name: "Nicolas Wine & Spirits", address: "Rue du Lac Leman, Les Berges du Lac", latitude: 36.8335, longitude: 10.2310 },
  ];

  for (const bar of bars) {
    const existing = await prisma.bar.findFirst({ where: { name: bar.name } });
    if (!existing) {
      await prisma.bar.create({
        data: {
          name: bar.name,
          address: bar.address,
          latitude: bar.latitude,
          longitude: bar.longitude,
          createdById: systemUser.id,
        },
      });
    }
  }
  console.log(`Seeded ${bars.length} bars in Tunisia`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
