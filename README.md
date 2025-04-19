# CustomAPI Server with Prometheus Monitoring

A complete REST API server with customer and product endpoints, using Prometheus and Grafana dashboards locally.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
  - [Local Development](#local-development)
  - [Docker Compose Setup](#docker-compose-setup)
- [API Endpoints Documentation](#api-endpoints-documentation)
- [Monitoring & Metrics](#monitoring--metrics)
  - [Available Metrics](#available-metrics)
  - [Using Prometheus](#using-prometheus)
  - [Using Grafana Dashboards](#using-grafana-dashboards)
- [Prometheus Query Guide](#prometheus-query-guide)
  - [Guaranteed Working Queries](#guaranteed-working-queries)
  - [Troubleshooting Empty Results](#troubleshooting-empty-results)
- [Troubleshooting](#troubleshooting)
- [Making Test Requests](#making-test-requests)

## Overview

This project provides a Node.js Express API server with customer and product management functionality. The server includes comprehensive monitoring using Prometheus for metrics collection and Grafana for visualization. This is perfect for learning about API development and modern monitoring practices.

## Features

- **RESTful API**: Standard CRUD operations for customers and products
- **Express.js**: Fast, unopinionated web framework for Node.js
- **Prometheus Integration**: Metrics collection for monitoring key performance indicators
- **Grafana Dashboards**: Beautiful visualizations of API performance metrics
- **Docker Compose**: Easy setup of the entire stack with a single command
- **Metrics Collection**: Track request rates, latency, error rates, and business operations

## Setup Instructions

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server** (development mode with auto-restart):
   ```bash
   npm run dev
   ```
   
   Or start in production mode:
   ```bash
   npm start
   ```

   The server runs on port 3000 by default. You can change this by setting the PORT environment variable.

### Docker Compose Setup

For a complete setup including the API server, Prometheus, and Grafana:

1. **Make sure Docker is installed and running** on your system

2. **Launch the entire stack**:
   ```bash
   docker-compose up -d
   ```

3. **Access the services**:
   - API Server: http://localhost:3002
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (pre-configured, no login required)

4. **Stop the stack** when finished:
   ```bash
   docker-compose down
   ```

## API Endpoints Documentation

### Root
- `GET /` - Returns information about available endpoints

### Customers
- `GET /customers` - Get all customers
- `POST /customers` - Create a new customer
- `GET /customers/:id` - Get a customer by ID

### Products
- `GET /products` - Get all products
- `POST /products` - Create a new product
- `GET /products/:id` - Get a product by ID

### Metrics
- `GET /metrics` - Prometheus metrics endpoint (raw metrics data)

## Monitoring & Metrics

### Available Metrics

The API server collects the following metrics:

1. **Request Rates**: Total number of requests by endpoint and method
2. **Request Latency**: Response time distributions (p50, p95) by endpoint
3. **Error Rates**: 4xx and 5xx status codes tracking
4. **Customer Operations**: Count of operations by type (create, get_all, get_by_id)
5. **Product Operations**: Count of operations by type (create, get_all, get_by_id)

### Using Prometheus

Prometheus is a powerful monitoring system and time-series database.

1. **Access the Prometheus UI**: Open http://localhost:9090 in your browser

2. **Creating basic graphs**:
   - Click on the "Graph" tab
   - Enter a PromQL query in the expression box
   - Click "Execute" to visualize the data

3. **Useful PromQL queries**:
   ```
   # Request rate per second over 1 minute window
   rate(http_requests_total[1m])
   
   # 95th percentile request duration 
   histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[1m])) by (le, method, route))
   
   # Error rate by route and method
   sum(rate(api_error_total[1m])) by (route, method)
   
   # Customer operations counts
   customer_operations_total
   
   # Product operations counts
   product_operations_total
   ```

4. **Exploring metrics**:
   - Go to the "Status" > "Targets" page to see what's being monitored
   - Use the "Status" > "Configuration" page to inspect the Prometheus setup

### Using Grafana Dashboards

Grafana provides beautiful, customizable dashboards for your metrics.

1. **Access Grafana**: Open http://localhost:3001 in your browser

2. **Using the pre-built dashboard**:
   - Click "Dashboards" in the left sidebar
   - Look for "API Server Metrics Dashboard"
   - Click on it to view your API metrics

3. **Understanding the dashboard panels**:
   - **Request Rate**: Shows the throughput of your API
   - **Request Latency**: Shows p50 and p95 response times
   - **Server Error Rate**: Shows 5xx errors
   - **Client Error Rate**: Shows 4xx errors
   - **Customer Operations**: Shows customer-related operations
   - **Product Operations**: Shows product-related operations

4. **Creating custom dashboards** (optional):
   - Click "Create" > "Dashboard" in the left sidebar
   - Add panels using the "Add new panel" button
   - Configure each panel with Prometheus queries
   - Save your custom dashboard

## Prometheus Query Guide

### Guaranteed Working Queries

If you're seeing empty query results in Prometheus, follow these steps to troubleshoot and get working queries:

#### Step 1: Generate Traffic First

Before querying, generate some API traffic:

```bash
# Run these commands multiple times (at least 5-10 times)
curl http://localhost:3002/customers
curl http://localhost:3002/products
curl -X POST http://localhost:3002/customers -H "Content-Type: application/json" -d '{"name":"Test Customer","email":"test@example.com"}'
curl -X POST http://localhost:3002/products -H "Content-Type: application/json" -d '{"name":"Test Product","price":19.99}'
```

#### Step 2: Start with Guaranteed Working Queries

These queries will always return results if Prometheus is correctly set up:

```
# Shows up/down status of all scrape targets (should be 1 for working targets)
up

# CPU time used by your Node.js process (always available)
process_cpu_seconds_total

# Memory usage
process_resident_memory_bytes

# Count of HTTP requests measured for duration
http_request_duration_ms_count
```

### Troubleshooting Empty Results

If you're still seeing empty query results:

1. **Verify Raw Metrics**:
   - Visit http://localhost:3002/metrics in your browser
   - Confirm metrics are being exposed correctly
   - Note exact metric names (they're case-sensitive!)

2. **Check Prometheus Targets**:
   - Go to http://localhost:9090/targets
   - Verify your API endpoint (labeled as "api-server") shows as "UP"
   - If "DOWN", check network connectivity between containers

3. **Adjust Time Range**:
   - Click on the time dropdown at the top-right of the Prometheus UI
   - Select "Last 15 minutes" or a range covering when you made requests
   - Prometheus only shows data from the selected time range

4. **Try Autocomplete**:
   - In the query field, type the first few letters of a metric name
   - Use the autocomplete dropdown to see available metrics
   - Example: type "http_" to see all HTTP-related metrics

5. **Start Simple**:
   - Begin with the raw metric name (e.g., `http_requests_total`)
   - Once confirmed working, add functions like `rate()` or `sum()`
   - Example progression:
     ```
     # 1. Basic metric
     http_requests_total
     
     # 2. Add rate calculation
     rate(http_requests_total[5m])
     
     # 3. Add filtering
     rate(http_requests_total{route="/customers"}[5m])
     
     # 4. Add aggregation
     sum by(method) (rate(http_requests_total{route="/customers"}[5m]))
     ```

6. **Check for Data in Selected Range**:
   - Prometheus won't show results if there's no data in the selected time range
   - After generating traffic, wait a minute for metrics to be collected
   - Try expanding the time range to "Last 1 hour" or more

7. **Example Working Query Flow**:

   **First, check the raw metrics endpoint**:
   Visit http://localhost:3002/metrics and look for metrics like:
   ```
   # HELP http_request_duration_ms_count Duration of HTTP requests in ms
   # TYPE http_request_duration_ms_count counter
   http_request_duration_ms_count{method="GET",route="/customers",status_code="200"} 5
   ```

   **Then, in Prometheus, use the exact metric name**:
   ```
   http_request_duration_ms_count
   ```

   **If this shows data, try more complex queries**:
   ```
   # Request count by endpoint
   sum by(route) (http_request_duration_ms_count)
   
   # 95th percentile latency
   histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[5m])) by (le, route))
   ```

Remember: Prometheus tracks data over time, so you need to make several API requests and wait for scraping to occur before you'll see meaningful trends in your graphs!

## Troubleshooting

### Common Issues:

1. **Port conflicts**: If you see errors like "port already in use":
   - Change the port mapping in docker-compose.yml
   - Or stop the service using that port

2. **Docker containers not starting**:
   - Check container logs: `docker-compose logs [service-name]`
   - Verify Docker is running correctly

3. **No metrics showing in Grafana**:
   - Generate some traffic by making API requests (see below)
   - Check if Prometheus target is up in Prometheus UI > Status > Targets

4. **Grafana dashboard not found**:
   - Import it manually from grafana/dashboards/api-server-dashboard.json

## Making Test Requests

Generate traffic to see metrics in action:

### Using Local Server (port 3000)

```bash
# Create customers
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "123-456-7890"}'

# Get all customers
curl http://localhost:3000/customers

# Create products
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Product 1", "price": 29.99, "description": "A great product"}'

# Get all products
curl http://localhost:3000/products
```

### Using Docker Container (port 3002)

```bash
# Create customers
curl -X POST http://localhost:3002/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "123-456-7890"}'

# Get all customers
curl http://localhost:3002/customers

# Create products
curl -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Product 1", "price": 29.99, "description": "A great product"}'

# Get all products
curl http://localhost:3002/products
```

Run these commands multiple times to generate data for your metrics visualizations. Then check Prometheus or Grafana to see the results. 