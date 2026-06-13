# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-script tool (`lottery.py`) that scrapes Chinese lottery draw history and produces color-coded Excel analysis spreadsheets. Handles two lottery games:
- **双色球 (shuangseqiu)**: 6 red balls (1-33) + 1 blue ball (1-16)
- **大乐透 (daletou)**: 5 front balls (1-35) + 2 back balls (1-12)

## Run

```bash
python3 lottery.py
```

No arguments. The `__main__` block scrapes both games from `datachart.500.com`, writes raw CSVs and styled `.xlsx` files to `~/Desktop/lottery/` (created automatically via `BASE_DIR`). Only the most recent 180 draws are analyzed (`df.tail(180)`); the full history goes to the CSV.

Requires network access to `http://datachart.500.com`. Dependencies: `pandas`, `numpy`, `openpyxl`, `requests`, `lxml`.

## Architecture

Two near-parallel pipelines, `shuangseqiu(df)` and `daletou(df)`, each take a 2-column DataFrame (`期数` period, `号码` numbers like `"1.2.3.4.5.6+7"`) and return a styled openpyxl `Workbook`. Both follow the same stages:

1. **Parse** numbers via `transform1/2/3` (split on `+` then `.`).
2. **Derive feature columns** as separate DataFrames (`df_1`..`df_7`), then `pd.concat` horizontally.
3. **Assign a hardcoded `MultiIndex`** (`multi_index` for shuangseqiu, `multi_index2` for daletou) as the final column header. **The number and order of generated columns must exactly match the MultiIndex length** — this is the most fragile part; adding/removing a feature column requires updating the corresponding MultiIndex tuple list.
4. **Round-trip through disk**: write to `sample.xlsx`, reload with `load_workbook`, then apply styling. Editing happens on the openpyxl object, not the DataFrame.
5. **Style**: `dye_value` colors 相克 (五行 interaction) text, `dye_column` shades number-zone columns, plus borders/alignment/column widths.

### Domain logic (五行 / Five Elements)

The analysis encodes Chinese Five-Elements numerology, not just statistics:
- `get_element_type(num)`: maps a ball's last digit to an element (土/水/火/木/金).
- `get_prop_type(item)`: classifies element pairs as 刑/克/生 (clash/conquer/generate) relationships. The `np.insert(..., '木', ..., axis=0)` + `np.char.add` pattern operates on **axis=0 (rows = draw periods)**, so 相克 compares each ball position against the **same position in the previous period** (cross-period), and the entire first row is set to `NaN` (no predecessor period). This is a common misread — it is NOT a within-draw comparison of adjacent balls.

### Other feature helpers

- `expand_list` / `expand_list_`: one-hot-style expansion of numbers into per-value columns.
- `process_yushu` / `process_yushu2`: expand remainder (`% 3`) features into a wide format.
- `count_consecutive_numbers` (连号), `count_repeat_numbers` (重号, compares to previous row), `count_same_numbers` / 同位 (duplicate last-digits).
- `modi_1(df1, df2)`: interleaves two DataFrames' columns (used to alternate 五行 and 相克 columns).

## Notes

- The commented-out interactive `input()` block at the bottom is the older manual-file workflow; the active `__main__` does automated scraping. Both call the same `shuangseqiu`/`daletou` functions.
- All output filenames, sheet labels, and code comments are in Chinese.
- `multi_index` (shuangseqiu) contains apparent duplicate tuples like `('蓝4', '4-2')` repeated — preserved as-is from the original; be cautious when "fixing" these, as column counts depend on exact length.

## HTML App (browser port of lottery.py)

A static, no-build web app reimplements `lottery.py` in the browser, adding interactive tabs and a number-recommendation feature. Files: `index.html`, `lottery.js`, `core.js`, `headers.js`, `vendor/exceljs.min.js`.

### Run & test
- Serve locally (ES modules + fetch need http, not `file://`): `python3 -m http.server 8000`, open http://localhost:8000/
- Unit tests (pure logic only): `node --test test/`
- Syntax check the browser module: `node --check lottery.js`

### Architecture
- **`core.js`** — pure analysis logic, no DOM/network. Exports `getElementType`, `getPropType`, counting helpers, `analyzeSSQ`/`analyzeDLT` (row builders), and `recommendSSQ`/`recommendDLT`. This is the only file with Node unit tests (`test/core.test.mjs`), since it has no browser dependencies. ESM (`package.json` has `"type":"module"`) so the same files import in both Node and the browser.
- **`headers.js`** — `SSQ_HEADER` (97 entries) / `DLT_HEADER` (102 entries): exact `[group, label]` replicas of the Python `multi_index`/`multi_index2`. **Row length must equal header length** — `analyzeSSQ`/`analyzeDLT` assert this. The original quirks are preserved verbatim: the "蓝/红" group names are swapped relative to real red/blue balls, and `["蓝4","4-2"]` is duplicated.
- **`lottery.js`** — browser side effects: `fetchDraws`/`parseRows` (scrape 500.com), localStorage incremental cache (`loadCache`/`saveCache`/`mergeDraws`/`refreshDraws`, key `lottery_{kind}_draws`), `renderTable` (multi-level `<thead>` + CSS-class coloring), `exportExcel` (ExcelJS, replicates openpyxl styling), and the tab/button wiring with a `state` object.

### Key correctness notes
- 相克 is **cross-period per ball position** (see Domain logic above). The shared `crossPeriodProps(prev, cur)` helper in `core.js` implements this; the entire first period's 相克 columns are null. A within-draw adjacent-pair implementation is wrong and will silently pass length checks.
- Both 大乐透 front-zone and back-zone 相克 are cross-period (matching `daletou`'s two `np.insert(..., axis=0)` blocks).
- Recommendation (`recommendSSQ`/`recommendDLT`) is new (not in the Python): frequency-weighted sampling without replacement (counts+1 smoothing), with a sum/odd-ratio sanity filter against the historical 10–90% quantile band, retried up to `maxTries`. `rng` is injectable for deterministic tests.
- Only the most recent 180 draws are analyzed; recommendation uses the most recent 100. Full-history CSV export from the Python version was intentionally dropped.
