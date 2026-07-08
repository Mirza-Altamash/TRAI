# Use official Node base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (including devDependencies for compilation)
RUN npm ci

# Copy backend source code
COPY . .

# Build TypeScript to Javascript (dist/)
RUN npm run build

# Remove development dependencies to keep the image slim
RUN npm prune --production

# Expose the API server port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
