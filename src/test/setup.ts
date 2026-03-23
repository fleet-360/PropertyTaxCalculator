// Set test database URI if not already set
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI =
    'mongodb://localhost:27017/property-tax-calculator-test';
}

// Optional: extend matchers for component tests
try {
  // await import('@testing-library/jest-dom');
} catch {
  // Not installed; skip
}
