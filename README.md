# Multi-Vehicle-Search

This project provides an API to find the cheapest combination of listings to park multiple vehicles.

## Running Locally

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Build the project:**

    ```bash
    npm run build
    ```

3.  **Start the server:**
    ```bash
    npm run start
    ```
    The server will be running at `http://localhost:3000`.

## API Usage

Send a `POST` request to `/` with a JSON body like this:

```json
[
  { "length": 20, "quantity": 1 },
  { "length": 30, "quantity": 1 }
]
```

## Deployment

To deploy the application, run the deployment script:

```bash
./deploy.sh
```

This script will pull the latest changes, install dependencies, build the project, and restart the application using `pm2`.
