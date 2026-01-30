"""
Materials Data Portal - Python Computation Server
Provides Pymatgen and ASE based computational tools
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import tempfile
import os

# Pymatgen imports
from pymatgen.core import Structure, Element
from pymatgen.symmetry.analyzer import SpacegroupAnalyzer
from pymatgen.analysis.local_env import CrystalNN
from pymatgen.analysis.phase_diagram import PhaseDiagram
from pymatgen.io.cif import CifParser, CifWriter
from pymatgen.io.vasp import Poscar
from pymatgen.io.ase import AseAtomsAdaptor

# New MP API
from mp_api.client import MPRester

# ASE imports
from ase.io import read, write

app = FastAPI(
    title="Materials Computation API",
    description="Pymatgen & ASE based computational tools",
    version="1.0.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment
MP_API_KEY = os.environ.get("MP_API_KEY", "")


# ============ Models ============

class CifInput(BaseModel):
    cif_string: str

class MaterialIdInput(BaseModel):
    material_id: str

class ConversionInput(BaseModel):
    content: str
    from_format: str
    to_format: str

class PhaseDiagramInput(BaseModel):
    elements: List[str]


# ============ Structure Analysis ============

def analyze_structure(structure: Structure) -> dict:
    """Common structure analysis logic"""
    # Symmetry analysis
    sga = SpacegroupAnalyzer(structure)

    # Crystal NN for coordination
    cnn = CrystalNN()
    coordination_info = []

    for i, site in enumerate(structure):
        if i >= 10:  # Limit to first 10 sites
            break
        try:
            nn_info = cnn.get_nn_info(structure, i)
            coord_num = len(nn_info)
            neighbors = [f"{n['site'].specie}({n['weight']:.2f})" for n in nn_info[:5]]
            coordination_info.append({
                "site": f"{site.specie} #{i+1}",
                "coordination_number": coord_num,
                "neighbors": neighbors
            })
        except:
            coordination_info.append({
                "site": f"{site.specie} #{i+1}",
                "coordination_number": "N/A",
                "neighbors": []
            })

    # Bond lengths
    bond_lengths = []
    for i, site1 in enumerate(structure):
        for j, site2 in enumerate(structure):
            if i < j:
                dist = site1.distance(site2)
                if dist < 3.5:
                    bond_lengths.append({
                        "bond": f"{site1.specie}-{site2.specie}",
                        "length": round(dist, 4)
                    })

    bond_lengths = sorted(bond_lengths, key=lambda x: x["length"])[:20]

    return {
        "formula": structure.composition.reduced_formula,
        "num_sites": len(structure),
        "volume": round(structure.volume, 4),
        "density": round(structure.density, 4),
        "lattice": {
            "a": round(structure.lattice.a, 4),
            "b": round(structure.lattice.b, 4),
            "c": round(structure.lattice.c, 4),
            "alpha": round(structure.lattice.alpha, 2),
            "beta": round(structure.lattice.beta, 2),
            "gamma": round(structure.lattice.gamma, 2),
            "volume": round(structure.lattice.volume, 4)
        },
        "symmetry": {
            "space_group": sga.get_space_group_symbol(),
            "space_group_number": sga.get_space_group_number(),
            "crystal_system": sga.get_crystal_system(),
            "point_group": sga.get_point_group_symbol(),
        },
        "coordination": coordination_info,
        "bond_lengths": bond_lengths,
        "elements": [str(el) for el in structure.composition.elements],
        "composition": {str(k): v for k, v in structure.composition.as_dict().items()}
    }


@app.post("/analyze/cif")
async def analyze_cif(data: CifInput):
    """Analyze a CIF structure"""
    try:
        parser = CifParser.from_str(data.cif_string)
        structure = parser.get_structures()[0]
        return analyze_structure(structure)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/analyze/material")
async def analyze_material(data: MaterialIdInput):
    """Analyze a material from Materials Project using new API"""
    try:
        with MPRester(MP_API_KEY) as mpr:
            # Use new API to get structure
            docs = mpr.materials.summary.search(material_ids=[data.material_id], fields=["structure"])
            if not docs or len(docs) == 0:
                raise HTTPException(status_code=404, detail=f"Material {data.material_id} not found")
            structure = docs[0].structure

        if structure is None:
            raise HTTPException(status_code=404, detail=f"Material {data.material_id} structure not found")

        return analyze_structure(structure)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


# ============ Structure Conversion ============

@app.post("/convert")
async def convert_structure(data: ConversionInput):
    """Convert between CIF, POSCAR, XYZ formats"""
    try:
        structure = None

        if data.from_format.lower() == "cif":
            parser = CifParser.from_str(data.content)
            structure = parser.get_structures()[0]
        elif data.from_format.lower() == "poscar":
            poscar = Poscar.from_str(data.content)
            structure = poscar.structure
        elif data.from_format.lower() == "xyz":
            with tempfile.NamedTemporaryFile(mode='w', suffix='.xyz', delete=False) as f:
                f.write(data.content)
                f.flush()
                atoms = read(f.name, format='xyz')
                structure = AseAtomsAdaptor.get_structure(atoms)
            os.unlink(f.name)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported input format: {data.from_format}")

        output = ""

        if data.to_format.lower() == "cif":
            writer = CifWriter(structure)
            output = str(writer)
        elif data.to_format.lower() == "poscar":
            poscar = Poscar(structure)
            output = poscar.get_str()
        elif data.to_format.lower() == "xyz":
            atoms = AseAtomsAdaptor.get_atoms(structure)
            with tempfile.NamedTemporaryFile(mode='w', suffix='.xyz', delete=False) as f:
                write(f.name, atoms, format='xyz')
            with open(f.name, 'r') as f:
                output = f.read()
            os.unlink(f.name)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported output format: {data.to_format}")

        return {
            "success": True,
            "from_format": data.from_format,
            "to_format": data.to_format,
            "formula": structure.composition.reduced_formula,
            "output": output
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ Phase Diagram ============

@app.post("/phase-diagram")
async def get_phase_diagram(data: PhaseDiagramInput):
    """Generate phase diagram data for given elements"""
    try:
        if len(data.elements) < 2 or len(data.elements) > 4:
            raise HTTPException(status_code=400, detail="Phase diagram requires 2-4 elements")

        with MPRester(MP_API_KEY) as mpr:
            # Get entries using new API
            entries = mpr.get_entries_in_chemsys(data.elements)

        if not entries:
            return {
                "success": False,
                "message": f"No entries found for {'-'.join(data.elements)} system"
            }

        # Create phase diagram
        pd = PhaseDiagram(entries)

        # Get stable entries
        stable_entries = []
        for entry in pd.stable_entries:
            stable_entries.append({
                "formula": entry.composition.reduced_formula,
                "energy_per_atom": round(entry.energy_per_atom, 4),
            })

        # Get unstable entries with decomposition
        unstable_entries = []
        for entry in pd.unstable_entries:
            try:
                decomp, e_above_hull = pd.get_decomp_and_e_above_hull(entry)
                decomp_formula = " + ".join([f"{v:.2f} {k.composition.reduced_formula}"
                                             for k, v in decomp.items()])
                unstable_entries.append({
                    "formula": entry.composition.reduced_formula,
                    "energy_above_hull": round(e_above_hull, 4),
                    "decomposition": decomp_formula
                })
            except:
                pass

        unstable_entries = sorted(unstable_entries, key=lambda x: x["energy_above_hull"])[:20]

        return {
            "success": True,
            "elements": data.elements,
            "num_entries": len(entries),
            "num_stable": len(stable_entries),
            "stable_phases": stable_entries,
            "unstable_phases": unstable_entries,
            "summary": f"{'-'.join(data.elements)} system: {len(stable_entries)} stable, {len(entries) - len(stable_entries)} unstable phases"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ Element Info ============

@app.get("/element/{symbol}")
async def get_element_info(symbol: str):
    """Get element information"""
    try:
        el = Element(symbol)
        return {
            "symbol": el.symbol,
            "name": el.long_name,
            "atomic_number": el.Z,
            "atomic_mass": round(float(el.atomic_mass), 4),
            "electronic_structure": el.electronic_structure,
            "group": el.group,
            "row": el.row,
            "block": el.block,
            "is_metal": el.is_metal,
            "is_metalloid": el.is_metalloid,
            "is_transition_metal": el.is_transition_metal,
            "oxidation_states": list(el.oxidation_states) if el.oxidation_states else [],
            "electronegativity": float(el.X) if el.X else None,
            "atomic_radius": float(el.atomic_radius) if el.atomic_radius else None,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ Health Check ============

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "pymatgen": "2024.1.26",
        "ase": "3.22.1",
        "mp_api": "0.39.5"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
