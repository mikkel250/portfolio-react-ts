import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getLangfuseSpanProcessor,
  setLangfuseSpanProcessor,
} from '../api/lib/langfuse-span-processor-ref';

const tracerProviderRegister = vi.fn();
let lastLangfuseProcessorOptions: { exportMode?: string } | undefined;
let lastSpanProcessors: unknown[] | undefined;

vi.mock('@opentelemetry/sdk-trace-node', () => ({
  NodeTracerProvider: class NodeTracerProvider {
    constructor(config: { spanProcessors: unknown[] }) {
      lastSpanProcessors = config.spanProcessors;
    }
    register = tracerProviderRegister;
  },
}));

vi.mock('@langfuse/otel', () => ({
  LangfuseSpanProcessor: class LangfuseSpanProcessor {
    constructor(options: { exportMode?: string }) {
      lastLangfuseProcessorOptions = options;
    }
  },
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

  it('no-ops when tracing is disabled or keys are missing', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'false');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    const register = await loadRegister();
    await register();
    expect(tracerProviderRegister).not.toHaveBeenCalled();

    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', '   ');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    vi.resetModules();

    const registerAgain = await loadRegister();
    await registerAgain();
    expect(tracerProviderRegister).not.toHaveBeenCalled();
    expect(getLangfuseSpanProcessor()).toBeNull();
  });

  it('registers NodeTracerProvider with immediate Langfuse export and caches the processor', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    const register = await loadRegister();
    await register();

    expect(lastLangfuseProcessorOptions).toEqual({ exportMode: 'immediate' });
    expect(lastSpanProcessors).toHaveLength(1);
    expect(tracerProviderRegister).toHaveBeenCalledOnce();

    const cached = getLangfuseSpanProcessor();
    expect(cached).toBe(lastSpanProcessors?.[0]);
  });
});
