/**
 * Synthesis Data API
 * Search and filter synthesis recipes from Ceder Group dataset
 */

import { SynthesisRecipe, SynthesisSearchParams } from '../types/synthesis.js';
import synthesisData from '../../data/synthesis.json' with { type: 'json' };

const recipes: SynthesisRecipe[] = synthesisData as SynthesisRecipe[];

/**
 * Normalize formula for comparison (remove spaces, lowercase)
 */
function normalizeFormula(formula: string): string {
  return formula.replace(/\s+/g, '').toLowerCase();
}

/**
 * Check if formula contains given elements
 */
function containsElements(formula: string, elements: string[]): boolean {
  const upperFormula = formula.toUpperCase();
  return elements.every(el => upperFormula.includes(el.toUpperCase()));
}

/**
 * Search synthesis recipes by target formula
 */
export function searchByFormula(
  formula: string,
  synthesisType: 'solid-state' | 'sol-gel' | 'all' = 'all',
  limit: number = 10
): SynthesisRecipe[] {
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
export function searchByPrecursor(
  precursor: string,
  limit: number = 10
): SynthesisRecipe[] {
  const normalized = normalizeFormula(precursor);

  return recipes
    .filter(r =>
      r.precursors.some(p =>
        normalizeFormula(p.formula).includes(normalized) ||
        normalized.includes(normalizeFormula(p.formula))
      )
    )
    .slice(0, limit);
}

/**
 * Search synthesis recipes by temperature range
 */
export function searchByTemperature(
  minTemp: number,
  maxTemp: number,
  elements?: string[],
  limit: number = 10
): SynthesisRecipe[] {
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
export function getSynthesisTypes(): string[] {
  return Array.from(new Set(recipes.map(r => r.synthesis_type)));
}

/**
 * Get total recipe count
 */
export function getRecipeCount(): number {
  return recipes.length;
}
