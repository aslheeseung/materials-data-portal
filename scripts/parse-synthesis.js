/**
 * Ceder Synthesis Dataset Parser
 * Parses solid-state and sol-gel datasets from CederGroupHub
 *
 * Usage: node scripts/parse-synthesis.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'mcp-server', 'data');
const OUTPUT_MCP = path.join(DATA_DIR, 'synthesis.json');
const OUTPUT_WEB = path.join(__dirname, '..', 'src', 'data', 'synthesis-recipes.ts');

function extractTemperature(operations) {
  let minTemp = null;
  let maxTemp = null;

  for (const op of operations) {
    const heating = op.conditions?.heating_temperature;
    if (heating && Array.isArray(heating)) {
      for (const temp of heating) {
        if (temp.min_value !== null) {
          if (minTemp === null || temp.min_value < minTemp) {
            minTemp = temp.min_value;
          }
        }
        if (temp.max_value !== null) {
          if (maxTemp === null || temp.max_value > maxTemp) {
            maxTemp = temp.max_value;
          }
        }
        // Also check values array
        if (temp.values && temp.values.length > 0) {
          for (const v of temp.values) {
            if (minTemp === null || v < minTemp) minTemp = v;
            if (maxTemp === null || v > maxTemp) maxTemp = v;
          }
        }
      }
    }
  }

  return { minTemp, maxTemp };
}

function extractTime(operations) {
  let minTime = null;
  let maxTime = null;

  for (const op of operations) {
    const time = op.conditions?.heating_time;
    if (time && Array.isArray(time)) {
      for (const t of time) {
        if (t.min_value !== null) {
          if (minTime === null || t.min_value < minTime) {
            minTime = t.min_value;
          }
        }
        if (t.max_value !== null) {
          if (maxTime === null || t.max_value > maxTime) {
            maxTime = t.max_value;
          }
        }
        // Also check values array
        if (t.values && t.values.length > 0) {
          for (const v of t.values) {
            if (minTime === null || v < minTime) minTime = v;
            if (maxTime === null || v > maxTime) maxTime = v;
          }
        }
      }
    }
  }

  return { minTime, maxTime };
}

function extractAtmosphere(operations) {
  for (const op of operations) {
    const atm = op.conditions?.heating_atmosphere;
    if (atm && Array.isArray(atm) && atm.length > 0) {
      return atm[0];
    }
  }
  return null;
}

function extractOperationTypes(operations) {
  return operations
    .map(op => op.type)
    .filter(t => t && t !== 'StartingSynthesis');
}

function parseReaction(reaction, index, synthType) {
  const target = reaction.target;
  const precursors = reaction.precursors || [];
  const operations = reaction.operations || [];

  const { minTemp, maxTemp } = extractTemperature(operations);
  const { minTime, maxTime } = extractTime(operations);
  const atmosphere = extractAtmosphere(operations);
  const operationTypes = extractOperationTypes(operations);

  return {
    id: `synth-${synthType === 'solid-state' ? 'ss' : 'sg'}-${index + 1}`,
    doi: reaction.doi || '',
    target_formula: target?.material_formula || target?.material_string || '',
    target_name: target?.material_name || '',
    precursors: precursors.map(p => ({
      formula: p.material_formula || p.material_string || '',
      name: p.material_name || ''
    })).filter(p => p.formula),
    temperature_min: minTemp,
    temperature_max: maxTemp,
    time_min: minTime,
    time_max: maxTime,
    atmosphere: atmosphere,
    operations: operationTypes,
    synthesis_type: synthType
  };
}

function main() {
  console.log('🔬 Parsing Ceder Synthesis Dataset...\n');

  // Load solid-state dataset
  console.log('📖 Loading solid-state dataset...');
  const solidStateFile = path.join(DATA_DIR, 'solid-state.json');
  const solidStateData = JSON.parse(fs.readFileSync(solidStateFile, 'utf8'));
  const solidStateReactions = solidStateData.reactions || [];
  console.log(`   Found ${solidStateReactions.length} solid-state reactions`);

  // Load sol-gel dataset
  console.log('📖 Loading sol-gel dataset...');
  const solGelFile = path.join(DATA_DIR, 'sol-gel.json');
  const solGelData = JSON.parse(fs.readFileSync(solGelFile, 'utf8'));
  const solGelReactions = solGelData.reactions || [];
  console.log(`   Found ${solGelReactions.length} sol-gel reactions\n`);

  // Parse all reactions
  console.log('⚙️  Parsing reactions...');
  const parsedSolidState = solidStateReactions.map((r, i) => parseReaction(r, i, 'solid-state'));
  const parsedSolGel = solGelReactions.map((r, i) => parseReaction(r, i, 'sol-gel'));

  const allRecipes = [...parsedSolidState, ...parsedSolGel];

  // Filter out invalid entries (no target formula)
  const validRecipes = allRecipes.filter(r => r.target_formula && r.target_formula.length > 0);
  console.log(`   Valid recipes: ${validRecipes.length} / ${allRecipes.length}`);

  // Stats
  const withTemp = validRecipes.filter(r => r.temperature_min !== null || r.temperature_max !== null);
  const withTime = validRecipes.filter(r => r.time_min !== null || r.time_max !== null);
  const withAtm = validRecipes.filter(r => r.atmosphere !== null);

  console.log('\n📊 Statistics:');
  console.log(`   With temperature: ${withTemp.length} (${(withTemp.length/validRecipes.length*100).toFixed(1)}%)`);
  console.log(`   With time: ${withTime.length} (${(withTime.length/validRecipes.length*100).toFixed(1)}%)`);
  console.log(`   With atmosphere: ${withAtm.length} (${(withAtm.length/validRecipes.length*100).toFixed(1)}%)`);

  // Write MCP server data (full dataset as JSON)
  console.log('\n💾 Writing MCP server data...');
  fs.writeFileSync(OUTPUT_MCP, JSON.stringify(validRecipes, null, 2));
  console.log(`   Saved to: ${OUTPUT_MCP}`);

  // Write Web data (TypeScript module)
  // For web, we'll limit to first 5000 for performance (client-side)
  const webRecipes = validRecipes.slice(0, 5000);
  console.log('\n💾 Writing Web data (limited to 5000 for client-side performance)...');

  const tsContent = `import { SynthesisRecipe } from '@/components/SynthesisCard'

// Auto-generated from Ceder Group Text-Mined Synthesis Dataset
// Source: https://github.com/CederGroupHub/text-mined-synthesis_public
// Generated: ${new Date().toISOString().split('T')[0]}
// Total recipes: ${validRecipes.length} (showing first 5000 for web performance)

export const synthesisRecipes: SynthesisRecipe[] = ${JSON.stringify(webRecipes, null, 2)}

// Search functions
export function searchByFormula(formula: string, limit = 10): SynthesisRecipe[] {
  const normalized = formula.toLowerCase().replace(/\\s+/g, '')
  return synthesisRecipes
    .filter(r => r.target_formula.toLowerCase().includes(normalized) ||
                 normalized.includes(r.target_formula.toLowerCase()))
    .slice(0, limit)
}

export function searchByPrecursor(precursor: string, limit = 10): SynthesisRecipe[] {
  const normalized = precursor.toLowerCase().replace(/\\s+/g, '')
  return synthesisRecipes
    .filter(r => r.precursors.some(p =>
      p.formula.toLowerCase().includes(normalized) ||
      normalized.includes(p.formula.toLowerCase())
    ))
    .slice(0, limit)
}

export function searchByTemperature(minTemp: number, maxTemp: number, limit = 10): SynthesisRecipe[] {
  return synthesisRecipes
    .filter(r => {
      const tMin = r.temperature_min ?? 0
      const tMax = r.temperature_max ?? Infinity
      return tMax >= minTemp && tMin <= maxTemp
    })
    .slice(0, limit)
}
`;

  fs.writeFileSync(OUTPUT_WEB, tsContent);
  console.log(`   Saved to: ${OUTPUT_WEB}`);

  console.log('\n✅ Done!');
  console.log(`\n📈 Summary:`);
  console.log(`   Total recipes: ${validRecipes.length}`);
  console.log(`   - Solid-state: ${parsedSolidState.filter(r => r.target_formula).length}`);
  console.log(`   - Sol-gel: ${parsedSolGel.filter(r => r.target_formula).length}`);
}

main();
