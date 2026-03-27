/** 
 * TariffWeaver Agent System
 * ------------------------
 * Each agent simulates reasoning and provides structured output.
 */

class RegulatoryAgent {
  constructor(bom) {
    this.bom = bom;
    this.logger = null;
  }

  log(msg) {
    if (this.logger) this.logger.add(msg);
    console.log(`[Regulatory]: ${msg}`);
  }

  async analyze(tariffEvent) {
    this.log("Scanning Bill of Materials for affected components...");
    const affected = this.bom.components.filter(c => c.name.toLowerCase() === tariffEvent.component.toLowerCase());
    
    if (affected.length > 0) {
      this.log(`⚠️ MATCH FOUND: ${affected.length} component(s) impacted: ${tariffEvent.component}.`);
      this.log(`Current Duty: ${tariffEvent.old_duty}% -> New Duty: ${tariffEvent.new_duty}%`);
    } else {
      this.log("No components in current BOM directly affected by this regulation.");
      return null;
    }

    this.log("Validating compliance for potential redesigns...");
    this.log("Rule R-101: Country of Origin shift requires Form 7-A filing.");
    this.log("Rule R-202: Material swaps must meet RoHS/CE standards.");
    
    return {
      affectedComponents: affected,
      complianceStatus: "READY",
      tariffEvent
    };
  }
}

class EngineeringAgent {
  constructor() {
    this.logger = null;
  }

  log(msg) {
    if (this.logger) this.logger.add(msg);
    console.log(`[Engineering]: ${msg}`);
  }

  async generateOptions(regData) {
    const comp = regData.affectedComponents[0];
    this.log(`Engineering brainstorming for component: [${comp.name}]...`);

    const options = [
      {
        id: 'SOURCING_SHIFT',
        name: 'Strategic Sourcing Shift',
        description: `Change sourcing of ${comp.name} from China to Vietnam.`,
        newDuty: 5,
        costChangePerUnit: 2,
        feasibility: 'HIGH',
        playbook: 'Lower duty (5%) outweighs the $2 unit cost increase.'
      },
      {
        id: 'MATERIAL_SWAP',
        name: 'Material Swap (Composite)',
        description: `Replace ${comp.name} magnet with Aluminum-based composite.`,
        newDuty: 10,
        costChangePerUnit: -1,
        feasibility: 'MEDIUM',
        playbook: 'Requires 4 weeks of reliability testing but offers material savings.'
      },
      {
        id: 'UNBUNDLING',
        name: 'In-Country Assembly (Unbundling)',
        description: `Import components separately and assemble in USA.`,
        newDuty: 0,
        costChangePerUnit: 5,
        feasibility: 'LOW',
        playbook: 'Best duty protection but significantly increases labor overhead.'
      }
    ];

    this.log(`Generated ${options.length} redesign strategies.`);
    this.log("Sourcing Shift: High Feasibility (Recommended).");
    return options;
  }
}

class FinOpsAgent {
  constructor(annualVolume) {
    this.annualVolume = annualVolume;
    this.logger = null;
  }

  log(msg) {
    if (this.logger) this.logger.add(msg);
    console.log(`[FinOps]: ${msg}`);
  }

  async calculate(options, regData) {
    this.log("Running financial simulations for all options...");
    const results = options.map(opt => {
      const comp = regData.affectedComponents[0];
      const oldDutyAmt = (comp.cost * (regData.tariffEvent.new_duty / 100));
      const baselineDutyAmt = (comp.cost * (regData.tariffEvent.old_duty / 100));
      
      const newDutyAmt = (comp.cost * (opt.newDuty / 100));
      const dutySavingPerUnit = oldDutyAmt - newDutyAmt;
      const netSavingPerUnit = dutySavingPerUnit - opt.costChangePerUnit;
      const totalAnnualSaving = netSavingPerUnit * this.annualVolume;

      return {
        ...opt,
        totalAnnualSaving,
        oldTotalCost: (comp.cost + oldDutyAmt) * this.annualVolume,
        newTotalCost: (comp.cost + opt.costChangePerUnit + newDutyAmt) * this.annualVolume
      };
    });

    this.log("Ranking strategies by Net Present Value (NPV) and Feasibility...");
    results.sort((a, b) => b.totalAnnualSaving - a.totalAnnualSaving);
    const best = results.find(r => r.feasibility === 'HIGH') || results[0];
    
    this.log(`Optimization complete. Best choice: ${best.name}.`);
    return {
      allOptions: results,
      bestRecommendation: best
    };
  }
}


// Utility for logs adding as proxy
function createLogger(domElement, prefixClass) {
  return {
    add: (msg) => {
      const entry = document.createElement('div');
      entry.className = `log-entry ${prefixClass}`;
      entry.innerHTML = `<span class="log-agent">${prefixClass.toUpperCase().replace('LOG-', '')}:</span> ${msg}`;
      domElement.appendChild(entry);
      domElement.scrollTop = domElement.scrollHeight;
    }
  };
}
