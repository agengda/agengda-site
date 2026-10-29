import re, io

# 统一把 WhatsApp 预填消息改为英语（老板 2026-10-26 要求）
DIST_MSG = "Hello, I would like to become an Agengda distributor in my country."
INQ_MSG = "Hello, I am interested in your industrial chillers. Please send me a quotation."

# 1) src/seo.js -> wa:
p1 = "src/seo.js"
s1 = io.open(p1, encoding="utf-8").read()
n1 = len(re.findall(r'wa:\s*"[^"]*"', s1))
s1 = re.sub(r'wa:\s*"[^"]*"', 'wa: "%s"' % DIST_MSG, s1)
io.open(p1, "w", encoding="utf-8").write(s1)
print("seo.js: 替换 wa 预填", n1, "处")

# 2) src/i18n.js -> wa_msg:
p2 = "src/i18n.js"
s2 = io.open(p2, encoding="utf-8").read()
n2 = len(re.findall(r'wa_msg:\s*"[^"]*"', s2))
s2 = re.sub(r'wa_msg:\s*"[^"]*"', 'wa_msg: "%s"' % INQ_MSG, s2)
io.open(p2, "w", encoding="utf-8").write(s2)
print("i18n.js: 替换 wa_msg 预填", n2, "处")
