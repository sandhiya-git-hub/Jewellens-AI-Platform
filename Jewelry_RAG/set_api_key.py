"""
Run this script to safely create your .env file with correct UTF-8 encoding.
Usage:
    python set_api_key.py YOUR_GEMINI_API_KEY_HERE
"""
import sys
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Usage: python set_api_key.py YOUR_GEMINI_API_KEY_HERE")
        sys.exit(1)

    key = sys.argv[1].strip()
    env_path = Path(__file__).parent / ".env"

    # Write with explicit UTF-8 encoding (avoids Windows Notepad UTF-16 BOM issue)
    env_path.write_text(f"GEMINI_API_KEY={key}\n", encoding="utf-8")
    print(f"✓ .env created at: {env_path}")
    print(f"✓ Key set: {key[:8]}...{key[-4:]}")

if __name__ == "__main__":
    main()
