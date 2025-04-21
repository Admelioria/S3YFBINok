import cv2
import time

def test_camera_indices(max_index=10):
    """
    Test camera indices from 0 to max_index-1 and show which ones work.
    
    Args:
        max_index (int): Maximum camera index to test
    """
    print("Testing camera indices...")
    
    working_cameras = []
    
    for index in range(max_index):
        cap = cv2.VideoCapture(index)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                print(f"Camera index {index} is working!")
                working_cameras.append(index)
                
                # Show a frame from this camera
                window_name = f"Camera {index}"
                cv2.imshow(window_name, frame)
                cv2.waitKey(1000)  # Display for 1 second
                cv2.destroyWindow(window_name)
            else:
                print(f"Camera index {index} opened but couldn't read frame.")
            cap.release()
        else:
            print(f"Camera index {index} failed to open.")
    
    if working_cameras:
        print(f"\nWorking camera indices: {working_cameras}")
        
        # Demonstrate the first working camera
        if working_cameras:
            primary_index = working_cameras[0]
            print(f"\nShowing video from camera {primary_index}. Press 'q' to quit.")
            
            cap = cv2.VideoCapture(primary_index)
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                cv2.imshow(f"Camera {primary_index} Live", frame)
                
                # Break loop on 'q' press
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            
            cap.release()
            cv2.destroyAllWindows()
    else:
        print("\nNo working cameras found.")

if __name__ == "__main__":
    test_camera_indices()
    print("Camera test complete.")