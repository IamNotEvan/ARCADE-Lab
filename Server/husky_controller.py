import paramiko
from paramiko.ssh_exception import NoValidConnectionsError, AuthenticationException, SSHException
import time
import socket

import paramiko.ssh_exception

class HuskyController:
    def __init__(self):
        self.ssh = paramiko.SSHClient()
        self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        self.ssh.connect('192.168.1.8', username='administrator', password='clearpath', timeout=10)
        self.shell = self.ssh.invoke_shell()
        self.buff_size = 1024 # Buffer size for receiving output

    # Stop all  motion
    def stop(self):
        command = '\x03'
        self.execute_ssh_command(command)

    # Move forward at 0.5m/s
    def move_forward(self):
        command = "source /opt/ros/melodic/setup.bash && rostopic pub /cmd_vel geometry_msgs/Twist '{linear: {x: 0.5, y: 0, z: 0}, angular: {x: 0, y: 0, z: 0}}' -r 10"
        self.execute_ssh_command(command)

    # Move backward at 0.5m/s
    def move_backward(self):
        command = "source /opt/ros/melodic/setup.bash && rostopic pub /cmd_vel geometry_msgs/Twist '{linear: {x: -0.5, y: 0, z: 0}, angular: {x: 0, y: 0, z: 0}}' -r 10"
        self.execute_ssh_command(command)

    # Turn left (i.e., counter-clockwise) at 0.5 rad/s
    def turn_left(self):
        command = "source /opt/ros/melodic/setup.bash && rostopic pub /cmd_vel geometry_msgs/Twist '{linear: {x: 0, y: 0, z: 0}, angular: {x: 0, y: 0, z: 0.5}}' -r 10"
        self.execute_ssh_command(command)

    # Turn right (i.e., clockwise) at 0.5 rad/s
    def turn_right(self):
        command = "source /opt/ros/melodic/setup.bash && rostopic pub /cmd_vel geometry_msgs/Twist '{linear: {x: 0, y: 0, z: 0}, angular: {x: 0, y: 0, z: -0.5}}' -r 10"
        self.execute_ssh_command(command)

    # Execute the specified command in the established interactive shell 
    def execute_ssh_command(self, command):
        try:
            self.shell.send(command + '\n')
            time.sleep(0.5) # Give time for the command to send
            # Receive the output
            output = self.shell.recv(self.buff_size).decode('utf-8')

            print("Output: ", output)
        # Handle exceptions
        except NoValidConnectionsError:
            print("SSH port not reachable")
        except socket.gaierror:
            print("Check hostname")
        except AuthenticationException:
            print("Authentication failed; check credentials")
        except SSHException as e:
            print("Paramiko Error: ", e)
        except Exception as e:
            print("Exception occurred: ", e)
    
    def cleanup(self):
        """Clean up the resources by closing the SSH connection."""
        if self.shell:
            self.shell.close()
        if self.ssh:
            self.ssh.close()
        print("SSH connection to Husky closed.")

# Below is for testing purposes
if __name__ == '__main__':
    husky = HuskyController()
    husky.move_backward()
    time.sleep(2)
    husky.stop()