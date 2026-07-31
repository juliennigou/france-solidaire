type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, event: string, data: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  const output = JSON.stringify(entry);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.info(output);
}

export const logger = {
  info(event: string, data: Record<string, unknown> = {}) {
    write("info", event, data);
  },
  warn(event: string, data: Record<string, unknown> = {}) {
    write("warn", event, data);
  },
  error(event: string, data: Record<string, unknown> = {}) {
    write("error", event, data);
  },
};

export function requestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
