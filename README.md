
A lite version of Canvas for course management. Specifically, it enables users—both students and instructors—to view details about the courses they are enrolled in or teaching.  It lets teachers create assignments for their classes and lets students turn in documents for those assignments.

Implementation
For our database we will use MongoDB. To implement rate limiting we will utilize Redis.
1. Project Setup

Environment Setup:
Create a .env file to store database credentials, JWT secrets etc.
Set up Docker to run the API and any associated services.

2. Database Design

Choose a Database:
MongoDB
Database Initialization:
Create MQL scripts for schema creation.
Set up Docker Compose to initialize the database with the schema.

3. Authentication and Authorization

JWT Setup:
Implement JWT-based authentication.
Middleware to verify JWT and extract user information.
Role-based Access Control:
Middleware to check user roles and permissions for different endpoints.

4. API Endpoints Implementation


5. Pagination

Paginate Endpoints:
Implement pagination for GET /courses and GET /assignments/{id}/submissions endpoints.
Define page size and navigation parameters (e.g., page number, page size).

6. Rate Limiting
   
Implement Rate Limiting:
Use Redis to enforce rate limiting.
Define limits for unauthenticated (10 requests/minute) and authenticated requests (30 requests/minute).

7. Deployment

Dockerization:
Create Dockerfiles for the API and any associated services.
Use Docker Compose to manage multi-container applications.
Deployment to Production:
Deploy the API to AWS ECS

how to run docker:
docker-compose up --build

connect with mongosh:
mongosh "mongodb://root:example@localhost:28017/classmate?authSource=admin"

run the redis image
docker run -d --name redis-server -p 6379:6379 redis:latest
