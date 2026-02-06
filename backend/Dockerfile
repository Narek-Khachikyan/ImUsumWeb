FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN npm run build

RUN mkdir -p uploads

EXPOSE 8000

CMD ["npm", "run", "start"]
