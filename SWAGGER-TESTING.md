# Swagger testing for Review 1

Start Eureka and every service. Open any direct Swagger page: `http://localhost:8081/swagger-ui.html` through `http://localhost:8085/swagger-ui.html`.

1. Use Auth endpoint `POST http://localhost:8080/auth/register`, then `POST /auth/login`; copy the `token` property.
2. In each Swagger page click **Authorize**. In the bearer field paste the token (Swagger normally adds `Bearer` itself; if its dialog requests the whole value, use `Bearer <token>`).
3. Execute protected endpoints. Swagger sends the Authorization header automatically.
4. For gateway proof, execute the same operation using `http://localhost:8080/books`, `/rentals`, `/fines`, or `/notifications` in Postman/browser client.

Swagger is intentionally opened on direct service ports because Gateway routes REST APIs, while each application owns its own generated OpenAPI document.
