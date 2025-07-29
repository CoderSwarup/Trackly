# Use a specific node version instead of latest for stability
FROM node:20-slim

# Switch to root temporarily to set up directories
USER root

# Create and set working directory
WORKDIR /usr/src/app

# Create public directories with proper permissions
RUN mkdir -p /usr/src/app/public/temp && \
    chown -R node:node /usr/src/app && \
    chmod -R 777 /usr/src/app/public/temp

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    chown -R node:node /usr/src/app/node_modules

# Copy application code
COPY . .
RUN chown -R node:node /usr/src/app

# Switch back to node user for security
USER node

# Expose the port
EXPOSE 5000

# Set NODE_ENV
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/index.js"]