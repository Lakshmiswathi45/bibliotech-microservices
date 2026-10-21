"..\.tools\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run# Architecture

The client talks to the API Gateway on port 8080. It routes paths such as `/books/**` to `lb://BOOK-SERVICE`, where `lb` asks Eureka for the running service instance. Each independent Spring Boot application registers with Eureka at port 8761.

```text
CLIENT -> API GATEWAY :8080 -> AUTH / BOOK / RENTAL / FINE / NOTIFICATION
                    \-> EUREKA SERVER :8761 (service discovery)
RENTAL -> BOOK (copy update), FINE (calculation), NOTIFICATION (stored message)
```

JWT is issued only by Auth Service. Protected services validate its signature locally with the shared secret; no extra auth-service call is needed for every request.
