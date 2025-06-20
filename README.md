
# Prometheus Lens (Firebase Studio)

This is a Next.js application for monitoring assets with Prometheus, built and managed in Firebase Studio.

## Getting Started

To get started, take a look at `src/app/page.tsx`.

The application uses Next.js for the frontend and API routes, ShadCN UI components, and Tailwind CSS for styling.

## Running with Docker and PostgreSQL

This application can be run using Docker and Docker Compose, with PostgreSQL as the database for storing asset and folder information.

### Prerequisites

*   Docker: [Install Docker](https://docs.docker.com/get-docker/)
*   Docker Compose: Usually comes with Docker Desktop. If not, [Install Docker Compose](https://docs.docker.com/compose/install/)

### Setup

1.  **Clone the repository (if applicable) or ensure you have the project files.**
2.  **Environment Variables**:
    The `docker-compose.yml` file sets default environment variables for the database connection. You can customize these if needed directly in the `docker-compose.yml` or by creating a `.env` file (though `.env` is in `.dockerignore` by default for this setup to prioritize `docker-compose.yml` for environment settings in a containerized context).

    Default database credentials in `docker-compose.yml`:
    *   POSTGRES_USER: `prometheuslens`
    *   POSTGRES_PASSWORD: `prometheuslenspass`
    *   POSTGRES_DB: `prometheuslensdb`

3.  **Build and Run**:
    Navigate to the project's root directory (where `docker-compose.yml` and `Dockerfile` are located) and run:
    ```bash
    docker-compose up --build
    ```
    *   `--build`: Forces Docker to rebuild the application image if there are changes to the `Dockerfile` or application code.
    *   The first time you run this, it will download the PostgreSQL image and build your Next.js application image, which might take a few minutes.
    *   Subsequent runs will be faster.

4.  **Accessing the Application**:
    Once the services are up and running, you can access:
    *   **Prometheus Lens Application**: `http://localhost:9002` (as configured in `docker-compose.yml`)
    *   **PostgreSQL Database (optional, for direct access/debugging)**: The database service in `docker-compose.yml` exposes port `5432`. You can connect to it using a PostgreSQL client like `psql` or pgAdmin with the credentials defined in `docker-compose.yml`.

5.  **Database Initialization**:
    The application will attempt to create the necessary `assets` and `asset_folders` tables in the PostgreSQL database on its first run (or when API routes are first hit). Check the application logs from `docker-compose up` to see messages about database schema initialization.

6.  **Stopping the Application**:
    To stop the services, press `Ctrl+C` in the terminal where `docker-compose up` is running.
    To stop and remove the containers:
    ```bash
    docker-compose down
    ```
    To stop, remove containers, and remove the PostgreSQL data volume (be careful, this deletes all database data):
    ```bash
    docker-compose down -v
    ```

### Development Mode with Docker (Alternative)

If you want to run the Next.js app in development mode with hot-reloading while using the Dockerized PostgreSQL database:

1.  Start only the database service:
    ```bash
    docker-compose up -d db
    ```
2.  Set up your local environment to connect to this Dockerized database. You'll need to set the `DATABASE_URL` environment variable in your local `.env.local` file:
    ```
    DATABASE_URL=postgresql://prometheuslens:prometheuslenspass@localhost:5432/prometheuslensdb
    ```
3.  Run the Next.js development server locally:
    ```bash
    pnpm dev
    ```
    Your local Next.js app will then connect to the PostgreSQL instance running in Docker.

## Original Firebase Studio Information

This project was initially a NextJS starter in Firebase Studio. The `apphosting.yaml` file is related to Firebase App Hosting. If deploying via Docker/Portainer, `apphosting.yaml` is not directly used for that deployment method.
