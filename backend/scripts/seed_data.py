"""Seed data entrypoint for AI-Powered Job Portal.
Usage:
    python backend/scripts/seed_data.py
or from inside backend directory:
    python scripts/seed_data.py
"""

import os
import sys

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from seed_demo_accounts import seed_standard_accounts

if __name__ == "__main__":
    print("[RUN] Starting seed_data.py...")
    seed_standard_accounts()
    print("[SUCCESS] Seed data completed successfully!")
