// TariffWeaver Application Coordinator

const MOCK_BOM = {
    product: "Speaker System (G2)",
    components: [
        { name: "Magnet", cost: 20, country: "China", currentDuty: 10 },
        { name: "Plastic Housing", cost: 10, country: "India", currentDuty: 5 },
        { name: "PCB Assembly", cost: 35, country: "Taiwan", currentDuty: 2 },
        { name: "Aluminum Cone", cost: 15, country: "Vietnam", currentDuty: 0 }
    ],
    annual_volume: 100000
};

// Application State
let currentTariffEvent = null;
let apiNewsHeadline = null;

// UI Elements
const logContainer = document.getElementById('agent-logs');
const newsBanner = document.getElementById('headline-text');
const fetchBtn = document.getElementById('fetch-news');
const runBtn = document.getElementById('run-analysis');
const bomBody = document.getElementById('bom-body');
const resultsCard = document.getElementById('results-card');

// Initialize BOM Table
function renderBOM() {
    bomBody.innerHTML = MOCK_BOM.components.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>$${c.cost.toFixed(2)}</td>
            <td><span class="badge badge-country">${c.country}</span></td>
            <td><span class="badge" style="background: rgba(255,165,0,0.2); color: orange;">${c.currentDuty}%</span></td>
        </tr>
    `).join('');
}

// News API logic
async function fetchNews() {
    const inputKey = document.getElementById('api-key').value;
    const defaultKey = '';
    const key = inputKey || defaultKey;
    const fallbackAlert = document.getElementById('fallback-alert');
    const query = 'tariff OR "import duty" OR "customs duty" OR "trade war" OR "import tax"';
    const fallbackHeadline = "New US-China Trade Probe Targets Magnet Production in Mainland China";
    
    if (!key) {
        alert("Please enter a valid NewsAPI Key first!");
        return;
    }

    fetchBtn.innerHTML = '<i class="lucide lucide-loader-2 pulse"></i> Validating Key...';
    fetchBtn.disabled = true;
    fallbackAlert.style.display = 'none';

    try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${key}&pageSize=1&language=en`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("API Connection Failed (Invalid Key/Limit)");
        
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
            apiNewsHeadline = data.articles[0].title;
            newsBanner.innerHTML = `<span style="color: #10b981;">✅ API Connected!</span> ${apiNewsHeadline}`;
        } else {
            apiNewsHeadline = fallbackHeadline;
            newsBanner.innerHTML = `<span style="color: #fbbf24;">⚠️ API Connected (No Results).</span> Falling back to cached data.`;
            fallbackAlert.style.display = 'block';
        }

        newsBanner.style.color = '#fff';
        runBtn.disabled = false;
        
        currentTariffEvent = mapHeadlineToTariff(apiNewsHeadline);
        fetchBtn.innerHTML = '<i data-lucide="check-circle"></i> Connection Verified';
        lucide.createIcons();
    } catch (err) {
        console.error("NewsAPI Error:", err);
        newsBanner.innerHTML = `<span style="color: #f43f5e;">⚠️ API Error: ${err.message}.</span> Switching to Demo Mode.`;
        fallbackAlert.style.display = 'block';
        fallbackAlert.innerHTML = `<i data-lucide="alert-triangle"></i> Demo Mode: API Connection Failed (${err.message})`;
        
        apiNewsHeadline = fallbackHeadline;
        runBtn.disabled = false;
        currentTariffEvent = mapHeadlineToTariff(apiNewsHeadline);
        fetchBtn.innerHTML = '<i data-lucide="alert-circle"></i> Service Unavailable';
        lucide.createIcons();
    }
}

async function activateDemo() {
    const fallbackHeadline = "US Trade Commission Flagged for 25% Import Duty hike on Chinese Magnetics";
    const demoBtn = document.getElementById('activate-demo');
    const fallbackAlert = document.getElementById('fallback-alert');
    
    demoBtn.innerHTML = '<i class="lucide lucide-loader-2 pulse"></i> Initializing...';
    await new Promise(r => setTimeout(r, 600));

    apiNewsHeadline = fallbackHeadline;
    newsBanner.innerHTML = `<i data-lucide="check-circle" size="14"></i> ${apiNewsHeadline}`;
    newsBanner.style.color = '#10b981';
    
    fallbackAlert.style.display = 'block';
    fallbackAlert.innerHTML = '<i data-lucide="info"></i> Predefined Hackathon Demo Mode Active (Bypassed API)';
    
    runBtn.disabled = false;
    currentTariffEvent = mapHeadlineToTariff(apiNewsHeadline);
    demoBtn.innerHTML = '<i data-lucide="database"></i> Demo Loaded';
    lucide.createIcons();
}

