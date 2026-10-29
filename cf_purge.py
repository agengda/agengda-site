#!/usr/bin/env python3
# 清 Cloudflare 缓存 (Purge Everything)
# 用途：每次改完网站并部署后调用，让生产站立刻生效（不再手动去 Cloudflare 点）。
# 凭证放在同目录 .cf_secret.json（不进 git、不随部署上传）：
#   { "email": "15888503789@163.com",
#     "api_key": "Global API Key（或留空改用 api_token）",
#     "api_token": "（可选）只给 Cache Purge 权限的 API Token",
#     "zone_id": "agengda-industrial-chiller.com 的 Zone ID" }
import json, sys, os, urllib.request, urllib.error

SECRET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cf_secret.json")


def load_secret():
    if not os.path.exists(SECRET_PATH):
        print("ERROR: 缺少 .cf_secret.json（参考 .cf_secret.example.json 填写）")
        sys.exit(2)
    with open(SECRET_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def purge():
    s = load_secret()
    zone_id = (s.get("zone_id") or "").strip()
    if not zone_id:
        print("ERROR: .cf_secret.json 缺少 zone_id")
        sys.exit(2)

    if s.get("api_token"):
        headers = {"Authorization": "Bearer " + s["api_token"].strip(),
                   "Content-Type": "application/json"}
    else:
        email = (s.get("email") or "").strip()
        api_key = (s.get("api_key") or "").strip()
        if not (email and api_key):
            print("ERROR: 需要提供 email+api_key，或 api_token")
            sys.exit(2)
        headers = {"X-Auth-Email": email, "X-Auth-Key": api_key,
                   "Content-Type": "application/json"}

    url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache"
    body = json.dumps({"purge_everything": True}).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("HTTPError", e.code, e.read().decode("utf-8", "ignore"))
        sys.exit(1)
    except Exception as e:
        print("ERROR", e)
        sys.exit(1)

    if resp.get("success"):
        print("OK: Cloudflare 缓存已清除 (Purge Everything) — 生产站将立刻拉取新版本")
    else:
        print("FAIL:", resp.get("errors"))
        sys.exit(1)


if __name__ == "__main__":
    purge()
