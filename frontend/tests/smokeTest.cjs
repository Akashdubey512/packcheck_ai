const http = require('http');

const routes = [
  '/',
  '/scan',
  '/scan/scn_sample_cereal',
  '/dashboard',
  '/history',
  '/history?search=milk&status=compliant&category=Dairy+Products&startDate=2026-09-01&endDate=2026-09-07&page=1',
  '/reports',
  '/reports?id=rep_2026_001',
  '/verify',
  '/verify/LOT-2026-X89',
  '/verify/MLK-882-A',
  '/login',
  '/settings',
];

async function checkRoute(route) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${route}`, (res) => {
      resolve({ route, statusCode: res.statusCode });
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log('--- STARTING BROWSER SMOKE TEST (HTTP VERIFICATION) ---');
  let allPass = true;
  for (const r of routes) {
    try {
      const res = await checkRoute(r);
      console.log(`PASS: ${res.route} => HTTP ${res.statusCode}`);
      if (res.statusCode !== 200) allPass = false;
    } catch (err) {
      console.error(`FAIL: ${r} => ${err.message}`);
      allPass = false;
    }
  }
  console.log('--- SMOKE TEST COMPLETE: ' + (allPass ? 'ALL ROUTES PASS (HTTP 200)' : 'SOME FAILED') + ' ---');
  process.exit(allPass ? 0 : 1);
}

run();
