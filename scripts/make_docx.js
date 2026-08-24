const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak
} = require("docx");

// ---------- palette ----------
const INK = "1B2733", TEAL = "0E6E82", AMBER = "9A5B12", RED = "A32218",
      GREEN = "1F6B37", MUTE = "5C6672", CODEBG = "0D1117", CODETXT = "D5DEE8",
      LINE = "CDD4DB", HDRBG = "E9EEF1", TAMPER = "8A4B00";

// ---------- helpers ----------
const T = (text, o = {}) => new TextRun({ text, ...o });
const P = (children, o = {}) =>
  new Paragraph({ children: Array.isArray(children) ? children : [children], ...o });

const body = (runs, o = {}) =>
  new Paragraph({ children: runs, spacing: { after: 140, line: 276 }, ...o });

const eyebrow = (txt) =>
  new Paragraph({
    spacing: { before: 260, after: 60 },
    children: [T(txt.toUpperCase(), { font: "Consolas", size: 15, bold: true, color: TEAL, characterSpacing: 30 })],
  });

const h2 = (txt) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1, spacing: { before: 40, after: 120 },
    children: [T(txt, { color: INK })],
  });

const h3 = (txt) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 90 },
    children: [T(txt, { color: INK })],
  });

// code "screenshot" block: array of {t, c?, bold?} line-specs
function codeBlock(title, lines) {
  const rows = [];
  // title bar
  rows.push(new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: "11161F" },
    spacing: { before: 0, after: 0 }, border: undefined,
    children: [T("● ● ●   " + title, { font: "Consolas", size: 15, color: "8A93A0" })],
  }));
  for (const ln of lines) {
    rows.push(new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: CODEBG },
      spacing: { before: 0, after: 0, line: 250 },
      children: (Array.isArray(ln) ? ln : [ln]).map(s =>
        T(s.t, { font: "Consolas", size: 16, color: s.c || CODETXT, bold: !!s.bold })),
    }));
  }
  // wrap spacing paragraph after
  return [
    new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }),
    ...rows,
    new Paragraph({ spacing: { before: 0, after: 160 }, children: [] }),
  ];
}

// ---------- table builder ----------
const bd = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const cellBorders = { top: bd, bottom: bd, left: bd, right: bd };
function cell(runs, { w, head = false, fill } = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders: cellBorders,
    shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    children: [new Paragraph({
      spacing: { after: 0, line: 250 },
      children: (Array.isArray(runs) ? runs : [runs]).map(r =>
        typeof r === "string"
          ? T(r, { size: 18, color: INK, bold: head })
          : T(r.t, { size: 18, color: r.c || INK, bold: head || r.bold, font: r.font, strike: r.strike })),
    })],
  });
}
function makeTable(widths, rows) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    borders: { top: bd, bottom: bd, left: bd, right: bd, insideHorizontal: bd, insideVertical: bd },
    rows: rows.map((r, i) =>
      new TableRow({
        tableHeader: i === 0,
        children: r.map((c, j) => cell(c, { w: widths[j], head: i === 0, fill: i === 0 ? HDRBG : undefined })),
      })),
  });
}

// mono run for code inside body
const m = (t, c = INK) => T(t, { font: "Consolas", size: 18, color: c });

