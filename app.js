// ---------- Helpers ----------
const clamp = (x, lo=0, hi=100) => Math.max(lo, Math.min(hi, x));
const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

function formatINR(n){
  const sign = n < 0 ? "-" : "";
  n = Math.abs(n);
  const s = String(n);
  if (s.length <= 3) return `${sign}₹${s}`;
  const last3 = s.slice(-3);
  let rem = s.slice(0, -3);
  const parts = [];
  while (rem.length > 2){ parts.unshift(rem.slice(-2)); rem = rem.slice(0, -2); }
  if (rem) parts.unshift(rem);
  return `${sign}₹${parts.join(",")},${last3}`;
}

function el(id){ return document.getElementById(id); }

// ---------- Data ----------
const JOBS = [
  { title:"Delivery Partner", salary:18000, minSmarts:0 },
  { title:"Call Center Executive", salary:28000, minSmarts:30 },
  { title:"Govt Clerk", salary:42000, minSmarts:40 },
  { title:"Police Sub-Inspector", salary:52000, minSmarts:45 },
  { title:"Software Engineer", salary:90000, minSmarts:55 },
  { title:"Bank PO", salary:65000, minSmarts:55 },
  { title:"IAS Officer", salary:120000, minSmarts:75 },
];

const SUPPLIES = {
  rifles:  { label:"Rifles",  unitCost:70000,     strength:1 },
  ammo:    { label:"Ammo",    unitCost:12000,     strength:1 },
  drones:  { label:"Drones",  unitCost:2500000,   strength:12 },
  tanks:   { label:"Tanks",   unitCost:65000000,  strength:40 },
  jets:    { label:"Jets",    unitCost:520000000, strength:90 },
  missiles:{ label:"Missiles",unitCost:180000000, strength:70 },
};

const STORAGE_KEY = "presidentlife_save_v1";

// ---------- State ----------
function defaultState(){
  return {
    name: "Harsh",
    age: 18,
    role: "Citizen",

    health: rand(70,90),
    happiness: rand(55,85),
    smarts: rand(45,75),
    looks: rand(40,80),
    popularity: 35,

    money: 50000,
    job: "Unemployed",
    monthlySalary: 0,

    // leader stats
    publicSupport: 50,
    corruption: 0,
    taxRate: 20,
    treasury: 200000000,
    militaryStrength: 220,
    supplies: {},

    neighbors: [
      { name:"Northland", relations:-10, threat:35, strength:260 },
      { name:"Eastaria", relations:20,  threat:15, strength:180 },
      { name:"Westovia", relations:-35, threat:55, strength:320 },
    ],

    log: ["Welcome to PresidentLife 🇮🇳"]
  };
}

let S = load() ?? defaultState();

// ---------- Save/Load ----------
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  toast("Saved ✅");
}
function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch{ return null; }
}
function resetGame(){
  if(!confirm("Reset game? You will lose your saved life.")) return;
  S = defaultState();
  localStorage.removeItem(STORAGE_KEY);
  render();
  toast("Reset ✅");
}

// ---------- Log ----------
function addLog(msg){
  S.log.unshift(msg);
  S.log = S.log.slice(0, 40);
}
function toast(msg){
  addLog(msg);
  renderLog();
}

// ---------- Gameplay ----------
function scandalRisk(){
  return clamp(10 + Math.floor(S.corruption/2) - Math.floor(S.popularity/4), 0, 95);
}

function monthlyIncome(){
  if(S.monthlySalary > 0) S.money += S.monthlySalary;
  const expenses = 8000 + (S.age * 120);
  S.money -= expenses;
  if(S.money < 0) S.happiness -= 2;
}

function randomLifeEvent(){
  const roll = rand(1,100);
  if(roll <= 18){
    const gain = rand(10000,80000);
    S.money += gain;
    addLog(`You got side income of ${formatINR(gain)}.`);
  } else if(roll <= 32){
    const cost = rand(5000,60000);
    S.money -= cost;
    S.health -= 4;
    addLog(`Medical expense: ${formatINR(cost)}. Health -4.`);
  } else if(roll <= 55){
    const boost = rand(3,9);
    S.smarts += boost;
    addLog(`You studied hard. Smarts +${boost}.`);
  } else if(roll <= 75){
    const boost = rand(3,10);
    S.happiness += boost;
    addLog(`Good social year. Happiness +${boost}.`);
  } else {
    addLog("Quiet year. Nothing major happened.");
  }
}

function simulateNationYear(){
  const collection = Math.max(0, Math.floor((2500000000000/1000) * (S.taxRate/100)));
  S.treasury += collection;

  if(S.taxRate > 28){ S.publicSupport -= 3; S.popularity -= 2; }
  else if(S.taxRate < 15){ S.publicSupport += 1; }

  const leakage = Math.floor((S.treasury * S.corruption) / 4000);
  S.treasury -= leakage;

  if(rand(1,100) <= scandalRisk()){
    S.popularity -= rand(8,18);
    S.publicSupport -= rand(5,15);
    addLog("📰 Scandal exposed! Popularity & support dropped.");
  } else {
    addLog(`Nation ran smoothly. Treasury +${formatINR(collection)} (tax).`);
  }
}

