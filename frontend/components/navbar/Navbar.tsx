"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLogoutUser } from "@/hooks/use-auth";
import { logout } from "@/redux/reducers/authReducer";
import { type AppDispatch, type RootState } from "@/redux/store/store";
import styles from "./navbar.module.css";

const Navbar = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const logoutMutation = useLogoutUser();

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        dispatch(logout());
        setLogoutDialogOpen(false);
        router.replace("/login");
      },
    });
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContent}>
        <div className={styles.navLinks}>
          <Link className={styles.navLink} href="/">Home</Link>
          <Link className={styles.navLink} href="/Dashboard">Dashboard</Link>
        </div>

        <div className={styles.navActions}>
          {isAuthenticated ? (
            <AlertDialog
              open={logoutDialogOpen}
              onOpenChange={setLogoutDialogOpen}
            >
              <AlertDialogTrigger className={styles.navButton}>
                Logout
              </AlertDialogTrigger>
              <AlertDialogContent
                className={styles.logoutDialog}
                overlayClassName={styles.logoutDialogOverlay}
              >
                <AlertDialogHeader className={styles.logoutDialogHeader}>
                  <AlertDialogTitle className={styles.logoutDialogTitle}>
                    Log out?
                  </AlertDialogTitle>
                  <AlertDialogDescription className={styles.logoutDialogDescription}>
                    Are you sure you want to log out of your account?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                  {logoutMutation.isError && (
                    <span className={styles.logoutError} role="alert">
                      {logoutMutation.error.message}
                    </span>
                  )}
                <AlertDialogFooter className={styles.logoutDialogFooter}>
                  <AlertDialogCancel
                    className={`${styles.dialogButton} ${styles.cancelButton}`}
                    disabled={logoutMutation.isPending}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className={`${styles.dialogButton} ${styles.confirmButton}`}
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? "Logging out..." : "Log out"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <>
              <Link className={styles.navButton} href="/Login">Login</Link>
              <Link className={styles.navButton} href="/Signup">Signup</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar