/**
 * Global Logger Utility
 * 
 * Standardizes console output across the app.
 * - DEBUG/INFO: Stripped in production for a clean console.
 * - WARN/ERROR: Preserved in production for critical debugging.
 * - Prefixing: Automatically adds [Module] tags to every log.
 */

const IS_PROD = import.meta.env.PROD;

class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  private formatMessage(message: string): string {
    return this.prefix ? `${this.prefix} ${message}` : message;
  }

  /**
   * DEBUG: Detailed flow tracing. Stripped in production.
   */
  debug(message: string, ...args: any[]) {
    if (!IS_PROD) {
      console.debug(this.formatMessage(message), ...args);
    }
  }

  /**
   * INFO: Significant lifecycle events. Stripped in production.
   */
  info(message: string, ...args: any[]) {
    if (!IS_PROD) {
      console.info(this.formatMessage(message), ...args);
    }
  }

  /**
   * WARN: Recoverable issues. Visible in production.
   */
  warn(message: string, ...args: any[]) {
    console.warn(this.formatMessage(message), ...args);
  }

  /**
   * ERROR: Critical failures. Visible in production.
   */
  error(message: string, ...args: any[]) {
    // Enhanced error logging for Supabase/PostgREST errors
    const processedArgs = args.map(arg => {
      if (arg && typeof arg === 'object' && ('message' in arg || 'code' in arg)) {
        return {
          message: arg.message,
          details: arg.details,
          hint: arg.hint,
          code: arg.code,
          status: arg.status,
          ...arg
        };
      }
      return arg;
    });
    console.error(this.formatMessage(message), ...processedArgs);
  }
}

/**
 * Factory to create a logger for a specific module
 * @example const authLogger = createLogger('Auth');
 */
export const createLogger = (prefix: string) => new Logger(prefix);

/**
 * Default logger for general use
 */
export const logger = createLogger('App');