function simulateBorderIncidents(){
  S.neighbors.forEach(c => {
    if(rand(1,100) <= Math.floor(c.threat/2)){
      c.relations -= 5;
      S.publicSupport -= 2;
      addLog(`🚨 Border incident with ${c.name}. Relations worsened.`);
    }
  });
}

function ageUpOneYear(){
  for(let i=0;i<12;i++) monthlyIncome();

  S.age += 1;
  S.health -= rand(0,3);
  S.happiness -= rand(0,2);

  randomLifeEvent();

  if(S.role !== "Citizen"){
    simulateNationYear();
    simulateBorderIncidents();
  }

  S.health = clamp(S.health);
  S.happiness = clamp(S.happiness);
  S.smarts = clamp(S.smarts);
  S.looks = clamp(S.looks);
  S.popularity = clamp(S.popularity);
  S.publicSupport = clamp(S.publicSupport);
  S.corruption = clamp(S.corruption);

  if(S.health <= 0){
    addLog("GAME OVER: Your health hit 0.");
  }
  render();
}

function study(){
  S.smarts = clamp(S.smarts + rand(3,9));
  S.happiness = clamp(S.happiness - rand(1,4));
  addLog("You studied this year. Smarts up.");
  render();
}

function workExtra(){
  const gain = rand(8000,22000);
  S.money += gain;
  S.health = clamp(S.health - rand(1,4));
  addLog(`You worked extra and earned ${formatINR(gain)}.`);
  render();
}

function applyJob(job){
  if(S.smarts < job.minSmarts){
    addLog(`Rejected for ${job.title}. Need Smarts ${job.minSmarts}+.`);
    render();
    return;
  }
  S.job = job.title;
  S.monthlySalary = job.salary;
  S.popularity = clamp(S.popularity + 2);
  addLog(`Hired: ${job.title} — ${formatINR(job.salary)}/month.`);
  render();
}

function canRunElection(){
  return S.age >= 30 && S.smarts >= 55 && S.popularity >= 45;
}

function runElection(){
  if(!canRunElection()){
    addLog("Not eligible: Need Age 30+, Smarts 55+, Popularity 45+.");
    render();
    return;
  }
  const winChance = clamp(S.popularity + Math.floor(S.smarts/2) - Math.floor(S.corruption/2), 5, 95);
  const roll = rand(1,100);
  if(roll <= winChance){
    S.role = "President";
    S.popularity = clamp(S.popularity + 10);
    S.publicSupport = clamp(S.publicSupport + 8);
    addLog("🏛️ You won the election and became President!");
  } else {
    S.popularity = clamp(S.popularity - 8);
    addLog("You lost the election. Popularity -8.");
  }
  render();
}

function takeBribe(){
  if(S.role === "Citizen"){ addLog("Only the President can do this."); render(); return; }
  const bribe = rand(200000,2500000);
  S.money += bribe;
  S.corruption = clamp(S.corruption + rand(6,14));
  S.popularity = clamp(S.popularity - rand(2,8));
  addLog(`💼 You took a bribe of ${formatINR(bribe)}. Corruption up, popularity down.`);
  render();
}

function setTaxRate(v){
  if(S.role === "Citizen"){ addLog("Only leadership can set taxes."); render(); return; }
  S.taxRate = clamp(parseInt(v,10), 5, 45);
  addLog(`Tax rate set to ${S.taxRate}%.`);
  render();
}

function buySupply(typeKey, units){
  if(S.role === "Citizen"){ addLog("Only leadership can buy supplies."); render(); return; }
  units = parseInt(units,10);
  if(!units || units <= 0) return;

  const item = SUPPLIES[typeKey];
  const cost = item.unitCost * units;

  if(S.treasury < cost){
    addLog(`Not enough treasury. Need ${formatINR(cost)}.`);
    render();
    return;
  }
  S.treasury -= cost;
  S.supplies[typeKey] = (S.supplies[typeKey] || 0) + units;
  S.militaryStrength += item.strength * units;
  addLog(`🪖 Bought ${units}x ${item.label} for ${formatINR(cost)}. Strength +${item.strength*units}.`);
  render();
}

