## Setup Instructions

### 1. Create Project Directory

Create a directory to contain both the frontend and backend applications:  
`mkdir <your-preferred-directory-name>`


### 2. Clone Repositories
Navigate to the newly created directory and clone the frontend and backend repositories:

`cd your-created-directory`  
`git clone https://github.com/yloading/movies-app-frontend.git`  
`git clone https://github.com/yloading/movies-app-backend.git`  

Your directory structure should look like this:

your-created-directory  
│  
├── movies-app-backend  
└── movies-app-frontend  

#### NOTE: You can verify that no JSON file has been created yet in `movies-app-backend/src/data`. The scraping process will occur during the docker execution process, at which point a `movies.json` file will be generated.

### 3. Install Docker
Download and install Docker for your operating system from [Docker's official website.](https://www.docker.com/)

After installation, verify that Docker is running correctly by opening a terminal and running:  
`docker --version`  
`docker-compose --version`  

### 4. Obtain Host Machine IP Address
To access the application, you need your host machine's IP address.  
For macOS:  
 - Open a terminal and run: `ifconfig`  
 - Look for the section that starts with en0 or en1 (depending on whether you're using Wi-Fi or Ethernet). The IP address is listed under inet.

For Windows:  
  - Open Command Prompt and run: `ipconfig`  
  - Locate the section under your active network adapter (e.g., "Ethernet adapter" or "Wireless LAN adapter"). The IP address is listed as "IPv4 Address" or "IPv4".

### 5. Start Docker Containers
Navigate to the backend directory and start the Docker containers:  
`cd movies-app-backend`  
`docker compose up`  

### 6. Access the Application
Open your preferred web browser and navigate to the application using the following URL format:  
`http://<host.machine.ip.address>:5173`

Please be aware that data scraping occurs during the Docker Compose process. If you need to execute it manually, ensure you have Node.js version 20.17.0 installed and run the command `npm run scrape`.