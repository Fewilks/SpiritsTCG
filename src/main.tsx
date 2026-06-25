// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Função para exibir um fallback visual de erro
function showErrorFallback(error: unknown) {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:#f8fafc;font-family:sans-serif;text-align:center;padding:2rem;">
        <div>
          <h1 style="font-size:2rem;margin-bottom:0.5rem;">⚠️ Erro ao carregar o portal</h1>
          <p style="opacity:0.7;">Ocorreu um problema durante a inicialização. Tente recarregar a página.</p>
          <pre style="margin-top:1rem;padding:1rem;background:#1e293b;border-radius:8px;text-align:left;overflow-x:auto;max-width:90vw;font-size:0.8rem;">${error instanceof Error ? error.stack || error.message : String(error)}</pre>
        </div>
      </div>
    `;
  }
}

// Inicialização com try/catch
function bootstrap() {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Elemento #root não encontrado no DOM. Verifique o index.html.');
  }

  try {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('❌ Erro crítico na montagem do React:', error);
    showErrorFallback(error);
    // Opcional: relatar erro para um serviço de monitoramento
    // if (window.Sentry) window.Sentry.captureException(error);
  }
}

bootstrap();
