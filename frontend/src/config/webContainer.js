import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;
let webContainerBootPromise = null;

export const getWebContainer = async () => {
    if (webContainerInstance) {
        return webContainerInstance;
    }

    if (!webContainerBootPromise) {
        webContainerBootPromise = WebContainer.boot()
            .then((container) => {
                webContainerInstance = container;
                return container;
            })
            .catch((error) => {
                webContainerBootPromise = null;
                throw error;
            });
    }

    return webContainerBootPromise;
}