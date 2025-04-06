FROM node:18

# Install LibreOffice
RUN apt-get update && \
    apt-get install -y libreoffice && \
    apt-get clean

# Setup working dir
WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm install
# Copy rest of the app
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
