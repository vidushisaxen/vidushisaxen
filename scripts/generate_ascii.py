from PIL import Image

ASCII_CHARS = "@%#*+=-:. "

def resize(image, new_width=70):
    width, height = image.size
    ratio = height / width
    new_height = int(new_width * ratio * 0.55)
    return image.resize((new_width, new_height))

def grayscale(image):
    return image.convert("L")

def pixels_to_ascii(image):
    pixels = image.getdata()
    chars = "".join(ASCII_CHARS[pixel * len(ASCII_CHARS) // 256] for pixel in pixels)
    return chars

def convert(image_path, output_path):
    image = Image.open(image_path)
    image = resize(image)
    image = grayscale(image)

    ascii_str = pixels_to_ascii(image)

    width = image.width
    ascii_img = "\n".join(
        ascii_str[i:i + width]
        for i in range(0, len(ascii_str), width)
    )

    with open(output_path, "w") as f:
        f.write(ascii_img)

    print(f"ASCII portrait saved to {output_path}")

convert(
    "assets/images/profile.png",
    "assets/images/portrait.txt"
)