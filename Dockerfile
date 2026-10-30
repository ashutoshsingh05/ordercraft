# ======================================================
# Stage 1: Build Angular Frontend
# ======================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ======================================================
# Stage 2: Build Spring Boot Backend with Static Assets
# ======================================================
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /build

COPY backend/pom.xml ./backend/
COPY backend/src ./backend/src

# Copy compiled Angular assets into Spring Boot static resources
COPY --from=frontend-builder /build/frontend/dist/frontend/browser ./backend/src/main/resources/static

RUN mvn -f backend/pom.xml clean package -DskipTests

# ======================================================
# Stage 3: Production Runtime Container
# ======================================================
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=backend-builder /build/backend/target/*.jar /app/ordercraft.jar

ENV PORT=8081
EXPOSE 8081

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/ordercraft.jar"]
