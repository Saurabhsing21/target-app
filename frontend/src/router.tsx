import { createBrowserRouter } from "react-router-dom";

import App from "./App";
import { AppShell } from "./ui/AppShell";
import { AuthShell } from "./ui/AuthShell";
import { CheckoutShell } from "./ui/CheckoutShell";
import { RequireAuth } from "./ui/RequireAuth";
import { CartPage } from "./views/CartPage";
import { CheckoutPage } from "./views/CheckoutPage";
import { DashboardPage } from "./views/DashboardPage";
import { ForgotPasswordPage } from "./views/ForgotPasswordPage";
import { HomePage } from "./views/HomePage";
import { LoginPage } from "./views/LoginPage";
import { OrdersPage } from "./views/OrdersPage";
import { ProductsPage } from "./views/ProductsPage";
import { ProductPage } from "./views/ProductPage";
import { ProfilePage } from "./views/ProfilePage";
import { RegisterPage } from "./views/RegisterPage";
import { ResetPasswordPage } from "./views/ResetPasswordPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      {
        element: (
          <AppShell>
            <RequireAuth />
          </AppShell>
        ),
        children: [
          { path: "cart", element: <CartPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "profile", element: <ProfilePage /> },
        ],
      },
      {
        element: (
          <AppShell>
            <DashboardPage />
          </AppShell>
        ),
        path: "dashboard",
      },
      {
        element: (
          <AppShell>
            <ProductsPage />
          </AppShell>
        ),
        path: "products",
      },
      {
        element: (
          <AppShell>
            <ProductPage />
          </AppShell>
        ),
        path: "products/:id",
      },
      {
        element: (
          <AuthShell>
            <LoginPage />
          </AuthShell>
        ),
        path: "login",
      },
      {
        element: (
          <AuthShell>
            <ForgotPasswordPage />
          </AuthShell>
        ),
        path: "forgot-password",
      },
      {
        element: (
          <AuthShell>
            <RegisterPage />
          </AuthShell>
        ),
        path: "register",
      },
      {
        element: (
          <AuthShell>
            <ResetPasswordPage />
          </AuthShell>
        ),
        path: "reset-password",
      },
      {
        element: (
          <RequireAuth />
        ),
        children: [
          {
            path: "checkout",
            element: (
              <CheckoutShell>
                <CheckoutPage />
              </CheckoutShell>
            ),
          },
        ],
      },
    ],
  },
]);
