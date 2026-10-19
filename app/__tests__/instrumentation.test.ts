import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getLangfuseSpanProcessor,
  setLangfuseSpanProcessor,
} from '../api/lib/langfuse-span-processor-ref';

const tracerProviderRegister = vi.fn();
const setLangfuseTracerProvider = vi.fn();
let lastProvider: unknown;
let lastLangfuseProcessorOptions:
  | {
      exportMode?: string;
      publicKey?: string;
      secretKey?: string;
      baseUrl?: string;
    }
  | undefined;
let lastSpanProcessors: unknown[] | undefined;

vi.mock('@opentelemetry/sdk-trace-node', () => ({
  NodeTracerProvider: class NodeTracerProvider {
    constructor(config: { spanProcessors: unknown[] }) {
      lastSpanProcessors = config.spanProcessors;
      lastProvider = this;
    }
    register = tracerProviderRegister;
  },
}));

vi.mock('@langfuse/otel', () => ({
  LangfuseSpanProcessor: class LangfuseSpanProcessor {
    constructor(options: {
      exportMode?: string;
      publicKey?: string;
      secretKey?: string;
      baseUrl?: string;
    }) {
      lastLangfuseProcessorOptions = options;
    }
  },
}));

vi.mock('@langfuse/tracing', () => ({
  setLangfuseTracerProvider: (...args: unknown[]) =>
    setLangfuseTracerProvider(...args),
}));

async function loadRegister() {
  const mod = await import('../../instrumentation');
  return mod.register;
}

describe('instrumentation register', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    setLangfuseSpanProcessor(null);
    tracerProviderRegister.mockClear();
    setLangfuseTracerProvider.mockClear();
    lastProvider = undefined;
    lastLangfuseProcessorOptions = undefined;
    lastSpanProcessors = undefined;
  });

  it('no-ops on edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    const register = await loadRegister();
    await register();

    expect(tracerProviderRegister).not.toHaveBeenCalled();
    expect(getLangfuseSpanProcessor()).toBeNull();
  });

  it('no-ops when tracing is disabled', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'false');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    const register = await loadRegister();
    await register();

    expect(tracerProviderRegister).not.toHaveBeenCalled();
    expect(getLangfuseSpanProcessor()).toBeNull();
    expect(lastLangfuseProcessorOptions).toBeUndefined();
  });

  it('no-ops when the public key is whitespace', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', '   ');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    const register = await loadRegister();
    await register();

    expect(tracerProviderRegister).not.toHaveBeenCalled();
    expect(getLangfuseSpanProcessor()).toBeNull();
    expect(lastLangfuseProcessorOptions).toBeUndefined();
  });

  it('no-ops when the secret key is missing', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'present');
    delete process.env.LANGFUSE_SECRET_KEY;

    const register = await loadRegister();
    await register();

    expect(tracerProviderRegister).not.toHaveBeenCalled();
    expect(getLangfuseSpanProcessor()).toBeNull();
    expect(lastLangfuseProcessorOptions).toBeUndefined();
  });

  it('registers NodeTracerProvider with immediate Langfuse export and caches the processor', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    const register = await loadRegister();
    await register();

    expect(lastLangfuseProcessorOptions).toEqual({
      exportMode: 'immediate',
      publicKey: 'pk',
      secretKey: 'sk',
      baseUrl: 'https://cloud.langfuse.com',
    });
    expect(lastSpanProcessors).toHaveLength(1);
    expect(tracerProviderRegister).toHaveBeenCalledOnce();
    expect(setLangfuseTracerProvider).toHaveBeenCalledOnce();
    expect(setLangfuseTracerProvider).toHaveBeenCalledWith(lastProvider);

    const cached = getLangfuseSpanProcessor();
    expect(cached).toBe(lastSpanProcessors?.[0]);
  });
});
