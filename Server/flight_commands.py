"""
-Adapted From-
Title: flydo - commands.py
Author: Charles Yuan
Date: 1-4-22
Code Version: N/A
Availability: https://github.com/Chubbyman2/flydo
"""

'''
This Code was obtained from Jacob Pitsenberger on Github:
# https://github.com/Jacob-Pitsenberger/Search-and-Rescue-Drone/blob/master/button_control_camera_direction.py
'''

import threading
import time


def fly(direction, drone):
    """

    Send RC control via four channels:

           left_right_velocity (left/right),
           forward_backward_velocity (forward/backward)
           up_down_velocity (up/down)
           yaw_velocity (yaw)

           drone.send_rc_control(left/right, forward/backward, up/down, yaw left/right)

    """

    drone.send_rc_control(direction[0], direction[1], direction[2], direction[3])
    time.sleep(0.05)


def start_flying(direction, drone, speed):
    """Have the drone fly in a certain direction at a certain speed"""
    # todo: change to support multiple flight commands
    
    if direction == "upward":
        print("Moving up")
        drone.ud = speed
    elif direction == "downward":
        drone.ud = -speed
        print("Moving down")

    if direction == "forward":
        drone.fb = speed
        print("Moving forward")
    elif direction == "backward":
        drone.fb = -speed
        print("Moving backward")
    
    if direction == "yaw_left":
        drone.yv = -speed
        print("turning left")
    elif direction == "yaw_right":
        drone.yv = speed
        print("turning right")
    
    if direction == "left":
        drone.lr = -speed
        print("Moving left")
    elif direction == "right":
        drone.lr = speed
        print("Moving right")

    if [drone.lr, drone.fb, drone.ud, drone.yv] != [0, 0, 0, 0]:
        threading.Thread(target=lambda: fly([drone.lr, drone.fb, drone.ud, drone.yv], drone)).start()


def stop_flying(drone):
    """When user releases a movement key the drone stops performing that movement"""
    drone.lr, drone.fb, drone.ud, drone.yv = 0, 0, 0, 0
    drone.send_rc_control(drone.lr, drone.fb, drone.ud, drone.yv)
    # todo: change to support multiple flight commands

