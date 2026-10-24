export const MOCK_ME = {
  email: "admin@fundingpips.local",
  first_name: "Admin",
  last_name: "Preview",
  role: "admin" as const,
};

export const MOCK_STATS = {
  user_count: 1284,
  challenge_count: 392,
  total_spend: 148920,
};

export const MOCK_RECENT_USERS = [
  {
    id: "1",
    email: "alaa@example.com",
    first_name: "Alaa",
    last_name: "Smaisem",
    country: "Turkey",
    role: "user",
    created_at: "2026-10-20T12:00:00.000Z",
  },
  {
    id: "2",
    email: "vipul@example.com",
    first_name: "Vipul",
    last_name: "Gupta",
    country: "India",
    role: "user",
    created_at: "2026-10-19T09:30:00.000Z",
  },
  {
    id: "3",
    email: "admin@fundingpips.local",
    first_name: "Admin",
    last_name: "Preview",
    country: "UAE",
    role: "admin",
    created_at: "2026-10-01T08:00:00.000Z",
  },
];

export const MOCK_USERS = [
  ...MOCK_RECENT_USERS.map((u, i) => ({
    ...u,
    blocked: false,
    challenge_count: [2, 5, 0][i] ?? 1,
    spent: [78, 555, 0][i] ?? 39,
  })),
  {
    id: "4",
    email: "rinaldi@example.com",
    first_name: "Rinaldi",
    last_name: "Relagus",
    country: "Indonesia",
    role: "user",
    blocked: true,
    challenge_count: 1,
    spent: 188,
    created_at: "2026-09-28T14:00:00.000Z",
  },
];

export const MOCK_CHALLENGES = [
  {
    id: "c1",
    user_email: "alaa@example.com",
    first_name: "Alaa",
    last_name: "Smaisem",
    evaluation_type: "2 Step",
    account_size: 100000,
    platform: "MetaTrader 5",
    plan: "Pro",
    fee: 555,
    quantity: 1,
    status: "active",
    created_at: "2026-10-18T11:00:00.000Z",
  },
  {
    id: "c2",
    user_email: "vipul@example.com",
    first_name: "Vipul",
    last_name: "Gupta",
    evaluation_type: "1 Step Flex",
    account_size: 50000,
    platform: "cTrader",
    plan: "Flex",
    fee: 353,
    quantity: 1,
    status: "completed",
    created_at: "2026-10-12T16:20:00.000Z",
  },
  {
    id: "c3",
    user_email: "rinaldi@example.com",
    first_name: "Rinaldi",
    last_name: "Relagus",
    evaluation_type: "Zero",
    account_size: 25000,
    platform: "MetaTrader 5",
    plan: "Zero",
    fee: 188,
    quantity: 1,
    status: "cancelled",
    created_at: "2026-10-05T08:45:00.000Z",
  },
];
