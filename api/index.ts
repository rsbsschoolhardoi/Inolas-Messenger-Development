import { app } from '../server';
import express from 'express';

// Ensure middlewares are loaded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle CORS OPTIONS preflight
app.options('*', (req, res) => {
  res.status(200).end();
});

export default app;
