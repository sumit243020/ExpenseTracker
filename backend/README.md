# ExpenseTracker API (Java / Spring Boot)

## Build & run
```bash
mvn -DskipTests package
java -jar target/expense-tracker-api-1.0.0.jar
```

Listens on **http://localhost:8080**. H2 file DB: `./data/expenses`.

## Auth
Email-only login (no password). Returns JWT.

## Endpoints
See root README.
