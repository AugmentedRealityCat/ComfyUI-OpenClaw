import { describe, expect, it } from "vitest";
import {
    HOST_SURFACES,
    HOST_SURFACE_REFERENCES,
    getHostSurfaceCapabilities,
    resolveHostSurface,
    stampHostSurfaceMetadata,
} from "../../openclaw_host_surface.js";

describe("openclaw_host_surface", () => {
    it("publishes exact standalone and two-generation desktop references", () => {
        expect(HOST_SURFACE_REFERENCES[HOST_SURFACES.standaloneFrontend]).toEqual({
            frontendVersion: "1.49.1",
            sourceRevision: "4b3866b838",
        });
        expect(HOST_SURFACE_REFERENCES[HOST_SURFACES.desktop]).toEqual({
            desktopVersion: "0.9.4",
            coreVersion: "0.22.3",
            embeddedFrontendVersion: "1.43.18",
            standaloneFrontendVersion: "1.49.1",
            frontendParity: "lagging",
            generation: "legacy_fixed_bundle",
            hostedVersionMode: "fixed",
        });
        expect(HOST_SURFACE_REFERENCES[HOST_SURFACES.comfyDesktop]).toEqual({
            desktopVersion: "1.0.32-rc.1",
            sourceRevision: "85e28b7a",
            sourceDescribe: "v1.0.32-rc.1-3-g85e28b7",
            generation: "managed_install",
            hostedVersionMode: "installation_specific",
            coreVersion: null,
            frontendVersion: null,
        });
    });

    it("treats electron bridge presence as desktop host surface", () => {
        const hostSurface = resolveHostSurface({
            win: { electronAPI: { getPlatform() {} } },
        });
        expect(hostSurface).toBe(HOST_SURFACES.desktop);
    });

    it("prefers explicit standalone host hints over generic runtime defaults", () => {
        const hostSurface = resolveHostSurface({
            app: { openclawHostSurface: "standalone_frontend" },
            win: { electronAPI: { getPlatform() {} } },
        });
        expect(hostSurface).toBe(HOST_SURFACES.standaloneFrontend);
    });

    it("derives desktop capabilities and stamps container metadata", () => {
        const container = document.createElement("div");
        const capabilities = stampHostSurfaceMetadata(container, {
            win: { electronAPI: { getPlatform() {} } },
        });

        expect(capabilities).toEqual({
            hostSurface: HOST_SURFACES.desktop,
            isDesktop: true,
            supportsElectronBridge: true,
            reference: HOST_SURFACE_REFERENCES[HOST_SURFACES.desktop],
        });
        expect(container.dataset.openclawHostSurface).toBe("desktop");
        expect(container.dataset.openclawDesktopHost).toBe("true");
        expect(container.dataset.openclawReferenceFrontend).toBe("1.49.1");
        expect(container.dataset.openclawCurrentDesktopVersion).toBe("1.0.32-rc.1");
        expect(container.dataset.openclawCurrentDesktopGeneration).toBe("managed_install");
        expect(container.dataset.openclawCurrentDesktopHostedVersionMode).toBe(
            "installation_specific"
        );
        expect(container.dataset.openclawDesktopVersion).toBe("0.9.4");
        expect(container.dataset.openclawDesktopCoreVersion).toBe("0.22.3");
        expect(container.dataset.openclawDesktopEmbeddedFrontend).toBe("1.43.18");
        expect(container.dataset.openclawDesktopFrontendParity).toBe("lagging");
    });

    it("falls back to standalone frontend when desktop-only signals are absent", () => {
        expect(
            getHostSurfaceCapabilities({
                win: {},
            })
        ).toEqual({
            hostSurface: HOST_SURFACES.standaloneFrontend,
            isDesktop: false,
            supportsElectronBridge: false,
            reference: HOST_SURFACE_REFERENCES[HOST_SURFACES.standaloneFrontend],
        });
    });

    it("does not activate current desktop bridge detection before the dedicated adapter", () => {
        expect(
            resolveHostSurface({
                win: { __comfyDesktop2: {} },
            })
        ).toBe(HOST_SURFACES.standaloneFrontend);
    });
});
