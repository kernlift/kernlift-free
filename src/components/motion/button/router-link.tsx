import { createLink } from "@tanstack/react-router";
import { ButtonLink } from "./base";

/** Preserve router navigation, preloading and modified clicks on the shared beUI anchor. */
export const RouterButtonLink = createLink(ButtonLink);
