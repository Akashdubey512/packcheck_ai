import Scan from "../models/Scan.js";

export async function getStats(req, res) {
  try {
    const [totalScans, compliantCount, nonCompliantCount, recentScans] = await Promise.all([
      Scan.countDocuments(),
      Scan.countDocuments({ overallStatus: "COMPLIANT" }),
      Scan.countDocuments({ overallStatus: "NON_COMPLIANT" }),
      Scan.find().sort({ createdAt: -1 }).limit(5).select("_id overallStatus createdAt"),
    ]);

    const compliantPercent = totalScans ? Number(((compliantCount / totalScans) * 100).toFixed(1)) : 0;

    res.json({
      totalScans,
      compliantCount,
      nonCompliantCount,
      compliantPercent,
      recentScans: recentScans.map((s) => ({
        scanId: s._id,
        overallStatus: s.overallStatus,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}