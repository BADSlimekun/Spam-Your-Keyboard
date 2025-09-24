// swarm.cjs – CJS version
const { io } = require('socket.io-client');
const { randomUUID } = require('crypto');

const TARGET = process.argv[2] || 'ws://127.0.0.1:3000';
const NUM_CLIENTS = parseInt(process.env.CLIENTS || '200', 10);
const KEYS_PER_SEC = 8, BURST_MS = 3000, GAP_MS = 1200;
const SYNC = process.env.SYNC === '1';

const rtts = [];
const inflight = new Map();
let sent = 0, acked = 0, keypresses = 0;

const nowNs = () => process.hrtime.bigint();
const nsToMs = ns => Number(ns) / 1e6;
function pct(a, p){ if(!a.length) return 0; const s=[...a].sort((x,y)=>x-y);
  const i=Math.ceil((p/100)*s.length)-1; return s[Math.max(0,Math.min(i,s.length-1))]; }

function spawnClient(i){
  const userID = randomUUID();
  const username = `swarm_${i}`;
  const socket = io(TARGET, { transports:['websocket'], reconnection:true });

  let delta=0, pressTimer=null, phaseTimer=null;

  function startBurst(){
    pressTimer = setInterval(()=>{ delta++; keypresses++; }, Math.floor(1000/KEYS_PER_SEC));
    phaseTimer = setTimeout(()=>{ clearInterval(pressTimer); startGap(); }, BURST_MS);
  }
  function startGap(){
    phaseTimer = setTimeout(()=>{
      if (delta>0){
        const rid = randomUUID();
        inflight.set(rid, nowNs());
        socket.emit('increment', { userID, username, amount: delta, rid });
        sent++; delta=0;
      }
      startBurst();
    }, GAP_MS);
  }

  socket.on('connect', ()=>{
    const jitter = SYNC ? 0 : Math.floor(Math.random()*(BURST_MS+GAP_MS));
    setTimeout(startBurst, jitter);
  });

  socket.on('ack', ({ rid })=>{
    const t0 = inflight.get(rid);
    if (t0){ rtts.push(nsToMs(nowNs()-t0)); inflight.delete(rid); acked++; }
  });

  socket.on('disconnect', ()=>{
    clearInterval(pressTimer); clearTimeout(phaseTimer);
  });
}

for (let i=0;i<NUM_CLIENTS;i++) spawnClient(i);

setInterval(()=>{
  console.log(`[STATS] clients=${NUM_CLIENTS} increments_sent=${sent} acked=${acked} inFlight=${inflight.size} p50=${pct(rtts,50).toFixed(1)}ms p95=${pct(rtts,95).toFixed(1)}ms p99=${pct(rtts,99).toFixed(1)}ms keypresses=${keypresses}`);
  if (rtts.length>50000) rtts.splice(0, rtts.length-10000);
}, 10000);

process.on('SIGINT', ()=>{
  console.log(`\n[RESULT] increments_sent=${sent} increments_acked=${acked} lost_inflight=${inflight.size} keypresses_simulated=${keypresses}`);
  process.exit(0);
});
