const GOAL = 1000;

const DRINKS = [
  { id:'espresso', name:'Espresso',   emoji:'☕', price:8,  brewTime:0.9 },
  { id:'latte',    name:'Latte',      emoji:'🥛', price:15, brewTime:1.6 },
  { id:'mocha',    name:'Mocha',      emoji:'🍫', price:22, brewTime:2.2 },
  { id:'milktea',  name:'Milk Tea',   emoji:'🧋', price:18, brewTime:1.9 },
  { id:'pandesal', name:'Pandesal',   emoji:'🥐', price:10, brewTime:1.1 },
  { id:'frappe',   name:'Frappe',     emoji:'🧊', price:30, brewTime:2.8 },
];

const UPGRADES = [
  { id:'beans',   name:'Better Beans',  icon:'🌱', desc:'Espresso ×3',      cost:60,  drink:'espresso', mult:3 },
  { id:'oat',     name:'Oat Milk',      icon:'🌾', desc:'Latte ×3',         cost:120, drink:'latte',    mult:3 },
  { id:'speed',   name:'Speed Grinder', icon:'⚙️', desc:'All brew 2× faster',cost:200, drink:'all', speedMult:2 },
  { id:'choco',   name:'Dark Choco',    icon:'🍫', desc:'Mocha ×3',         cost:180, drink:'mocha',    mult:3 },
  { id:'premium', name:'Premium Menu',  icon:'✨', desc:'All drinks ×2',    cost:400, drink:'all',      mult:2 },
];

const DIFF = {
  easy:   { label:'😊 Easy',   rivalSpeed:0.55, rivalUpgChance:0.15 },
  medium: { label:'😤 Medium', rivalSpeed:0.85, rivalUpgChance:0.35 },
  hard:   { label:'🔥 Hard',   rivalSpeed:1.25, rivalUpgChance:0.6  },
};

let youMoney   = 0;
let rivalMoney = 0;
let timeLeft   = 90;
let gameRunning= false;
let difficulty = 'easy';
let brewMult   = {};
let speedMult  = 1;
let upgBought  = {};
let rivalUpgs  = [];
let mainTimer  = null;
let rivalTimer = null;

DRINKS.forEach(d => brewMult[d.id] = 1);

function setDiff(d) {
  difficulty = d;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('diff_' + d).classList.add('selected');
}

function drinkVal(drink) {
  let v = drink.price * brewMult[drink.id];
  if (upgBought['premium']) v *= 2;
  return Math.floor(v);
}

function drinkTime(drink) {
  let t = drink.brewTime;
  if (upgBought['speed']) t /= 2;
  return t;
}

function buildDrinksGrid() {
  const grid = document.getElementById('drinksGrid');
  grid.innerHTML = '';
  DRINKS.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'drink-btn';
    btn.id = 'db_' + d.id;
    btn.innerHTML = `
      <span class="d-emoji">${d.emoji}</span>
      <span class="d-name">${d.name}</span>
      <span class="d-price" id="dp_${d.id}">₱${drinkVal(d)}</span>
      <div class="brew-track"><div class="brew-fill" id="bf_${d.id}"></div></div>
    `;
    btn.onclick = () => brewDrink(d, btn);
    grid.appendChild(btn);
  });
}

function buildUpgGrid() {
  const grid = document.getElementById('upgGrid');
  grid.innerHTML = '';
  UPGRADES.forEach(u => {
    const btn = document.createElement('button');
    btn.className = 'upg-btn';
    btn.id = 'ub_' + u.id;
    btn.disabled = upgBought[u.id] || youMoney < u.cost;
    btn.innerHTML = `
      <span class="upg-icon">${u.icon}</span>
      <div>
        <div class="upg-name">${u.name}${upgBought[u.id] ? ' <span class="upg-owned">owned</span>' : ''}</div>
        <div class="upg-desc">${u.desc}</div>
        <div class="upg-cost">₱${u.cost}</div>
      </div>
    `;
    btn.onclick = () => buyUpgrade(u);
    grid.appendChild(btn);
  });
}

function brewDrink(drink, btn) {
  if (!gameRunning || btn.disabled) return;
  btn.disabled = true;
  btn.classList.add('brewing');
  const bar = document.getElementById('bf_' + drink.id);
  const t = drinkTime(drink);
  const steps = 20;
  const step = (t * 1000) / steps;
  let i = 0;
  const iv = setInterval(() => {
    i++;
    bar.style.width = (i / steps * 100) + '%';
    if (i >= steps) {
      clearInterval(iv);
      bar.style.width = '0%';
      btn.disabled = false;
      btn.classList.remove('brewing');
      const val = drinkVal(drink);
      youMoney += val;
      updateHUD();
      spawnFloat('+₱' + val, btn);
      checkWin();
    }
  }, step);
}

function buyUpgrade(u) {
  if (upgBought[u.id] || youMoney < u.cost) { showToast('Not enough money! 💸'); return; }
  youMoney -= u.cost;
  upgBought[u.id] = true;
  if (u.speedMult) speedMult *= u.speedMult;
  else if (u.drink === 'all') DRINKS.forEach(d => brewMult[d.id] *= u.mult);
  else brewMult[u.drink] *= u.mult;
  updateHUD();
  buildDrinksGrid();
  buildUpgGrid();
  showToast(u.name + ' unlocked! ✨');
}

