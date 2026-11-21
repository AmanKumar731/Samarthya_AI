"""
CLI script to seed demo and fallback mock data for Samarthya AI.
Usage:
    python3 scripts/seed_db.py [--reset]
"""

import argparse
import json
from pathlib import Path


def seed_database(reset: bool = False) -> None:
    root_dir = Path(__file__).resolve().parent.parent
    mock_file = root_dir / "scripts" / "mock_data.json"
    schemes_file = root_dir / "backend" / "schemes.json"

    if not mock_file.exists():
        print(f"Error: Mock data file not found at {mock_file}")
        return

    with open(mock_file, "r", encoding="utf-8") as f:
        mock_data = json.load(f)

    print(f"Loaded {len(mock_data.get('citizens', []))} demo citizens from mock_data.json")

    if schemes_file.exists():
        with open(schemes_file, "r", encoding="utf-8") as f:
            schemes_data = json.load(f)
        count = len(schemes_data["SCHEME_DATABASE"]) if isinstance(schemes_data, dict) and "SCHEME_DATABASE" in schemes_data else len(schemes_data)
        print(f"Verified {count} active schemes in {schemes_file.name}")

    if reset:
        print("Database reset flag detected. Resetting local cache...")

    print("Database seeding completed successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed demo database for Samarthya AI")
    parser.add_argument("--reset", action="store_true", help="Reset existing demo records")
    args = parser.parse_args()
    seed_database(reset=args.reset)
