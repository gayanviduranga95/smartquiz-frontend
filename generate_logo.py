from PIL import Image, ImageDraw, ImageFont
import os

# Create a high-quality logo image
width, height = 400, 200
image = Image.new('RGB', (width, height), color=(255, 255, 255))
draw = ImageDraw.Draw(image, 'RGBA')

# Add gradient-like background with teal gradient
for y in range(height):
    r = int(20 + (50 - 20) * (y / height))
    g = int(184 + (100 - 184) * (y / height))
    b = int(166 + (150 - 166) * (y / height))
    draw.rectangle([(0, y), (width, y+1)], fill=(r, g, b))

# Add some visual elements - circles representing quiz bubbles
# Circle 1
draw.ellipse([(40, 40), (100, 100)], fill=(255, 255, 255, 200), outline=(255, 255, 255, 255), width=2)
# Circle 2
draw.ellipse([(280, 50), (340, 110)], fill=(255, 255, 255, 200), outline=(255, 255, 255, 255), width=2)
# Circle 3
draw.ellipse([(160, 100), (200, 140)], fill=(255, 255, 255, 150), outline=(255, 255, 255, 255), width=2)

# Add checkmark symbol in main circle
draw.ellipse([(80, 60), (170, 150)], fill=(20, 184, 166), outline=(255, 255, 255, 255), width=3)

# Draw simple checkmark
checkmark_points = [(105, 110), (125, 130), (155, 90)]
draw.line(checkmark_points, fill=(255, 255, 255), width=6)

# Add text
try:
    font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 48)
    font_small = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 20)
except:
    font = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Draw "SmartQuiz" text
text = "SmartQuiz"
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_x = (width - text_width) // 2
draw.text((text_x, 55), text, fill=(255, 255, 255), font=font)

# Draw tagline
tagline = "Master Your Learning"
bbox2 = draw.textbbox((0, 0), tagline, font=font_small)
tagline_width = bbox2[2] - bbox2[0]
tagline_x = (width - tagline_width) // 2
draw.text((tagline_x, 130), tagline, fill=(255, 255, 255), font=font_small)

# Save as PNG
output_path = os.path.join(os.path.dirname(__file__), 'public', 'logo.png')
image.save(output_path, 'PNG', quality=95)
print("Logo generated successfully: logo.png")
print(f"Logo size: {width}x{height} pixels")
print(f"Saved to: {output_path}")
