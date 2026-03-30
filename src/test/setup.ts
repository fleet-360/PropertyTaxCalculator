// Set test database URI if not already set
if (!process.env.MONGODB_URI_MONGODB_URI) {
  process.env.MONGODB_URI_MONGODB_URI =
    'mongodb://localhost:27017/property-tax-calculator-test';
}

// Extend matchers for component tests
import '@testing-library/jest-dom';
