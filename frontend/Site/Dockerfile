# Use an official Node.js runtime as a parent image
FROM node:16-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Define the command to start the app
CMD ["node", "server.js"]
