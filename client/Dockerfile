FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Add this line to pass environment variables to the React app at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
