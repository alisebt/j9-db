# Use official Node.js runtime as a parent image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose ports for the API and Vite dev server
EXPOSE 3000 5173

# Default command (can be overridden in docker-compose for the client)
CMD ["npm", "run", "server"]
