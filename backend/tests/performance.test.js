import test from "node:test";
import assert from "node:assert/strict";
import http from "http";
import fs from "fs";
import path from "path";
import { app } from "../src/server.js";

const CANDIDATE_IMAGE_PATHS = [
  path.resolve(process.cwd(), "../ai-service/archive (1)/product_desc_english/DC product_desc_english (1).jpg"),
  path.resolve(process.cwd(), "ai-service/archive (1)/product_desc_english/DC product_desc_english (1).jpg"),
  "D:\\packcheck\\packcheck_ai\\ai-service\\archive (1)\\product_desc_english\\DC product_desc_english (1).jpg",
];

const SAMPLE_IMAGE_PATH = CANDIDATE_IMAGE_PATHS.find((p) => fs.existsSync(p)) || CANDIDATE_IMAGE_PATHS[0];

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { median: 0, p95: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  return { median: Math.round(median), p95: Math.round(p95) };
}

test("Phase 3 Performance & Latency Benchmarks", async (t) => {
  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  t.after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("Measures Health & Readiness Endpoint Latency", async () => {
    const healthLatencies = [];
    const readyLatencies = [];

    for (let i = 0; i < 10; i++) {
      const t0 = performance.now();
      const res1 = await fetch(`${baseUrl}/health`);
      healthLatencies.push(performance.now() - t0);
      assert.equal(res1.status, 200);

      const t1 = performance.now();
      const res2 = await fetch(`${baseUrl}/ready`);
      readyLatencies.push(performance.now() - t1);
      assert.equal(res2.status, 200);
    }

    const healthStats = calculatePercentiles(healthLatencies);
    const readyStats = calculatePercentiles(readyLatencies);

    console.log(`[Perf Benchmark] Health Check — Median: ${healthStats.median}ms, P95: ${healthStats.p95}ms`);
    console.log(`[Perf Benchmark] Readiness Probe — Median: ${readyStats.median}ms, P95: ${readyStats.p95}ms`);

    assert.ok(healthStats.median < 100, "Health probe median latency should be under 100ms");
  });

  await t.test("Measures Dashboard Metrics Query Latency", async () => {
    const latencies = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/api/v1/dashboard/metrics`);
      latencies.push(performance.now() - t0);
      assert.equal(res.status, 200);
    }

    const stats = calculatePercentiles(latencies);
    console.log(`[Perf Benchmark] Dashboard Query — Median: ${stats.median}ms, P95: ${stats.p95}ms`);
    assert.ok(stats.median < 300, "Dashboard query median latency should be under 300ms");
  });
});
