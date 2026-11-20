# syntax=docker/dockerfile:1

# Gym Manager: one image holding the API and the Angular UI (same Maven reactor as a local build).

# 1. Maven reactor: frontend (Node downloaded by frontend-maven-plugin) then the executable backend jar.
#    Tests are run outside the image: mvn verify

FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build

# Optional corporate proxy (--build-arg HTTPS_PROXY=http://host:port): Maven only reads it from settings.xml,
# and frontend-maven-plugin forwards it to the Node download and to npm.
RUN set -e; p="${HTTPS_PROXY:-${https_proxy:-}}"; mkdir -p /root/.m2; \
    if [ -n "$p" ]; then hp="${p#*://}"; hp="${hp%/}"; \
      printf '<settings><proxies><proxy><id>p</id><active>true</active><protocol>https</protocol><host>%s</host><port>%s</port></proxy></proxies></settings>' \
        "${hp%:*}" "${hp##*:}" > /root/.m2/settings.xml; fi

COPY pom.xml ./
COPY gym-manager-backend/pom.xml gym-manager-backend/
COPY gym-manager-backend/src gym-manager-backend/src
COPY gym-manager-frontend/ gym-manager-frontend/

RUN --mount=type=cache,target=/root/.m2/repository \
    --mount=type=cache,target=/root/.npm \
    mvn -B -q -DskipTests package

# 2. Runtime

FROM eclipse-temurin:21-jre

RUN useradd --system --uid 1001 gym && mkdir /data && chown gym /data

USER gym

WORKDIR /app

COPY --from=build /build/gym-manager-backend/target/gym-manager-backend-1.0.0.jar app.jar

ENV PORT=8090 DATA_DIR=/data

EXPOSE 8090

VOLUME /data

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
