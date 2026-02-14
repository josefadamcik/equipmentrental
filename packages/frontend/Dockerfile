# ==================================
# Stage 1: Build - Compile React app
# ==================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
# Using npm install because package-lock.json is at monorepo root
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ==================================
# Stage 2: Production - Serve with nginx
# ==================================
FROM nginx:alpine AS production

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# nginx runs as daemon by default; override to keep in foreground
CMD ["nginx", "-g", "daemon off;"]
