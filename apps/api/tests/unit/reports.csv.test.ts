import { conversionFunnelToCsv, winLossToCsv, trendsToCsv } from "../../src/modules/reports/reports.csv";

describe("reports CSV formatting", () => {
  it("escapes cells containing commas", () => {
    const csv = winLossToCsv({
      range: "this_month",
      totalWon: 1,
      totalLost: 0,
      overallWinRate: 100,
      byRep: [
        { assigneeId: "u1", assigneeName: "Smith, John", wonCount: 1, wonValue: 500, lostCount: 0, lostValue: 0, winRate: 100 },
      ],
      byLostReason: [],
    });
    expect(csv).toContain('"Smith, John"');
  });

  it("leaves plain numeric cells unquoted", () => {
    const csv = trendsToCsv({
      months: 1,
      points: [{ period: "2026-08", revenue: 1000, newLeads: 5, dealsWon: 2, conversionRate: 40 }],
    });
    expect(csv).toContain("2026-08,1000,5,2,40");
  });

  it("renders null conversionRateFromPrevious as an empty cell, not the string 'null'", () => {
    const csv = conversionFunnelToCsv({
      range: "this_month",
      totalLeads: 3,
      disqualifiedCount: 0,
      stages: [
        { stage: "NEW", label: "New", count: 3, conversionRateFromPrevious: null },
      ],
    });
    expect(csv).toContain("New,3,\n");
    expect(csv).not.toContain("null");
  });
});
