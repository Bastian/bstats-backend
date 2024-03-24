FROM node:16 as builder

WORKDIR /app

COPY . .

# Install app dependencies and build application
RUN npm install
RUN npm run build

FROM oven/bun:1

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "dist/main.js" ]

