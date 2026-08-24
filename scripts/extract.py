import zipfile, re, sys
xml = zipfile.ZipFile(sys.argv[1]).read("word/document.xml").decode("utf-8")
paras = xml.split("</w:p>")
out = []
for p in paras:
    texts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, re.S)
    line = "".join(texts)
    if line.strip():
        out.append(line)
print("non-empty paragraphs:", len(out))
print("tables:", xml.count("<w:tbl>"), " page-breaks:", xml.count("<w:br w:type=\"page\"/>"))
print("=" * 60)
for l in out:
    print(l[:90])
