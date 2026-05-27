FROM node:22-alpine

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY build ./build

USER app
EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "build/index.js"]
