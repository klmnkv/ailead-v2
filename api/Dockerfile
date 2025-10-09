FROM node:18-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники
COPY src ./src

# Компилируем TypeScript
RUN npm run build

# Создаем директорию для логов
RUN mkdir -p logs

# Запускаем
CMD ["node", "dist/index.js"]