# Use the official Node.js image as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 8080 to Cloud Run
EXPOSE 8080

# Run the Node.js application
CMD ["node", "server.js"]
