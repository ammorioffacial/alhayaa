# One-off migration for the v2 type scale. Rewrites font-size declarations in the storefront
# stylesheets using the selector each declaration belongs to, and prints every change.
import re
import sys

FILES = [
    "src/app/storefront.css",
    "src/components/storefront/product-experience.css",
]
DECL = re.compile(r"^(\s*)font-size:\s*(.+?);\s*$")


def target(selector: str, indent: str, value: str) -> str | None:
    s = selector.lower()
    desktop = len(indent) >= 4  # declarations inside @media blocks are indented further
    v = value.strip()
    if v.startswith("clamp("):
        if "campaign h1" in s or "h1" in s:
            return "clamp(44px, 4vw, 56px)" if desktop else "clamp(36px, 9vw, 56px)"
        if "h2" in s or "detail-name" in s or "h3" in s:
            return "clamp(24px, 5vw, 34px)"
        return None
    m = re.fullmatch(r"(\d+(?:\.\d+)?)px", v)
    if not m:
        return None
    px = float(m.group(1))
    if "price" in s:
        return "16px"
    if "title" in s or "name" in s or s.endswith(" h3") or "cart-item-content h3" in s:
        return "17px"
    if "wordmark small" in s:
        return "14px"
    if px >= 19:
        return "16px" if px < 22 else "24px"
    if px >= 22:
        return "24px"
    if px == 17:
        return "16px"
    if px == 18:
        return "17px"
    if px < 14:
        return "14px"
    return None  # 14px and 16px stay as they are


def main() -> None:
    total = 0
    for path in FILES:
        lines = open(path, encoding="utf-8").read().split("\n")
        selector = ""
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.endswith("{") and not stripped.startswith("@"):
                selector = stripped.rstrip("{").strip()
                continue
            m = DECL.match(line)
            if not m:
                continue
            new = target(selector, m.group(1), m.group(2))
            if new and new != m.group(2).strip():
                print(f"{path}:{i + 1} [{selector[:60]}] {m.group(2).strip()} -> {new}")
                lines[i] = f"{m.group(1)}font-size: {new};"
                total += 1
        open(path, "w", encoding="utf-8").write("\n".join(lines))
    print(f"changed {total} declarations", file=sys.stderr)


if __name__ == "__main__":
    main()
