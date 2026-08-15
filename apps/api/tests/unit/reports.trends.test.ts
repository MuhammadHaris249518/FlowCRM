import { reportsService } from "../../src/modules/reports/reports.service";
import { reportsRepository } from "../../src/modules/reports/reports.repository";

jest.mock("../../src/modules/reports/reports.repository");

describe("reportsService.getTrends", () => {
  it("returns one point per requested month, oldest first", async () => {
    (reportsRepository.getMonthlyTrendData as jest.Mock).mockResolvedValue({
      revenue: 1000,
      newLeads: 5,
      dealsWon: 2,
      totalLeadsForConversion: 5,
      convertedLeads: 1,
    });

    const result = await reportsService.getTrends(
      { organizationId: "org1", userId: "u1", clerkId: "c1", role: "SALES_MANAGER" },
      3
    );

    expect(result.points).toHaveLength(3);
    expect(result.points[2].conversionRate).toBe(20); // most recent month, oldest-first order
  });
});
