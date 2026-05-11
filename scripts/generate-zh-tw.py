"""
Generate the zh-TW translation block by converting the existing zh block
using OpenCC s2twp (Simplified -> Traditional with Taiwan phrase mapping).

Usage:
  uv run --with opencc-python-reimplemented python scripts/generate-zh-tw.py

Effect:
  - Updates i18n/translations.ts in-place: adds a `'zh-TW': { ... }` block
    immediately after the `ko: { ... }` block.
  - Updates the Language type to include 'zh-TW'.
  - Idempotent: re-running replaces an existing 'zh-TW' block.
"""
import re
import sys
from pathlib import Path

from opencc import OpenCC

ROOT = Path(__file__).resolve().parent.parent
TRANS_FILE = ROOT / "i18n" / "translations.ts"


def find_block(text: str, lang_key: str) -> tuple[int, int, str]:
    """Find the `<lang_key>: { ... },` block. Returns (start, end_exclusive, body)."""
    # Match the property header (handle quoted/unquoted, e.g. zh: { or 'zh-TW': {)
    pattern = re.compile(
        rf"^(  )(?:'?{re.escape(lang_key)}'?):\s*\{{\s*$",
        re.MULTILINE,
    )
    m = pattern.search(text)
    if not m:
        return -1, -1, ""
    start = m.start()
    # Walk forward, counting braces.
    i = m.end()
    depth = 1
    while i < len(text) and depth > 0:
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                # Include the closing brace + optional trailing comma + newline.
                end = i + 1
                if end < len(text) and text[end] == ",":
                    end += 1
                if end < len(text) and text[end] == "\n":
                    end += 1
                return start, end, text[start:end]
        i += 1
    raise RuntimeError(f"Unterminated block for '{lang_key}'")


def main() -> int:
    text = TRANS_FILE.read_text(encoding="utf-8")

    # 1. Make sure zh exists.
    zh_start, zh_end, zh_body = find_block(text, "zh")
    if zh_start < 0:
        print("ERROR: could not find `zh:` block", file=sys.stderr)
        return 1

    # 2. Convert the entire zh block via OpenCC.
    cc = OpenCC("s2twp")
    converted = cc.convert(zh_body)

    # 3. Rewrite the property header `zh:` -> `'zh-TW':`.
    converted = re.sub(
        r"^(  )zh:\s*\{",
        r"\1'zh-TW': {",
        converted,
        count=1,
        flags=re.MULTILINE,
    )

    # 4. Drop or replace any existing 'zh-TW' block.
    existing_start, existing_end, _ = find_block(text, "zh-TW")
    if existing_start >= 0:
        text = text[:existing_start] + converted + text[existing_end:]
    else:
        # Insert after the ko block.
        ko_start, ko_end, _ = find_block(text, "ko")
        if ko_start < 0:
            print("ERROR: could not find `ko:` block", file=sys.stderr)
            return 1
        # ko was the last block in the original file — its closing `}` has no
        # trailing comma. Inject one before appending `zh-TW`.
        prefix = text[:ko_end]
        if prefix.rstrip().endswith("}"):
            prefix = prefix.rstrip()[:-1] + "},\n"
        text = prefix + converted + text[ko_end:]

    # 5. Update the Language type union.
    text = re.sub(
        r"export type Language = ([^;]+);",
        lambda m: f"export type Language = {ensure_zh_tw_in_union(m.group(1))};",
        text,
        count=1,
    )

    TRANS_FILE.write_text(text, encoding="utf-8")
    print(f"OK: updated {TRANS_FILE}")
    return 0


def ensure_zh_tw_in_union(union: str) -> str:
    if "'zh-TW'" in union:
        return union
    return union.rstrip() + " | 'zh-TW'"


if __name__ == "__main__":
    sys.exit(main())
