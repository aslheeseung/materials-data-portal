/**
 * Synthesis Recipe Types
 * Based on Ceder Group Text-Mined Synthesis Dataset
 */

export interface SynthesisRecipe {
  id: string;
  doi: string;
  target_formula: string;
  target_name: string;
  precursors: Precursor[];
  temperature_min: number | null;
  temperature_max: number | null;
  time_min: number | null;
  time_max: number | null;
  atmosphere: string | null;
  operations: string[];
  synthesis_type: 'solid-state' | 'sol-gel';
}

export interface Precursor {
  formula: string;
  name: string;
}

export interface SynthesisSearchParams {
  formula?: string;
  precursor?: string;
  min_temp?: number;
  max_temp?: number;
  synthesis_type?: 'solid-state' | 'sol-gel' | 'all';
  elements?: string[];
  limit?: number;
}
