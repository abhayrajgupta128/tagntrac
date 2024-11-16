FROM node:18.12.1

# Create app dir
RUN mkdir -p /app
WORKDIR /app
ADD . /app

# Install dependencies and build
RUN yarn install --pure-lockfile
RUN yarn build

# Install PM2
RUN npm install pm2 -g

# Start server
EXPOSE 4000

# Initialize App using PM2
CMD pm2-runtime ecosystem.config.js
