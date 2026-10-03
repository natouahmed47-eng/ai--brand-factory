from PIL import Image


def extract_colors(image_path: str, num_colors: int = 5) -> list[str]:
    """
    استخراج أهم الألوان من صورة.
    يعيد قائمة من أكواد الألوان HEX.
    """
    try:
        img = Image.open(image_path).convert("RGB")
        img = img.resize((150, 150))

        quantized = img.quantize(colors=num_colors, method=Image.Quantize.MEDIANCUT)
        palette = quantized.getpalette()
        color_counts = sorted(quantized.getcolors(), reverse=True)

        colors = []
        for count, index in color_counts[:num_colors]:
            r, g, b = palette[index * 3 : index * 3 + 3]
            colors.append(f"#{r:02x}{g:02x}{b:02x}")

        return colors
    except Exception as e:
        print(f"[BRAND_BRAIN] Color extraction failed: {e}")
        return []


def extract_dominant_color(image_path: str) -> str | None:
    """استخراج اللون السائد فقط"""
    colors = extract_colors(image_path, num_colors=1)
    return colors[0] if colors else None
