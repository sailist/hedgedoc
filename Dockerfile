# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy source code
COPY . .

RUN yarn install --immutable

# Build frontend
RUN yarn build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install Python 3.10, pip and cairo dependencies
RUN apk add --no-cache python3 py3-pip cairo cairo-dev pango-dev

# Copy built assets from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/locales ./locales
COPY --from=builder /app/app.js ./app.js
COPY --from=builder /app/app.json ./app.json
COPY --from=builder /app/config.json ./config.json
COPY --from=builder /app/package.json ./package.json


# Create uploads directory
RUN mkdir -p public/uploads && chmod 700 public/uploads

RUN pip install http://172.28.142.50:8090/api/v4/projects/106/packages/generic/cop-md/v0.8.1/cop_md-0.8.1-py3-none-any.whl -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple --break-system-packages

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["node", "app.js"]
