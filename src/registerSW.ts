// Registers the service worker in production and keeps it fresh.
// In dev we actively unregister any stale worker so it can never interfere
// with Vite's HMR.

function reloadOnce() {
    // Guard against reload loops when a new worker takes control.
    if (sessionStorage.getItem('sw-reloaded') === '1') return;
    try {
        sessionStorage.setItem('sw-reloaded', '1');
    } catch {
        /* storage may be unavailable — reload anyway */
    }
    window.location.reload();
}

export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    if (!import.meta.env.PROD) {
        // Clean up any worker a previous production build left behind.
        void navigator.serviceWorker.getRegistrations().then((regs) => {
            regs.forEach((reg) => void reg.unregister());
        });
        return;
    }

    window.addEventListener('load', () => {
        void navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                // When an updated worker is installed and ready, activate it.
                registration.addEventListener('updatefound', () => {
                    const installing = registration.installing;
                    if (!installing) return;
                    installing.addEventListener('statechange', () => {
                        if (
                            installing.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            installing.postMessage('SKIP_WAITING');
                        }
                    });
                });
            })
            .catch(() => {
                /* registration failures are non-fatal */
            });

        // A new worker took control — reload once to pick up fresh assets.
        navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);
    });
}
