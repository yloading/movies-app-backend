FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
RUN npm run scrape

EXPOSE 8001

CMD npm run dev
