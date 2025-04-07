FROM node:18.19.1-alpine3.18

WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install --production
COPY . .

ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]
