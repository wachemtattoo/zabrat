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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
