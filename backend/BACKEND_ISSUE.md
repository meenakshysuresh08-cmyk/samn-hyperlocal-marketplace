# SAMN Backend Issue: Root Cause Analysis (RCA) & Resolution Guide

**Incident Summary:** Backend server starts on port `3000`, but fails to establish a connection to the MongoDB Atlas cluster. All subsequent incoming API calls (such as `/api/auth/login`) receive an immediate `HTTP 503 Service Unavailable` response.

---

## 1. Symptom & Observed Error Logs

When running `npm run dev` in `backend/`:

```text
[nodemon] starting `node server.js`
[Firebase Admin] Skipping initialization (credentials not set in .env)
[MongoDB Warning] Lost connection to database. Auto-reconnecting...
[MongoDB Error] Connection failed: Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted. Make sure your current IP address is on your Atlas cluster's IP whitelist: https://www.mongodb.com/docs/atlas/security-whitelist/
[Cron Job] Fallback Broadcast scheduled (every 2 minutes)
[MongoDB Error]: Server selection timed out after 5000 ms
===============================================
🚀 SAMN Backend Server running on port 3000
📡 Local URL:   http://localhost:3000
📡 Network URL: http://0.0.0.0:3000
⚡ Socket.IO initialized on same port
===============================================
POST /api/auth/login 503 6.292 ms - 110
```

---

## 2. Root Cause Analysis (RCA)

### 2.1 Why the MongoDB Connection Fails
The database is hosted on **MongoDB Atlas** (Cluster: `srkkr34`, AWS Region: `ap-south-1`).
The configured connection URI in `backend/.env` points to:
```text
mongodb://meenakshysuresh08_db_user:***@ac-civga1g-shard-00-00.srkkr34.mongodb.net:27017,...
```

Low-level network diagnostics revealed:

1. **DNS Resolution Test:**
   - Shard hostname: `ac-civga1g-shard-00-00.srkkr34.mongodb.net`
   - CNAME resolves to: `ec2-159-41-226-38.ap-south-1.compute.amazonaws.com`
   - Target IPv4: `159.41.226.38`
   - **Result: DNS resolution passed.**

2. **TCP Port 27017 Connectivity Test:**
   ```powershell
   Test-NetConnection -ComputerName ac-civga1g-shard-00-00.srkkr34.mongodb.net -Port 27017
   ```
   - **Result:**
     ```text
     WARNING: TCP connect to (159.41.226.38 : 27017) failed
     PingSucceeded    : True
     TcpTestSucceeded : False
     ```
   - Ping to the AWS server succeeds, but **TCP port 27017 is actively blocked / dropped**.

3. **Client IP Identification:**
   - The development machine's current public IP is: **`49.200.135.54`**.
   - MongoDB Atlas employs an **IP Access List (firewall)**. Connections originating from IP addresses not explicitly registered in the cluster's Network Access List are dropped by default.

### 2.2 Why API Endpoints Return HTTP 503
In `backend/src/app.js`, lines 59–70 contain an intentional fail-fast database readiness guard:

```javascript
// Database guard: If MongoDB is reconnecting, fail fast instead of buffering and hanging for 10s!
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is reconnecting. Please retry in a few seconds.',
      isDbReconnecting: true,
    });
  }
  next();
});
```

Because Mongoose is unable to complete the initial handshake, `mongoose.connection.readyState` remains `0` (disconnected) or `2` (connecting). The guard immediately intercepts all API requests (including `/api/auth/login` and `/api/tasks`) with `503 Service Unavailable` so the client does not hang for 30+ seconds waiting for a database timeout.

---

## 3. Resolution Steps

### Option A: Whitelist Your IP in MongoDB Atlas (Recommended — 60 seconds)

1. Log into your **[MongoDB Atlas Dashboard](https://cloud.mongodb.com/)**.
2. Select the Project containing database cluster **`srkkr34`**.
3. In the left navigation sidebar under the **Security** heading, click **Network Access**.
4. In the Network Access tab, click the green **"+ Add IP Address"** button.
5. In the modal that appears:
   - **For Development Convenience (Recommended):** Click **"ALLOW ACCESS FROM ANYWHERE"** (this sets `0.0.0.0/0`), allowing you to connect regardless of Wi-Fi or mobile hotspot IP changes.
   - **Or for Strict Security:** Click **"ADD CURRENT IP ADDRESS"** (it will auto-detect and enter `49.200.135.54/32`).
6. Click **Confirm**.
7. Wait ~30 to 60 seconds for Atlas status to switch from *Pending* to *Active*.

**Automatic Recovery:** Because `nodemon` has a built-in reconnect scheduler in `backend/src/config/db.js`, you do **not** even need to restart the server. As soon as Atlas unlocks the IP, you will see:
```text
[MongoDB] Connected: ac-civga1g-shard-00-00.srkkr34.mongodb.net/samn
```
And `503` errors will immediately stop.

---

### Option B: Use a Local MongoDB Instance (Offline Fallback)

If internet is unstable or you do not have Atlas dashboard credentials:

#### Using Docker:
1. Start Docker Desktop.
2. In a terminal, run:
   ```powershell
   docker run -d -p 27017:27017 --name samn-mongodb mongo:latest
   ```
3. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/samn
   ```

#### Using Local MongoDB Service (Windows MSI):
1. Install [MongoDB Community Server for Windows](https://www.mongodb.com/try/download/community).
2. Ensure the Windows service `MongoDB` is running.
3. Set `MONGODB_URI=mongodb://localhost:27017/samn` in `backend/.env`.

---

## 4. Verification Checklist

| Check | Expected Result | Command / Method |
| :--- | :--- | :--- |
| **Port 27017 Reachability** | `TcpTestSucceeded : True` | `Test-NetConnection -ComputerName ac-civga1g-shard-00-00.srkkr34.mongodb.net -Port 27017` |
| **Backend Terminal Logs** | `[MongoDB] Connected: ...` | Terminal running `npm run dev` in `backend/` |
| **Healthcheck Endpoint** | `{"status":"online","database":"connected"}` | `curl http://localhost:3000/api/health` |
| **Auth Login Endpoint** | Returns JWT token or 401 (not 503) | Submit login form on web or mobile app |
