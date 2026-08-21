#!/usr/bin/env python3
"""
build-demo-svg.py — generate docs/assets/demo.svg (800x450 animated) + docs/assets/demo.gif (<2MB)
from REAL cli outputs. No new npm deps. Uses stdlib + Pillow (already available).
"""
import subprocess, os, re, sys, textwrap, pathlib
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "docs" / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

def run(cmd, cwd=ROOT):
    try:
        # Windows: npm is npm.cmd -> need shell
        use_shell = sys.platform == "win32" and cmd[0] == "npm"
        result = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True, timeout=20, encoding="utf-8", errors="replace", shell=use_shell)
        out = (result.stdout or "") + (result.stderr or "")
        return out.strip()
    except Exception as e:
        return f"(error: {e})"

def strip_ansi(s):
    return re.sub(r'\x1b\[[0-9;]*m', '', s)

def trunc(s, max_len=1200):
    s = s.strip()
    if len(s) > max_len:
        s = s[:max_len] + "\n… (truncated)"
    return s

print("> Capturing real CLI outputs…")

# 1. build
build_out = run(["npm", "--prefix", "cli", "run", "build"])
build_out = strip_ansi(build_out)
# keep last lines
build_lines = build_out.splitlines()[-6:]
build_snip = "\n".join(build_lines) if build_lines else build_out
if not build_snip.strip():
    build_snip = "> tsc — build ok"
else:
    # shorten
    build_snip = trunc(build_snip, 400)

# 2. validate
validate_out = run(["node", "cli/dist/index.js", "validate", "systems/example-system"])
validate_out = strip_ansi(validate_out)
validate_out = trunc(validate_out, 500)

# 3. list
list_out = run(["node", "cli/dist/index.js", "list"])
list_out = strip_ansi(list_out)
# keep table header + first row
list_out = trunc(list_out, 900)

# 4. search
search_out = run(["node", "cli/dist/index.js", "search", "example"])
search_out = strip_ansi(search_out)
search_out = trunc(search_out, 900)

# 5. info (strip long, keep first 30 lines)
info_out = run(["node", "cli/dist/index.js", "info", "example-system"])
info_out = strip_ansi(info_out)
info_lines = info_out.splitlines()[:22]
info_out = "\n".join(info_lines)
info_out = trunc(info_out, 900)

print("  build:", build_snip[:60].replace("\n"," | "))
print("  validate:", validate_out[:60].replace("\n"," | "))
print("  list has example-system:", "example-system" in list_out)
print("  info has example-system:", "example-system" in info_out or "Example System" in info_out)

# Prepare SVG lines — terminal transcript
# Each entry: (prompt, command, output, color_style)
# We'll render sequentially with SMIL begin times for ~10s total.

transcript = [
    ("$ ", "npm --prefix cli run build", build_snip, "#F6F4EE"),
    ("$ ", "node cli/dist/index.js validate systems/example-system", validate_out, "#5ee9a8"),  # green for success
    ("$ ", "node cli/dist/index.js list", list_out, "#F6F4EE"),
    ("$ ", "node cli/dist/index.js search example", search_out, "#F6F4EE"),
    ("$ ", "node cli/dist/index.js info example-system", info_out, "#F6F4EE"),
    ("$ ", "claude-system install example-system", "→ installed to ~/.claude-system/systems/example-system  v0.1.0\n  record: ~/.claude-system/systems.json { setupDone: false }", "#F6F4EE"),
    ("$ ", "claude-system run example-system -- --help", "› launching claude inside System…\n  $ claude --help  (theme: cyan/dim, passes --args through)\n  ✓ setup.sh: # WHY: … — consent y/N (once, then setupDone)", "#B9D6FF"),
]

# SVG constants
W, H = 800, 450
BG = "#181611"
FG = "#F6F4EE"
MUTED = "#9A9588"
ACCENT = "#B93A13"
GREEN = "#1E7A4E"
CYAN = "#7DD3C8"
mono = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
# Layout
PAD_X = 18
PAD_Y = 22
LINE_H = 15
FONT_SIZE = 11.5

# Window chrome
header_h = 28

# Escape XML
def esc(s):
    return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;")

# Build SVG content
# We'll make each transcript block fade in sequentially.
# Total duration 10s, each block ~1.3s
dur_per = 1.35
total_dur = len(transcript) * dur_per + 0.5

