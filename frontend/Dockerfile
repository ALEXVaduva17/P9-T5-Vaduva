FROM node:18-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy application source (overridden by volume mount in dev)
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
