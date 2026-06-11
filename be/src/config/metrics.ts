import { NextFunction, Request, Response } from "express";
import { prometheus } from "../middlewares/prometheus";

export const httpRequestCounter = new prometheus.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});

export const httpRequestDuration = new prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;

    const route = req.route?.path || req.path;

    httpRequestCounter.inc({
      method: req.method,
      route,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status: res.statusCode,
      },
      duration,
    );
  });

  next();
}