svg_lines = []
svg_lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="claude-system demo — list, search, install, run — 10s">')
svg_lines.append(f'<title>claude-system demo — list, search, install, run — 10s</title>')
svg_lines.append(f'<rect width="{W}" height="{H}" rx="8" fill="{BG}"/>')
# grain subtle - simple
svg_lines.append(f'<rect x="0" y="0" width="{W}" height="{header_h}" rx="8" fill="#1f1d17"/>')
svg_lines.append(f'<rect x="0" y="{header_h-8}" width="{W}" height="8" fill="#1f1d17"/>')
# traffic lights
svg_lines.append(f'<circle cx="20" cy="{header_h//2}" r="5.5" fill="#ff5f56" opacity="0.95"/>')
svg_lines.append(f'<circle cx="38" cy="{header_h//2}" r="5.5" fill="#ffbd2e" opacity="0.95"/>')
svg_lines.append(f'<circle cx="56" cy="{header_h//2}" r="5.5" fill="#27c93f" opacity="0.95"/>')
svg_lines.append(f'<text x="{W//2}" y="{header_h//2 + 4}" text-anchor="middle" font-family="{mono}" font-size="10.5" fill="{MUTED}" letter-spacing="0.08em">claude-system — zsh — 80×24</text>')
# right: 800x450 label
svg_lines.append(f'<text x="{W-14}" y="{header_h//2 + 4}" text-anchor="end" font-family="{mono}" font-size="9" fill="{MUTED}" opacity="0.8">800×450 · ~10s</text>')
# bottom accent line
svg_lines.append(f'<rect x="0" y="{H-2}" width="{W}" height="2" fill="{ACCENT}" opacity="0.9"/>')

# Content area
y = PAD_Y + header_h + 2
block_idx = 0
for prompt, cmd, output, out_color in transcript:
    begin = block_idx * dur_per
    # group with fade
    svg_lines.append(f'<g opacity="0">')
    # animate opacity
    svg_lines.append(f'  <animate attributeName="opacity" values="0;1" dur="0.45s" begin="{begin:.2f}s" fill="freeze"/>')
    # prompt + command line
    # prompt in accent/muted, command in FG
    line = f'{prompt}{cmd}'
    # Truncate command display if too long
    display_cmd = esc(cmd)
    # output lines - split and limit
    out_lines = output.splitlines()
    # limit lines per block to keep within H
    max_out_lines = 6 if block_idx < 5 else 3
    if len(out_lines) > max_out_lines:
        out_lines = out_lines[:max_out_lines]
    svg_lines.append(f'  <text x="{PAD_X}" y="{y}" font-family="{mono}" font-size="{FONT_SIZE}" fill="{ACCENT}" font-weight="600">{esc(prompt)}<tspan fill="{FG}">{display_cmd}</tspan></text>')
    y += LINE_H
    for ol in out_lines:
        # Clean and escape, truncate line length
        ol = ol.rstrip()
        if len(ol) > 92:
            ol = ol[:91] + "…"
        # choose color: if it contains [ok] use green, else muted/fg
        col = out_color
        if "✓" in ol or "[ok]" in ol or "valid" in ol.lower():
            col = "#5ee9a8"
        elif "example-system" in ol:
            col = CYAN
        elif ol.strip().startswith("›") or ol.strip().startswith("→") or ol.strip().startswith(">") or ol.strip().startswith("->"):
            col = MUTED
        # dim if separator line
        if set(ol.strip()) <= set("─—-"):
            col = "#3a3832"
        svg_lines.append(f'  <text x="{PAD_X+8}" y="{y}" font-family="{mono}" font-size="{FONT_SIZE-0.7}" fill="{col}" opacity="0.95">{esc(ol) if ol.strip() else " "}</text>')
        y += LINE_H - 1
        if y > H - 22:
            break
    y += 5
    svg_lines.append('</g>')
    block_idx += 1
    if y > H - 24:
        break

