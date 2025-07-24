cd "c:\Users\frsma\Desktop\Stage\Application\Frontend\maintenance-frontend"

# Install dependencies if needed
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Start the application
Write-Host "Starting the Angular application..."
npm start
