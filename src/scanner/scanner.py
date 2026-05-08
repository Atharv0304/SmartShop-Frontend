import cv2
from pyzbar.pyzbar import decode
import requests
import datetime
import numpy as np

API_URL = "https://smartshop-backend-64zl.onrender.com/api/products/scan"

def enhance_image(frame):
    # Convert to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # Increase contrast
    gray = cv2.equalizeHist(gray)
    # Sharpen image
    kernel = np.array([[-1,-1,-1],
                       [-1, 9,-1],
                       [-1,-1,-1]])
    sharpened = cv2.filter2D(gray, -1, kernel)
    # Remove noise
    blurred = cv2.GaussianBlur(sharpened, (3, 3), 0)
    return blurred

def scan_barcode():
    cap = cv2.VideoCapture(0)
    # Increase camera resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    print("Scanner started... Show barcode to camera")
    print("Tips: Good lighting | Hold steady | 15-20cm distance")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Try scanning original frame first
        barcodes = decode(frame)

        # If not found, try enhanced image
        if not barcodes:
            enhanced = enhance_image(frame)
            barcodes = decode(enhanced)

        # If still not found, try resized image
        if not barcodes:
            resized = cv2.resize(frame, None, fx=2, fy=2)
            barcodes = decode(resized)

        for barcode in barcodes:
            barcode_data = barcode.data.decode("utf-8")
            barcode_type = barcode.type
            print(f"✅ Detected! Type: {barcode_type} | Data: {barcode_data}")

            payload = {
                "barcode": barcode_data,
                "type": barcode_type,
                "scannedAt": str(datetime.datetime.now())
            }
            try:
                response = requests.post(API_URL, json=payload)
                print(f"Server: {response.json()}")
            except Exception as e:
                print(f"⚠️ Server not connected yet: {e}")

            # Draw green box
            x, y, w, h = barcode.rect
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 3)
            cv2.putText(frame, barcode_data, (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # Show scan guide box in center
        h, w = frame.shape[:2]
        cx, cy = w//2, h//2
        cv2.rectangle(frame, (cx-150, cy-80), (cx+150, cy+80), (255, 0, 0), 2)
        cv2.putText(frame, "Place barcode here", (cx-100, cy-90),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)

        cv2.imshow("Smart Store Scanner", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    scan_barcode()