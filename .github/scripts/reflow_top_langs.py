#!/usr/bin/env python3
"""Reflow the top-langs card legend from 2 columns x N rows to 4 columns x N rows.

The github-readme-stats card generator hard-codes a 2-column legend
(chunkArray(langs, langs.length / 2)). This script re-arranges the
generated legend into a 4-column grid and shrinks the card height
accordingly.

Usage: reflow_top_langs.py <svg-path>
"""
import re
import sys

COLS = 4
COL_W = 110  # px per column inside the legend
ROW_GAP = 25
HEADER = 55
BOTTOM_PAD = 20


def main(path: str) -> None:
    src = open(path).read()

    m = re.search(r'<svg data-testid="lang-items"[^>]*>(.*?)</svg>', src, re.S)
    if not m:
        print("lang-items block not found; leaving file unchanged")
        return
    items = re.findall(r'<g class="stagger".*?</g>', m.group(1), re.S)
    if len(items) < 2:
        print(f"only {len(items)} legend items found; leaving file unchanged")
        return

    grid = []
    for idx, item in enumerate(items):
        col, row = idx % COLS, idx // COLS
        grid.append(f'<g transform="translate({col * COL_W}, {row * ROW_GAP})">{item}</g>')
    replacement = '<svg data-testid="lang-items" x="25">' + "".join(grid) + "</svg>"
    src = src[: m.start()] + replacement + src[m.end() :]

    rows = (len(items) + COLS - 1) // COLS
    new_h = HEADER + rows * ROW_GAP + BOTTOM_PAD
    src = re.sub(r'(<svg\b[^>]*?\bheight=")\d+(")', rf"\g<1>{new_h}\g<2>", src, count=1, flags=re.S)
    src = re.sub(r'(viewBox="[\d.]+ [.\d-]+ [\d.]+) [\d.]+(")', rf"\g<1> {new_h}\g<2>", src, count=1)

    open(path, "w").write(src)
    print(f"reflowed {len(items)} langs into {rows} rows x {COLS} cols; height -> {new_h}")


if __name__ == "__main__":
    main(sys.argv[1])