function startWar(index){
  if(S.role !== "President"){ addLog("Only the President can start war."); render(); return; }
  const c = S.neighbors[index];

  S.popularity = clamp(S.popularity - Math.max(2, 12 - Math.floor(c.threat/10)));
  S.publicSupport = clamp(S.publicSupport - rand(3,10));

  const ourPower = (S.militaryStrength + rand(-40,80) - (S.corruption*2));
  const enemyPower = (c.strength + rand(-30,90));

  if(ourPower >= enemyPower){
    S.publicSupport = clamp(S.publicSupport + 10);
    S.popularity = clamp(S.popularity + 6);
    S.treasury += rand(10000000,50000000);
    c.relations -= 15;
    c.threat = clamp(c.threat - 20);
    addLog(`⚔️ War vs ${c.name}: YOU WON. Support +10. Treasury increased.`);
  } else {
    S.publicSupport = clamp(S.publicSupport - 12);
    S.popularity = clamp(S.popularity - 10);
    S.health = clamp(S.health - 6);
    S.treasury -= rand(5000000,25000000);
    c.threat = clamp(c.threat + 15);
    addLog(`⚠️ War vs ${c.name}: YOU LOST. Support -12. Treasury decreased.`);
  }

  render();
}

// ---------- UI Render ----------
function setBar(value, valueEl, barEl){
  valueEl.textContent = value;
  barEl.style.width = `${clamp(value)}%`;
}

function inventoryText(){
  const keys = Object.keys(S.supplies);
  if(keys.length === 0) return "None";
  return keys.map(k => `${SUPPLIES[k].label}: ${S.supplies[k]}`).join(" · ");
}

function renderJobs(){
  const wrap = el("jobs");
  wrap.innerHTML = "";
  JOBS.forEach(j => {
    const d = document.createElement("div");
    d.className = "chip";
    d.innerHTML = `${j.title}<strong>${formatINR(j.salary)}/mo</strong><span class="smallText">Need Smarts ${j.minSmarts}+</span>`;
    d.addEventListener("click", () => applyJob(j));
    wrap.appendChild(d);
  });
}

function renderCountries(){
  const wrap = el("countries");
  wrap.innerHTML = "";
  S.neighbors.forEach((c, idx) => {
    const box = document.createElement("div");
    box.className = "country";
    box.innerHTML = `
      <div class="countryTop">
        <strong>${c.name}</strong>
        <span class="smallText">Strength ${c.strength}</span>
      </div>
      <div class="countryMeta">
        <span>Relations: ${c.relations}</span>
        <span>Threat: ${c.threat}</span>
      </div>
      ${S.role === "President" ? `<div style="margin-top:10px">
        <button class="ghost" data-war="${idx}">Start War</button>
      </div>` : ""}
    `;
    wrap.appendChild(box);
  });

  wrap.querySelectorAll("button[data-war]").forEach(btn => {
    btn.addEventListener("click", () => startWar(parseInt(btn.dataset.war,10)));
  });
}

function renderLog(){
  const wrap = el("log");
  wrap.innerHTML = "";
  S.log.slice(0, 14).forEach(item => {
    const d = document.createElement("div");
    d.className = "logItem";
    d.textContent = `• ${item}`;
    wrap.appendChild(d);
  });
}

function render(){
  el("name").value = S.name;
  el("age").textContent = S.age;
  el("role").textContent = S.role;
  el("money").textContent = formatINR(S.money);
  el("job").textContent = S.job;

  setBar(S.health, el("healthV"), el("healthB"));
  setBar(S.happiness, el("happyV"), el("happyB"));
  setBar(S.smarts, el("smartV"), el("smartB"));
  setBar(S.looks, el("looksV"), el("looksB"));
  setBar(S.popularity, el("popV"), el("popB"));
  setBar(S.publicSupport, el("supportV"), el("supportB"));
  setBar(S.corruption, el("corrV"), el("corrB"));

  const panel = el("presidentPanel");
  panel.style.display = (S.role === "Citizen") ? "none" : "block";

  el("treasury").textContent = formatINR(S.treasury);
  el("mil").textContent = S.militaryStrength;
  el("taxRate").textContent = `${S.taxRate}%`;
  el("invShort").textContent = inventoryText();

  el("taxSlider").value = S.taxRate;
  el("inventory").textContent = "Inventory: " + inventoryText();

  renderCountries();
  renderLog();
}

// ---------- Init UI ----------
function init(){
  const st = el("supplyType");
  st.innerHTML = "";
  Object.keys(SUPPLIES).forEach(k => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = SUPPLIES[k].label + ` (unit ${formatINR(SUPPLIES[k].unitCost)})`;
    st.appendChild(opt);
  });

  renderJobs();
  render();

  el("name").addEventListener("input", (e) => { S.name = e.target.value || "Player"; });
  el("btnYear").addEventListener("click", ageUpOneYear);
  el("btnStudy").addEventListener("click", study);
  el("btnWork").addEventListener("click", workExtra);
  el("btnElection").addEventListener("click", runElection);

  el("btnBribe").addEventListener("click", takeBribe);
  el("btnTax").addEventListener("click", () => setTaxRate(el("taxSlider").value));
  el("btnBuy").addEventListener("click", () => buySupply(el("supplyType").value, el("supplyUnits").value));

  el("btnSave").addEventListener("click", save);
  el("btnReset").addEventListener("click", resetGame);

  setInterval(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(S)), 5000);
}

init();
