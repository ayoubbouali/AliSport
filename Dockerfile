# syntax=docker/dockerfile:1

# Gym Manager: one image holding the API and the Angular UI (same layout as build.sh).

# 1. Angular build -> backend/src/main/resources/static (outputPath in angular.json)

FROM node:22-alpine AS front

WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci --no-audit --no-fund

COPY frontend/ ./

RUN npx ng build

# 2. Executable jar (tests are run outside the image: ./mvnw test)

FROM maven:3.9-eclipse-temurin-21 AS back

WORKDIR /build/backend

COPY backend/pom.xml ./

# Optional corporate proxy (--build-arg HTTPS_PROXY=http://host:port): Maven only reads it from settings.xml.

RUN set -e; p="${HTTPS_PROXY:-${https_proxy:-}}"; mkdir -p /root/.m2; \

    if [ -n "$p" ]; then hp="${p#*://}"; hp="${hp%/}"; \

      printf '<settings><proxies><proxy><id>p</id><active>true</active><protocol>https</protocol><host>%s</host><port>%s</port></proxy></proxies></settings>' \

        "${hp%:*}" "${hp##*:}" > /root/.m2/settings.xml; fi; \

    mvn -B -q dependency:go-offline

COPY backend/src ./src

COPY --from=front /build/backend/src/main/resources/static ./src/main/resources/static

RUN mvn -B -q -DskipTests package

# 3. Runtime

FROM eclipse-temurin:21-jre

RUN useradd --system --uid 1001 gym && mkdir /data && chown gym /data

USER gym

WORKDIR /app

COPY --from=back /build/backend/target/gym-manager-1.0.0.jar app.jar

ENV PORT=8090 DATA_DIR=/data

EXPOSE 8090

VOLUME /data

ENTRYPOINT ["java", "-jar", "/app/app.jar"]