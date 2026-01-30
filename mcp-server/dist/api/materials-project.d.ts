import { Material, MaterialDetail } from '../types/materials.js';
export declare class MaterialsProjectAPI {
    private apiKey;
    constructor(apiKey: string);
    private fetch;
    searchByFormula(formula: string, limit?: number): Promise<Material[]>;
    searchByElements(elements: string[], limit?: number): Promise<Material[]>;
    getMaterial(materialId: string): Promise<MaterialDetail | null>;
    searchByBandGap(minGap: number, maxGap: number, limit?: number): Promise<Material[]>;
    searchStableMaterials(elements: string[], limit?: number): Promise<Material[]>;
}
