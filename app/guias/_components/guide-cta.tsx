"use client";

import { SignInButton } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

const GuideCta = ({ label = "Começar grátis" }: { label?: string }) => (
  <SignInButton mode="modal">
    <Button className="rounded-full px-6 font-semibold">
      {label}
      <ArrowRightIcon className="ml-2 h-4 w-4" />
    </Button>
  </SignInButton>
);

export default GuideCta;
