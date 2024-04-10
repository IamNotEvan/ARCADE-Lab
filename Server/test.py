import requests

# The URL for the API endpoint
url = "http://localhost:5000/husky/move_backward"

# Make a POST request to the URL
response = requests.post(url)

# Print the response from the server
print(response.json())