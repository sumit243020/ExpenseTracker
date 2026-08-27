# Multi-stage production image for ExpenseTracker API
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package \
 && mv target/expense-tracker-api-*.jar /app/app.jar

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN mkdir -p /app/data \
 && groupadd -r app && useradd -r -g app app \
 && chown -R app:app /app
USER app
COPY --from=build /app/app.jar /app/app.jar
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar /app/app.jar"]
