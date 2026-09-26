"""
BLACKOUT Application Package.
Local-first resilient autonomous agent powered by Gemma 4.
"""

import sys
from pathlib import Path

# Ensure backend root is always in sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

__version__ = "1.0.0"
