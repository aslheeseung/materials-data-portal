"""
Materials Data Portal - Python Computation Server
Provides Pymatgen, ASE, and UPET (MLIP) based computational tools
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import tempfile
import os
import numpy as np

# Pymatgen imports
from pymatgen.core import Structure, Element, Composition
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
from ase.optimize import BFGS
try:
    from ase.filters import ExpCellFilter  # ASE >= 3.23
except ImportError:
    from ase.constraints import ExpCellFilter  # ASE < 3.23

# UPET (MLIP) - lazy loading to avoid startup delay
_upet_calculator = None

def get_upet_calculator(device: str = "cpu"):
    """Lazy load UPET calculator"""
    global _upet_calculator
    if _upet_calculator is None:
        try:
            from upet.calculator import UPETCalculator
            _upet_calculator = UPETCalculator(
                model="pet-mad-s",  # Fast and universal
                version="1.0.2",
                device=device
            )
            print("✓ UPET Calculator loaded successfully")
        except ImportError:
            print("⚠ UPET not installed. Run: pip install upet")
            return None
        except Exception as e:
            print(f"⚠ UPET loading failed: {e}")
            return None
    return _upet_calculator

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

class EnergyInput(BaseModel):
    material_id: Optional[str] = None
    cif_string: Optional[str] = None
    structure_dict: Optional[dict] = None

class RelaxInput(BaseModel):
    material_id: Optional[str] = None
    cif_string: Optional[str] = None
    fmax: float = 0.05  # Force convergence threshold
    steps: int = 100    # Max optimization steps

class FormationEnergyInput(BaseModel):
    material_id: Optional[str] = None
    cif_string: Optional[str] = None
    elements_reference: Optional[dict] = None  # Custom reference energies


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


# ============ UPET (MLIP) Calculations ============

# Reference energies per atom for elements (PBEsol, approximate)
ELEMENT_REFERENCE_ENERGIES = {
    "Li": -1.90, "Na": -1.31, "K": -1.11,
    "Be": -3.76, "Mg": -1.60, "Ca": -2.00,
    "Sc": -6.33, "Ti": -7.89, "V": -9.08, "Cr": -9.65, "Mn": -9.03,
    "Fe": -8.31, "Co": -7.11, "Ni": -5.78, "Cu": -4.10, "Zn": -1.27,
    "Y": -6.46, "Zr": -8.55, "Nb": -10.09, "Mo": -10.94, "Ru": -9.27,
    "Rh": -7.36, "Pd": -5.38, "Ag": -2.83, "Cd": -0.90,
    "Hf": -9.96, "Ta": -11.85, "W": -12.96, "Re": -12.44, "Os": -11.23,
    "Ir": -8.86, "Pt": -6.05, "Au": -3.27,
    "Al": -3.75, "Si": -5.43, "Ga": -3.03, "Ge": -4.62,
    "O": -4.95, "S": -4.13, "N": -8.34, "P": -5.41,
    "F": -1.91, "Cl": -1.80, "Br": -1.63, "I": -1.52,
}


def get_structure_from_input(material_id: str = None, cif_string: str = None) -> Structure:
    """Helper to get structure from various inputs"""
    if material_id:
        with MPRester(MP_API_KEY) as mpr:
            docs = mpr.materials.summary.search(material_ids=[material_id], fields=["structure"])
            if not docs:
                raise ValueError(f"Material {material_id} not found")
            return docs[0].structure
    elif cif_string:
        parser = CifParser.from_str(cif_string)
        return parser.get_structures()[0]
    else:
        raise ValueError("Either material_id or cif_string required")


@app.post("/mlip/energy")
async def calculate_energy(data: EnergyInput):
    """Calculate total energy using UPET MLIP"""
    try:
        calc = get_upet_calculator()
        if calc is None:
            raise HTTPException(status_code=503, detail="UPET not available. Install with: pip install upet")

        # Get structure
        structure = get_structure_from_input(data.material_id, data.cif_string)

        # Convert to ASE atoms
        atoms = AseAtomsAdaptor.get_atoms(structure)
        atoms.calc = calc

        # Calculate energy
        energy = atoms.get_potential_energy()
        forces = atoms.get_forces()

        # Per-atom values
        n_atoms = len(atoms)
        energy_per_atom = energy / n_atoms
        max_force = float(np.max(np.abs(forces)))

        return {
            "success": True,
            "formula": structure.composition.reduced_formula,
            "n_atoms": n_atoms,
            "total_energy_eV": round(float(energy), 6),
            "energy_per_atom_eV": round(energy_per_atom, 6),
            "max_force_eV_A": round(max_force, 6),
            "model": "PET-MAD-S (PBEsol level)",
            "note": "Energy calculated using UPET machine learning potential"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/mlip/formation-energy")
async def calculate_formation_energy(data: FormationEnergyInput):
    """Calculate formation energy using UPET MLIP"""
    try:
        calc = get_upet_calculator()
        if calc is None:
            raise HTTPException(status_code=503, detail="UPET not available")

        # Get structure
        structure = get_structure_from_input(data.material_id, data.cif_string)

        # Convert to ASE and calculate energy
        atoms = AseAtomsAdaptor.get_atoms(structure)
        atoms.calc = calc
        total_energy = atoms.get_potential_energy()

        # Get composition
        comp = structure.composition
        n_atoms = len(atoms)

        # Calculate reference energy
        ref_energies = data.elements_reference or ELEMENT_REFERENCE_ENERGIES
        reference_energy = 0.0
        missing_refs = []

        for el, amt in comp.as_dict().items():
            if el in ref_energies:
                reference_energy += ref_energies[el] * amt
            else:
                missing_refs.append(el)

        if missing_refs:
            return {
                "success": False,
                "error": f"Missing reference energies for: {', '.join(missing_refs)}",
                "available_elements": list(ref_energies.keys())
            }

        # Formation energy = E_compound - sum(E_elements)
        formation_energy = total_energy - reference_energy
        formation_energy_per_atom = formation_energy / n_atoms

        # Stability estimate (rough heuristic)
        stability = "likely stable" if formation_energy_per_atom < -0.1 else \
                   "metastable" if formation_energy_per_atom < 0.1 else \
                   "likely unstable"

        return {
            "success": True,
            "formula": comp.reduced_formula,
            "n_atoms": n_atoms,
            "total_energy_eV": round(float(total_energy), 6),
            "reference_energy_eV": round(float(reference_energy), 6),
            "formation_energy_eV": round(float(formation_energy), 6),
            "formation_energy_per_atom_eV": round(formation_energy_per_atom, 6),
            "stability_estimate": stability,
            "model": "PET-MAD-S (PBEsol level)",
            "note": "Formation energy = E_compound - Σ(E_elements). Negative = exothermic formation."
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/mlip/relax")
async def relax_structure(data: RelaxInput):
    """Relax structure using UPET MLIP"""
    try:
        calc = get_upet_calculator()
        if calc is None:
            raise HTTPException(status_code=503, detail="UPET not available")

        # Get structure
        structure = get_structure_from_input(data.material_id, data.cif_string)

        # Convert to ASE
        atoms = AseAtomsAdaptor.get_atoms(structure)
        atoms.calc = calc

        # Initial energy
        initial_energy = atoms.get_potential_energy()

        # Relax with cell optimization
        ecf = ExpCellFilter(atoms)
        opt = BFGS(ecf, logfile=None)
        converged = opt.run(fmax=data.fmax, steps=data.steps)

        # Final energy
        final_energy = atoms.get_potential_energy()
        final_forces = atoms.get_forces()

        # Convert back to pymatgen
        relaxed_structure = AseAtomsAdaptor.get_structure(atoms)

        # Get CIF of relaxed structure
        cif_writer = CifWriter(relaxed_structure)
        relaxed_cif = str(cif_writer)

        return {
            "success": True,
            "converged": converged,
            "n_steps": opt.nsteps,
            "formula": relaxed_structure.composition.reduced_formula,
            "initial_energy_eV": round(float(initial_energy), 6),
            "final_energy_eV": round(float(final_energy), 6),
            "energy_change_eV": round(float(final_energy - initial_energy), 6),
            "max_force_eV_A": round(float(np.max(np.abs(final_forces))), 6),
            "lattice": {
                "a": round(relaxed_structure.lattice.a, 4),
                "b": round(relaxed_structure.lattice.b, 4),
                "c": round(relaxed_structure.lattice.c, 4),
                "alpha": round(relaxed_structure.lattice.alpha, 2),
                "beta": round(relaxed_structure.lattice.beta, 2),
                "gamma": round(relaxed_structure.lattice.gamma, 2),
                "volume": round(relaxed_structure.lattice.volume, 4)
            },
            "relaxed_cif": relaxed_cif,
            "model": "PET-MAD-S (PBEsol level)"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/mlip/status")
async def mlip_status():
    """Check MLIP availability and status"""
    calc = get_upet_calculator()
    if calc is None:
        return {
            "available": False,
            "message": "UPET not installed or failed to load",
            "install_command": "pip install upet"
        }
    return {
        "available": True,
        "model": "PET-MAD-S",
        "version": "1.0.2",
        "theory_level": "PBEsol",
        "capabilities": [
            "Energy calculation",
            "Force calculation",
            "Formation energy",
            "Structure relaxation"
        ]
    }


# ============ Health Check ============

@app.get("/health")
async def health_check():
    # Check UPET availability
    upet_available = get_upet_calculator() is not None

    return {
        "status": "healthy",
        "pymatgen": "2024.1.26",
        "ase": "3.22.1",
        "mp_api": "0.39.5",
        "upet_mlip": upet_available
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
