import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gulvira Group | Дизайн и ремонт под ключ",
  description:
    "Лендинг, CRM и личный кабинет клиента для строительной компании и дизайн-студии Gulvira Group."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