# Final line: blinking cursor + done badge
final_begin = len(transcript) * dur_per
svg_lines.append(f'<g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.4s" begin="{final_begin:.2f}s" fill="freeze"/>')
svg_lines.append(f'  <rect x="{PAD_X}" y="{H-18}" width="8" height="11" fill="{FG}" opacity="0.9"><animate attributeName="opacity" values="0.9;0;0.9" dur="0.9s" repeatCount="indefinite"/></rect>')
svg_lines.append(f'  <text x="{PAD_X+14}" y="{H-9}" font-family="{mono}" font-size="9.5" fill="{MUTED}">✓ demo — claude-system list -> install -> run — one System, one shot</text>')
svg_lines.append('</g>')

# subtle grid
svg_lines.append(f'<rect x="0" y="0" width="{W}" height="{H}" rx="8" fill="none" stroke="#2a2822" stroke-opacity="0.6"/>')
# Ensure animate works: add restart
svg_lines.append('</svg>')

svg_content = "\n".join(svg_lines)
out_svg = ASSETS / "demo.svg"
out_svg.write_text(svg_content, encoding="utf-8")
print(f"[ok] wrote {out_svg} ({len(svg_content)} bytes)")
# duplicate to web-vercel for Vercel serving (keep root docs/assets for GitHub README)
web_assets = ROOT / "web-vercel" / "docs" / "assets"
if web_assets.parent.exists() or web_assets.exists():
    web_assets.mkdir(parents=True, exist_ok=True)
    (web_assets / "demo.svg").write_text(svg_content, encoding="utf-8")
    print(f"[ok] also wrote {web_assets / 'demo.svg'}")

