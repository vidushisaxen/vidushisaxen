from PIL import Image, ImageOps

ASCII_CHARS = "@%#*+=-:. "

IMAGE_PATH = "assets/images/profile.png"
OUTPUT_PATH = "assets/images/portrait.txt"

# Open image
image = Image.open(IMAGE_PATH).convert("L")

# Crop around face (adjust later if needed)
image = image.crop((170, 30, 630, 500))

# Improve contrast
image = ImageOps.autocontrast(image)

# Resize
WIDTH = 70
HEIGHT = int(image.height / image.width * WIDTH * 0.5)

image = image.resize((WIDTH, HEIGHT))

pixels = image.load()

ascii_art = ""

for y in range(HEIGHT):
    for x in range(WIDTH):
        brightness = pixels[x, y]
        ascii_art += ASCII_CHARS[brightness * len(ASCII_CHARS) // 256]
    ascii_art += "\n"

with open(OUTPUT_PATH, "w") as f:
    f.write(ascii_art)

print("ASCII portrait generated!")