"""Prepare Google Flow originals for the runtime: chroma key, crop, and atlas packing."""
from PIL import Image
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def sprites(source, count, cell, output):
    original = Image.open(ROOT / 'art-source' / source).convert('RGBA')
    atlas = Image.new('RGBA', (count * cell[0], cell[1]))
    for i in range(count):
        tile = original.crop((round(i*original.width/count), 170, round((i+1)*original.width/count), 625))
        pixels = tile.load()
        for y in range(tile.height):
            for x in range(tile.width):
                r,g,b,a = pixels[x,y]
                if g > 90 and g > r*1.4 and g > b*1.4:
                    pixels[x,y] = (0,0,0,0)
                elif g > r*1.15 and g > b*1.15 and g > 100:
                    pixels[x,y] = (r,min(g,max(r,b)+12),b,a)
        bounds = tile.getbbox()
        if not bounds: raise ValueError(f'Empty sprite {i}')
        tile = tile.crop(bounds)
        tile.thumbnail((cell[0]-8, cell[1]-12), Image.Resampling.LANCZOS)
        atlas.alpha_composite(tile, (i*cell[0]+(cell[0]-tile.width)//2, (cell[1]-tile.height)//2))
    atlas.save(ROOT / 'dist' / 'assets' / output, quality=92, method=6)

sprites('vehicles-flow.jpg',7,(128,256),'vehicles.webp')
sprites('props-flow.jpg',5,(192,192),'props.webp')
original=Image.open(ROOT/'art-source/terrain-flow.jpg').convert('RGB')
atlas=Image.new('RGB',(1280,256))
for i in range(5):
    x=round((i+.5)*original.width/5)-128
    atlas.paste(original.crop((x,210,x+256,466)),(i*256,0))
atlas.save(ROOT/'dist/assets/terrain.jpg',quality=88,optimize=True)
print('Prepared seven vehicles, five props, and five terrain materials.')