// Map headline words to components
function mapHeadlineToTariff(headline) {
    const hl = headline.toLowerCase();
    let component = "Magnet"; // Default for demo
    let oldDuty = 10;
    let newDuty = 25;

    if (hl.includes("plastic") || hl.includes("resin") || hl.includes("poly")) {
        component = "Plastic Housing";
        oldDuty = 5;
        newDuty = 35;
    } else if (hl.includes("aluminum") || hl.includes("metal")) {
        component = "Aluminum Cone";
        oldDuty = 0;
        newDuty = 15;
    } else if (hl.includes("pcb") || hl.includes("chip") || hl.includes("circuit")) {
        component = "PCB Assembly";
        oldDuty = 2;
        newDuty = 25;
    }

    return { component, old_duty: oldDuty, new_duty: newDuty };
}

// Main sequence
async function runAnalysisSequence() {
    runBtn.disabled = true;
    logContainer.innerHTML = '';
    resultsCard.style.display = 'none';

    // Logger Initialization
    const logReg = createLogger(logContainer, 'log-reg');
    const logEng = createLogger(logContainer, 'log-eng');
    const logFin = createLogger(logContainer, 'log-fin');

    // REGULATORY AGENT
    const regAgent = new RegulatoryAgent(MOCK_BOM);
    regAgent.logger = logReg;
    const regResults = await regAgent.analyze(currentTariffEvent);
    
    if (!regResults) return;
    await new Promise(r => setTimeout(r, 1500));

    // ENGINEERING AGENT
    const engAgent = new EngineeringAgent();
    engAgent.logger = logEng;
    const options = await engAgent.generateOptions(regResults);
    await new Promise(r => setTimeout(r, 1500));

    // FINOPS AGENT
    const finOps = new FinOpsAgent(MOCK_BOM.annual_volume);
    finOps.logger = logFin;
    const finResults = await finOps.calculate(options, regResults);
    await new Promise(r => setTimeout(r, 1500));

    // Display Results
    displayResults(finResults, regResults);
    
    // Summary Update
    document.getElementById('sum-affected').innerText = regResults.affectedComponents[0].name;
    document.getElementById('sum-options').innerText = options.length;
    document.getElementById('sum-verified').innerText = options.filter(o => o.feasibility !== 'LOW').length;
    document.getElementById('sum-result').innerText = finResults.bestRecommendation.name.split(' ')[0];
    document.getElementById('agent-summary-box').style.display = 'flex';

    runBtn.disabled = false;
}

function displayResults(finResults, regResults) {
    const best = finResults.bestRecommendation;
    const optionsDisplay = document.getElementById('options-display');
    resultsCard.style.display = 'block';
    
    // Render All Options
    optionsDisplay.innerHTML = finResults.allOptions.map(opt => `
        <div class="option-mini-card ${opt.id === best.id ? 'selected' : ''}">
            <div class="option-name">${opt.name}</div>
            <div class="option-metric">
                <span>Duty:</span>
                <span class="metric-val">${opt.newDuty}%</span>
            </div>
            <div class="option-metric">
                <span>Cost Δ:</span>
                <span class="metric-val" style="color: ${opt.costChangePerUnit > 0 ? '#f43f5e' : '#10b981'}">
                    ${opt.costChangePerUnit > 0 ? '+' : ''}$${opt.costChangePerUnit}/unit
                </span>
            </div>
            <div class="option-metric">
                <span>Savings:</span>
                <span class="metric-val" style="color: var(--success)">$${(opt.totalAnnualSaving/1000).toFixed(0)}k</span>
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; font-weight: 800;">
                Feasibility: <span style="color: ${opt.feasibility === 'HIGH' ? '#10b981' : opt.feasibility === 'MEDIUM' ? '#fbbf24' : '#f43f5e'}">${opt.feasibility}</span>
            </div>
        </div>
    `).join('');

    document.getElementById('strategy-title').innerText = best.name;
    document.getElementById('strategy-desc').innerText = best.description;
    
    const oldCostAnnual = best.oldTotalCost;
    const newCostAnnual = best.newTotalCost;
    const savingsNet = best.totalAnnualSaving;

    document.getElementById('old-cost').innerText = formatCurrency(oldCostAnnual);
    document.getElementById('new-cost').innerText = formatCurrency(newCostAnnual);
    document.getElementById('net-savings').innerText = formatCurrency(savingsNet);
    
    // Mini arrow values
    document.getElementById('old-val-mini').innerText = formatShortCurrency(oldCostAnnual);
    document.getElementById('new-val-mini').innerText = formatShortCurrency(newCostAnnual);
    
    document.getElementById('playbook-explanation').innerHTML = `
        <p><b>Agent Playbook Logic:</b> ${best.playbook}</p>
        <p style="margin-top: 0.5rem;">Detected a ${regResults.tariffEvent.new_duty}% duty hike on <b>${regResults.tariffEvent.component}</b>. 
        Multi-agent consensus recommends <b>${best.name}</b> due to its superior tradeoff between net savings and implementation feasibility.</p>
    `;

    resultsCard.scrollIntoView({ behavior: 'smooth' });
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

function formatShortCurrency(num) {
    return '$' + (num / 1000000).toFixed(1) + 'M';
}

// Listeners
fetchBtn.addEventListener('click', fetchNews);
document.getElementById('activate-demo').addEventListener('click', activateDemo);
runBtn.addEventListener('click', runAnalysisSequence);

// Initial Render
renderBOM();
lucide.createIcons();
