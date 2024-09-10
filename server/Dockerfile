# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR ./

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application to the container
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run your app
CMD ["npm", "run", "dev"]
