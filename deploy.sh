#!/bin/bash
set -e
# Enterprise AWS EC2 Deployment Script

echo "Starting AbKharido AWS Deployment..."

# 1. Ensure Docker and Docker Compose are installed
if ! command -v docker &> /dev/null
then
    echo "Docker could not be found, installing..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "Docker installed successfully."
fi

# 2. Rebuild and restart the containers
echo "Building and starting Docker containers in detached mode..."
# Using docker compose plugin syntax (docker compose) rather than docker-compose (old)
sudo docker compose down
echo "Cleaning up old Docker build cache and images (preserving database volumes)..."
sudo docker system prune -af
sudo docker builder prune -af
echo "Building backend..."
sudo docker compose build backend
echo "Building frontend..."
sudo docker compose build frontend
echo "Starting services..."
sudo docker compose up -d

echo "Deployment Successful!"
echo "Your application should now be running on port 80 (HTTP)."
echo "Ensure your AWS EC2 Security Group has Port 80 (HTTP) open."
