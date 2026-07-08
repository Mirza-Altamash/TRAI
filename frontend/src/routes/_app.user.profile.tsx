import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/feature/ProfileView";
export const Route = createFileRoute("/_app/user/profile")({ component: ProfileView });
