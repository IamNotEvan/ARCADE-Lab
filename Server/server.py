from flask import Flask, jsonify, send_file
from flask_socketio import SocketIO, emit
import threading
import time
from datetime import datetime
from flask_cors import CORS  # Import CORS
from drone_control import DroneController
from husky_controller import HuskyController
import atexit


app = Flask(__name__)
CORS(app)  # Enable CORS on the app
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize the DroneController
drone_controller = DroneController(socketio=socketio)

# # Initialize HuskyController
# husky_controller = HuskyController()

# Ensure HuskyController and DroneController cleanup is called on app exit
atexit.register(drone_controller.cleanup)
# atexit.register(husky_controller.cleanup)


@app.route('/')
def home():
    return 'Server is running!'


@app.route('/connect_drone', methods=['POST'])
def connect():
    try:
        drone_controller.connect_drone()
        threading.Thread(target=battery_level_emitter, daemon=True).start()
        return jsonify({"success": True, "message": "Drone connected successfully"}), 200
    except Exception as e:
        print("NOOO")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/take_snapshot', methods=['GET'])
def take_snapshot():
    try:
        filepath = drone_controller.take_snapshot()
        if filepath:
            return jsonify({"success": True, "message": f"Snapshot saved to {filepath}"})
        else:
            return jsonify({"success": False, "message": "Failed to take snapshot."}), 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/start_collecting', methods=['POST'])
def start_collecting():
    try:
        drone_controller.start_collecting_surface_data()
        return jsonify({"message": "Data collection started."}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route('/stop_collecting', methods=['POST'])
def stop_collecting():
    try:
        # Stop the data collection process
        drone_controller.stop_collecting_surface_data()
        
        # Retrieve the collected data
        collected_data = drone_controller.get_collected_surface_data()
        
        # Return the collected data to the frontend
        return jsonify({"message": "Data collection stopped.", "data": collected_data}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    
@app.route('/start_recording', methods=['POST'])
def start_recording():
    try:
        # Check if already recording to avoid overwriting/starting a new recording accidentally
        if not drone_controller.recording:
            drone_controller.toggle_recording()
            return jsonify({"message": "Recording started."}), 200
        else:
            return jsonify({"message": "Already recording."}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    try:
        # Check if it's recording before trying to stop
        if drone_controller.recording:
            drone_controller.toggle_recording()
            return jsonify({"message": "Recording stopped."}), 200
        else:
            return jsonify({"message": "Not currently recording."}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/change_camera_direction', methods=['POST'])
def change_camera_direction():
    try:
        drone_controller.set_camera_direction()
        return jsonify({"message": "Camera direction changed successfully."}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    
@app.route('/takeoff_land', methods=['POST'])
def takeoff_land():
    try:
        drone_controller.takeoff_land()
        return jsonify({"message": "Successfully executed takeoff/land command."}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


##############################################################################################################################################
def battery_level_emitter():
    while True:
        if drone_controller.is_connected:  # Check if drone is connected
            battery_level = drone_controller.get_battery_level()
            socketio.emit('battery_update', {'battery_level': battery_level})
        else:
            print("Drone not connected, waiting to emit battery level...")
        time.sleep(5)

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Start the battery level emitter in a background thread upon client connection
    # threading.Thread(target=battery_level_emitter).start()

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')
##############################################################################################################################################

@socketio.on('drone_command')
def handle_drone_command(message):
    command = message['command']
    try:
        # Process the command through the DroneController
        drone_controller.handle_command(command)
        emit('command_response', {'status': 'success', 'command': command})
    except Exception as e:
        emit('command_response', {'status': 'error', 'message': str(e)})

@socketio.on('start_stream')
def start_stream():
    # Start video streaming in a background thread to avoid blocking
    threading.Thread(target=drone_controller.start_video_stream).start()
    emit('stream_response', {'status': 'streaming started'})

@socketio.on('stop_stream')
def stop_stream():
    # Signal to stop the streaming loop
    drone_controller.stream_on = False
    emit('stream_response', {'status': 'streaming stopped'})

@app.route('/toggle_recording', methods=['POST'])
def toggle_recording():
    try:
        # Toggle the recording state
        was_recording = drone_controller.recording
        drone_controller.toggle_recording()
        now_recording = drone_controller.recording
        
        # Determine the action taken based on the recording state change
        action_taken = "started" if not was_recording and now_recording else "stopped" if was_recording and not now_recording else "unchanged"
        
        if action_taken == "started":
            message = "Recording started."
        elif action_taken == "stopped":
            message = "Recording stopped."
        else:
            message = "Recording state unchanged."

        # Optionally, include more details in the response, such as file path for new recordings
        return jsonify({"success": True, "action": action_taken, "message": message}), 200
    except Exception as e:
        # Handle any exceptions that occur during the toggle operation
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/enable_mission_pads', methods=['POST'])
def enable_mission_pads():
    try:
        drone_controller.detect_mission_pads()
        return jsonify({"success": True, "message": "Mission pad detection enabled successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/navigate_to_mission_pad', methods=['POST'])
def navigate_to_mission_pad():
    try:
        drone_controller.navigate_to_mission_pad()
        return jsonify({"success": True, "message": "Navigating to mission pad."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/get_mission_pad_data', methods=['GET'])
def get_mission_pad_data():
    try:
        pad_id, dist_x, dist_y, dist_z = drone_controller.get_mission_pad_data()
        if pad_id == -1:
            return jsonify({"success": True, "message": "No mission pad detected.", "data": None}), 200
        else:
            data = {
                "pad_id": pad_id,
                "dist_x": dist_x,
                "dist_y": dist_y,
                "dist_z": dist_z
            }
            return jsonify({"success": True, "message": "Mission pad data retrieved successfully.", "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

###################################################################################################################################################

# @app.route('/husky/move_forward', methods=['POST'])
# def husky_move_forward():
#     try:
#         husky_controller.move_forward()
#         return jsonify({"success": True, "message": "Husky moving forward"}), 200
#     except Exception as e:
#         return jsonify({"success": False, "message": str(e)}), 500

# @app.route('/husky/move_backward', methods=['POST'])
# def husky_move_backward():
#     try:
#         husky_controller.move_backward()
#         return jsonify({"success": True, "message": "Husky moving backward"}), 200
#     except Exception as e:
#         return jsonify({"success": False, "message": str(e)}), 500

# @app.route('/husky/stop', methods=['POST'])
# def husky_stop():
#     try:
#         husky_controller.stop()
#         return jsonify({"success": True, "message": "Husky stopped"}), 200
#     except Exception as e:
#         return jsonify({"success": False, "message": str(e)}), 500

# @app.route('/husky/turn_left', methods=['POST'])
# def husky_turn_left():
#     try:
#         husky_controller.turn_left()
#         return jsonify({"success": True, "message": "Husky turning left"}), 200
#     except Exception as e:
#         return jsonify({"success": False, "message": str(e)}), 500

# @app.route('/husky/turn_right', methods=['POST'])
# def husky_turn_right():
#     try:
#         husky_controller.turn_right()
#         return jsonify({"success": True, "message": "Husky turning right"}), 200
#     except Exception as e:
#         return jsonify({"success": False, "message": str(e)}), 500

###################################################################################################################################################

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
