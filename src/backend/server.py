from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import cv2
import threading
import time
import base64
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

camera = None
detection_thread = None
thread_running = False

@app.route('/')
def home():
    return jsonify({"message": "YOLO Flask server is running."})

def detect_objects():
    global camera, thread_running
    try:
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            socketio.emit('server_message', {'type': 'error', 'message': 'Failed to open camera'})
            return

        model = YOLO("src/backend/best.pt")
        model.fuse()  # Optional: Speeds up inference
        model.conf = 0.25  # Set global confidence threshold

        while thread_running:
            ret, frame = camera.read()
            if not ret:
                socketio.emit('server_message', {'type': 'error', 'message': 'Failed to read frame'})
                break

            results = model.track(frame, persist=True, device="cpu")[0]
            label = "none"

            if results.boxes is not None and len(results.boxes.cls) > 0:
                cls_id = int(results.boxes.cls[0].item())
                label = model.names.get(cls_id, "none")

            # Send detection label
            socketio.emit('server_message', {'type': 'detection', 'label': label})

            # Send annotated frame
            annotated_frame = results.plot()
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            socketio.emit('server_message', {
                'type': 'frame',
                'image': f'data:image/jpeg;base64,{img_base64}'
            })

            time.sleep(0.1)

    except Exception as e:
        print("Detection error:", str(e))
        socketio.emit('server_message', {'type': 'error', 'message': str(e)})

    finally:
        thread_running = False
        if camera and camera.isOpened():
            camera.release()

@socketio.on('connect')
def handle_connect():
    global thread_running, detection_thread
    print("Client connected.")
    emit('server_message', {'type': 'status', 'message': 'Connected to YOLO Flask server'})

    if not thread_running:
        thread_running = True
        detection_thread = threading.Thread(target=detect_objects)
        detection_thread.start()

@socketio.on('disconnect')
def handle_disconnect():
    global thread_running
    print("Client disconnected.")
    thread_running = False

if __name__ == '__main__':
    socketio.run(app, host='172.20.10.5', port=3000, debug=True, allow_unsafe_werkzeug=True)
