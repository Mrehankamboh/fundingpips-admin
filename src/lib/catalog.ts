/** FundingPips live catalog (from marketing site js/main.js). */

function parseSize(label: string): number {
  const n = Number(String(label).replace(/[$,Kk]/g, ""));
  return Number.isFinite(n) ? n * 1000 : 0;
}

type SeedRow = {
  challenge_name: string;
  account_size: number;
  price: number;
  leverage: string;
};

const ZERO = {
  sizes: ["$5K", "$10K", "$25K", "$50K", "$100K", "$200K"] as const,
  price: {
    "$5K": [60],
    "$10K": [88],
    "$25K": [188],
    "$50K": [244],
    "$100K": [444],
    "$200K": [888],
  } as Record<string, number[]>,
};

const ONE = {
  sizes: ["$5K", "$10K", "$25K", "$50K", "$100K"] as const,
  price: {
    "$5K": [74],
    "$10K": [111],
    "$25K": [255],
    "$50K": [353],
    "$100K": [666],
  } as Record<string, number[]>,
};

const TWO = {
  sizes: ["$5K", "$10K", "$25K", "$50K", "$100K"] as const,
  price: {
    "$5K": [39, 35, 29],
    "$10K": [72, 64, 55],
    "$25K": [195, 175, 145],
    "$50K": [349, 299, 249],
    "$100K": [652, 555, 466],
  } as Record<string, number[]>,
  plans: ["2 Step Standard", "2 Step FLEX", "2 Step Pro"] as const,
};

export function fundingPipsPriceSeeds(): SeedRow[] {
  const rows: SeedRow[] = [];
  for (const size of ZERO.sizes) {
    rows.push({
      challenge_name: "Zero",
      account_size: parseSize(size),
      price: ZERO.price[size][0],
      leverage: "1:100",
    });
  }
  for (const size of ONE.sizes) {
    rows.push({
      challenge_name: "1 Step Flex",
      account_size: parseSize(size),
      price: ONE.price[size][0],
      leverage: "1:100",
    });
  }
  for (const size of TWO.sizes) {
    TWO.plans.forEach((name, i) => {
      rows.push({
        challenge_name: name,
        account_size: parseSize(size),
        price: TWO.price[size][i],
        leverage: "1:100",
      });
    });
  }
  return rows;
}
