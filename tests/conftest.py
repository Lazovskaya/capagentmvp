"""Shared pytest configuration and fixtures."""
import sys
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

# Allow tests to import from scripts/ directly
scripts_dir = str(FACTORY_ROOT / "scripts")
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)
