# import openCV for receiving the video frames
import cv2
# Import the tello module
from djitellopy import tello
# Import threading for our takeoff/land method
import threading
# import our flight commands
from flight_commands import start_flying, stop_flying
import time
# For video saving functionality
from datetime import datetime
import os
import base64



# Class for controlling the drone via keyboard commands
class DroneController:

    #####################################################################################################################################
    def __init__(self, socketio=None):
        self.drone = tello.Tello()
        self.surface_data = []
        self.recording = False
        self.camera_down = False
        self.frame = None
        self.video_writer = None
        self.socketio = socketio
        self.is_connected = False  # Add this line
    #####################################################################################################################################

    #####################################################################################################################################
    def toggle_recording(self):
        if self.recording:
            # Stop recording
            self.recording = False
            if self.video_writer is not None:
                self.video_writer.release()
                self.video_writer = None
            print("Recording stopped.")
        else:
            # Start recording
            self.recording = True
            filename = datetime.now().strftime("%d-%m-%Y_%H-%M-%S") + ".avi"
            filepath = os.path.join("C:\\Users\\evanl\\OneDrive\\Desktop\\ARCADE Lab\\Video", filename)
            resolution = self.get_video_resolution()
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            self.video_writer = cv2.VideoWriter(filepath, fourcc, 30.0, resolution)
            print("Recording started, saving to {filepath}.")
    #####################################################################################################################################

    #####################################################################################################################################
    def connect_drone(self):
        # Move the connection logic here
        self.drone.connect()
        self.is_connected = True
        print(f"Connected to drone. Battery level: {self.drone.get_battery()}%")
        self.drone.streamon()
        self.frame = self.drone.get_frame_read()
        self.drone.speed = 50
        self.drone.ud = 0
        self.drone.fb = 0
        self.drone.yv = 0
        self.drone.lr = 0
    #####################################################################################################################################


    #####################################################################################################################################
    def take_snapshot(self):
        filename = datetime.now().strftime("%Y-%m-%d_%H-%M-%S") + ".jpg"
        filepath = os.path.join("C:\\Users\\evanl\\OneDrive\\Desktop\\ARCADE Lab\\Image", filename)  # Adjust the path as necessary
        frame = self.drone.get_frame_read().frame
        cv2.imwrite(filepath, frame)
        print(f"Snapshot saved to {filepath}")
        return filepath
    #####################################################################################################################################


    #####################################################################################################################################
    def collect_surface_level_data(self):
        while self.collecting_data:
            distance = self.drone.get_distance_tof()
            timestamp = datetime.now()
            self.surface_data.append((timestamp, distance))
            time.sleep(1)  # Sleep for 1 second before the next collection

    def start_collecting_surface_data(self):
        def wrapper():
            self.collect_surface_level_data()
        self.collecting_data = True
        data_collection_thread = threading.Thread(target=wrapper)
        data_collection_thread.start()

    
    def stop_collecting_surface_data(self):
        # This method stops the data collection
        self.collecting_data = False

    def get_collected_surface_data(self):
        # Check if surface data has been collected
        if hasattr(self, 'surface_data') and self.surface_data:
            return self.surface_data
        else:
            print("No surface data has been collected yet.")
            return []
    #####################################################################################################################################

    
    #####################################################################################################################################
    def get_video_resolution(self):
        # Assuming the full resolution for the front camera and a cropped resolution for the bottom camera
        if self.camera_down:
            return (320, 240)  # Adjust based on your cropping for the bottom camera
        else:
            return (720, 480)  # Full resolution for the front camera
    #####################################################################################################################################

    #####################################################################################################################################
    # This is for recording a video
    def toggle_recording(self):
        if self.recording:
            # Stop recording
            self.recording = False
            if self.video_writer is not None:
                self.video_writer.release()
                self.video_writer = None
            print("Recording stopped.")
        else:
            # Start recording
            self.recording = True
            filename = datetime.now().strftime("%d-%m-%Y_%H-%M-%S") + ".avi"
            filepath = os.path.join("C:\\Users\\evanl\\OneDrive\\Desktop\\ARCADE Lab\\Video", filename)
            resolution = self.get_video_resolution()
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            self.video_writer = cv2.VideoWriter(filepath, fourcc, 30.0, resolution)
            print(f"Recording started, saving to {filepath}.")
    #####################################################################################################################################


    #####################################################################################################################################
    def get_battery_level(self):
        return self.drone.get_battery()
    #####################################################################################################################################


    #####################################################################################################################################
    # Define a method for setting the camera direction
    def set_camera_direction(self):
        wasRecording = False
        if self.recording:
            # Stop recording if it was active
            self.toggle_recording()
            wasRecording = True
        if self.camera_down:
            self.camera_down = False
            self.drone.set_video_direction(self.drone.CAMERA_FORWARD)
        else:
            self.camera_down = True
            self.drone.set_video_direction(self.drone.CAMERA_DOWNWARD)
        if wasRecording:
            # Restart recording with the new camera direction
            self.toggle_recording()
    #####################################################################################################################################          


    #####################################################################################################################################
    # Define a method for taking off and landing
    def takeoff_land(self):
        if self.drone.is_flying:
        # If the drone is flying, we want to land it.
            def land_and_update_state():
                self.drone.land()
                self.drone.is_flying = False  # Set is_flying to False after landing.
            
            threading.Thread(target=land_and_update_state).start()
        
        else:
            # If the drone is not flying, we want to take off.
            def takeoff_and_update_state():
                self.drone.takeoff()
                self.drone.is_flying = True  # Set is_flying to True after takeoff.
            
            threading.Thread(target=takeoff_and_update_state).start()
    #####################################################################################################################################


    #####################################################################################################################################
    # Method to run the application
    def handle_command(self, command):
        print("THis is command" + command)
        try:
            # Directly call the appropriate flight or stop commands based on the input command
            if command == 'w':
                start_flying('upward', self.drone, self.drone.speed)
            elif command == 'release-w':
                stop_flying(self.drone)

            elif command == 'a':
                start_flying('yaw_left', self.drone, self.drone.speed)
            elif command == 'release-a':
                stop_flying(self.drone)

            elif command == 's':
                start_flying('downward', self.drone, self.drone.speed)
            elif command == 'release-s':
                stop_flying(self.drone)

            elif command == 'd':
                start_flying('yaw_right', self.drone, self.drone.speed)
            elif command == 'release-d':
                stop_flying(self.drone)

            elif command == 'Up':
                start_flying('forward', self.drone, self.drone.speed)
            elif command == 'release-Up':
                stop_flying(self.drone)

            elif command == 'Down':
                start_flying('backward', self.drone, self.drone.speed)
            elif command == 'release-Down':
                stop_flying(self.drone)

            elif command == 'Left':
                start_flying('left', self.drone, self.drone.speed)
            elif command == 'release-Left':
                stop_flying(self.drone)

            elif command == 'Right':
                start_flying('right', self.drone, self.drone.speed)
            elif command == 'release-Right':
                stop_flying(self.drone)
        
        except Exception as e:
            print(f"Error processing the command: {e}")
        finally:
            # Ensure to clean up any resources or reset states as needed
            self.cleanup()
    #####################################################################################################################################


    #####################################################################################################################################
    # Method to display video stream
    def start_video_stream(self):
        """Starts sending video frames to clients."""
        self.stream_on = True
        self.drone.streamon()  # Ensure the drone's video stream is on
        while self.stream_on:
            frame = self.drone.get_frame_read().frame
            frame = cv2.resize(frame, (720, 480))  # Example resize, adjust as needed
            
            # Optionally adjust the frame based on camera direction
            if self.camera_down:
                frame = frame[:240, :320]

            # Encode frame for web transmission
            _, buffer = cv2.imencode('.jpg', frame)
            frame_encoded = base64.b64encode(buffer).decode('utf-8')

            # Emit the frame to all connected clients
            self.socketio.emit('video_frame', {'image': frame_encoded})

            # Sleep briefly to control framerate
            time.sleep(1 / 30)  # Adjust framerate as needed
    #####################################################################################################################################
        

    #####################################################################################################################################
    # Method for cleaning up resources
    def cleanup(self) -> None:
        # Release any resources
        print("Cleaning up resources...")

         # If recording, stop and release the video writer
        if self.recording:
            print("Stopping recording and releasing resources...")
            self.video_writer.release()
            self.recording = False  # Ensure recording flag is reset

            #################### STEP 5 #######################
            # Ensure to set the camera direction back to forward if not.
            if self.camera_down:
                self.drone.set_video_direction(self.drone.CAMERA_FORWARD)
            ###################################################
            self.drone.end()
            print("Application closed successfully.")
    #####################################################################################################################################


    #####################################################################################################################################
    def detect_mission_pads(self):
        # Enable mission pad detection
        self.drone.enable_mission_pads()

        # Set mission pad detection direction to both (0 for all directions)
        self.drone.set_mission_pad_detection_direction(2)
        print("Mission Pad detection Started!!!!!!!!!!!")


    def navigate_to_mission_pad(self):
        """
        Navigates the drone towards the detected mission pad by adjusting its position
        based on the X, Y, and Z distances to the mission pad.
        """
        pad_id = self.drone.get_mission_pad_id()
        if pad_id == -1:
            print("No mission pad detected.")
            return

        # Get distances from the mission pad
        dist_x = self.drone.get_mission_pad_distance_x()
        dist_y = self.drone.get_mission_pad_distance_y()
        dist_z = self.drone.get_mission_pad_distance_z()

        # Log the distances for debugging
        print(f"Mission Pad {pad_id}: Distance X: {dist_x} cm, Y: {dist_y} cm, Z: {dist_z} cm")

        # Adjust position to align with the mission pad
        if dist_x > 20:  # Arbitrary threshold for movement
            self.drone.move_left(dist_x)
        elif dist_x < -20:
            self.drone.move_right(abs(dist_x))
        if dist_y > 20:
            self.drone.move_back(dist_y)
        elif dist_y < -20:
            self.drone.move_forward(abs(dist_y))
        # if dist_z > 20:
        #     self.drone.move_down(dist_z)

        self.drone.land()
        
        print(f"Drone is moving to align with Mission Pad {pad_id}.")


    def get_mission_pad_data(self):
        """
        Returns the mission pad ID and the distances (X, Y, Z) from the drone to the mission pad.
        If no mission pad is detected, returns -1 for the ID and None for the distances.

        Returns:
            tuple: A tuple containing the mission pad ID, and distances X, Y, and Z.
        """
        pad_id = self.drone.get_mission_pad_id()
        if pad_id == -1:
            # No mission pad detected
            print("No mission pad detected.")
            return pad_id, None, None, None

        # Get distances from the mission pad
        dist_x = self.drone.get_mission_pad_distance_x()
        dist_y = self.drone.get_mission_pad_distance_y()
        dist_z = self.drone.get_mission_pad_distance_z()

        # Log the distances for debugging
        print(f"Mission Pad {pad_id}: Distance X: {dist_x} cm, Y: {dist_y} cm, Z: {dist_z} cm")

        return pad_id, dist_x, dist_y, dist_z
    #####################################################################################################################################