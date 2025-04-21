from ultralytics import YOLO
import cv2
import os

# Print current working directory to help with path issues
print(f"Current working directory: {os.getcwd()}")

# Load the model - test if it exists and can be loaded
try:
    model_path = "src/backend/best.pt"
    print(f"Attempting to load model from: {model_path}")
    if os.path.exists(model_path):
        print(f"Model file exists: {model_path}")
    else:
        print(f"Model file does not exist: {model_path}")
        # Try to list files in the directory
        parent_dir = os.path.dirname(model_path)
        if os.path.exists(parent_dir):
            print(f"Files in {parent_dir}: {os.listdir(parent_dir)}")
        else:
            print(f"Directory does not exist: {parent_dir}")
    
    model = YOLO(model_path)
    print("Model loaded successfully!")
    print(f"Model type: {type(model)}")
    print(f"Available classes: {model.names}")
    
    # Test with a sample image
    # Replace with path to a test image
    test_image = "path/to/test_image.jpg"
    if os.path.exists(test_image):
        print(f"Test image exists: {test_image}")
        
        # Run prediction
        results = model.predict(test_image, conf=0.25, device="cpu")
        print(f"Prediction results: {len(results)} objects returned")
        print(f"Detected objects: {len(results[0].boxes)} boxes")
        
        # Show classes and confidence
        if len(results[0].boxes) > 0:
            boxes = results[0].boxes
            for i, box in enumerate(boxes):
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                confidence = float(box.conf[0])
                print(f"Object {i+1}: {class_name} (confidence: {confidence:.2f})")
                
        # Visualize detections
        img = cv2.imread(test_image)
        annotated_img = results[0].plot()
        cv2.imwrite("test_detection_result.jpg", annotated_img)
        print("Detection visualization saved to 'test_detection_result.jpg'")
    else:
        print(f"Test image does not exist: {test_image}")
        
    # Test with webcam (if available)
    print("\nAttempting to test with webcam...")
    try:
        cam = cv2.VideoCapture(1)  # Try camera index 0
        if cam.isOpened():
            print("Camera opened successfully")
            ret, frame = cam.read()
            if ret:
                print(f"Frame captured: shape={frame.shape}")
                
                # Run prediction on camera frame
                results = model.predict(frame, conf=0.25, device="cpu")
                print(f"Webcam detection results: {len(results[0].boxes)} boxes")
                
                # Show classes detected in webcam frame
                if len(results[0].boxes) > 0:
                    boxes = results[0].boxes
                    for i, box in enumerate(boxes):
                        class_id = int(box.cls[0])
                        class_name = model.names[class_id]
                        confidence = float(box.conf[0])
                        print(f"Webcam object {i+1}: {class_name} (confidence: {confidence:.2f})")
                
                # Save annotated frame
                annotated_frame = results[0].plot()
                cv2.imwrite("webcam_test_result.jpg", annotated_frame)
                print("Webcam detection visualization saved to 'webcam_test_result.jpg'")
            else:
                print("Failed to capture frame from camera")
            cam.release()
        else:
            print("Failed to open camera")
    except Exception as e:
        print(f"Error testing webcam: {e}")
        
except Exception as e:
    print(f"Error loading or using model: {e}")