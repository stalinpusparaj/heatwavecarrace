FROM node:22-alpine
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server/ ./
COPY dist/ /app/dist/
ENV HOST=0.0.0.0 PORT=4180 NODE_ENV=production
EXPOSE 4180
USER node
CMD ["node", "index.mjs"]
