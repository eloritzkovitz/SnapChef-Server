# Benchmarks

This folder contains benchmark and end-to-end tests for the SnapChef server.  
These tests are designed to evaluate the performance of the main API flows.

## Instructions

1. **Install k6:**  
   Download and install k6 from [https://grafana.com/docs/k6/latest/](https://grafana.com/docs/k6/latest/).

2. **Set the target environment:**  
   By default, tests run against `http://localhost:3000`.  
   To target a different environment (e.g., production), set the `BASE_URL` environment variable:
   ```
   k6 run --env BASE_URL=https://snapchef.cs.colman.ac.il benchmark.test.js
   ```

3. **Run the tests:**  
   From this directory, execute:
   ```
   k6 run benchmark.test.js
   ```

4. **View results:**  
   k6 will display a summary of checks, response times, and errors in the terminal after the test completes.

5. **Customize test parameters:**  
   You can adjust the number of virtual users or iterations by editing the `options` in the test script.

