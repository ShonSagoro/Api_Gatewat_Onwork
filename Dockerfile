FROM node:20

WORKDIR /app

COPY package*.json ./
COPY src ./src
COPY .env ./
COPY . .

RUN npm install
RUN npm install -g ts-node-dev

EXPOSE 3000

CMD ["npm", "run", "dev"]
