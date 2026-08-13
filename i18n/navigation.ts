import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

const navigation = createNavigation(routing);

/**
 * next-intl with `pathnames` types Link/router strictly. The app still builds many
 * hrefs as template strings (`/store/${slug}`). Runtime localization still works;
 * we widen types so existing call sites stay valid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Link = navigation.Link as any;
export const usePathname = navigation.usePathname;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useRouter = navigation.useRouter as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const redirect = navigation.redirect as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPathname = navigation.getPathname as any;
