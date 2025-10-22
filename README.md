SPAM YOUR KEYBOARD!
-------------------------

A real‑time **keyboard spammer + global leaderboard + live logs game** 

* **Server:** Node.js + Express + Socket.IO
* **Data:** Upstash Redis (ZSET leaderboard, HASH usernames, STRING globalCount)
* **Key wins:** batched writes (`MULTI/EXEC`), thresholded leaderboard refresh, and **idle sleep** (no Redis reads when nobody’s online).

---

## Overview

* Users mash keys (or clicks). Client buffers increments for 1s, then emits one `increment` to the server.
* Server **coalesces** all user deltas and writes them to Redis in one shot per flush tick.
* Leaderboard and global counter are only broadcast when they **actually change** and there’s an **audience**.


* Cuts Redis command rate under load; keeps the hot path O(1) per keypress (amortized).
* Avoids pointless reads when idle. 

---

## File structure

```
repo/
├─ index.js         # server: Express + Socket.IO, batching, Redis writes, broadcast loop
├─ client/
│  ├─ index.html    # minimal UI shell (served statically by Express)
│  ├─ script.js     # client: username rules, WebSocket events, 1s buffering, combo system
│  ├─ bonusWords.txt# word list for combo scoring (fetched by client)
│  └─ click.mp3     # tap sound (WebAudio)
└─ syk.cjs          # quick test script (Socket.IO load/poke harness)
```

---

## Requirements

* Node.js 18+
* An Upstash Redis database (HTTP/REST).
* `.env` with:

```
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
NODE_ENV=production
PORT=3000
```

---

## Quick start

```bash
npm ci
node index.js
# open http://localhost:3000 (served via Express)
```

---

## How it works

**Redis keys**

* `leaderboard` (ZSET): member=`userID`, score=`total presses`.
* `usernames` (HASH): `userID → sanitizedUsername`.
* `globalCount` (STRING): total presses across all users.

**Server loop**

* Buffers: `pendUsernames`, `pendScores`, `pendGlobal`.
* Every `FLUSH_MS` (200ms): one atomic `MULTI` with `HSET`, `ZINCRBY`, `INCRBY`.
* Broadcast loop: only emits `leaderboard`/`update` if **dirty**, above a small **threshold**, and **users are connected**.

**Client loop**

* Buffers local `bubbleCount` for ~1s then `socket.emit("increment", { userID, username, amount })`.
* Renders `leaderboard` and global count updates; enforces username rules (1–10 chars, `A–Z a–z 0–9 _ -`).

---

## Events

**Client → Server**

* `increment({ userID, username, amount, rid? })`

**Server → Client**

* `init({ count, leaderboard })`
* `update(number)` – new global count
* `leaderboard(Array<{userID, username, total}>)`
* `onlineCount(number)`
* `log_batch(Array<{username, increment}>)`

---

## Testing (syk.cjs)

A small Socket.IO harness to simulate clients that send `increment` events and observe broadcasts and server requests.

* Demonstrates **batching & back‑pressure**, **dirty‑bit broadcasting**, and **idle‑aware** operation.
* Clear separation of concerns (client input → server buffer → atomic DB write → gated fan‑out).
* Swappable Redis provider; Nginx/PM2 notes included for production hygiene.

---

## License

MIT
