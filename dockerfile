# 멀티스테이지 빌드: 빌드 스테이지
FROM gradle:8.14.2-jdk17 AS build

# 작업 디렉토리 설정
WORKDIR /app

# Gradle 래퍼와 설정 파일들 복사
COPY gradle/ gradle/
COPY gradlew gradlew.bat build.gradle settings.gradle ./

# 의존성 다운로드 (캐시 최적화)
RUN ./gradlew dependencies --no-daemon

# 소스 코드 복사
COPY src/ src/

# gradlew 스크립트에 실행 권한 부여
RUN chmod +x ./gradlew

# 의존성 다운로드 (캐시 최적화)
RUN ./gradlew dependencies --no-daemon

# 런타임 스테이지
FROM openjdk:17-slim

# 애플리케이션 사용자 생성
RUN addgroup --system spring && adduser --system spring --ingroup spring

# 작업 디렉토리 설정
WORKDIR /app

# 빌드된 JAR 파일 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 파일 소유권 변경
RUN chown spring:spring app.jar

# 비root 사용자로 전환
USER spring:spring

# 포트 노출
EXPOSE 8080

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# JVM 옵션 설정 (메모리 최적화)
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseG1GC"

# Spring 프로파일 설정
ENV SPRING_PROFILES_ACTIVE=prod