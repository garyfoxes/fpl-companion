FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm install --workspace apps/api --include-workspace-root=false

COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["npm", "run", "start"]
