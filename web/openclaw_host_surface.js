/**
 * R164: Explicit frontend host-surface detection helpers.
 * Keep desktop-vs-standalone assumptions centralized so extension code does not
 * silently treat the desktop bundle as identical to standalone frontend HEAD.
 */

export const HOST_SURFACES = Object.freeze({
    standaloneFrontend: "standalone_frontend",
    desktop: "desktop",
    comfyDesktop: "comfy_desktop",
});

export const HOST_SURFACE_REFERENCES = Object.freeze({
    [HOST_SURFACES.standaloneFrontend]: Object.freeze({
        frontendVersion: "1.49.1",
        sourceRevision: "4b3866b838",
    }),
    [HOST_SURFACES.desktop]: Object.freeze({
        desktopVersion: "0.9.4",
        coreVersion: "0.22.3",
        embeddedFrontendVersion: "1.43.18",
        standaloneFrontendVersion: "1.49.1",
        frontendParity: "lagging",
        generation: "legacy_fixed_bundle",
        hostedVersionMode: "fixed",
    }),
    [HOST_SURFACES.comfyDesktop]: Object.freeze({
        desktopVersion: "1.0.32-rc.1",
        sourceRevision: "85e28b7a",
        sourceDescribe: "v1.0.32-rc.1-3-g85e28b7",
        generation: "managed_install",
        hostedVersionMode: "installation_specific",
        coreVersion: null,
        frontendVersion: null,
    }),
});

function normalizeSurfaceName(surface) {
    if (surface === HOST_SURFACES.desktop || surface === "desktop") {
        return HOST_SURFACES.desktop;
    }
    if (
        surface === HOST_SURFACES.standaloneFrontend ||
        surface === "standalone" ||
        surface === "standalone_frontend" ||
        surface === "localhost"
    ) {
        return HOST_SURFACES.standaloneFrontend;
    }
    return null;
}

export function resolveHostSurface({ app = null, win = window } = {}) {
    const explicitSurface = normalizeSurfaceName(
        app?.openclawHostSurface || app?.hostSurface || win?.__OPENCLAW_HOST_SURFACE__
    );
    if (explicitSurface) return explicitSurface;

    const distributionSurface = normalizeSurfaceName(win?.__DISTRIBUTION__);
    if (distributionSurface) return distributionSurface;

    if (win?.electronAPI) {
        return HOST_SURFACES.desktop;
    }

    return HOST_SURFACES.standaloneFrontend;
}

export function getHostSurfaceCapabilities(options = {}) {
    const hostSurface = resolveHostSurface(options);
    const reference = HOST_SURFACE_REFERENCES[hostSurface] || {};
    return {
        hostSurface,
        isDesktop: hostSurface === HOST_SURFACES.desktop,
        supportsElectronBridge:
            hostSurface === HOST_SURFACES.desktop && !!options?.win?.electronAPI,
        reference,
    };
}

export function stampHostSurfaceMetadata(container, options = {}) {
    const capabilities = getHostSurfaceCapabilities(options);
    if (container?.dataset) {
        container.dataset.openclawHostSurface = capabilities.hostSurface;
        container.dataset.openclawDesktopHost = capabilities.isDesktop
            ? "true"
            : "false";
        container.dataset.openclawReferenceFrontend = capabilities.isDesktop
            ? capabilities.reference.standaloneFrontendVersion || ""
            : capabilities.reference.frontendVersion || "";
        const currentDesktopReference =
            HOST_SURFACE_REFERENCES[HOST_SURFACES.comfyDesktop];
        container.dataset.openclawCurrentDesktopVersion =
            currentDesktopReference.desktopVersion;
        container.dataset.openclawCurrentDesktopGeneration =
            currentDesktopReference.generation;
        container.dataset.openclawCurrentDesktopHostedVersionMode =
            currentDesktopReference.hostedVersionMode;
        if (capabilities.isDesktop) {
            container.dataset.openclawDesktopVersion = capabilities.reference.desktopVersion || "";
            container.dataset.openclawDesktopCoreVersion = capabilities.reference.coreVersion || "";
            container.dataset.openclawDesktopEmbeddedFrontend =
                capabilities.reference.embeddedFrontendVersion || "";
            container.dataset.openclawDesktopFrontendParity =
                capabilities.reference.frontendParity || "";
        }
    }
    return capabilities;
}
