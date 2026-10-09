/** Unlisted staff entry point. Authentication remains the security boundary. */
export const ADMIN_LOGIN_PATH = "/19811171adminlogin";
export const ADMIN_RECOVERY_PATH = `${ADMIN_LOGIN_PATH}/recovery`;
export const ADMIN_ROBOTS = { index: false, follow: false, nocache: true } as const;
