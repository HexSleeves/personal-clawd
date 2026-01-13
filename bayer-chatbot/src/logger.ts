export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

const levelOrder: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
};

export type LoggerOptions = {
  level: LogLevel;
  pretty?: boolean;
};

export class Logger {
  private readonly level: LogLevel;
  private readonly pretty: boolean;

  constructor(options: LoggerOptions) {
    this.level = options.level;
    this.pretty = options.pretty ?? true;
  }

  child(fields: Record<string, unknown>) {
    return new ChildLogger(this, fields);
  }

  enabled(level: LogLevel) {
    return levelOrder[this.level] >= levelOrder[level];
  }

  log(level: Exclude<LogLevel, "silent">, msg: string, fields?: Record<string, unknown>) {
    if (!this.enabled(level)) return;

    const payload = {
      ts: new Date().toISOString(),
      level,
      msg,
      ...(fields ?? {})
    };

    const line = this.pretty ? JSON.stringify(payload) : String(payload);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  error(msg: string, fields?: Record<string, unknown>) {
    this.log("error", msg, fields);
  }

  warn(msg: string, fields?: Record<string, unknown>) {
    this.log("warn", msg, fields);
  }

  info(msg: string, fields?: Record<string, unknown>) {
    this.log("info", msg, fields);
  }

  debug(msg: string, fields?: Record<string, unknown>) {
    this.log("debug", msg, fields);
  }
}

class ChildLogger {
  private readonly parent: Logger;
  private readonly fields: Record<string, unknown>;

  constructor(parent: Logger, fields: Record<string, unknown>) {
    this.parent = parent;
    this.fields = fields;
  }

  error(msg: string, fields?: Record<string, unknown>) {
    this.parent.error(msg, { ...this.fields, ...(fields ?? {}) });
  }

  warn(msg: string, fields?: Record<string, unknown>) {
    this.parent.warn(msg, { ...this.fields, ...(fields ?? {}) });
  }

  info(msg: string, fields?: Record<string, unknown>) {
    this.parent.info(msg, { ...this.fields, ...(fields ?? {}) });
  }

  debug(msg: string, fields?: Record<string, unknown>) {
    this.parent.debug(msg, { ...this.fields, ...(fields ?? {}) });
  }

  enabled(level: LogLevel) {
    return this.parent.enabled(level);
  }
}
