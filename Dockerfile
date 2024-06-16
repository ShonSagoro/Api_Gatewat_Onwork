FROM node:latest

WORKDIR /usr/app

COPY package*.json ./
COPY src ./src
COPY .env ./

RUN npm install
RUN npm install express
RUN npm install -g ts-node-dev

EXPOSE 3000

CMD [ "npm", "run", "dev" ]