# 10–15 minute Review 1 demonstration

1. Create the single MySQL database `bibliotech` (all five business services use `jdbc:mysql://localhost:3306/bibliotech`; Hibernate updates their required tables), then start Eureka and open `http://localhost:8761`.
2. Start all services and Gateway; refresh dashboard to show their registrations.
3. Register an ADMIN and USER through Gateway Swagger/Postman.
4. Login as ADMIN; explain the JWT response.
5. Open Book Service Swagger UI, click **Authorize**, enter the token, and create a book.
6. Login as USER and authorize Swagger with the USER token.
7. Call GET books through `http://localhost:8080/books` to demonstrate gateway routing.
8. Borrow with `POST /rentals/borrow`; show available copies decreases.
9. Call rental GET endpoint and explain that RestTemplate called Book and Notification services.
10. Return the rental; show book availability increases and returned response includes the fine.
11. Open Fine Swagger and view `/fines/{rentalId}`.
12. Open Notification Swagger and view `/notifications/user/{userId}`; mention its console line.
13. Borrow the same book twice before return and show 409.
14. Call GET books without Authorization and show 401.
15. Use USER token for POST books and show 403.
