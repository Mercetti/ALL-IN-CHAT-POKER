import { FullConfig } from '@playwright/test';
declare function globalSetup(config: FullConfig): Promise<void>;
declare function globalTeardown(config: FullConfig): Promise<void>;
export default globalSetup;
export { globalTeardown };
//# sourceMappingURL=global-setup.d.ts.map