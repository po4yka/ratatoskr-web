import { useState } from "react"
import { useAuth } from "@/auth/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * The account menu: who is using the client, and the one destructive action
 * it carries. Sign-out always confirms first, and the confirmation says what
 * actually happens — this contract version has no server-side revocation
 * endpoint, so the wording claims only what the client performs.
 */
export function UserMenu() {
  const { signOut } = useAuth()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="account-menu-trigger"
          className="rounded-lg px-2 py-1 text-body font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Account
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setConfirming(true)}>
            Sign out…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of Ratatoskr?</AlertDialogTitle>
            <AlertDialogDescription>
              Signing out ends the session on this device and discards the
              credential it holds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirming(false)
                void signOut()
              }}
            >
              End the session on this device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
