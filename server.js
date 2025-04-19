const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const promBundle = require('express-prom-bundle');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Register the prom-client registry
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Register custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [1, 5, 15, 50, 100, 200, 500, 1000, 2000],
  registers: [register]
});

// Create custom counters for customer and product operations
const customerOperationsCounter = new client.Counter({
  name: 'customer_operations_total',
  help: 'Counter for customer operations',
  labelNames: ['operation'],
  registers: [register]
});

const productOperationsCounter = new client.Counter({
  name: 'product_operations_total',
  help: 'Counter for product operations',
  labelNames: ['operation'],
  registers: [register]
});

// Error counter
const errorCounter = new client.Counter({
  name: 'api_error_total',
  help: 'Count of errors in API requests',
  labelNames: ['route', 'method'],
  registers: [register]
});

// Configure Prometheus middleware
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { project: 'custom-server' },
  promRegistry: register
});

// Middleware
app.use(metricsMiddleware);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Custom middleware to measure request duration
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
});

// In-memory data storage
const customers = [];
const products = [];

// Customer routes
app.get('/customers', (req, res) => {
  customerOperationsCounter.inc({ operation: 'get_all' });
  res.json(customers);
});

app.post('/customers', (req, res) => {
  try {
    const customer = {
      id: customers.length + 1,
      ...req.body,
      createdAt: new Date()
    };
    
    customers.push(customer);
    customerOperationsCounter.inc({ operation: 'create' });
    res.status(201).json(customer);
  } catch (error) {
    errorCounter.inc({ route: '/customers', method: 'POST' });
    res.status(500).json({ error: error.message });
  }
});

app.get('/customers/:id', (req, res) => {
  try {
    const customer = customers.find(c => c.id === parseInt(req.params.id));
    
    if (!customer) {
      errorCounter.inc({ route: '/customers/:id', method: 'GET' });
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    customerOperationsCounter.inc({ operation: 'get_by_id' });
    res.json(customer);
  } catch (error) {
    errorCounter.inc({ route: '/customers/:id', method: 'GET' });
    res.status(500).json({ error: error.message });
  }
});

// Product routes
app.get('/products', (req, res) => {
  productOperationsCounter.inc({ operation: 'get_all' });
  res.json(products);
});

app.post('/products', (req, res) => {
  try {
    const product = {
      id: products.length + 1,
      ...req.body,
      createdAt: new Date()
    };
    
    products.push(product);
    productOperationsCounter.inc({ operation: 'create' });
    res.status(201).json(product);
  } catch (error) {
    errorCounter.inc({ route: '/products', method: 'POST' });
    res.status(500).json({ error: error.message });
  }
});

app.get('/products/:id', (req, res) => {
  try {
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
      errorCounter.inc({ route: '/products/:id', method: 'GET' });
      return res.status(404).json({ message: 'Product not found' });
    }
    
    productOperationsCounter.inc({ operation: 'get_by_id' });
    res.json(product);
  } catch (error) {
    errorCounter.inc({ route: '/products/:id', method: 'GET' });
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'API Server is running',
    endpoints: [
      { path: '/customers', methods: ['GET', 'POST'] },
      { path: '/customers/:id', methods: ['GET'] },
      { path: '/products', methods: ['GET', 'POST'] },
      { path: '/products/:id', methods: ['GET'] },
      { path: '/metrics', methods: ['GET'], description: 'Prometheus metrics' }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
}); 