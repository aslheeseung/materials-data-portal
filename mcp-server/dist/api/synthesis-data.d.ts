/**
 * Synthesis Data API
 * Search and filter synthesis recipes from Ceder Group dataset
 */
import { SynthesisRecipe } from '../types/synthesis.js';
/**
 * Search synthesis recipes by target formula
 */
export declare function searchByFormula(formula: string, synthesisType?: 'solid-state' | 'sol-gel' | 'all', limit?: number): SynthesisRecipe[];
/**
 * Search synthesis recipes by precursor
 */
export declare function searchByPrecursor(precursor: string, limit?: number): SynthesisRecipe[];
/**
 * Search synthesis recipes by temperature range
 */
export declare function searchByTemperature(minTemp: number, maxTemp: number, elements?: string[], limit?: number): SynthesisRecipe[];
/**
 * Get all available synthesis types
 */
export declare function getSynthesisTypes(): string[];
/**
 * Get total recipe count
 */
export declare function getRecipeCount(): number;
