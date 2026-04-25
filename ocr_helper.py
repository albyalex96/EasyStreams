import sys
import base64
import ddddocr
import io

# Set encoding for Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def solve_ocr(base64_image):
    try:
        # Remove header if present
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]
            
        ocr = ddddocr.DdddOcr(show_ad=False)
        image_data = base64.b64decode(base64_image)
        res = ocr.classification(image_data)
        return res
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(solve_ocr(sys.argv[1]))
    else:
        # Read from stdin if no arg
        img_b64 = sys.stdin.read().strip()
        if img_b64:
            print(solve_ocr(img_b64))
