# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the React app
RUN npm run build

# Install a simple server to serve the React app
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 3000

# Serve the built app
CMD ["serve", "-s", "dist", "-l", "3000"]