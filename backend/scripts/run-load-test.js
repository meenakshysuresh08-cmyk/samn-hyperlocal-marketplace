/**
 * Automated Baseline & Load Testing Tool
 * SAMN Backend API - 100 Virtual Users (VUs) continuous for 1 Minute
 * 
 * Usage:
 *   node backend/scripts/run-load-test.js
 * 
 * Features:
 *   - 100 concurrent virtual users
 *   - Continuous 60-second test window
 *   - Measures Requests Per Second (RPS)
 *   - Measures Min, Average, Max, and P95 latency (ms)
 *   - Displays formatted terminal execution report
 */

const http = require('http');

const CONFIG = {
  host: 'localhost',
  port: 3000,
  path: '/api/health', // Can also target /api/users/nearby-helpers or /api/tasks/nearby
  method: 'GET',
  vus: 100,            // 100 Virtual Users
  durationSeconds: 60, // 1 Minute continuous execution
};

console.log(`\n================================================================`);
console.log(`🚀 SAMN BACKEND BASELINE LOAD TEST RUNNER`);
console.log(`================================================================`);
console.log(`🎯 Target Endpoint:    http://${CONFIG.host}:${CONFIG.port}${CONFIG.path}`);
console.log(`👥 Virtual Users (VUs): ${CONFIG.vus} Concurrent Users`);
console.log(`⏱️ Duration:            ${CONFIG.durationSeconds} Seconds (1 Minute Continuous)`);
console.log(`⏳ Starting test... Please wait 60 seconds...\n`);

let totalRequests = 0;
let successCount = 0;
let errorCount = 0;
const latencies = [];
let isRunning = true;
const startTime = Date.now();

function sendRequest() {
  if (!isRunning) return;

  const reqStart = process.hrtime();
  const req = http.request(
    {
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: CONFIG.path,
      method: CONFIG.method,
      headers: {
        'User-Agent': 'SAMN-LoadTest-VU/1.0',
        'Connection': 'keep-alive',
      },
    },
    (res) => {
      res.on('data', () => {}); // Consume body stream
      res.on('end', () => {
        const diff = process.hrtime(reqStart);
        const latencyMs = (diff[0] * 1e3) + (diff[1] / 1e6);

        totalRequests++;
        if (res.statusCode >= 200 && res.statusCode < 400) {
          successCount++;
        } else {
          errorCount++;
        }
        latencies.push(latencyMs);

        // Immediate next request in event loop
        if (isRunning) {
          setImmediate(sendRequest);
        }
      });
    }
  );

  req.on('error', () => {
    totalRequests++;
    errorCount++;
    if (isRunning) {
      setTimeout(sendRequest, 100);
    }
  });

  req.setTimeout(5000, () => {
    req.destroy();
  });

  req.end();
}

// Spawn 100 concurrent worker loops
for (let i = 0; i < CONFIG.vus; i++) {
  sendRequest();
}

// Progress tick every 10 seconds
const interval = setInterval(() => {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const currentRps = (totalRequests / (elapsed || 1)).toFixed(1);
  console.log(`⏳ [${elapsed}s / ${CONFIG.durationSeconds}s] Completed: ${totalRequests} requests | Current RPS: ${currentRps} req/sec`);
}, 10000);

// Stop after 60 seconds and calculate stats
setTimeout(() => {
  isRunning = false;
  clearInterval(interval);

  const durationSec = (Date.now() - startTime) / 1000;
  const rps = (totalRequests / durationSec).toFixed(1);

  latencies.sort((a, b) => a - b);
  const minLatency = latencies.length ? latencies[0].toFixed(1) : 0;
  const maxLatency = latencies.length ? latencies[latencies.length - 1].toFixed(1) : 0;
  const sum = latencies.reduce((acc, val) => acc + val, 0);
  const avgLatency = latencies.length ? (sum / latencies.length).toFixed(1) : 0;
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies[p95Index] ? latencies[p95Index].toFixed(1) : 0;
  const errorRate = totalRequests ? ((errorCount / totalRequests) * 100).toFixed(2) : 0;

  console.log(`\n================================================================`);
  console.log(`📊 100-USER BASELINE LOAD TEST EXECUTION RESULTS`);
  console.log(`================================================================`);
  console.log(`⏱️ Actual Duration:       ${durationSec.toFixed(2)} seconds`);
  console.log(`📦 Total Requests Sent:   ${totalRequests.toLocaleString()}`);
  console.log(`✅ Successful Requests:   ${successCount.toLocaleString()}`);
  console.log(`❌ Failed Requests:       ${errorCount.toLocaleString()} (${errorRate}%)`);
  console.log(`⚡ Throughput (RPS):      ${rps} req/sec`);
  console.log(`----------------------------------------------------------------`);
  console.log(`🚀 Min Latency (Fastest): ${minLatency} ms`);
  console.log(`📈 Avg Latency (Mean):    ${avgLatency} ms`);
  console.log(`🐢 Max Latency (Slowest): ${maxLatency} ms`);
  console.log(`🎯 95th Percentile (P95): ${p95Latency} ms`);
  console.log(`================================================================\n`);
}, CONFIG.durationSeconds * 1000);

