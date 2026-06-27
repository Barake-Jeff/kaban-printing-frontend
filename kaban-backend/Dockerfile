# ---- Stage 1: Build ----
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# ---- Stage 2: Production image ----
FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev && \
    mkdir -p /app/uploads/originals /app/uploads/pdfs && \
    chown -R node:node /app

COPY --from=builder --chown=node:node /app/dist ./dist

USER node

EXPOSE 3001

CMD ["node", "dist/main"]
