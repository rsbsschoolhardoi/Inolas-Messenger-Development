import { app } from '../server';
import express, { Request, Response } from 'express';

// Ensure middlewares are loaded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle CORS preflight explicitly for all routes
app.options('*', (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-API-Key, Accept");
  res.status(200).end();
});

export default app;

