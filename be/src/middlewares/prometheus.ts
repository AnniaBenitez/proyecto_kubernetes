import * as prometheus from "prom-client";

prometheus.collectDefaultMetrics();

export { prometheus };
