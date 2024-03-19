ARG NODE_VERSION=20.8.0
ARG PORT=3000

FROM node:${NODE_VERSION}-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE ${PORT}

CMD npx prisma generate && npx prisma migrate dev --name init && npm run start
