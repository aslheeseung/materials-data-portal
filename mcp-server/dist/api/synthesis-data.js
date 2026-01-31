/**
 * Synthesis Data API
 * Search and filter synthesis recipes from Ceder Group dataset
 */
import synthesisData from '../../data/synthesis.json' with { type: 'json' };
const recipes = synthesisData;
/**
 * Normalize formula for comparison (remove spaces, lowercase)
 */
function normalizeFormula(formula) {
    return formula.replace(/\s+/g, '').toLowerCase();
}
/**
 * Check if formula contains given elements
 */
function containsElements(formula, elements) {
    const upperFormula = formula.toUpperCase();
    return elements.every(el => upperFormula.includes(el.toUpperCase()));
}
/**
 * Search synthesis recipes by target formula
 */
export function searchByFormula(formula, synthesisType = 'all', limit = 10) {
    const normalized = normalizeFormula(formula);
    return recipes
        .filter(r => {
        const matchesFormula = normalizeFormula(r.target_formula).includes(normalized) ||
            normalized.includes(normalizeFormula(r.target_formula));
        const matchesType = synthesisType === 'all' || r.synthesis_type === synthesisType;
        return matchesFormula && matchesType;
    })
        .slice(0, limit);
}
/**
 * Search synthesis recipes by precursor
 */
export function searchByPrecursor(precursor, limit = 10) {
    const normalized = normalizeFormula(precursor);
    return recipes
        .filter(r => r.precursors.some(p => normalizeFormula(p.formula).includes(normalized) ||
        normalized.includes(normalizeFormula(p.formula))))
        .slice(0, limit);
}
/**
 * Search synthesis recipes by temperature range
 */
export function searchByTemperature(minTemp, maxTemp, elements, limit = 10) {
    return recipes
        .filter(r => {
        // Check temperature overlap
        const tempMin = r.temperature_min ?? 0;
        const tempMax = r.temperature_max ?? Infinity;
        const tempMatch = tempMax >= minTemp && tempMin <= maxTemp;
        // Check elements if provided
        const elementsMatch = !elements || containsElements(r.target_formula, elements);
        return tempMatch && elementsMatch;
    })
        .slice(0, limit);
}
/**
 * Get all available synthesis types
 */
export function getSynthesisTypes() {
    return Array.from(new Set(recipes.map(r => r.synthesis_type)));
}
/**
 * Get total recipe count
 */
export function getRecipeCount() {
    return recipes.length;
}
