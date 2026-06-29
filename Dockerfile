# Use official Node base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY . .

# Set build mode and compile the frontend using the Node server preset
ENV NITRO_PRESET=node-server
RUN npm run build

# Expose the server port
EXPOSE 3000

# Start the frontend SSR server
CMD ["node", ".output/server/index.mjs"]