function rivalTick() {
  const cfg = DIFF[difficulty];
  const drink = DRINKS[Math.floor(Math.random() * DRINKS.length)];
  let rivalMult = 1;
  rivalUpgs.forEach(uid => {
    const u = UPGRADES.find(x => x.id === uid);
    if (u) {
      if (u.drink === 'all' && u.mult) rivalMult *= u.mult;
      else if (u.drink === drink.id) rivalMult *= u.mult;
    }
  });
  const earned = Math.floor(drink.price * rivalMult * cfg.rivalSpeed);
  rivalMoney += earned;

  if (Math.random() < cfg.rivalUpgChance / 10 && rivalUpgs.length < UPGRADES.length) {
    const available = UPGRADES.filter(u => !rivalUpgs.includes(u.id));
    if (available.length) {
      const pick = available[Math.floor(Math.random() * available.length)];
      rivalUpgs.push(pick.id);
      updateRivalUpgList();
      showToast('Rival bought ' + pick.name + '! 😱');
    }
  }

  document.getElementById('rivalActivity').innerHTML =
    `<div><span class="rival-drink-anim">${drink.emoji}</span><span style="font-size:13px;color:#c0392b;font-weight:800;">Brewing ${drink.name}… +₱${earned}</span></div>`;

  updateHUD();
  checkWin();
}

function updateRivalUpgList() {
  const el = document.getElementById('rivalUpgList');
  if (rivalUpgs.length === 0) { el.textContent = 'None yet'; return; }
  el.innerHTML = rivalUpgs.map(uid => {
    const u = UPGRADES.find(x => x.id === uid);
    return u ? `<span style="margin-right:6px;">${u.icon} ${u.name}</span>` : '';
  }).join('');
}

function updateHUD() {
  document.getElementById('youMoney').textContent   = Math.floor(youMoney);
  document.getElementById('rivalMoney').textContent = Math.floor(rivalMoney);
  document.getElementById('youChip').textContent    = Math.floor(youMoney);
  document.getElementById('rivalChip').textContent  = Math.floor(rivalMoney);
  document.getElementById('timerVal').textContent   = timeLeft;

  const youPct   = Math.min(50, youMoney   / GOAL * 50);
  const rivalPct = Math.min(50, rivalMoney / GOAL * 50);

  document.getElementById('raceYou').style.width   = youPct + '%';
  document.getElementById('raceYou').textContent   = Math.floor(youMoney);
  document.getElementById('raceRival').style.width = rivalPct + '%';
  document.getElementById('raceRival').textContent = Math.floor(rivalMoney);

  if (timeLeft <= 15) document.getElementById('timerChip').classList.add('urgent');

  UPGRADES.forEach(u => {
    const btn = document.getElementById('ub_' + u.id);
    if (btn && !upgBought[u.id]) btn.disabled = youMoney < u.cost;
  });

  DRINKS.forEach(d => {
    const el = document.getElementById('dp_' + d.id);
    if (el) el.textContent = '₱' + drinkVal(d);
  });
}

function checkWin() {
  if (!gameRunning) return;
  if (youMoney >= GOAL) { endGame('you'); return; }
  if (rivalMoney >= GOAL) { endGame('rival'); return; }
}

function startGame() {
  document.getElementById('setupPanel').style.display = 'none';
  document.getElementById('gamePanel').style.display  = '';
  youMoney = 0; rivalMoney = 0; timeLeft = 90;
  gameRunning = true; rivalUpgs = [];
  upgBought = {}; DRINKS.forEach(d => brewMult[d.id] = 1); speedMult = 1;
  buildDrinksGrid(); buildUpgGrid(); updateHUD();

  mainTimer = setInterval(() => {
    timeLeft--;
    updateHUD();
    if (timeLeft <= 0) endGame('time');
  }, 1000);

  const rivalInterval = 1000 / DIFF[difficulty].rivalSpeed;
  rivalTimer = setInterval(rivalTick, rivalInterval);
}

function endGame(who) {
  if (!gameRunning) return;
  gameRunning = false;
  clearInterval(mainTimer);
  clearInterval(rivalTimer);

  let emoji, title, sub;
  if (who === 'you') {
    emoji = '🏆'; title = 'You Win!';
    sub = 'Your café reached ₱1,000 first. LCBA students are the best baristas!';
  } else if (who === 'rival') {
    emoji = '😓'; title = 'Rival Wins!';
    sub = 'The rival café got there first. Brew faster next time!';
  } else {
    if (youMoney > rivalMoney) {
      emoji = '🏆'; title = "Time's Up — You Win!";
      sub = 'Time ran out but you had more money. Nice work!';
    } else if (rivalMoney > youMoney) {
      emoji = '😓'; title = "Time's Up — Rival Wins!";
      sub = 'Time ran out and the rival was ahead. So close!';
    } else {
      emoji = '🤝'; title = "It's a Draw!";
      sub = 'Perfectly matched cafés. Rematch?';
    }
  }

  document.getElementById('endEmoji').textContent = emoji;
  document.getElementById('endTitle').textContent = title;
  document.getElementById('endSub').textContent   = sub;
  document.getElementById('endYou').textContent   = Math.floor(youMoney);
  document.getElementById('endRival').textContent = Math.floor(rivalMoney);
  document.getElementById('overlay').classList.add('show');
}

function resetGame() {
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('gamePanel').style.display  = 'none';
  document.getElementById('setupPanel').style.display = '';
  document.getElementById('timerChip').classList.remove('urgent');
  document.getElementById('raceYou').style.width   = '0%';
  document.getElementById('raceRival').style.width = '0%';
  document.getElementById('rivalActivity').innerHTML = 'Rival is setting up…';
  document.getElementById('rivalUpgList').textContent = 'None yet';
  document.getElementById('drinksGrid').innerHTML = '';
  document.getElementById('upgGrid').innerHTML = '';
  updateHUD();
}

function spawnFloat(text, btn) {
  const el = document.createElement('div');
  el.className = 'float-money';
  el.textContent = text;
  const r = btn.getBoundingClientRect();
  el.style.left = (r.left + r.width / 2 - 16) + 'px';
  el.style.top  = (r.top + window.scrollY - 8) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
