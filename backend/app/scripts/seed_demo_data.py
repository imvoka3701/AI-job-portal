"""Seed demo data wrapper — runnable via `python -m app.scripts.seed_demo_data`."""

import os
import sys

# Ensure backend root is in python path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from seed_demo_accounts import seed_standard_accounts  # noqa: E402

if __name__ == "__main__":
    print("[RUN] Executing seed_standard_accounts()...")
    seed_standard_accounts()
    print("[DONE] Demo database populated successfully!")
