import "./globals.css";

export const metadata = {
  title: "Canvas UI",
  description:
    "High-performance network topology viewer — canvas-based with 100k+ element support",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
