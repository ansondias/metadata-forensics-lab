# Metadata Forensics Lab — Beyond the Image

**Experiment 07 · Digital Forensics**

Extending the classic ExifTool EXIF/GPS image exercise to three other file
containers — a **Microsoft Word document**, a **PDF**, and an **audio file** —
to *read*, *spoof*, and *hide* data in each, then *recover* what a naïve wipe
leaves behind.

> ⚠️ **Educational use only.** These techniques are for authorized security
> learning and digital-forensics coursework — understanding how metadata is
> forged so it can be detected. Don't use them to falsify records.

---

## Contents

| Path | What it is |
|------|------------|
| `report/Experiment07_Metadata_Manipulation.docx` | Full lab report (Word), experiment format |
| `report/report.html` | Same report as a styled, printable web page |
| `specimens/report.docx` · `report.pdf` · `track.mp3` | Clean specimen files |
| `specimens/*_tampered.*` | The forged copies produced in the experiment |
| `scripts/make_specimens.py` | Generates the clean `.docx` / `.pdf` / `.mp3` specimens |
| `scripts/make_docx.js` | Builds the Word lab report (docx-js) |
| `scripts/extract.py` | Dumps ordered text from a `.docx` for verification |

---

## The workflow, per format

Each container stores the same class of metadata — authorship, timestamps,
originating tool, and a free-text field an attacker can weaponize as a covert
channel — just in a different envelope.

| Format | Metadata lives in | ExifTool read | ExifTool write | Hidden-text field |
|--------|-------------------|:-------------:|:--------------:|-------------------|
| JPEG | EXIF / IPTC / XMP | ✅ | ✅ | `Comment` |
| DOCX | `docProps/core.xml` in a ZIP | ✅ | ❌ → edit the ZIP | `dc:description` |
| PDF  | `/Info` dict + XMP | ✅ | ✅ | `Subject` / `Keywords` |
| MP3  | ID3v2 frames | ✅ | ❌ → edit ID3 | `COMM` frame |

### Key findings
- **ExifTool is read-only for ZIP-based DOCX and for MP3/WAV/FLAC** — confirmed
  with `exiftool -listwf` (only the MP4 family, e.g. `M4A`, is writable). Forging
  those requires editing the container directly.
- **PDF "edits" don't erase anything.** ExifTool writes an *incremental update*,
  so the original author/keywords survive in the earlier revision and the file
  *grows* — the exact seam a forensic analyst uses to prove tampering:
  ```
  $ strings report_tampered.pdf | grep -Ei "Alice|survey, GPS"
  << /Title (Quarterly Field Report) /Author (Alice Fieldworker) ... >>
  ```

---

## Reproduce it

Requires [ExifTool](https://exiftool.org/), Python 3, and Node.js.

```bash
# 1. Generate clean specimens
python3 scripts/make_specimens.py

# 2. Read metadata (works on all three)
exiftool specimens/report.docx
exiftool specimens/report.pdf
exiftool specimens/track.mp3

# 3. Spoof a PDF directly (ExifTool supports PDF writes)
exiftool -overwrite_original -Author="System Administrator" \
  -CreateDate="2020:01:01 00:00:00Z" specimens/report.pdf

# 4. Recover the "deleted" author from the raw bytes
strings specimens/report.pdf | grep -i author
```

DOCX and MP3 are forged by editing `docProps/core.xml` inside the ZIP and the
ID3v2 frames respectively — see `scripts/make_specimens.py` for the mechanics.

---

## Defensive takeaways
- Never trust metadata as proof of authorship or time — every field here was
  rewritten in seconds.
- Hunt for residue: revision count and file growth on PDFs; inspect *every* part
  in a DOCX ZIP, not just what the viewer shows.
- Look for impossible values (a 2020 date on a 2026 document).
- Scrub deliberately (`exiftool -all=` then linearize) — don't assume an edit erased anything.
- Scan free-text fields (`Comment` / `Subject` / `COMM`) for hidden payloads.

---

*Tooling: ExifTool 13.55. Specimens are synthetic and generated for lab use.*
