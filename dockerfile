# ---------- Build stage ----------
FROM gradle:8.14.2-jdk17 AS build
WORKDIR /app

# Gradle 래퍼 & 설정 파일
COPY gradle/ gradle/
COPY gradlew gradlew.bat build.gradle settings.gradle ./
RUN chmod +x gradlew

# 의존성 캐싱
RUN ./gradlew dependencies --no-daemon

# 소스 복사
COPY src/ src/

RUN ./gradlew clean bootJar -x test --no-daemon

FROM openjdk:17-slim
RUN addgroup --system spring && adduser --system spring --ingroup spring
WORKDIR /app

# wildcard로 JAR 복사
COPY --from=build /app/build/libs/*.jar app.jar
RUN chown spring:spring app.jar
USER spring:spring

EXPOSE 8080
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseG1GC"
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java","-jar","/app/app.jar"]