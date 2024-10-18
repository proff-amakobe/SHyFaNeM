# SHyFaNeM: Simplified Hyperledger Fabric Network Management

SHyFaNeM is a web-based application designed to simplify the process of creating and managing Hyperledger Fabric networks. It provides an intuitive user interface for deploying Fabric networks, deploying chaincode, and visualizing the health and status of the network in real-time.

## Features
- **Network Creation**: Easily create a Hyperledger Fabric network by specifying network parameters such as peers, orderers, and channels through a user-friendly interface.
- **Chaincode Deployment**: Deploy and manage smart contracts (chaincode) with simple uploads or repository links.
- **Network Health Monitoring**: Real-time visualization of the network's health using Prometheus and Grafana. Monitor peer statuses, block generation rates, and other important metrics.
- **User Authentication**: Role-based access control to manage permissions for network creation, chaincode deployment, and health monitoring.
- **CI/CD for Chaincode**: Automate the deployment of chaincode through continuous integration and continuous deployment pipelines.

## Project Structure

- **Frontend**: Built with React.js, providing a responsive and interactive UI.
- **Backend**: Node.js with the Hyperledger Fabric SDK for managing network operations and deploying chaincode.
- **Monitoring**: Integrated with Prometheus and Grafana for network health visualization.
- **Database**: MongoDB/PostgreSQL for storing user and network configurations.

## Installation

### Prerequisites
Before running this project, make sure you have the following installed:
- Docker and Docker Compose
- Node.js and npm
- Hyperledger Fabric binaries
- MongoDB/PostgreSQL

### Clone the Repository
```bash
git clone https://github.com/your-username/SHyFaNeM.git
cd SHyFaNeM