// ============================================================
const doc = new Document({
  creator: "Digital Forensics Lab",
  title: "Metadata Manipulation Beyond the Image",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 21, color: INK } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
        run: { font: "Calibri", size: 30, bold: true, color: INK },
        paragraph: { spacing: { before: 40, after: 120 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
        run: { font: "Calibri", size: 23, bold: true, color: INK },
        paragraph: { spacing: { before: 220, after: 90 } } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1200, right: 1200 } } },
    children: [
      // ---------- MASTHEAD ----------
      new Paragraph({
        spacing: { after: 40 },
        children: [T("DIGITAL FORENSICS  ·  EXPERIMENT 07", { font: "Consolas", size: 16, bold: true, color: TEAL, characterSpacing: 40 })],
      }),
      new Paragraph({
        spacing: { after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 6 } },
        children: [T("Metadata Manipulation Beyond the Image", { size: 44, bold: true, color: INK })],
      }),
      body([T("Extending the ExifTool EXIF/GPS exercise to three other containers — a Microsoft Word document, a PDF, and an audio file — to read, spoof, and hide data, then recover what a naïve wipe leaves behind.",
        { size: 22, color: MUTE, italics: true })], { spacing: { after: 180 } }),
      makeTable([2340, 2340, 2340, 2820], [
        [{ t: "TOOL", c: MUTE }, { t: "HOST", c: MUTE }, { t: "SPECIMENS", c: MUTE }, { t: "DATE", c: MUTE }],
        [
          [{ t: "ExifTool 13.55", font: "Consolas" }],
          [{ t: "macOS (darwin 25.6)" }],
          [{ t: ".docx · .pdf · .mp3", font: "Consolas" }],
          [{ t: "2026-08-25", font: "Consolas" }],
        ],
      ]),

      // ---------- 1 AIM ----------
      eyebrow("1 · Aim"),
      h2("Objective"),
      body([
        T("The image lab showed that photographs carry "), T("invisible", { italics: true }),
        T(" data — GPS coordinates, camera make/model, editing software, timestamps — that ExifTool can both read and rewrite. Documents, PDFs, and audio carry the same class of metadata in different containers. The aim here is to prove that the same "),
        T("read → spoof → hide → verify", { bold: true }),
        T(" workflow transfers to those formats, to note where the tool's write support stops, and to show how an analyst detects the tampering."),
      ]),

      // ---------- 2 THEORY ----------
      eyebrow("2 · Theory"),
      h2("One idea, four containers"),
      body([T("“Metadata” is data "), T("about", { italics: true }),
        T(" the file that rides alongside the visible content. Each format stores it in its own envelope, but the exposure is identical — authorship, timestamps, tools, and free-text fields an attacker can abuse to hide a payload:")]),
      makeTable([1600, 4600, 2620], [
        ["Format", "Where metadata lives", "Hidden-text field"],
        [[{ t: "JPEG", font: "Consolas", c: MUTE }], "EXIF / IPTC / XMP segments", [{ t: "Comment, UserComment", font: "Consolas" }]],
        [[{ t: "DOCX", font: "Consolas", c: MUTE }], [{ t: "docProps/core.xml", font: "Consolas" }, { t: " inside a ZIP" }], [{ t: "dc:description, Keywords", font: "Consolas" }]],
        [[{ t: "PDF", font: "Consolas", c: MUTE }], [{ t: "/Info", font: "Consolas" }, { t: " dict + XMP stream" }], [{ t: "Subject, Keywords", font: "Consolas" }]],
        [[{ t: "MP3", font: "Consolas", c: MUTE }], "ID3v2 frames prepended to audio", [{ t: "COMM (comment) frame", font: "Consolas" }]],
      ]),
      body([], { spacing: { after: 60 } }),
      calloutFind("Baseline (image lab, for reference)", [
        T("The prior exercise wrote a fake location and camera into a photo — "),
        m("exiftool -overwrite_original -GPSLatitude=33.9249 -GPSLatitudeRef=N -GPSLongitude=18.4242 -GPSLongitudeRef=E -Make=Apple -Model=\"iPhone 13\" group.jpg"),
        T(" — moving the pin from Mumbai to Cape Town and re-badging the camera. Below, the equivalent moves on the other three formats."),
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ================= EXPERIMENT A: WORD =================
      eyebrow("3 · Experiment A"),
      h2("A.  Microsoft Word document"),
      body([T("Specimen: ", { color: MUTE }), m("report.docx"), T("   Author: Alice Fieldworker · Company: ACME Survey Group", { color: MUTE, size: 19 })]),

      h3("A.1 — Read all metadata"),
      body([T("ExifTool opens the ZIP and maps "), m("docProps"), T(" straight into readable tags — the analog of "), m("exiftool photo.jpg"), T(".")]),
      ...codeBlock("exiftool report.docx", [
        [{ t: "$ ", c: GREEN }, { t: "exiftool report.docx", c: "E6EDF3", bold: true }],
        [{ t: "File Type          : ", c: "56D4DD" }, { t: "DOCX" }],
        [{ t: "Title              : ", c: "56D4DD" }, { t: "Quarterly Field Report" }],
        [{ t: "Creator            : ", c: "56D4DD" }, { t: "Alice Fieldworker" }],
        [{ t: "Last Modified By    : ", c: "56D4DD" }, { t: "Alice Fieldworker" }],
        [{ t: "Create Date        : ", c: "56D4DD" }, { t: "2026:03:14 09:12:00Z" }],
        [{ t: "Modify Date        : ", c: "56D4DD" }, { t: "2026:03:14 09:40:00Z" }],
        [{ t: "Keywords           : ", c: "56D4DD" }, { t: "survey, GPS, confidential" }],
        [{ t: "Application        : ", c: "56D4DD" }, { t: "Microsoft Office Word" }],
        [{ t: "Company            : ", c: "56D4DD" }, { t: "ACME Survey Group" }],
      ]),

      h3("A.2 — Attempt to write with ExifTool"),
      ...codeBlock("write attempt", [
        [{ t: "$ ", c: GREEN }, { t: "exiftool -Creator=\"Bob Attacker\" report.docx", c: "E6EDF3", bold: true }],
        [{ t: "Error: Writing of DOCX files is not yet supported - report.docx", c: "FF7B72" }],
        [{ t: "    0 image files updated" }],
        [{ t: "    1 files weren't updated due to errors", c: "FF7B72" }],
      ]),
      calloutFind("Finding A-1", [
        T("ExifTool "), T("reads", { bold: true }), T(" OOXML but will not "), T("write", { bold: true }),
        T(" it — the metadata is inside a ZIP it won't repackage. So we manipulate the XML part directly, which is trivially easy."),
      ]),

      h3("A.3 — Manipulate the container directly & verify"),
      body([T("Unzip, edit "), m("docProps/core.xml"), T(" (spoof the author, back-date both timestamps, inject a hidden note into "), m("dc:description"), T("), re-zip. ExifTool then confirms the forgery:")]),
      ...codeBlock("verify tampered docx", [
        [{ t: "$ ", c: GREEN }, { t: "# core.xml rewritten inside the ZIP", c: "7D8797" }],
        [{ t: "$ ", c: GREEN }, { t: "exiftool -Creator -CreateDate -ModifyDate -Description report_tampered.docx", c: "E6EDF3", bold: true }],
        [{ t: "Creator            : ", c: "56D4DD" }, { t: "System Administrator", c: "E3B341", bold: true }],
        [{ t: "Create Date        : ", c: "56D4DD" }, { t: "2020:01:01 00:00:00Z", c: "E3B341", bold: true }],
        [{ t: "Modify Date        : ", c: "56D4DD" }, { t: "2020:01:01 00:00:00Z", c: "E3B341", bold: true }],
        [{ t: "Description        : ", c: "56D4DD" }, { t: "HIDDEN: exfil channel test 4E6F7465", c: "E3B341", bold: true }],
      ]),
      makeTable([2200, 3400, 3220], [
        ["Field", "Original", "Forged"],
        [[{ t: "Creator", font: "Consolas", c: MUTE }], [{ t: "Alice Fieldworker", font: "Consolas", c: RED, strike: true }], [{ t: "System Administrator", font: "Consolas", c: GREEN, bold: true }]],
        [[{ t: "Create Date", font: "Consolas", c: MUTE }], [{ t: "2026-03-14 09:12", font: "Consolas", c: RED, strike: true }], [{ t: "2020-01-01 00:00", font: "Consolas", c: GREEN, bold: true }]],
        [[{ t: "Description", font: "Consolas", c: MUTE }], [{ t: "— (empty)", font: "Consolas" }], [{ t: "HIDDEN payload injected", font: "Consolas", c: GREEN, bold: true }]],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ================= EXPERIMENT B: PDF =================
      eyebrow("4 · Experiment B"),
      h2("B.  PDF document"),
      body([T("Specimen: ", { color: MUTE }), m("report.pdf"), T("   Producer: ACME PDF Engine 1.0", { color: MUTE, size: 19 })]),

      h3("B.1 — Read all metadata"),
      ...codeBlock("exiftool report.pdf", [
        [{ t: "$ ", c: GREEN }, { t: "exiftool report.pdf", c: "E6EDF3", bold: true }],
        [{ t: "Title       : ", c: "56D4DD" }, { t: "Quarterly Field Report" }],
        [{ t: "Author      : ", c: "56D4DD" }, { t: "Alice Fieldworker" }],
        [{ t: "Creator     : ", c: "56D4DD" }, { t: "ACME Survey Tool" }],
        [{ t: "Producer    : ", c: "56D4DD" }, { t: "ACME PDF Engine 1.0" }],
        [{ t: "Create Date : ", c: "56D4DD" }, { t: "2026:03:14 09:12:00Z" }],
        [{ t: "Keywords    : ", c: "56D4DD" }, { t: "survey, GPS, confidential" }],
      ]),

      h3("B.2 — Spoof metadata & inject a hidden comment"),
      body([T("Unlike DOCX, PDF "), T("is", { italics: true }), T(" in ExifTool's writable list — the same "), m("-overwrite_original"), T(" syntax as the photo works verbatim:")]),
      ...codeBlock("spoof + inject", [
        [{ t: "$ ", c: GREEN }, { t: "exiftool -overwrite_original -Author=\"System Administrator\" \\", c: "E6EDF3", bold: true }],
        [{ t: "    -Producer=\"Adobe Acrobat Pro\" -CreateDate=\"2020:01:01 00:00:00Z\" \\", c: "E6EDF3", bold: true }],
        [{ t: "    -Keywords=\"cleaned\" report_tampered.pdf", c: "E6EDF3", bold: true }],
        [{ t: "    1 image files updated", c: "7EE787" }],
        [{ t: "$ ", c: GREEN }, { t: "exiftool -overwrite_original -Subject=\"HIDDEN: exfil...\" report_tampered.pdf", c: "E6EDF3", bold: true }],
        [{ t: "    1 image files updated", c: "7EE787" }],
        [{ t: "$ ", c: GREEN }, { t: "exiftool -Author -Producer -CreateDate -Keywords -Subject report_tampered.pdf", c: "E6EDF3", bold: true }],
        [{ t: "Author      : ", c: "56D4DD" }, { t: "System Administrator", c: "E3B341", bold: true }],
        [{ t: "Producer    : ", c: "56D4DD" }, { t: "Adobe Acrobat Pro", c: "E3B341", bold: true }],
        [{ t: "Create Date : ", c: "56D4DD" }, { t: "2020:01:01 00:00:00Z", c: "E3B341", bold: true }],
        [{ t: "Keywords    : ", c: "56D4DD" }, { t: "cleaned", c: "E3B341", bold: true }],
        [{ t: "Subject     : ", c: "56D4DD" }, { t: "HIDDEN: exfil channel test 4E6F7465", c: "E3B341", bold: true }],
      ]),

      h3("B.3 — Recover the “deleted” metadata (counter-forensics)"),
      body([T("ExifTool writes PDFs by "), T("incremental update", { italics: true }), T(": it appends a new revision and leaves the old one in place. The original author is still physically in the bytes — "), m("strings"), T(" pulls it right back out.")]),
      ...codeBlock("forensic residue", [
        [{ t: "$ ", c: GREEN }, { t: "strings report_tampered.pdf | grep -Ei \"Alice|survey, GPS\"", c: "E6EDF3", bold: true }],
        [{ t: "<< /Title (Quarterly Field Report) /Author (", c: "D5DEE8" }, { t: "Alice Fieldworker", c: "E3B341", bold: true }, { t: ")" }],
        [{ t: "   /Producer (ACME PDF Engine 1.0)", c: "D5DEE8" }],
        [{ t: "   /Keywords (", c: "D5DEE8" }, { t: "survey, GPS, confidential", c: "E3B341", bold: true }, { t: ") >>" }],
        [{ t: "$ ", c: GREEN }, { t: "ls -l report.pdf report_tampered.pdf", c: "E6EDF3", bold: true }],
        [{ t: "  892  report.pdf          # original", c: "7D8797" }],
        [{ t: " 4934  report_tampered.pdf # grew — both revisions retained", c: "E3B341" }],
      ]),
      calloutWarn("Finding B-1 · High value", [
        T("An ExifTool “edit” on a PDF does "), T("not erase", { bold: true }),
        T(" the prior value. The wiped author, keywords, and dates survive in the earlier revision, and the file "), T("grows", { italics: true }),
        T(" — two tell-tales an analyst uses to prove tampering. Truly scrubbing a PDF requires a linearize/rewrite pass (e.g. "),
        m("qpdf --linearize"), T("), not a metadata edit."),
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ================= EXPERIMENT C: AUDIO =================
      eyebrow("5 · Experiment C"),
      h2("C.  Audio file (MP3 / ID3)"),
      body([T("Specimen: ", { color: MUTE }), m("track.mp3"), T("   Artist: Alice Fieldworker · ID3v2.3", { color: MUTE, size: 19 })]),

      h3("C.1 — Read ID3 tags"),
      ...codeBlock("exiftool track.mp3", [
        [{ t: "$ ", c: GREEN }, { t: "exiftool -Artist -Title -Album -Year -Genre -Comment track.mp3", c: "E6EDF3", bold: true }],
        [{ t: "Artist        : ", c: "56D4DD" }, { t: "Alice Fieldworker" }],
        [{ t: "Title         : ", c: "56D4DD" }, { t: "Site Recording 12" }],
        [{ t: "Album         : ", c: "56D4DD" }, { t: "Q1 Survey" }],
        [{ t: "Year          : ", c: "56D4DD" }, { t: "2026" }],
        [{ t: "Genre         : ", c: "56D4DD" }, { t: "Speech" }],
        [{ t: "Comment       : ", c: "56D4DD" }, { t: "Recorded on-site, mic 2" }],
        [{ t: "Audio Bitrate : ", c: "56D4DD" }, { t: "128 kbps" }],
      ]),

      h3("C.2 — Attempt to write with ExifTool"),
      ...codeBlock("write attempt + capability check", [
        [{ t: "$ ", c: GREEN }, { t: "exiftool -Artist=\"Bob Attacker\" track.mp3", c: "E6EDF3", bold: true }],
        [{ t: "Error: Writing of MP3 files is not yet supported - track.mp3", c: "FF7B72" }],
        [{ t: "$ ", c: GREEN }, { t: "exiftool -listwf | grep -Ei \"mp3|m4a|wav|flac\"", c: "E6EDF3", bold: true }],
        [{ t: "M4A   # MP4-family audio IS writable; MP3 / WAV / FLAC are not", c: "7D8797" }],
      ]),
      calloutFind("Finding C-1", [
        T("ExifTool "), T("reads", { bold: true }), T(" ID3 fully but "), T("cannot write MP3, WAV, or FLAC", { bold: true }),
        T(" — only the MP4 container family ("), m("M4A"), T(", "), m("MOV"), T(", "), m("MP4"),
        T("). To forge an MP3 tag you edit the ID3v2 frames directly (below); to do it with ExifTool you'd convert to "), m(".m4a"), T(" first."),
      ]),

      h3("C.3 — Rewrite the ID3 frames directly & verify"),
      body([T("Strip the old ID3v2 header, rebuild the frames with a spoofed artist/album, a back-dated year, and a hidden "), m("COMM"), T(" comment, then re-read:")]),
      ...codeBlock("verify tampered mp3", [
        [{ t: "$ ", c: GREEN }, { t: "# ID3v2.3 frames rewritten, audio stream untouched", c: "7D8797" }],
        [{ t: "$ ", c: GREEN }, { t: "exiftool -Artist -Album -Year -Comment track_tampered.mp3", c: "E6EDF3", bold: true }],
        [{ t: "Artist  : ", c: "56D4DD" }, { t: "DJ Anonymous", c: "E3B341", bold: true }],
        [{ t: "Album   : ", c: "56D4DD" }, { t: "Public Domain", c: "E3B341", bold: true }],
        [{ t: "Year    : ", c: "56D4DD" }, { t: "2015", c: "E3B341", bold: true }],
        [{ t: "Comment : ", c: "56D4DD" }, { t: "(steg) HIDDEN: exfil channel test 4E6F7465", c: "E3B341", bold: true }],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ================= ANALYSIS =================
      eyebrow("6 · Analysis"),
      h2("Comparative results"),
      makeTable([1300, 1550, 2300, 2400, 1670], [
        ["Format", "Read", "Write", "Hidden-text vector", "Forensic residue"],
        [[{ t: "JPEG", font: "Consolas", c: MUTE }], [{ t: "yes", c: GREEN, bold: true }], [{ t: "yes", c: GREEN, bold: true }], [{ t: "Comment", font: "Consolas" }], "overwrite in place"],
        [[{ t: "DOCX", font: "Consolas", c: MUTE }], [{ t: "yes", c: GREEN, bold: true }], [{ t: "no → edit ZIP", c: RED, bold: true }], [{ t: "dc:description", font: "Consolas" }], "clean re-zip"],
        [[{ t: "PDF", font: "Consolas", c: MUTE }], [{ t: "yes", c: GREEN, bold: true }], [{ t: "yes", c: GREEN, bold: true }], [{ t: "Subject / Keywords", font: "Consolas" }], [{ t: "old revision retained", c: TAMPER, bold: true }]],
        [[{ t: "MP3", font: "Consolas", c: MUTE }], [{ t: "yes", c: GREEN, bold: true }], [{ t: "no → edit ID3", c: RED, bold: true }], [{ t: "COMM frame", font: "Consolas" }], "frames replaced"],
      ]),
      body([], { spacing: { after: 60 } }),
      body([T("All four formats leak authorship, timestamps, and tool fingerprints, and all four expose a free-text field an attacker can weaponize as a covert channel. The write path differs — ExifTool writes JPEG and PDF directly but hands off DOCX and MP3 to container-level editing — yet the metadata is equally forgeable in every case.")]),

      // ================= DEFENSE =================
      eyebrow("7 · Defensive takeaways"),
      h2("Detection & mitigation"),
      ...bullets([
        [T("Never trust metadata as evidence of authorship or time. ", { bold: true }), T("Every field shown here was rewritten in seconds; timestamps and “Author” are attacker-controlled.")],
        [T("Hunt for residue. ", { bold: true }), T("On PDFs, compare revision count and file growth ("), m("892 → 4934 bytes"), T(") and "), m("grep"), T(" for prior values; on DOCX, inspect every part in the ZIP.")],
        [T("Look for impossible values. ", { bold: true }), T("A 2020 create-date on a 2026 document, or "), m("Producer: Adobe Acrobat Pro"), T(" on a file the logs say came from a survey tool, are contradiction signals.")],
        [T("Scrub before sharing. ", { bold: true }), T("Strip metadata deliberately — "), m("exiftool -all= file.pdf"), T(", then linearize — rather than assuming an edit erased anything.")],
        [T("Inspect free-text fields for payloads. ", { bold: true }), T("Comment / Subject / COMM fields are a known exfiltration and steganography channel; scan them, don't just display them.")],
      ]),

      // ================= CONCLUSION =================
      eyebrow("8 · Result"),
      h2("Conclusion"),
      body([
        T("The image-metadata workflow transferred cleanly to Word, PDF, and audio: in every container the metadata was "),
        T("read, spoofed, and used to hide a payload", { bold: true }),
        T(", and verified with ExifTool. The exercise also surfaced two limits worth remembering — ExifTool refuses to write ZIP-based DOCX and MP3 (forcing direct container edits), and its PDF writes leave the original values physically recoverable, which is exactly the seam a forensic analyst exploits to catch the forgery."),
      ]),
      new Paragraph({
        spacing: { before: 220 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 6 } },
        children: [T("exiftool 13.55 · specimens generated for lab use · read → spoof → hide → verify → recover", { font: "Consolas", size: 15, color: MUTE })],
      }),
    ],
  }],
});

// ---------- callouts (defined after use is fine: hoisted funcs) ----------
function calloutBox(label, labelColor, barColor, runs) {
  return new Paragraph({
    spacing: { before: 60, after: 200, line: 270 },
    shading: { type: ShadingType.CLEAR, fill: "F1F5F7" },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: barColor, space: 12 },
              top: { style: BorderStyle.SINGLE, size: 2, color: LINE, space: 8 },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE, space: 8 },
              right: { style: BorderStyle.SINGLE, size: 2, color: LINE, space: 8 } },
    children: [
      T(label.toUpperCase() + "   ", { font: "Consolas", size: 15, bold: true, color: labelColor, characterSpacing: 20 }),
      ...runs,
    ],
  });
}
function calloutFind(label, runs) { return calloutBox(label, TEAL, TEAL, runs); }
function calloutWarn(label, runs) { return calloutBox(label, RED, RED, runs); }

function bullets(items) {
  return items.map(runs => new Paragraph({
    spacing: { after: 100, line: 270 }, bullet: { level: 0 },
    children: runs,
  }));
}

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(process.argv[2] || "report.docx", buf);
  console.log("wrote", process.argv[2], buf.length, "bytes");
});
