FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY web ./web
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
USER node
CMD ["node", "web/server.js"]
