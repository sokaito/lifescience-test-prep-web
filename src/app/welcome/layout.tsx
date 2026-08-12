import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Get started with Lifesci Prep - Your ultimate companion for CSIR NET Life Sciences preparation.",
};


export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
