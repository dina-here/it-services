# Web-devcontainer (för docker-compose lokalt)
FROM node:20-alpine
WORKDIR /app

# Copy entire monorepo structure
COPY package*.json ./
COPY packages ./packages
COPY apps ./apps

# Install all workspace dependencies (including shared packages)
RUN npm install

EXPOSE 5173
CMD ["npm", "run", "dev", "-w", "apps/web", "--", "--host", "0.0.0.0"]
