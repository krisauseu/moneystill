# Build stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build arguments for Vite
ARG VITE_POCKETBASE_URL
ARG VITE_API_URL

# Make them available as environment variables during build
ENV VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL
ENV VITE_API_URL=$VITE_API_URL

# Debug: Print env vars (will be visible in build logs)
RUN echo "Vite Build Vars: PB_URL=$VITE_POCKETBASE_URL..."


RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
