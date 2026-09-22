# Stage 1: Build Frontend (React + Vite + Tailwind CSS)
FROM node:22-alpine AS web-build
WORKDIR /src/Corvus.Web
COPY src/Corvus.Web/package*.json ./
RUN npm ci
COPY src/Corvus.Web/ ./
RUN npm run build

# Stage 2: Build Backend (.NET 9 Native AOT)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS api-build
# Install native compilation dependencies for Linux Native AOT
RUN apt-get update && apt-get install -y --no-install-recommends clang zlib1g-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY src/Corvus.Api/Corvus.Api.csproj ./Corvus.Api/
RUN dotnet restore ./Corvus.Api/Corvus.Api.csproj -r linux-x64

COPY src/Corvus.Api/ ./Corvus.Api/
# Copy the compiled frontend directly into wwwroot
COPY --from=web-build /src/Corvus.Api/wwwroot/ ./Corvus.Api/wwwroot/

WORKDIR /src/Corvus.Api
RUN dotnet publish -c Release -r linux-x64 -o /app/publish

# Stage 3: Minimal Distroless/Deps Runtime Container (<30MB RAM target)
FROM mcr.microsoft.com/dotnet/runtime-deps:9.0
WORKDIR /app
COPY --from=api-build /app/publish ./
RUN mkdir -p /data

ENV CORVUS_PORT=8090 \
    CORVUS_DATA_DIR=/data \
    DOCKER_SOCKET=/var/run/docker.sock

EXPOSE 8090
VOLUME ["/data"]

ENTRYPOINT ["./Corvus.Api"]
