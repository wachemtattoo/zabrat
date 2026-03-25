import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function checkBadges(userId: string): Promise<string[]> {
  const newBadges: string[] = [];

  const allBadges = await prisma.badge.findMany();
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const unlockedIds = new Set(userBadges.map((ub) => ub.badgeId));

  for (const badge of allBadges) {
    if (unlockedIds.has(badge.id)) continue;

    const earned = await evaluateCondition(userId, badge.conditionType, badge.conditionValue);
    if (earned) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      newBadges.push(badge.name);
    }
  }

  // Level up based on XP
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    const newLevel = Math.floor(user.xp / 100) + 1;
    if (newLevel > user.level) {
      await prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
    }
  }

  return newBadges;
}

async function evaluateCondition(userId: string, type: string, value: number): Promise<boolean> {
  switch (type) {
    case "total_checkins": {
      const count = await prisma.checkIn.count({ where: { userId } });
      return count >= value;
    }

    case "unique_bars": {
      const bars = await prisma.checkIn.findMany({
        where: { userId, barId: { not: null } },
        select: { barId: true },
        distinct: ["barId"],
      });
      return bars.length >= value;
    }

    case "unique_types": {
      const checkIns = await prisma.checkIn.findMany({
        where: { userId },
        select: { beer: { select: { type: true } } },
        distinct: ["beerId"],
      });
      const types = new Set(checkIns.map((c) => c.beer.type));
      return types.size >= value;
    }

    case "total_cheers_sent": {
      const count = await prisma.cheers.count({ where: { fromUserId: userId } });
      return count >= value;
    }

    case "total_friends": {
      const count = await prisma.friendship.count({
        where: {
          status: "accepted",
          OR: [{ userId }, { friendId: userId }],
        },
      });
      return count >= value;
    }

    case "checkin_before_noon": {
      const checkIns = await prisma.checkIn.findMany({
        where: { userId },
        select: { createdAt: true },
      });
      return checkIns.some((c) => c.createdAt.getHours() < 12);
    }

    case "checkin_after_midnight": {
      const checkIns = await prisma.checkIn.findMany({
        where: { userId },
        select: { createdAt: true },
      });
      return checkIns.some((c) => c.createdAt.getHours() >= 0 && c.createdAt.getHours() < 5);
    }

    case "bars_in_one_night": {
      // Check if user visited N bars in a single evening (6pm-5am)
      const checkIns = await prisma.checkIn.findMany({
        where: { userId, barId: { not: null } },
        select: { barId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });

      // Group by night (6pm to 5am next day)
      const nights = new Map<string, Set<string>>();
      for (const c of checkIns) {
        const d = new Date(c.createdAt);
        const h = d.getHours();
        // If before 5am, count as previous day's night
        if (h < 5) d.setDate(d.getDate() - 1);
        const key = d.toISOString().split("T")[0];
        if (!nights.has(key)) nights.set(key, new Set());
        nights.get(key)!.add(c.barId!);
      }

      return Array.from(nights.values()).some((bars) => bars.size >= value);
    }

    case "weekly_streak": {
      const checkIns = await prisma.checkIn.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      if (checkIns.length === 0) return false;

      // Get unique weeks (ISO week numbers)
      const weeks = new Set<string>();
      checkIns.forEach((c) => {
        const d = new Date(c.createdAt);
        const year = d.getFullYear();
        const oneJan = new Date(year, 0, 1);
        const weekNum = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
        weeks.add(`${year}-W${weekNum}`);
      });

      const sortedWeeks = Array.from(weeks).sort();
      let maxStreak = 1;
      let streak = 1;
      for (let i = 1; i < sortedWeeks.length; i++) {
        const [prevY, prevW] = sortedWeeks[i - 1].split("-W").map(Number);
        const [currY, currW] = sortedWeeks[i].split("-W").map(Number);
        if ((currY === prevY && currW === prevW + 1) || (currY === prevY + 1 && prevW >= 52 && currW === 1)) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 1;
        }
      }

      return maxStreak >= value;
    }

    default:
      return false;
  }
}
