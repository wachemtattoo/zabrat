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
    // Tunis
    { name: "Le Comptoir", address: "Avenue Habib Bourguiba, Tunis", latitude: 36.7998, longitude: 10.1802, type: "bar" },
    { name: "Bar Le Diplomate", address: "Rue de Marseille, Tunis", latitude: 36.7955, longitude: 10.1788, type: "bar" },
    { name: "Le Plug", address: "Rue du Lac Biwa, Les Berges du Lac", latitude: 36.8325, longitude: 10.2330, type: "bar" },
    { name: "Brasserie de La Marsa", address: "Avenue Habib Bourguiba, La Marsa", latitude: 36.8783, longitude: 10.3247, type: "bar" },
    { name: "Le Pirate", address: "Port de Sidi Bou Said", latitude: 36.8690, longitude: 10.3490, type: "bar" },
    { name: "Cafe des Nattes", address: "Sidi Bou Said", latitude: 36.8695, longitude: 10.3477, type: "bar" },
    { name: "Le Golfe", address: "La Goulette", latitude: 36.8180, longitude: 10.3050, type: "bar" },
    { name: "Bar Chez Marcel", address: "La Marsa Plage", latitude: 36.8810, longitude: 10.3280, type: "bar" },
    // Sousse
    { name: "Le QG", address: "Avenue du 14 Janvier, Sousse", latitude: 35.8283, longitude: 10.6367, type: "bar" },
    { name: "Boga Bar", address: "Zone Touristique, Sousse", latitude: 35.8400, longitude: 10.6050, type: "bar" },
    { name: "Red Iguana", address: "Port El Kantaoui", latitude: 35.8930, longitude: 10.5930, type: "bar" },
    // Hammamet
    { name: "Bar Samba", address: "Zone Touristique, Hammamet", latitude: 36.4000, longitude: 10.6167, type: "bar" },
    { name: "Le Barberousse", address: "Medina de Hammamet", latitude: 36.3950, longitude: 10.6120, type: "bar" },
    // Magasins d'alcool
    { name: "Magasin General - Lac 1", address: "Centre Commercial Les Berges du Lac", latitude: 36.8310, longitude: 10.2350, type: "shop" },
    { name: "Nicolas Wine & Spirits", address: "Rue du Lac Leman, Les Berges du Lac", latitude: 36.8335, longitude: 10.2310, type: "shop" },
    { name: "Carrefour - La Marsa", address: "Centre Commercial La Marsa", latitude: 36.8770, longitude: 10.3260, type: "shop" },
    { name: "Monoprix - Tunis Centre", address: "Avenue Habib Bourguiba, Tunis", latitude: 36.7990, longitude: 10.1810, type: "shop" },
    { name: "Magasin General - Sousse", address: "Route de Tunis, Sousse", latitude: 35.8350, longitude: 10.6200, type: "shop" },
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