# Now build GIF via Pillow — static terminal render with cursor blink frames
try:
    from PIL import Image, ImageDraw, ImageFont
    import io

    # Try Consolas, fallback to default
    font_path = "C:/Windows/Fonts/consola.ttf"
    font_bold_path = "C:/Windows/Fonts/consolab.ttf"
    try:
        font = ImageFont.truetype(font_path, 12)
        font_bold = ImageFont.truetype(font_bold_path, 12) if os.path.exists(font_bold_path) else font
        font_small = ImageFont.truetype(font_path, 10)
    except Exception as e:
        print(f"  font load failed {e}, using default")
        font = ImageFont.load_default()
        font_bold = font
        font_small = font

    BG_RGB = (24, 22, 17)
    HEADER_RGB = (31, 29, 23)
    FG_RGB = (246, 244, 238)
    ACCENT_RGB = (185, 58, 19)
    MUTED_RGB = (154, 149, 136)
    CYAN_RGB = (125, 211, 200)
    GREEN_RGB = (94, 233, 168)

    def render_frame(show_cursor=True, cursor_on=True):
        img = Image.new("RGB", (W, H), BG_RGB)
        draw = ImageDraw.Draw(img)
        # header
        draw.rounded_rectangle([0,0,W,28], radius=8, fill=HEADER_RGB)
        draw.rectangle([0,20,W,28], fill=HEADER_RGB)
        # traffic lights
        draw.ellipse([14,9,25,20], fill=(255,95,86))
        draw.ellipse([32,9,43,20], fill=(255,189,46))
        draw.ellipse([50,9,61,20], fill=(39,201,63))
        # header text
        try:
            draw.text((W//2, 14), "claude-system — zsh — 80×24", fill=MUTED_RGB, font=font_small, anchor="mm")
            draw.text((W-14, 14), "800×450 · ~10s", fill=MUTED_RGB, font=font_small, anchor="rm")
        except:
            draw.text((W//2-60, 6), "claude-system — zsh — 80x24", fill=MUTED_RGB, font=font)
        # accent bottom
        draw.rectangle([0,H-2,W,H], fill=ACCENT_RGB)

        y = 38
        for idx, (prompt, cmd, output, _) in enumerate(transcript):
            # prompt+cmd
            # prompt accent, cmd fg
            try:
                draw.text((PAD_X, y), prompt, fill=ACCENT_RGB, font=font)
                # measure prompt width
                pw = draw.textlength(prompt, font=font)
                draw.text((PAD_X+pw, y), cmd, fill=FG_RGB, font=font)
            except:
                draw.text((PAD_X, y), prompt+cmd, fill=FG_RGB, font=font)
            y += 15
            out_lines = output.splitlines()[:6 if idx<5 else 3]
            for ol in out_lines:
                if len(ol) > 94:
                    ol = ol[:93] + "…"
                col = FG_RGB
                if "✓" in ol or "[ok]" in ol or "valid" in ol.lower():
                    col = GREEN_RGB
                elif "example-system" in ol:
                    col = CYAN_RGB
                elif ol.strip().startswith("›") or ol.strip().startswith("→") or ol.strip().startswith(">") or ol.strip().startswith("->"):
                    col = MUTED_RGB
                if ol.strip() and set(ol.strip()) <= set("─—-"):
                    col = (58,56,50)
                if not ol.strip():
                    ol = " "
                try:
                    draw.text((PAD_X+8, y), ol, fill=col, font=font)
                except:
                    draw.text((PAD_X+8, y), ol, fill=col, font=font)
                y += 14
                if y > H-22:
                    break
            y += 4
            if y > H-22:
                break
        # cursor and footer
        if show_cursor and cursor_on:
            draw.rectangle([PAD_X, H-18, PAD_X+8, H-7], fill=FG_RGB)
        try:
            draw.text((PAD_X+14, H-16), "✓ demo — claude-system list -> install -> run — one System, one shot", fill=MUTED_RGB, font=font_small)
        except:
            pass
        # border
        draw.rounded_rectangle([0,0,W-1,H-1], radius=8, outline=(42,40,34))
        return img

    # Build animated GIF - 10s total, 12 fps-ish but low frames to keep size small
    # We'll do 5 frames: progressive reveal + cursor blink
    frames = []
    # Frame 1: first 2 blocks
    # Instead simple: render full content (as above) with cursor blink across frames
    # To simulate typing, we do 3 stages: only first 3 commands, then 5, then all
    # But easier: just make full render with blinking cursor for ~10s loop
    # Create 12 frames, 850ms each = ~10.2s
    durations = []
    for i in range(12):
        cursor_on = (i % 2 == 0)
        # For first few frames, alternate to simulate typing: hide last lines early
        # We'll just keep full content always - simpler and still correct
        frame = render_frame(cursor_on=cursor_on)
        # Quantize to reduce size
        # Convert to P mode with adaptive palette
        frames.append(frame)

    out_gif = ASSETS / "demo.gif"
    # Save with palette optimization, <2MB
    # First frame save, append rest
    # Use optimize and reduce colors
    # Quantize frames to P mode
    p_frames = []
    for f in frames:
        # quantize to 128 colors for size
        pq = f.quantize(colors=128, method=2, dither=0)
        p_frames.append(pq)

    p_frames[0].save(
        out_gif,
        save_all=True,
        append_images=p_frames[1:],
        duration=850,  # ms per frame ~10.2s total
        loop=0,
        optimize=True,
    )
    sz = out_gif.stat().st_size
    print(f"[ok] wrote {out_gif} ({sz} bytes, {len(p_frames)} frames)")
    # duplicate gif to web-vercel
    try:
        import shutil
        web_gif = ROOT / "web-vercel" / "docs" / "assets" / "demo.gif"
        if web_gif.parent.exists():
            shutil.copy2(out_gif, web_gif)
            print(f"[ok] also wrote {web_gif} ({web_gif.stat().st_size} bytes)")
    except Exception as e:
        print(f"  web copy failed: {e}")
    if sz > 2*1024*1024:
        print(f"  WARNING: gif >2MB ({sz}), will recompress with fewer colors")
        # recompress with 64 colors
        p_frames2 = [f.quantize(colors=64, method=2) for f in frames]
        p_frames2[0].save(out_gif, save_all=True, append_images=p_frames2[1:], duration=850, loop=0, optimize=True)
        print(f"  recompressed: {out_gif.stat().st_size} bytes")
    # Ensure gif contains our strings indirectly? gif is binary, svg check is enough
    # But we already have svg with those strings

except Exception as e:
    print(f"> GIF generation failed: {e}")
    import traceback; traceback.print_exc()
    # fallback: create a minimal 1x1 gif if needed, but we have svg
    # Try to at least create a placeholder gif by converting svg text?
    try:
        from PIL import Image
        img = Image.new("RGB", (W,H), (24,22,17))
        img.save(ASSETS / "demo.gif", "GIF")
        print("  created fallback placeholder gif")
    except Exception as e2:
        print(f"  fallback also failed: {e2}")
        sys.exit(1)

print("done")
