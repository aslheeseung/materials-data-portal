#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { MaterialsProjectAPI } from './api/materials-project.js';
import { searchByFormula as searchSynthesisByFormula, searchByPrecursor, searchByTemperature, getRecipeCount } from './api/synthesis-data.js';
const API_KEY = process.env.MP_API_KEY || '';
if (!API_KEY) {
    console.error('Error: MP_API_KEY environment variable is required');
    process.exit(1);
}
const api = new MaterialsProjectAPI(API_KEY);
const server = new Server({
    name: 'materials-mcp-server',
    version: '1.1.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Format material for display
function formatMaterial(m) {
    const lines = [
        `**${m.formula_pretty}** (${m.material_id})`,
        `  - Elements: ${m.elements.join(', ')}`,
        `  - Crystal System: ${m.symmetry?.crystal_system || 'N/A'} (${m.symmetry?.symbol || 'N/A'})`,
    ];
    if (m.band_gap !== undefined) {
        lines.push(`  - Band Gap: ${m.band_gap.toFixed(3)} eV ${m.is_metal ? '(Metal)' : ''}`);
    }
    if (m.formation_energy_per_atom !== undefined) {
        lines.push(`  - Formation Energy: ${m.formation_energy_per_atom.toFixed(4)} eV/atom`);
    }
    if (m.energy_above_hull !== undefined) {
        lines.push(`  - Energy Above Hull: ${m.energy_above_hull.toFixed(4)} eV/atom ${m.is_stable ? '(Stable)' : '(Unstable)'}`);
    }
    if (m.is_magnetic !== undefined) {
        lines.push(`  - Magnetic: ${m.is_magnetic ? 'Yes' : 'No'}`);
    }
    if (m.density !== undefined) {
        lines.push(`  - Density: ${m.density.toFixed(3)} g/cm³`);
    }
    if (m.theoretical !== undefined) {
        lines.push(`  - Theoretical: ${m.theoretical ? 'Yes' : 'No (Experimental)'}`);
    }
    return lines.join('\n');
}
// Format synthesis recipe for display
function formatSynthesisRecipe(r) {
    const lines = [
        `**${r.target_formula}** (${r.synthesis_type})`,
        `DOI: ${r.doi}`,
        '',
        `📦 Precursors:`,
        ...r.precursors.map(p => `  - ${p.formula}${p.name ? ` (${p.name})` : ''}`),
        '',
        `🔥 Conditions:`,
    ];
    if (r.temperature_min !== null || r.temperature_max !== null) {
        const temp = r.temperature_min === r.temperature_max
            ? `${r.temperature_min}°C`
            : `${r.temperature_min ?? '?'}-${r.temperature_max ?? '?'}°C`;
        lines.push(`  - Temperature: ${temp}`);
    }
    if (r.time_min !== null || r.time_max !== null) {
        const time = r.time_min === r.time_max
            ? `${r.time_min}h`
            : `${r.time_min ?? '?'}-${r.time_max ?? '?'}h`;
        lines.push(`  - Time: ${time}`);
    }
    if (r.atmosphere) {
        lines.push(`  - Atmosphere: ${r.atmosphere}`);
    }
    if (r.operations.length > 0) {
        lines.push('', `⚙️ Operations: ${r.operations.join(' → ')}`);
    }
    return lines.join('\n');
}
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // Materials Project Tools
            {
                name: 'search_materials',
                description: 'Search materials by chemical formula (e.g., "Fe2O3", "LiCoO2", "IrPt"). Returns basic properties including band gap, formation energy, and stability.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        formula: {
                            type: 'string',
                            description: 'Chemical formula to search (e.g., "Fe2O3", "IrPt", "Li2O")',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results (default: 10)',
                            default: 10,
                        },
                    },
                    required: ['formula'],
                },
            },
            {
                name: 'search_by_elements',
                description: 'Search materials containing specific elements (e.g., ["Fe", "O"] finds all Fe-O compounds). Useful when you want to explore all compounds in a chemical system.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        elements: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of element symbols (e.g., ["Ir", "Pt"] or ["Li", "Co", "O"])',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results (default: 10)',
                            default: 10,
                        },
                    },
                    required: ['elements'],
                },
            },
            {
                name: 'get_material',
                description: 'Get detailed information about a specific material using its Materials Project ID (e.g., "mp-1234").',
                inputSchema: {
                    type: 'object',
                    properties: {
                        material_id: {
                            type: 'string',
                            description: 'Materials Project ID (e.g., "mp-1234", "mp-19017")',
                        },
                    },
                    required: ['material_id'],
                },
            },
            {
                name: 'search_by_band_gap',
                description: 'Search materials with band gap in a specific range. Useful for finding semiconductors or insulators with desired electronic properties.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        min_gap: {
                            type: 'number',
                            description: 'Minimum band gap in eV',
                        },
                        max_gap: {
                            type: 'number',
                            description: 'Maximum band gap in eV',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results (default: 10)',
                            default: 10,
                        },
                    },
                    required: ['min_gap', 'max_gap'],
                },
            },
            {
                name: 'search_stable_materials',
                description: 'Search only thermodynamically stable materials (energy_above_hull = 0) in a chemical system. Useful for finding synthesizable compounds.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        elements: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of element symbols (e.g., ["Li", "Fe", "O"])',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results (default: 10)',
                            default: 10,
                        },
                    },
                    required: ['elements'],
                },
            },
            // Synthesis Recipe Tools
            {
                name: 'search_synthesis_recipes',
                description: `Search solid-state synthesis recipes by target material formula. Returns synthesis conditions including precursors, temperature, time, and atmosphere. Based on Ceder Group text-mined dataset (${getRecipeCount()} recipes).`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        formula: {
                            type: 'string',
                            description: 'Target material formula (e.g., "LiCoO2", "BaTiO3", "LiFePO4")',
                        },
                        synthesis_type: {
                            type: 'string',
                            enum: ['solid-state', 'sol-gel', 'all'],
                            description: 'Filter by synthesis method (default: all)',
                            default: 'all',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results (default: 10)',
                            default: 10,
                        },
                    },
                    required: ['formula'],
                },
            },
            {
                name: 'search_by_precursor',
                description: 'Find synthesis recipes that use a specific precursor material. Useful for exploring what materials can be made from available starting compounds.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        precursor: {
                            type: 'string',
                            description: 'Precursor formula (e.g., "Li2CO3", "TiO2", "Fe2O3")',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results (default: 10)',
                            default: 10,
                        },
                    },
                    required: ['precursor'],
                },
            },
            {
                name: 'search_by_temperature',
                description: 'Find synthesis recipes within a specific temperature range. Useful for finding low-temperature or high-temperature synthesis routes.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        min_temp: {
                            type: 'number',
                            description: 'Minimum synthesis temperature in °C',
                        },
                        max_temp: {
                            type: 'number',
                            description: 'Maximum synthesis temperature in °C',
                        },
                        elements: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Optional: filter by elements in target material',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results (default: 10)',
                            default: 10,
                        },
                    },
                    required: ['min_temp', 'max_temp'],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            // Materials Project Tools
            case 'search_materials': {
                const formula = args?.formula;
                const limit = args?.limit || 10;
                const materials = await api.searchByFormula(formula, limit);
                if (materials.length === 0) {
                    return {
                        content: [{ type: 'text', text: `No materials found for formula: ${formula}` }],
                    };
                }
                const results = materials.map(formatMaterial).join('\n\n');
                return {
                    content: [{
                            type: 'text',
                            text: `Found ${materials.length} materials for "${formula}":\n\n${results}`
                        }],
                };
            }
            case 'search_by_elements': {
                const elements = args?.elements;
                const limit = args?.limit || 10;
                const materials = await api.searchByElements(elements, limit);
                if (materials.length === 0) {
                    return {
                        content: [{ type: 'text', text: `No materials found for elements: ${elements.join(', ')}` }],
                    };
                }
                const results = materials.map(formatMaterial).join('\n\n');
                return {
                    content: [{
                            type: 'text',
                            text: `Found ${materials.length} materials in ${elements.join('-')} system:\n\n${results}`
                        }],
                };
            }
            case 'get_material': {
                const materialId = args?.material_id;
                const material = await api.getMaterial(materialId);
                if (!material) {
                    return {
                        content: [{ type: 'text', text: `Material not found: ${materialId}` }],
                    };
                }
                return {
                    content: [{
                            type: 'text',
                            text: `Material Details:\n\n${formatMaterial(material)}\n\nMaterials Project Link: https://materialsproject.org/materials/${materialId}`
                        }],
                };
            }
            case 'search_by_band_gap': {
                const minGap = args?.min_gap;
                const maxGap = args?.max_gap;
                const limit = args?.limit || 10;
                const materials = await api.searchByBandGap(minGap, maxGap, limit);
                if (materials.length === 0) {
                    return {
                        content: [{ type: 'text', text: `No materials found with band gap between ${minGap} and ${maxGap} eV` }],
                    };
                }
                const results = materials.map(formatMaterial).join('\n\n');
                return {
                    content: [{
                            type: 'text',
                            text: `Found ${materials.length} materials with band gap ${minGap}-${maxGap} eV:\n\n${results}`
                        }],
                };
            }
            case 'search_stable_materials': {
                const elements = args?.elements;
                const limit = args?.limit || 10;
                const materials = await api.searchStableMaterials(elements, limit);
                if (materials.length === 0) {
                    return {
                        content: [{ type: 'text', text: `No stable materials found for elements: ${elements.join(', ')}` }],
                    };
                }
                const results = materials.map(formatMaterial).join('\n\n');
                return {
                    content: [{
                            type: 'text',
                            text: `Found ${materials.length} stable materials in ${elements.join('-')} system:\n\n${results}`
                        }],
                };
            }
            // Synthesis Recipe Tools
            case 'search_synthesis_recipes': {
                const formula = args?.formula;
                const synthesisType = args?.synthesis_type || 'all';
                const limit = args?.limit || 10;
                const recipes = searchSynthesisByFormula(formula, synthesisType, limit);
                if (recipes.length === 0) {
                    return {
                        content: [{ type: 'text', text: `No synthesis recipes found for: ${formula}` }],
                    };
                }
                const results = recipes.map(formatSynthesisRecipe).join('\n\n---\n\n');
                return {
                    content: [{
                            type: 'text',
                            text: `Found ${recipes.length} synthesis recipes for "${formula}":\n\n${results}`
                        }],
                };
            }
            case 'search_by_precursor': {
                const precursor = args?.precursor;
                const limit = args?.limit || 10;
                const recipes = searchByPrecursor(precursor, limit);
                if (recipes.length === 0) {
                    return {
                        content: [{ type: 'text', text: `No synthesis recipes found using precursor: ${precursor}` }],
                    };
                }
                const results = recipes.map(formatSynthesisRecipe).join('\n\n---\n\n');
                return {
                    content: [{
                            type: 'text',
                            text: `Found ${recipes.length} synthesis recipes using "${precursor}" as precursor:\n\n${results}`
                        }],
                };
            }
            case 'search_by_temperature': {
                const minTemp = args?.min_temp;
                const maxTemp = args?.max_temp;
                const elements = args?.elements;
                const limit = args?.limit || 10;
                const recipes = searchByTemperature(minTemp, maxTemp, elements, limit);
                if (recipes.length === 0) {
                    const elementsStr = elements ? ` containing ${elements.join(', ')}` : '';
                    return {
                        content: [{ type: 'text', text: `No synthesis recipes found at ${minTemp}-${maxTemp}°C${elementsStr}` }],
                    };
                }
                const results = recipes.map(formatSynthesisRecipe).join('\n\n---\n\n');
                const elementsStr = elements ? ` (containing ${elements.join(', ')})` : '';
                return {
                    content: [{
                            type: 'text',
                            text: `Found ${recipes.length} synthesis recipes at ${minTemp}-${maxTemp}°C${elementsStr}:\n\n${results}`
                        }],
                };
            }
            default:
                return {
                    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Materials MCP Server v1.1.0 running on stdio');
    console.error(`Loaded ${getRecipeCount()} synthesis recipes`);
}
main().catch(console.error);
