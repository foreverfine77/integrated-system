import os
import math
from PIL import Image, ImageDraw

def create_icon():
    # Size
    size = (256, 256)
    
    # Create image with transparent background
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors (Matching App Theme)
    bg_color = (15, 23, 42, 255)      # Slate-900
    grid_color = (30, 41, 59, 255)    # Slate-800
    line1_color = (16, 185, 129, 255) # Emerald-500
    line2_color = (59, 130, 246, 255) # Blue-500
    border_color = (51, 65, 85, 255)  # Slate-700
    
    # 1. Draw Container (Rounded Square)
    margin = 16
    rect = [margin, margin, size[0]-margin, size[1]-margin]
    radius = 48 # Softer corners
    draw.rounded_rectangle(rect, radius=radius, fill=bg_color, outline=border_color, width=4)
    
    # 2. Draw Faint Grid (Technical feel)
    step = 32
    for i in range(margin, size[0]-margin, step):
        # Vertical
        if i > margin:
            draw.line([(i, margin), (i, size[1]-margin)], fill=grid_color, width=1)
        # Horizontal
        if i > margin:
            draw.line([(margin, i), (size[0]-margin, i)], fill=grid_color, width=1)

    # 3. Draw Multichannel Signals (Two waves)
    # Wave 1: Emerald
    points1 = []
    # Wave 2: Blue
    points2 = []
    
    start_x = margin + 10
    end_x = size[0] - margin - 10
    mid_y = size[1] // 2
    
    amplitude = 50
    frequency = 0.035
    phase_shift = math.pi / 3 # Shift for second channel
    
    for x in range(start_x, end_x):
        # Wave 1 (Sine)
        y1 = mid_y + amplitude * math.sin(frequency * (x - start_x))
        points1.append((x, y1))
        
        # Wave 2 (Shifted Sine)
        y2 = mid_y + amplitude * math.sin(frequency * (x - start_x) + phase_shift)
        points2.append((x, y2))
        
    # Draw lines with anti-aliasing simulation (drawing multiple times with slight offset or just thick lines)
    # PIL's line drawing isn't perfectly anti-aliased, but thick lines look okay.
    
    draw.line(points2, fill=line2_color, width=8) # Blue first (background)
    draw.line(points1, fill=line1_color, width=8) # Emerald second (foreground)
    
    # 4. Add "Channel" Dots/Indicators at top right
    # To reinforce "Multichannel"
    dot_radius = 6
    dot_margin = 35
    # Blue Dot
    draw.ellipse([size[0]-dot_margin-25, dot_margin, size[0]-dot_margin-15, dot_margin+10], fill=line2_color)
    # Green Dot
    draw.ellipse([size[0]-dot_margin-10, dot_margin, size[0]-dot_margin, dot_margin+10], fill=line1_color)

    # Ensure directories exist
    public_dir = r'e:\多通道项目\system\integrated_system\frontend\public'
    if not os.path.exists(public_dir):
        os.makedirs(public_dir)
        
    # Save as PNG
    png_path = os.path.join(public_dir, 'app_icon.png')
    img.save(png_path)
    print(f"Generated PNG: {png_path}")
    
    # Save as ICO
    ico_path = os.path.join(public_dir, 'app_icon.ico')
    img.save(ico_path, format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print(f"Generated ICO: {ico_path}")

if __name__ == '__main__':
    try:
        create_icon()
        print("Icon generation successful.")
    except Exception as e:
        print(f"Error generating icon: {e}")
