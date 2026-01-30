const BASE_URL = 'https://api.materialsproject.org/v2';
export class MaterialsProjectAPI {
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async fetch(endpoint, params) {
        const url = new URL(`${BASE_URL}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value)
                    url.searchParams.append(key, value);
            });
        }
        const response = await fetch(url.toString(), {
            headers: {
                'X-API-KEY': this.apiKey,
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Materials Project API error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    async searchByFormula(formula, limit = 10) {
        const result = await this.fetch('/materials/summary/', {
            formula: formula,
            _limit: limit.toString(),
            _fields: 'material_id,formula_pretty,elements,nelements,nsites,volume,density,symmetry,formation_energy_per_atom,energy_above_hull,is_stable,band_gap,is_metal,is_magnetic,theoretical',
        });
        return result.data;
    }
    async searchByElements(elements, limit = 10) {
        const chemsys = elements.sort().join('-');
        const result = await this.fetch('/materials/summary/', {
            chemsys: chemsys,
            _limit: limit.toString(),
            _fields: 'material_id,formula_pretty,elements,nelements,nsites,volume,density,symmetry,formation_energy_per_atom,energy_above_hull,is_stable,band_gap,is_metal,is_magnetic,theoretical',
        });
        return result.data;
    }
    async getMaterial(materialId) {
        try {
            const result = await this.fetch('/materials/summary/', {
                material_ids: materialId,
                _fields: 'material_id,formula_pretty,formula_anonymous,chemsys,elements,nelements,nsites,volume,density,density_atomic,symmetry,formation_energy_per_atom,energy_above_hull,is_stable,band_gap,is_metal,is_magnetic,ordering,total_magnetization,theoretical',
            });
            return result.data[0] || null;
        }
        catch {
            return null;
        }
    }
    async searchByBandGap(minGap, maxGap, limit = 10) {
        const result = await this.fetch('/materials/summary/', {
            band_gap_min: minGap.toString(),
            band_gap_max: maxGap.toString(),
            _limit: limit.toString(),
            _fields: 'material_id,formula_pretty,elements,band_gap,formation_energy_per_atom,is_stable',
        });
        return result.data;
    }
    async searchStableMaterials(elements, limit = 10) {
        const chemsys = elements.sort().join('-');
        const result = await this.fetch('/materials/summary/', {
            chemsys: chemsys,
            is_stable: 'true',
            _limit: limit.toString(),
            _fields: 'material_id,formula_pretty,elements,band_gap,formation_energy_per_atom,energy_above_hull,symmetry',
        });
        return result.data;
    }
}
