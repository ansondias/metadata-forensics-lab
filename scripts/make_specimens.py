#!/usr/bin/env python3
"""Generate clean specimen files for the metadata-manipulation lab:
   - report.docx  (OOXML = a ZIP with docProps metadata)
   - report.pdf   (minimal PDF with an /Info dictionary)
   - track.mp3    (one valid MPEG-1 Layer III frame; enough for ExifTool)
"""
import zipfile, struct, os

HERE = os.path.dirname(os.path.abspath(__file__))

# ----------------------------------------------------------------------
# 1) Word document (.docx)
# ----------------------------------------------------------------------
content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>'''

rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''

document = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t>Quarterly Field Report - CONFIDENTIAL</w:t></w:r></w:p></w:body>
</w:document>'''

core = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Quarterly Field Report</dc:title>
  <dc:creator>Alice Fieldworker</dc:creator>
  <cp:lastModifiedBy>Alice Fieldworker</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-03-14T09:12:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-03-14T09:40:00Z</dcterms:modified>
  <cp:keywords>survey, GPS, confidential</cp:keywords>
</cp:coreProperties>'''

app = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Microsoft Office Word</Application>
  <Company>ACME Survey Group</Company>
</Properties>'''

docx_path = os.path.join(HERE, "report.docx")
with zipfile.ZipFile(docx_path, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", content_types)
    z.writestr("_rels/.rels", rels)
    z.writestr("word/document.xml", document)
    z.writestr("docProps/core.xml", core)
    z.writestr("docProps/app.xml", app)
print("wrote", docx_path)

# ----------------------------------------------------------------------
# 2) PDF (.pdf) with an /Info metadata dictionary
# ----------------------------------------------------------------------
objs = []
objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
objs.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
objs.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>")
stream = b"BT /F1 18 Tf 72 700 Td (Quarterly Field Report - CONFIDENTIAL) Tj ET"
objs.append(b"<< /Length %d >>\nstream\n%s\nendstream" % (len(stream), stream))
objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
objs.append(b"<< /Title (Quarterly Field Report) /Author (Alice Fieldworker) "
            b"/Creator (ACME Survey Tool) /Producer (ACME PDF Engine 1.0) "
            b"/CreationDate (D:20260314091200Z) /ModDate (D:20260314094000Z) "
            b"/Keywords (survey, GPS, confidential) >>")

pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
offsets = []
for i, body in enumerate(objs, start=1):
    offsets.append(len(pdf))
    pdf += b"%d 0 obj\n" % i + body + b"\nendobj\n"
xref_pos = len(pdf)
n = len(objs) + 1
pdf += b"xref\n0 %d\n" % n
pdf += b"0000000000 65535 f \n"
for off in offsets:
    pdf += b"%010d 00000 n \n" % off
pdf += b"trailer\n<< /Size %d /Root 1 0 R /Info 6 0 R >>\n" % n
pdf += b"startxref\n%d\n%%%%EOF\n" % xref_pos
pdf_path = os.path.join(HERE, "report.pdf")
with open(pdf_path, "wb") as f:
    f.write(pdf)
print("wrote", pdf_path)

# ----------------------------------------------------------------------
# 3) MP3 (.mp3) - one valid MPEG-1 Layer III frame, silent payload
#    Header FF FB 90 00 = MPEG-1 L3, 128 kbps, 44.1 kHz, mono, no CRC.
#    Frame length = 144 * 128000 / 44100 = 417 bytes.
# ----------------------------------------------------------------------
frame = bytearray(b"\xff\xfb\x90\x00")
frame += b"\x00" * (417 - 4)
mp3 = bytes(frame) * 20            # ~a few frames so it reads as real audio
mp3_path = os.path.join(HERE, "track.mp3")
with open(mp3_path, "wb") as f:
    f.write(mp3)
print("wrote", mp3_path)
